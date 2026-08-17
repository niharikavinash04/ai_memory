import pytest
from mcp_server.tools import hello_world
from mcp_server.server import mcp

def test_hello_world_tool_direct():
    """Verify that hello_world direct function returns the expected string."""
    result = hello_world()
    assert result == "Hello from the AI Work Memory MCP server."

@pytest.mark.asyncio
async def test_mcp_server_tool_registration():
    """Verify that the MCP server registers all four required tools."""
    tools = await mcp.list_tools()
    tool_names = [getattr(t, "name", None) or t.get("name") for t in tools]
    assert "hello_world" in tool_names
    assert "publish_knowledge" in tool_names
    assert "search_knowledge" in tool_names
    assert "get_knowledge" in tool_names

@pytest.mark.asyncio
async def test_mcp_server_hello_world_execution():
    """Verify executing hello_world via MCP server returns expected content."""
    result = await mcp.call_tool("hello_world", {})
    assert result is not None
    if isinstance(result, list):
        item = result[0]
        text = getattr(item, "text", str(item))
        assert "Hello from the AI Work Memory MCP server." in text
    else:
        assert "Hello from the AI Work Memory MCP server." in str(result)
