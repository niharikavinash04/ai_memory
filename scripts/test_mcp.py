import asyncio

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


async def main():
    url = "http://127.0.0.1:8000/mcp"

    print(f"Connecting to MCP server at {url}...")

    async with streamable_http_client(url) as (
        read_stream,
        write_stream,
    ):
        async with ClientSession(read_stream, write_stream) as session:

            await session.initialize()

            print("MCP session initialized successfully!")

            result = await session.list_tools()

            print("\nAvailable MCP tools:")

            for tool in result.tools:
                print(f" - {tool.name}")

            print("\nMCP TEST SUCCESS!")


if __name__ == "__main__":
    asyncio.run(main())