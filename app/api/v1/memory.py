from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.schemas.knowledge import SearchResult, PublishInput, PublishOutput
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/memory", tags=["Memory Operations"])

class MemoryQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Memory query string")
    project_id: Optional[str] = Field(None, description="Optional project filter")
    limit: int = Field(10, ge=1, le=100, description="Max results limit")

@router.get("/query", response_model=List[SearchResult])
def query_memory_get(
    q: str = Query(..., min_length=1, description="Memory search query"),
    project_id: Optional[str] = Query(None, description="Optional project filter"),
    limit: int = Query(10, ge=1, le=100, description="Max results limit"),
    db: Session = Depends(get_db)
):
    """Query AI_Memory stored in Supabase via GET query parameters."""
    return KnowledgeService.search_approved_items(db=db, query=q, project_id=project_id, limit=limit)

@router.post("/query", response_model=List[SearchResult])
def query_memory_post(
    payload: MemoryQueryRequest,
    db: Session = Depends(get_db)
):
    """Query AI_Memory stored in Supabase via POST JSON payload."""
    return KnowledgeService.search_approved_items(
        db=db,
        query=payload.query,
        project_id=payload.project_id,
        limit=payload.limit
    )

@router.post("/publish", response_model=PublishOutput, status_code=status.HTTP_201_CREATED)
def publish_memory(
    payload: PublishInput,
    db: Session = Depends(get_db)
):
    """Publish a memory item into AI_Memory Supabase store."""
    return KnowledgeService.publish_item(db=db, data=payload)
