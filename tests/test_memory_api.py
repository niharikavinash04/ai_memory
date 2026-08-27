import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import create_app
from app.services.knowledge_service import KnowledgeService

@pytest.fixture
def client_with_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    import app.models.knowledge  # noqa: F401
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client, TestingSessionLocal

def test_memory_query_endpoints(client_with_db):
    client, SessionLocal = client_with_db

    # 1. Publish candidate memory via POST /api/v1/memory/publish
    unique_title = f"Supabase Memory {uuid.uuid4()}"
    pub_res = client.post("/api/v1/memory/publish", json={
        "title": unique_title,
        "context": "Testing dedicated memory endpoint",
        "final_output": "Stored safely in Supabase PostgreSQL.",
        "project_id": "proj-supabase",
        "classification": "internal"
    })
    assert pub_res.status_code == 201
    item_id = pub_res.json()["item_id"]

    # 2. Query before approval -> returns 0 items
    query_res_get = client.get(f"/api/v1/memory/query?q={unique_title}")
    assert query_res_get.status_code == 200
    assert len(query_res_get.json()) == 0

    # 3. Approve item in DB
    db = SessionLocal()
    try:
        KnowledgeService.approve_item(db=db, item_id=item_id)
    finally:
        db.close()

    # 4. Query after approval via GET /api/v1/memory/query
    query_approved_get = client.get(f"/api/v1/memory/query?q={unique_title}")
    assert query_approved_get.status_code == 200
    res_data = query_approved_get.json()
    assert len(res_data) == 1
    assert res_data[0]["item_id"] == item_id

    # 5. Query after approval via POST /api/v1/memory/query
    query_approved_post = client.post("/api/v1/memory/query", json={
        "query": unique_title,
        "project_id": "proj-supabase",
        "limit": 10
    })
    assert query_approved_post.status_code == 200
    res_post_data = query_approved_post.json()
    assert len(res_post_data) == 1
    assert res_post_data[0]["item_id"] == item_id
