import sys
import os
import json
import uuid
import pytest
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.knowledge
from app.db.base import Base
from app.services.knowledge_service import KnowledgeService

@pytest.fixture(autouse=True)
def init_test_db():
    """Ensure DB tables exist for MCP tool execution during tests."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    import app.models.knowledge  # noqa: F401
    Base.metadata.create_all(bind=engine)
    yield

@pytest.mark.asyncio
async def test_stdio_mcp_client_integration():
    """Simulates external AI agent clients (Claude Code / Codex) connecting to the Python MCP server via stdio transport."""
    server_params = StdioServerParameters(
        command=sys.executable,
        args=["-m", "mcp_server.server"],
        env=dict(os.environ)
    )

    unique_title = f"MCP Stdio Guide {uuid.uuid4()}"

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # 1. Initialize session with server
            await session.initialize()

            # 2. Discover available tools
            tools_result = await session.list_tools()
            tool_names = [tool.name for tool in tools_result.tools]
            for expected in ["hello_world", "publish_knowledge", "search_knowledge", "get_knowledge"]:
                assert expected in tool_names, f"Expected '{expected}' in discovered tools: {tool_names}"

            # 3. Call hello_world tool
            hello_res = await session.call_tool("hello_world", {})
            assert "Hello from the AI Work Memory MCP server." in hello_res.content[0].text

            # 4. Call publish_knowledge tool via MCP
            pub_res = await session.call_tool("publish_knowledge", {
                "title": unique_title,
                "context": "Connecting Claude Code and Codex via stdio",
                "final_output": "Use FastMCP over stdio transport.",
                "project_id": "proj-mcp",
                "classification": "internal",
                "provider": "claude",
                "author_email": "engineer@company.com"
            })

            pub_text = pub_res.content[0].text
            pub_json = json.loads(pub_text) if isinstance(pub_text, str) and pub_text.startswith("{") else eval(pub_text)
            assert pub_json["status"] == "PENDING"
            item_id = pub_json["item_id"]

            # 5. Call search_knowledge tool while PENDING -> returns 0 results
            search_pending = await session.call_tool("search_knowledge", {"query": unique_title})
            search_pending_text = search_pending.content[0].text
            search_pending_json = json.loads(search_pending_text) if isinstance(search_pending_text, str) and search_pending_text.startswith("{") else eval(search_pending_text)
            assert search_pending_json["count"] == 0

            # 6. Approve item directly in DB via KnowledgeService
            from app.db.session import SessionLocal
            db = SessionLocal()
            try:
                KnowledgeService.approve_item(db=db, item_id=item_id)
            finally:
                db.close()

            # 7. Call search_knowledge tool after APPROVAL -> returns 1 result
            search_approved = await session.call_tool("search_knowledge", {"query": unique_title})
            search_approved_text = search_approved.content[0].text
            search_approved_json = json.loads(search_approved_text) if isinstance(search_approved_text, str) and search_approved_text.startswith("{") else eval(search_approved_text)
            assert search_approved_json["count"] == 1
            assert search_approved_json["results"][0]["item_id"] == item_id

            # 8. Call get_knowledge tool -> returns full details
            get_res = await session.call_tool("get_knowledge", {"item_id": item_id})
            get_text = get_res.content[0].text
            get_json = json.loads(get_text) if isinstance(get_text, str) and get_text.startswith("{") else eval(get_text)
            assert get_json["found"] is True
            assert get_json["item"]["id"] == item_id
            assert get_json["item"]["title"] == unique_title
            assert get_json["item"]["status"] == "APPROVED"
