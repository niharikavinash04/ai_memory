import os
import sys
import uuid
import json
import asyncio
import pytest
import uvicorn
import httpx

from fastapi import FastAPI
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models.knowledge
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app
from app.services.knowledge_service import KnowledgeService

@pytest.fixture
def http_server_url():
    """Fixture providing isolated in-memory DB and Streamable HTTP server URL."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    import app.models.knowledge  # noqa: F401
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app_instance = create_app()
    app_instance.dependency_overrides[get_db] = override_get_db
    return ("http://127.0.0.1:8006/mcp", "http://127.0.0.1:8006", app_instance)

@pytest.mark.asyncio
async def test_mcp_streamable_http_transport(http_server_url):
    """Verifies complete Streamable HTTP MCP client-server communication, tool discovery, and tool execution."""
    mcp_url, base_url, test_app = http_server_url
    config = uvicorn.Config(test_app, host="127.0.0.1", port=8006, log_level="warning")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())
    await asyncio.sleep(1.5)  # Allow server to initialize

    unique_title = f"Streamable HTTP Spec {uuid.uuid4()}"

    try:
        # 1. Verify FastAPI application starts and REST endpoint works
        async with httpx.AsyncClient() as client:
            health_res = await client.get(f"{base_url}/health")
            assert health_res.status_code == 200
            assert health_res.json() == {"status": "ok"}

            root_res = await client.get(f"{base_url}/")
            assert root_res.status_code == 200
            assert root_res.json()["mcp_endpoint"] == "/mcp"

        # 2. Connect via Streamable HTTP client
        async with streamable_http_client(mcp_url) as (read, write):
            async with ClientSession(read, write) as session:
                # 3. Initialize MCP session
                await session.initialize()

                # 4. Discover tools and verify exact tool set
                tools_res = await session.list_tools()
                tool_names = set(t.name for t in tools_res.tools)
                expected_tools = {
                    "hello_world",
                    "publish_knowledge",
                    "search_knowledge",
                    "get_knowledge"
                }
                assert tool_names == expected_tools, f"Discovered tools {tool_names} do not match expected {expected_tools}"

                # 5. Call hello_world tool and verify exact text response
                hello_res = await session.call_tool("hello_world", {})
                assert hello_res.content[0].text == "Hello from the AI Work Memory MCP server."

                # 6. Call publish_knowledge tool via HTTP MCP
                pub_res = await session.call_tool("publish_knowledge", {
                    "title": unique_title,
                    "context": "Verifying remote MCP over HTTP",
                    "final_output": "Streamable HTTP works for Claude.ai browser.",
                    "project_id": "proj-browser",
                    "classification": "internal"
                })
                pub_text = pub_res.content[0].text
                pub_json = json.loads(pub_text) if isinstance(pub_text, str) and pub_text.startswith("{") else eval(pub_text)
                assert pub_json["status"] == "PENDING"
                item_id = pub_json["item_id"]

                # 7. Search while PENDING -> returns 0 results
                search_pending = await session.call_tool("search_knowledge", {"query": unique_title})
                search_pending_json = json.loads(search_pending.content[0].text)
                assert search_pending_json["count"] == 0

                # 8. Approve item directly via service
                from app.db.session import SessionLocal
                db = SessionLocal()
                try:
                    KnowledgeService.approve_item(db=db, item_id=item_id)
                finally:
                    db.close()

                # 9. Search after APPROVAL -> returns 1 result
                search_approved = await session.call_tool("search_knowledge", {"query": unique_title})
                search_approved_json = json.loads(search_approved.content[0].text)
                assert search_approved_json["count"] == 1
                assert search_approved_json["results"][0]["item_id"] == item_id

                # 10. Get knowledge detail via HTTP MCP
                get_res = await session.call_tool("get_knowledge", {"item_id": item_id})
                get_json = json.loads(get_res.content[0].text)
                assert get_json["found"] is True
                assert get_json["item"]["id"] == item_id
                assert get_json["item"]["status"] == "APPROVED"
    finally:
        server_task.cancel()
