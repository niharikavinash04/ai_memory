from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class PublishInput(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Item title")
    context: str = Field(..., min_length=1, description="Prompt context or requirement explanation")
    final_output: str = Field(..., min_length=1, description="Visible assistant output text")
    project_id: str = Field(..., min_length=1, max_length=100, description="Target project identifier")
    classification: str = Field(
        default="internal",
        description="Classification: private, internal, project-confidential, restricted"
    )
    provider: str = Field(
        default="manual",
        description="Source provider: claude, codex, manual, imported"
    )
    author_email: str = Field(
        default="user@company.com",
        description="Author email address"
    )

class PublishOutput(BaseModel):
    item_id: str
    status: str
    content_hash: str
    is_duplicate: bool = False
    warnings: List[Any] = []
    message: str

class InboxItemResponse(BaseModel):
    id: str
    title: str
    context: str
    final_output: str
    project_id: str
    classification: str
    status: str
    provider: str
    author_email: str
    content_hash: str
    warnings: Optional[List[Any]] = None
    created_at: datetime
    updated_at: datetime
    approved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, description="Keyword search query")
    project_id: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=100)

class SearchResult(BaseModel):
    item_id: str
    title: str
    snippet: str
    project_id: str
    classification: str
    provider: str
    author_email: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
