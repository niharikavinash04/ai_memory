# MCP Tool Specifications & Service Integration

## 1. Overview

The **AI Work Memory** system exposes a single, provider-neutral **Python MCP Server** over `stdio` transport that serves both **Claude Code** and **OpenAI Codex**.

All MCP tool handlers delegate directly to the shared Python **`KnowledgeService`** layer (`app/services/knowledge_service.py`) without performing HTTP hops to localhost.

---

## 2. Shared Architecture Map

```
Claude Code CLI                           OpenAI Codex CLI
     │                                           │
     │ stdio                                     │ stdio
     └─────────────────────┬─────────────────────┘
                           ▼
               ┌───────────────────────┐
               │   Python MCP Server   │
               │  (FastMCP / mcp SDK)  │
               │                       │
               │   - hello_world       │
               │   - publish_knowledge │
               │   - search_knowledge  │
               │   - get_knowledge     │
               └───────────┬───────────┘
                           │ (Direct Python Module Calls)
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

## 3. Exposed MCP Tools

### 3.1 `hello_world`
- **Description**: Proof of Concept regression tool returning a greeting.
- **Input**: None
- **Output**: `"Hello from the AI Work Memory MCP server."`
- **Service Called**: N/A (Direct string return)

---

### 3.2 `publish_knowledge`
- **Description**: Publishes an AI turn output and prompt context into the Knowledge Inbox in `PENDING` status. Preserves SHA-256 content hash deduplication.
- **Service Called**: `KnowledgeService.publish_item()`

#### Input Parameters:
```json
{
  "title": "FastMCP Stdio Transport Guide",
  "context": "Instructions for stdio transport configuration",
  "final_output": "Configure FastMCP with sys.stderr logging...",
  "project_id": "proj-mcp",
  "classification": "internal",
  "provider": "claude",
  "author_email": "developer@company.com"
}
```

#### Output Schema:
```json
{
  "item_id": "e4848cbf-fb7c-4e85-9df0-9486b4675756",
  "status": "PENDING",
  "content_hash": "f6b8250e450a0158aac518e146a00c2be7e01cd993ec6a881ae24897ff557162",
  "is_duplicate": false,
  "warnings": [],
  "message": "Knowledge item created successfully in PENDING status."
}
```

---

### 3.3 `search_knowledge`
- **Description**: Searches strictly `APPROVED` knowledge items using PostgreSQL keyword matching. Items in `PENDING` or `REJECTED` status are excluded.
- **Service Called**: `KnowledgeService.search_approved_items()`

#### Input Parameters:
```json
{
  "query": "FastMCP",
  "project_id": "proj-mcp",
  "limit": 10
}
```

#### Output Schema:
```json
{
  "query": "FastMCP",
  "count": 1,
  "results": [
    {
      "item_id": "e4848cbf-fb7c-4e85-9df0-9486b4675756",
      "title": "FastMCP Stdio Transport Guide",
      "snippet": "Configure FastMCP with sys.stderr logging...",
      "project_id": "proj-mcp",
      "classification": "internal",
      "provider": "claude",
      "author_email": "developer@company.com",
      "status": "APPROVED",
      "created_at": "2026-08-11T05:00:00Z",
      "approved_at": "2026-08-11T05:02:00Z"
    }
  ]
}
```

---

### 3.4 `get_knowledge`
- **Description**: Retrieves full item details, prompt context, and metadata for a specific knowledge item by its unique ID.
- **Service Called**: `KnowledgeService.get_inbox_item()`

#### Input Parameters:
```json
{
  "item_id": "e4848cbf-fb7c-4e85-9df0-9486b4675756"
}
```

#### Output Schema:
```json
{
  "found": true,
  "item": {
    "id": "e4848cbf-fb7c-4e85-9df0-9486b4675756",
    "title": "FastMCP Stdio Transport Guide",
    "context": "Instructions for stdio transport configuration",
    "final_output": "Configure FastMCP with sys.stderr logging...",
    "project_id": "proj-mcp",
    "classification": "internal",
    "status": "APPROVED",
    "provider": "claude",
    "author_email": "developer@company.com",
    "content_hash": "f6b8250e450a0158aac518e146a00c2be7e01cd993ec6a881ae24897ff557162",
    "warnings": [],
    "created_at": "2026-08-11T05:00:00Z",
    "approved_at": "2026-08-11T05:02:00Z"
  }
}
```
