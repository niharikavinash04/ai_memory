import asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mcp.server.mcpserver import MCPServer

m = MCPServer("test")
@m.tool()
def hello() -> str:
    return "world"

# Test approach: Create FastAPI app, add routes / AND /health BEFORE mounting mcp_app at ""
app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

mcp_app = m.streamable_http_app()
app.mount("", mcp_app)

client = TestClient(app)
res_root = client.get("/")
print("Root GET status:", res_root.status_code)
res_health = client.get("/health")
print("Health GET status:", res_health.status_code)
