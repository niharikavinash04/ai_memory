"""Python MCP Server for AI Work Memory using FastMCP / MCPServer stdio transport."""

import sys
import logging
from typing import Optional, Dict, Any

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    from mcp.server.mcpserver import MCPServer as FastMCP

from mcp_server.tools import (
    hello_world,
    publish_knowledge_tool,
    search_knowledge_tool,
    get_knowledge_tool
)

# Configure logging to sys.stderr so stdio stdout is strictly reserved for JSON-RPC protocol
logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Initialize MCP Server
mcp = FastMCP("ai-work-memory")

@mcp.tool(
    name="hello_world",
    description="Proof of Concept tool returning a greeting from the AI Work Memory MCP server."
)
def hello_world_mcp_tool() -> str:
    """Return greeting from AI Work Memory MCP server."""
    return hello_world()

@mcp.tool(
    name="publish_knowledge",
    description="Publish an AI turn output and context into the Knowledge Inbox for human review."
)
def publish_knowledge_mcp_tool(
    title: str,
    context: str,
    final_output: str,
    project_id: str,
    classification: str = "internal",
    provider: str = "manual",
    author_email: str = "user@company.com"
) -> Dict[str, Any]:
    """Publish a knowledge item into PENDING status."""
    return publish_knowledge_tool(
        title=title,
        context=context,
        final_output=final_output,
        project_id=project_id,
        classification=classification,
        provider=provider,
        author_email=author_email
    )

@mcp.tool(
    name="search_knowledge",
    description="Search approved company knowledge using keyword matching."
)
def search_knowledge_mcp_tool(
    query: str,
    project_id: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """Search approved knowledge items."""
    return search_knowledge_tool(query=query, project_id=project_id, limit=limit)

@mcp.tool(
    name="get_knowledge",
    description="Retrieve full details for a specific knowledge item by its unique ID."
)
def get_knowledge_mcp_tool(item_id: str) -> Dict[str, Any]:
    """Get detailed knowledge item by ID."""
    return get_knowledge_tool(item_id=item_id)

def main():
    """Run the MCP server over stdio transport."""
    mcp.run(transport="stdio")

if __name__ == "__main__":
    main()
