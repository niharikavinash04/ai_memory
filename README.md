# AI Work Memory — Remote MCP & Claude.ai Browser Integration

An internal system for capturing, reviewing, preserving, and retrieving valuable work produced by AI coding agents and browser-based AI assistants (**Claude.ai Browser**, **Claude Code**, and **OpenAI Codex**).

---

## Technical Architecture

```
┌───────────────────────────┐                       ┌───────────────────────────┐
│     Claude.ai Browser     │                       │     Claude Code / Codex   │
└─────────────┬─────────────┘                       └─────────────┬─────────────┘
              │                                                   │
              │ Remote MCP (HTTPS / Streamable HTTP)              │ Local stdio
              ▼                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                          AI Work Memory Backend API                           │
│                       (uvicorn app.main:app --port 8000)                      │
│                                                                               │
│   FastAPI Endpoints (/api/v1/...)   │   Mounted Remote MCP Endpoint (/mcp)   │
└──────────────────────┬──────────────────────────────────────────┬─────────────┘
                       │                                          │
                       └────────────────────┬─────────────────────┘
                                            │ (Direct Python Service Calls)
                                            ▼
                                ┌───────────────────────┐
                                │ Shared Service Layer  │
                                │  (app/services/       │
                                │  knowledge_service.py)│
                                └───────────┬───────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │      PostgreSQL       │
                                │   (knowledge_items)   │
                                └───────────────────────┘
```

---

## Repository Structure

```
ai-work-memory/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application, lifespan & /mcp Streamable HTTP mount
│   ├── config.py            # Environment & database configuration
│   ├── api/                 # API Routes (Ingestion & Knowledge Inbox)
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── knowledge.py # /api/v1/knowledge/publish & search
│   │       └── inbox.py     # /api/v1/inbox (list, detail, approve, reject)
│   ├── db/                  # Database session & models base
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── session.py
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   └── knowledge.py     # KnowledgeItem entity
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   └── knowledge.py
│   └── services/            # Reusable business logic service layer
│       ├── __init__.py
│       └── knowledge_service.py
├── mcp_server/
│   ├── __init__.py
│   ├── server.py            # Python MCP Server (FastMCP / MCPServer instance)
│   └── tools.py             # Tool logic (hello_world, publish, search, get)
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api.py          # Core health check tests
│   ├── test_knowledge_api.py# Ingestion, Inbox & Search API integration tests
│   ├── test_knowledge_service.py # Service unit tests & hash deduplication
│   ├── test_mcp_http.py     # Streamable HTTP remote MCP transport tests
│   ├── test_mcp_integration.py # Stdio JSON-RPC client-server integration test
│   └── test_mcp_server.py   # Unit tests for MCP server tool registrations
├── docs/
│   ├── claude-browser-mcp.md# Guide for Claude.ai browser integration via HTTPS tunnel
│   ├── knowledge-model.md   # Schema, lifecycle & deduplication documentation
│   ├── mcp-research.md      # Protocol research, Streamable HTTP & stdio details
│   └── mcp-tools.md         # Production contracts for publish, search, get tools
├── .env.example
├── .gitignore
├── .mcp.json                # Project-scoped Claude Code configuration manifest
├── codex.toml               # OpenAI Codex configuration manifest
├── docker-compose.yml       # Docker Compose setup (FastAPI + PostgreSQL)
├── Dockerfile
├── pytest.ini
├── README.md
└── requirements.txt
```

---

## Startup & Execution Instructions

### 1. Launch Server Locally

```bash
cd ai-work-memory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Endpoints exposed:
- **FastAPI Web / REST API**: `http://localhost:8000/api/v1/...`
- **Remote Streamable HTTP MCP Endpoint**: `http://localhost:8000/mcp`

### 2. Connecting to Claude.ai Browser

Refer to [docs/claude-browser-mcp.md](file:///c:/Users/nihar/Downloads/AI_Memory/ai-work-memory/docs/claude-browser-mcp.md) for complete instructions:
1. Expose `http://localhost:8000` via HTTPS tunnel (`ngrok http 8000`).
2. Add connector URL in Claude.ai Settings: `https://<subdomain>.ngrok-free.app/mcp`.
3. Discover and invoke tools (`hello_world`, `publish_knowledge`, `search_knowledge`, `get_knowledge`).

---

## Testing

Run the full automated Pytest test suite (16 tests covering REST API, KnowledgeService, SHA-256 deduplication, stdio transport, and Streamable HTTP transport):

```bash
python -m pytest -v
```

Expected Output:
```text
======================= 16 passed, 2 warnings in 6.07s ========================
```
