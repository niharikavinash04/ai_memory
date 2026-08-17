# Model Context Protocol (MCP) SDK Research & Architecture

## 1. Installed MCP SDK Inspection

- **Installed Package**: `mcp`
- **Version**: `2.0.0`
- **Python Compatibility**: Python 3.11+ (Tested on Python 3.14.3)

---

## 2. Supported Transports in MCP 2.0.0

| Transport Name | Python Module / Class | Usage Context |
| :--- | :--- | :--- |
| **`stdio` (Standard I/O)** | `mcp.server.stdio` / `stdio_client` | Local CLI coding assistants (Claude Code CLI, OpenAI Codex CLI). Client launches server executable directly as a subprocess. |
| **`Streamable HTTP`** | `mcp.server.streamable_http` / `StreamableHTTPServerTransport` / `streamable_http_app()` | **Primary Target for Remote MCP & Claude.ai Browser Integration**. Replaces legacy SSE with standard HTTP POST/GET streaming. |

---

## 3. Python API for Streamable HTTP in MCP 2.0.0

In `mcp` 2.0.0, the high-level server instance (`FastMCP` / `MCPServer`) natively generates a Starlette/ASGI HTTP application for Streamable HTTP via:

```python
# Create Starlette ASGI sub-application exposing the /mcp endpoint
mcp_app = mcp.streamable_http_app()

# Mount into FastAPI
app.mount("", mcp_app)
```

### Lifespan & Task Group Initialization
`mcp.streamable_http_app()` uses an internal `StreamableHTTPSessionManager` to manage active sessions. The manager's task group MUST be initialized within the Starlette/FastAPI lifespan context manager:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Create fresh streamable_http_app instance per lifespan context
    fresh_mcp_app = mcp.streamable_http_app()
    async with fresh_mcp_app.router.lifespan_context(app):
        yield
```

---

## 4. Transport Selection Rationale: Stdio vs. Streamable HTTP

### Why Streamable HTTP is Required for Claude.ai Browser
1. **Browser Sandbox**: The Claude.ai web application runs inside the user's web browser and communicates with Anthropic cloud services. It cannot launch local OS executables via standard input/output streams (`stdio`).
2. **Remote Accessibility**: Streamable HTTP operates over standard web protocols (HTTP/1.1 and HTTP/2) over TCP port sockets, allowing local development servers to be securely exposed over HTTPS (e.g. via ngrok or Cloudflare Tunnel) to Claude.ai.
3. **Dual Transport Support**: The system retains `stdio` transport in `mcp_server/server.py` for regression and CLI testing, while mounting `Streamable HTTP` at `/mcp` on the FastAPI server for remote browser integration.
