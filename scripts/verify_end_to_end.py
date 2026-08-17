"""Verification script to perform end-to-end API lifecycle checks for Week 1 Backend Foundation."""
import os
import sys
import json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.knowledge
from app.main import app
from app.db.base import Base
from app.db.session import get_db

def run_verification():
    print("=" * 70)
    print("AI WORK MEMORY — WEEK 1 BACKEND FOUNDATION VERIFICATION")
    print("=" * 70)

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    # 1. Publish item A
    print("\n[Step 1] Publishing Item A (CEO HTML Prototype)...")
    payload_a = {
        "title": "CEO HTML Prototype",
        "context": "Interactive prototype for sales metrics",
        "final_output": "<html><body><h1>Sales Prototype</h1></body></html>",
        "project_id": "proj-ceo-2026",
        "classification": "internal",
        "provider": "claude",
        "author_email": "ceo@company.com"
    }
    res_pub = client.post("/api/v1/knowledge/publish", json=payload_a)
    print(f"Status Code: {res_pub.status_code}")
    pub_a_data = res_pub.json()
    print(f"Publish Output: {json.dumps(pub_a_data, indent=2)}")
    item_a_id = pub_a_data["item_id"]
    assert pub_a_data["status"] == "PENDING"

    # 2. Check Inbox
    print("\n[Step 2] Checking Knowledge Inbox (GET /api/v1/inbox)...")
    res_inbox = client.get("/api/v1/inbox")
    inbox_data = res_inbox.json()
    print(f"Inbox Items Count: {len(inbox_data)}")
    print(f"Inbox Item 1 Status: {inbox_data[0]['status']}")
    assert len(inbox_data) == 1
    assert inbox_data[0]["id"] == item_a_id

    # 3. Search for Item A while PENDING (Must be empty)
    print("\n[Step 3] Searching for 'Sales Prototype' while PENDING (GET /api/v1/knowledge/search)...")
    res_search_pending = client.get("/api/v1/knowledge/search?q=Sales")
    pending_search_data = res_search_pending.json()
    print(f"Search Results Count (PENDING): {len(pending_search_data)}")
    assert len(pending_search_data) == 0

    # 4. Approve Item A
    print(f"\n[Step 4] Approving Item A ({item_a_id})...")
    res_approve = client.post(f"/api/v1/inbox/{item_a_id}/approve")
    approve_data = res_approve.json()
    print(f"Approved Item Status: {approve_data['status']}")
    print(f"Approved At Timestamp: {approve_data['approved_at']}")
    assert approve_data["status"] == "APPROVED"

    # 5. Search for Item A after APPROVAL (Must return item)
    print("\n[Step 5] Searching for 'Sales Prototype' after APPROVAL...")
    res_search_approved = client.get("/api/v1/knowledge/search?q=Sales")
    approved_search_data = res_search_approved.json()
    print(f"Search Results Count (APPROVED): {len(approved_search_data)}")
    print(f"Search Result Item Title: {approved_search_data[0]['title']}")
    assert len(approved_search_data) == 1
    assert approved_search_data[0]["item_id"] == item_a_id

    # 6. Publish Item B and Reject it
    print("\n[Step 6] Publishing Item B (Outdated Draft) and Rejecting it...")
    payload_b = {
        "title": "Outdated Draft Spec",
        "context": "Legacy requirement",
        "final_output": "Do not implement this spec.",
        "project_id": "proj-legacy",
        "classification": "private"
    }
    res_pub_b = client.post("/api/v1/knowledge/publish", json=payload_b)
    item_b_id = res_pub_b.json()["item_id"]

    res_reject = client.post(f"/api/v1/inbox/{item_b_id}/reject")
    reject_data = res_reject.json()
    print(f"Rejected Item Status: {reject_data['status']}")
    assert reject_data["status"] == "REJECTED"

    # 7. Search for Item B (Must NOT return item)
    print("\n[Step 7] Searching for 'Outdated' (REJECTED item)...")
    res_search_rejected = client.get("/api/v1/knowledge/search?q=Outdated")
    rejected_search_data = res_search_rejected.json()
    print(f"Search Results Count (REJECTED): {len(rejected_search_data)}")
    assert len(rejected_search_data) == 0

    # 8. Duplicate publish test (SHA-256 deduplication)
    print("\n[Step 8] Publishing exact duplicate payload of Item A...")
    res_dup = client.post("/api/v1/knowledge/publish", json=payload_a)
    dup_data = res_dup.json()
    print(f"Duplicate Result: is_duplicate={dup_data['is_duplicate']}")
    print(f"Returned Item ID: {dup_data['item_id']}")
    print(f"Warning Message: {dup_data['warnings'][0]['message']}")
    assert dup_data["is_duplicate"] is True
    assert dup_data["item_id"] == item_a_id

    print("\n" + "=" * 70)
    print("ALL END-TO-END API & LIFECYCLE CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_verification()
