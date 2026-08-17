import os
import sys
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uvicorn
import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from app.main import app

async def run_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    server_task = asyncio.create_task(run_server())
    await asyncio.sleep(1.5)

    print("Verifying http://127.0.0.1:8000/health...")
    async with httpx.AsyncClient() as client:
        res = await client.get("http://127.0.0.1:8000/health")
        print(f"Health Status Code: {res.status_code}, Body: {res.json()}")

    print("Verifying http://127.0.0.1:8000/mcp via streamable_http_client...")
    async with streamable_http_client("http://127.0.0.1:8000/mcp") as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            print("Successfully initialized MCP session at http://127.0.0.1:8000/mcp!")

            tools_res = await session.list_tools()
            tool_names = [t.name for t in tools_res.tools]
            print(f"Discovered Tools: {tool_names}")

            hello_res = await session.call_tool("hello_world", {})
            print(f"hello_world Result: '{hello_res.content[0].text}'")

    server_task.cancel()
    print("Local verification completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
