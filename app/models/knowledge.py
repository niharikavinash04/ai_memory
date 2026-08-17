import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.db.base import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    context = Column(Text, nullable=False)
    final_output = Column(Text, nullable=False)
    project_id = Column(String(100), nullable=False, index=True)
    classification = Column(String(50), nullable=False, default="internal")
    status = Column(String(50), nullable=False, default="PENDING", index=True)
    provider = Column(String(50), nullable=False, default="manual")
    author_email = Column(String(255), nullable=False, default="unknown@company.com")
    content_hash = Column(String(64), nullable=False, unique=True, index=True)
    warnings = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<KnowledgeItem(id='{self.id}', title='{self.title}', status='{self.status}')>"
