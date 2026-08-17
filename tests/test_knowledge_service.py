import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.schemas.knowledge import PublishInput
from app.services.knowledge_service import KnowledgeService, calculate_content_hash

@pytest.fixture
def db_session():
    """Provides an isolated in-memory SQLite database session for unit testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_calculate_content_hash_deterministic():
    """Verify exact-hash calculation is deterministic and whitespace-normalized."""
    hash1 = calculate_content_hash("  Title 1 ", " Context 1\n", " Output 1 ")
    hash2 = calculate_content_hash("Title 1", "Context 1", "Output 1")
    assert hash1 == hash2
    assert len(hash1) == 64  # SHA-256 hex string length

def test_publish_item_creates_pending_status(db_session):
    """Verify new published knowledge item starts in PENDING status."""
    payload = PublishInput(
        title="CEO Dashboard Prototype",
        context="HTML dashboard request",
        final_output="<html><body>Analytics Dashboard</body></html>",
        project_id="proj-analytics",
        classification="internal",
        provider="claude",
        author_email="ceo@company.com"
    )

    result = KnowledgeService.publish_item(db=db_session, data=payload)
    assert result.status == "PENDING"
    assert result.is_duplicate is False
    assert result.item_id is not None

    # Retrieve from inbox
    pending_items = KnowledgeService.get_pending_inbox_items(db=db_session)
    assert len(pending_items) == 1
    assert pending_items[0].id == result.item_id
    assert pending_items[0].status == "PENDING"

def test_exact_hash_deduplication(db_session):
    """Verify duplicate submission detects content hash match and prevents second record creation."""
    payload = PublishInput(
        title="CEO Dashboard Prototype",
        context="HTML dashboard request",
        final_output="<html><body>Analytics Dashboard</body></html>",
        project_id="proj-analytics",
        classification="internal"
    )

    # First submission
    res1 = KnowledgeService.publish_item(db=db_session, data=payload)
    assert res1.is_duplicate is False

    # Duplicate submission
    res2 = KnowledgeService.publish_item(db=db_session, data=payload)
    assert res2.is_duplicate is True
    assert res2.item_id == res1.item_id
    assert len(res2.warnings) > 0
    assert "duplicate" in res2.warnings[0]["type"]

    # Verify only 1 record exists in DB
    pending_items = KnowledgeService.get_pending_inbox_items(db=db_session)
    assert len(pending_items) == 1

def test_lifecycle_approval_flow(db_session):
    """Verify PENDING -> APPROVED lifecycle state transition."""
    payload = PublishInput(
        title="Architecture Decision Record",
        context="Database selection ADR",
        final_output="We select PostgreSQL + pgvector for storage.",
        project_id="proj-infrastructure"
    )

    pub_res = KnowledgeService.publish_item(db=db_session, data=payload)
    item_id = pub_res.item_id

    # Item is initially PENDING
    item = KnowledgeService.get_inbox_item(db=db_session, item_id=item_id)
    assert item.status == "PENDING"
    assert item.approved_at is None

    # Approve item
    approved_item = KnowledgeService.approve_item(db=db_session, item_id=item_id)
    assert approved_item.status == "APPROVED"
    assert approved_item.approved_at is not None

    # Cannot approve an already APPROVED item
    with pytest.raises(ValueError, match="cannot be approved"):
        KnowledgeService.approve_item(db=db_session, item_id=item_id)

def test_lifecycle_rejection_flow(db_session):
    """Verify PENDING -> REJECTED lifecycle state transition."""
    payload = PublishInput(
        title="Draft Note",
        context="Incomplete draft",
        final_output="Draft content",
        project_id="proj-draft"
    )

    pub_res = KnowledgeService.publish_item(db=db_session, data=payload)
    item_id = pub_res.item_id

    # Reject item
    rejected_item = KnowledgeService.reject_item(db=db_session, item_id=item_id)
    assert rejected_item.status == "REJECTED"

    # Cannot reject an already REJECTED item
    with pytest.raises(ValueError, match="cannot be rejected"):
        KnowledgeService.reject_item(db=db_session, item_id=item_id)

def test_keyword_search_filters_unapproved_items(db_session):
    """Verify keyword search ONLY returns APPROVED items, strictly excluding PENDING or REJECTED."""
    # 1. Publish 3 items
    p1 = KnowledgeService.publish_item(db=db_session, data=PublishInput(
        title="PostgreSQL Setup Guide",
        context="Database installation instructions",
        final_output="Run postgres container via Docker Compose.",
        project_id="proj-db"
    ))
    p2 = KnowledgeService.publish_item(db=db_session, data=PublishInput(
        title="PostgreSQL Tuning Guide",
        context="Performance tuning",
        final_output="Adjust shared_buffers for high memory.",
        project_id="proj-db"
    ))
    p3 = KnowledgeService.publish_item(db=db_session, data=PublishInput(
        title="PostgreSQL Rejected Proposal",
        context="Legacy proposal",
        final_output="Use SQLite for production database.",
        project_id="proj-db"
    ))

    # Approve p1, Reject p3, Leave p2 as PENDING
    KnowledgeService.approve_item(db=db_session, item_id=p1.item_id)
    KnowledgeService.reject_item(db=db_session, item_id=p3.item_id)

    # Search for 'PostgreSQL'
    search_results = KnowledgeService.search_approved_items(db=db_session, query="PostgreSQL")

    # Only p1 should be in search results!
    assert len(search_results) == 1
    assert search_results[0].item_id == p1.item_id
    assert search_results[0].title == "PostgreSQL Setup Guide"
