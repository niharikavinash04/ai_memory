from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.knowledge import InboxItemResponse
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/inbox", tags=["Knowledge Inbox & Review"])

@router.get("", response_model=List[InboxItemResponse])
def get_pending_inbox(db: Session = Depends(get_db)):
    """Retrieves all candidate items in PENDING status for review."""
    return KnowledgeService.get_pending_inbox_items(db=db)

@router.get("/{item_id}", response_model=InboxItemResponse)
def get_inbox_item_detail(item_id: str, db: Session = Depends(get_db)):
    """Retrieves single inbox item detail by ID."""
    item = KnowledgeService.get_inbox_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge item with ID '{item_id}' not found."
        )
    return item

@router.post("/{item_id}/approve", response_model=InboxItemResponse)
def approve_inbox_item(item_id: str, db: Session = Depends(get_db)):
    """Approves a PENDING item (PENDING -> APPROVED), making it searchable."""
    try:
        return KnowledgeService.approve_item(db=db, item_id=item_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )

@router.post("/{item_id}/reject", response_model=InboxItemResponse)
def reject_inbox_item(item_id: str, db: Session = Depends(get_db)):
    """Rejects a PENDING item (PENDING -> REJECTED). Rejected items remain unsearchable."""
    try:
        return KnowledgeService.reject_item(db=db, item_id=item_id)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
