from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, security
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import Scope, Receive, Send

from app.config import settings
from app.db.session import init_db
from app.api.v1 import knowledge, inbox, memory

from mcp_server.server import mcp


class DynamicMCPApp:
    """
    ASGI wrapper for the Streamable HTTP MCP application.

    Creates a fresh MCP HTTP application for each FastAPI lifespan.
    """

    def __init__(self) -> None:
        self.current_app: Any = self._create_mcp_app()

    def _create_mcp_app(self) -> Any:
        return mcp.streamable_http_app()

    def reset(self) -> None:
        self.current_app = self._create_mcp_app()

    async def __call__(
        self,
        scope: Scope,
        receive: Receive,
        send: Send,
    ) -> None:
        await self.current_app(scope, receive, send)


dynamic_mcp = DynamicMCPApp()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()

    # Reset MCP session manager and enter lifespan context
    dynamic_mcp.reset()

    async with dynamic_mcp.current_app.router.lifespan_context(app):
        yield


def create_app() -> FastAPI:
    """
    Application factory that initializes FastAPI,
    Database, and Streamable HTTP MCP server.
    """

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="AI Work Memory Backend & Remote MCP Service",
        lifespan=lifespan,
    )

    # Enable CORS for React frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register REST API routers FIRST
    app.include_router(knowledge.router, prefix="/api/v1")
    app.include_router(inbox.router, prefix="/api/v1")
    app.include_router(memory.router, prefix="/api/v1")

    @app.get("/")
    def read_root():
        return {
            "status": "online",
            "app": settings.app_name,
            "environment": settings.app_env,
            "mcp_endpoint": "/mcp",
        }

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    # Mount MCP app SECOND
    app.mount("", dynamic_mcp)

    return app


app = create_app()