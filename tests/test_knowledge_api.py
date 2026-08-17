import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.knowledge  # Ensure models are registered in Base.metadata
from app.main import app
from app.db.base import Base
from app.db.session import get_db

@pytest.fixture
def api_client():
    """Provides a TestClient with an isolated in-memory SQLite database session override using StaticPool."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def test_publish_and_inbox_lifecycle_api(api_client):
    """Verifies complete HTTP API flow: Publish -> PENDING -> Inbox -> Search (Excluded) -> Approve -> Search (Included)."""
    # 1. Publish item
    publish_payload = {
        "title": "FastAPI Setup Guide",
        "context": "Backend route initialization instructions",
        "final_output": "Configure FastAPI app with routers and CORS middleware.",
        "project_id": "proj-fastapi",
        "classification": "internal",
        "provider": "codex",
        "author_email": "dev@company.com"
    }

    res_pub = api_client.post("/api/v1/knowledge/publish", json=publish_payload)
    assert res_pub.status_code == 201
    pub_data = res_pub.json()
    assert pub_data["status"] == "PENDING"
    assert pub_data["is_duplicate"] is False
    item_id = pub_data["item_id"]

    # 2. Get pending inbox items
    res_inbox = api_client.get("/api/v1/inbox")
    assert res_inbox.status_code == 200
    inbox_items = res_inbox.json()
    assert len(inbox_items) == 1
    assert inbox_items[0]["id"] == item_id
    assert inbox_items[0]["status"] == "PENDING"

    # 3. Get inbox item detail
    res_detail = api_client.get(f"/api/v1/inbox/{item_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["title"] == "FastAPI Setup Guide"

    # 4. Search before approval -> MUST return empty list
    res_search_pending = api_client.get("/api/v1/knowledge/search?q=FastAPI")
    assert res_search_pending.status_code == 200
    assert res_search_pending.json() == []

    # 5. Approve item
    res_approve = api_client.post(f"/api/v1/inbox/{item_id}/approve")
    assert res_approve.status_code == 200
    assert res_approve.json()["status"] == "APPROVED"

    # 6. Search after approval -> MUST return item
    res_search_approved = api_client.get("/api/v1/knowledge/search?q=FastAPI")
    assert res_search_approved.status_code == 200
    search_results = res_search_approved.json()
    assert len(search_results) == 1
    assert search_results[0]["item_id"] == item_id
    assert search_results[0]["title"] == "FastAPI Setup Guide"

def test_reject_inbox_item_api(api_client):
    """Verifies PENDING -> REJECTED lifecycle via HTTP API."""
    publish_payload = {
        "title": "Deprecated Spec",
        "context": "Outdated requirement",
        "final_output": "Do not use this outdated spec.",
        "project_id": "proj-legacy",
        "classification": "private"
    }

    res_pub = api_client.post("/api/v1/knowledge/publish", json=publish_payload)
    item_id = res_pub.json()["item_id"]

    # Reject item
    res_reject = api_client.post(f"/api/v1/inbox/{item_id}/reject")
    assert res_reject.status_code == 200
    assert res_reject.json()["status"] == "REJECTED"

    # Search -> MUST NOT return rejected item
    res_search = api_client.get("/api/v1/knowledge/search?q=Deprecated")
    assert res_search.status_code == 200
    assert res_search.json() == []

def test_duplicate_publish_api(api_client):
    """Verifies duplicate submission returns duplicate warning via HTTP API."""
    publish_payload = {
        "title": "Idempotent Document",
        "context": "Testing duplicate detection",
        "final_output": "Identical payload content.",
        "project_id": "proj-test"
    }

    res1 = api_client.post("/api/v1/knowledge/publish", json=publish_payload)
    assert res1.status_code == 201
    assert res1.json()["is_duplicate"] is False

    res2 = api_client.post("/api/v1/knowledge/publish", json=publish_payload)
    assert res2.status_code == 201
    dup_data = res2.json()
    assert dup_data["is_duplicate"] is True
    assert dup_data["item_id"] == res1.json()["item_id"]
    assert "duplicate" in dup_data["warnings"][0]["type"]
