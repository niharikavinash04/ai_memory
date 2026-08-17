import hashlib
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.models.knowledge import KnowledgeItem
from app.schemas.knowledge import PublishInput, PublishOutput, SearchResult

def calculate_content_hash(title: str, context: str, final_output: str) -> str:
    """Computes a deterministic SHA-256 content hash over normalized title, context, and final_output strings."""
    norm_title = title.strip()
    norm_context = context.strip()
    norm_final_output = final_output.strip()
    raw_content = f"{norm_title}\n{norm_context}\n{norm_final_output}"
    return hashlib.sha256(raw_content.encode("utf-8")).hexdigest()

class KnowledgeService:
    @staticmethod
    def publish_item(db: Session, data: PublishInput) -> PublishOutput:
        """Publishes a new knowledge item into the Inbox as PENDING or returns existing duplicate."""
        content_hash = calculate_content_hash(data.title, data.context, data.final_output)

        # Check for existing item with exact content hash
        existing_item = db.query(KnowledgeItem).filter(KnowledgeItem.content_hash == content_hash).first()
        if existing_item:
            return PublishOutput(
                item_id=existing_item.id,
                status=existing_item.status,
                content_hash=content_hash,
                is_duplicate=True,
                warnings=[{
                    "type": "duplicate",
                    "message": f"An identical knowledge item already exists with status '{existing_item.status}'."
                }],
                message="Duplicate item detected. Existing item returned without creating a new record."
            )

        # Create new pending knowledge item
        new_item = KnowledgeItem(
            title=data.title.strip(),
            context=data.context.strip(),
            final_output=data.final_output.strip(),
            project_id=data.project_id.strip(),
            classification=data.classification,
            status="PENDING",
            provider=data.provider,
            author_email=data.author_email,
            content_hash=content_hash,
            warnings=[]
        )

        db.add(new_item)
        db.commit()
        db.refresh(new_item)

        return PublishOutput(
            item_id=new_item.id,
            status=new_item.status,
            content_hash=new_item.content_hash,
            is_duplicate=False,
            warnings=[],
            message="Knowledge item created successfully in PENDING status."
        )

    @staticmethod
    def get_pending_inbox_items(db: Session) -> List[KnowledgeItem]:
        """Retrieves all candidate items in PENDING status."""
        return db.query(KnowledgeItem).filter(
            KnowledgeItem.status == "PENDING"
        ).order_by(desc(KnowledgeItem.created_at)).all()

    @staticmethod
    def get_inbox_item(db: Session, item_id: str) -> Optional[KnowledgeItem]:
        """Retrieves a single knowledge item by ID."""
        return db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()

    @staticmethod
    def approve_item(db: Session, item_id: str) -> KnowledgeItem:
        """Approves a PENDING knowledge item, changing status to APPROVED."""
        item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
        if not item:
            raise ValueError(f"Knowledge item with ID '{item_id}' not found.")
        if item.status != "PENDING":
            raise ValueError(f"Item '{item_id}' cannot be approved because current status is '{item.status}' (must be 'PENDING').")

        item.status = "APPROVED"
        item.approved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def reject_item(db: Session, item_id: str) -> KnowledgeItem:
        """Rejects a PENDING knowledge item, changing status to REJECTED."""
        item = db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
        if not item:
            raise ValueError(f"Knowledge item with ID '{item_id}' not found.")
        if item.status != "PENDING":
            raise ValueError(f"Item '{item_id}' cannot be rejected because current status is '{item.status}' (must be 'PENDING').")

        item.status = "REJECTED"
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def search_approved_items(
        db: Session,
        query: str,
        project_id: Optional[str] = None,
        limit: int = 10
    ) -> List[SearchResult]:
        """Performs keyword search strictly over APPROVED items. PENDING or REJECTED items are excluded."""
        search_pattern = f"%{query.strip()}%"

        base_query = db.query(KnowledgeItem).filter(
            KnowledgeItem.status == "APPROVED",
            or_(
                KnowledgeItem.title.ilike(search_pattern),
                KnowledgeItem.context.ilike(search_pattern),
                KnowledgeItem.final_output.ilike(search_pattern)
            )
        )

        if project_id:
            base_query = base_query.filter(KnowledgeItem.project_id == project_id)

        items = base_query.order_by(desc(KnowledgeItem.approved_at)).limit(limit).all()

        results = []
        for item in items:
            snippet_text = item.final_output[:200] + ("..." if len(item.final_output) > 200 else "")
            results.append(SearchResult(
                item_id=item.id,
                title=item.title,
                snippet=snippet_text,
                project_id=item.project_id,
                classification=item.classification,
                provider=item.provider,
                author_email=item.author_email,
                status=item.status,
                created_at=item.created_at,
                approved_at=item.approved_at
            ))

        return results
