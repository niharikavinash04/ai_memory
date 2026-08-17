import os
import sys
import asyncio
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uvicorn
from fastapi import FastAPI
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from mcp_server.server import mcp
from app.db.session import init_db

mcp_app = mcp.streamable_http_app()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    async with mcp_app.router.lifespan_context(app):
        yield

app = FastAPI(title="AI Work Memory", lifespan=lifespan)
app.mount("", mcp_app)

@app.get("/health")
def health():
    return {"status": "ok"}

async def run_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=8005, log_level="warning")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    server_task = asyncio.create_task(run_server())
    await asyncio.sleep(1)

    print("Connecting to Streamable HTTP MCP server at http://127.0.0.1:8005/mcp...")
    async with streamable_http_client("http://127.0.0.1:8005/mcp") as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print("SUCCESSFULLY INITIALIZED MCP HTTP SESSION!")

            # 1. Discover tools
            tools_res = await session.list_tools()
            tool_names = [t.name for t in tools_res.tools]
            print(f"Discovered MCP Tools: {tool_names}")

            # 2. Call hello_world
            hello_res = await session.call_tool("hello_world", {})
            print(f"hello_world Output: {hello_res.content[0].text}")

            # 3. Call publish_knowledge
            pub_res = await session.call_tool("publish_knowledge", {
                "title": "Remote HTTP MCP Spec",
                "context": "Browser integration requirement",
                "final_output": "Streamable HTTP is used for remote MCP.",
                "project_id": "proj-remote",
                "classification": "internal"
            })
            print(f"publish_knowledge Output: {pub_res.content[0].text}")

            # 4. Call search_knowledge
            search_res = await session.call_tool("search_knowledge", {"query": "Streamable"})
            print(f"search_knowledge Output: {search_res.content[0].text}")

    server_task.cancel()
    print("Test finished successfully!")

if __name__ == "__main__":
    asyncio.run(main())
