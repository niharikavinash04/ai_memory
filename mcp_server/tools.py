"""MCP Tools implementation for AI Work Memory MCP Server.

Provides wrapper functions that connect MCP tool calls directly to the
reusable KnowledgeService layer.
"""

from typing import Dict, Any, Optional
from app.db.session import SessionLocal
from app.schemas.knowledge import PublishInput
from app.services.knowledge_service import KnowledgeService

def hello_world() -> str:
    """Returns a greeting from the AI Work Memory MCP server."""
    return "Hello from the AI Work Memory MCP server."

def publish_knowledge_tool(
    title: str,
    context: str,
    final_output: str,
    project_id: str,
    classification: str = "internal",
    provider: str = "manual",
    author_email: str = "user@company.com"
) -> Dict[str, Any]:
    """Publishes a knowledge item into the AI Work Memory system as PENDING.
    
    Preserves SHA-256 content hash deduplication.
    """
    db = SessionLocal()
    try:
        payload = PublishInput(
            title=title,
            context=context,
            final_output=final_output,
            project_id=project_id,
            classification=classification,
            provider=provider,
            author_email=author_email
        )
        res = KnowledgeService.publish_item(db=db, data=payload)
        return res.model_dump()
    finally:
        db.close()

def search_knowledge_tool(
    query: str,
    project_id: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """Searches strictly APPROVED knowledge items using PostgreSQL keyword matching."""
    db = SessionLocal()
    try:
        results = KnowledgeService.search_approved_items(
            db=db,
            query=query,
            project_id=project_id,
            limit=limit
        )
        return {
            "query": query,
            "count": len(results),
            "results": [r.model_dump() for r in results]
        }
    finally:
        db.close()

def get_knowledge_tool(item_id: str) -> Dict[str, Any]:
    """Retrieves a single knowledge item detail by ID."""
    db = SessionLocal()
    try:
        item = KnowledgeService.get_inbox_item(db=db, item_id=item_id)
        if not item:
            return {
                "found": False,
                "error": f"Knowledge item with ID '{item_id}' not found."
            }
        return {
            "found": True,
            "item": {
                "id": item.id,
                "title": item.title,
                "context": item.context,
                "final_output": item.final_output,
                "project_id": item.project_id,
                "classification": item.classification,
                "status": item.status,
                "provider": item.provider,
                "author_email": item.author_email,
                "content_hash": item.content_hash,
                "warnings": item.warnings,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "approved_at": item.approved_at.isoformat() if item.approved_at else None
            }
        }
    finally:
        db.close()
