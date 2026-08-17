from fastapi import FastAPI
from mcp.server.mcpserver import MCPServer

mcp = MCPServer("ai-work-memory")

@mcp.tool()
def hello() -> str:
    return "world"

app = FastAPI()
mcp_app = mcp.streamable_http_app()
app.mount("/mcp-server", mcp_app)

print("Streamable HTTP MCP app routes:", mcp_app.routes)
print("FastAPI app mounted successfully.")
