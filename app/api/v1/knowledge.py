from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.knowledge import PublishInput, PublishOutput, SearchResult
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/knowledge", tags=["Knowledge Ingestion & Retrieval"])

@router.post("/publish", response_model=PublishOutput, status_code=status.HTTP_201_CREATED)
def publish_knowledge(payload: PublishInput, db: Session = Depends(get_db)):
    """Publishes a new knowledge item into the system. Items start in PENDING status."""
    return KnowledgeService.publish_item(db=db, data=payload)

@router.get("/search", response_model=List[SearchResult])
def search_knowledge(
    q: str = Query(..., min_length=1, description="Keyword search query"),
    project_id: Optional[str] = Query(None, description="Optional project filter"),
    limit: int = Query(10, ge=1, le=100, description="Max results limit"),
    db: Session = Depends(get_db)
):
    """Executes keyword search strictly over APPROVED knowledge items. PENDING or REJECTED items are excluded."""
    return KnowledgeService.search_approved_items(db=db, query=q, project_id=project_id, limit=limit)
