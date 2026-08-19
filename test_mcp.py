import asyncio

from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client


async def main():
    url = "https://unbeaten-hazard-evict.ngrok-free.dev/mcp"

    print(f"Connecting to {url}...")

    async with streamable_http_client(url) as (read_stream, write_stream):
        async with ClientSession(read_stream, write_stream) as session:
            await session.initialize()

            result = await session.list_tools()

            print("\nMCP connection successful!")
            print("\nAvailable tools:")

            for tool in result.tools:
                print(f"- {tool.name}")
                if tool.description:
                    print(f"  {tool.description}")


if __name__ == "__main__":
    asyncio.run(main())