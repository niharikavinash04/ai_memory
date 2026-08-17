# Claude.ai Browser Integration & Remote MCP Guide

## 1. Executive Summary

This document specifies the integration architecture for connecting **Claude.ai in the browser** to the **AI Work Memory** system via a **Remote MCP Server over HTTPS / Streamable HTTP**.

---

## 2. Architecture Comparison: Stdio vs. Remote HTTP MCP

| Architectural Dimension | Local Stdio Transport (`stdio`) | Remote Streamable HTTP Transport (`/mcp`) |
| :--- | :--- | :--- |
| **Primary Target** | CLI Coding Agents (Claude Code CLI, Codex CLI) | **Claude.ai Browser Application** |
| **Execution Model** | Client spawns server process directly on local machine | Client sends HTTP requests to a remote HTTPS endpoint |
| **Protocol** | Standard input/output JSON-RPC stream | Streamable HTTP (HTTP POST / GET / DELETE stream) |
| **Network Boundary** | Restricted to localhost OS subprocesses | Accessible over LAN, WAN, or Cloud HTTPS URLs |

### Why Stdio is Insufficient for Claude.ai Browser
The **Claude.ai web application** runs in the user's web browser and communicates with Anthropic cloud servers. Browsers cannot spawn local OS subprocesses (`stdio`). Therefore, Claude.ai requires a publicly reachable **HTTPS MCP endpoint** running Streamable HTTP.

---

## 3. Remote MCP System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Claude.ai Browser                    │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Remote MCP over HTTPS
                             ▼
┌─────────────────────────────────────────────────────────┐
│              HTTPS Secure Tunnel / Proxy                │
│       (e.g., ngrok / Cloudflare Tunnel / Cloud Load Balancer)│
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Local HTTP Forwarding
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Application                   │
│               (uvicorn app.main:app --port 8000)        │
│                                                         │
│   Mount: /mcp (StreamableHTTPASGIApp)                   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│               Shared KnowledgeService                   │
│             (app/services/knowledge_service.py)         │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                     │
│                  (knowledge_items)                      │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Local Development & Tunnel Setup

### Step 1: Start PostgreSQL and FastAPI Application
Start the application server locally on port 8000:

```bash
cd ai-work-memory
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify that local endpoints are listening:
- **FastAPI Health Check**: `http://localhost:8000/health`
- **Local Streamable HTTP MCP Endpoint**: `http://localhost:8000/mcp`

---

### Step 2: Expose Local MCP Endpoint via HTTPS Tunnel

Because Claude.ai cannot access `localhost` or `127.0.0.1` directly, use a secure HTTPS tunnel for development:

#### Option A: Using Cloudflare Tunnel (`cloudflared`)
```bash
cloudflared tunnel --url http://localhost:8000
```

#### Option B: Using `ngrok`
```bash
ngrok http 8000
```

This will produce a public HTTPS URL, for example:
`https://ai-work-memory.ngrok-free.app`

Your remote MCP endpoint for Claude.ai is:
`https://ai-work-memory.ngrok-free.app/mcp`

---

## 5. Configuring Claude.ai Browser Connector

1. Log into **Claude.ai** in your browser.
2. Navigate to **Settings** $\rightarrow$ **Integrations** / **MCP Connectors** (or Custom Connector configuration).
3. Click **Add New MCP Server**.
4. Enter Server Details:
   - **Name**: `AI Work Memory`
   - **URL**: `https://your-subdomain.ngrok-free.app/mcp`
   - **Transport**: `Streamable HTTP` / `HTTP`
5. Save the configuration. Claude.ai will perform an HTTP initialization handshake (`POST /mcp`) and discover all exposed tools:
   - `hello_world`
   - `publish_knowledge`
   - `search_knowledge`
   - `get_knowledge`

---

## 6. Verification Prompts in Claude.ai

### 1. Test `hello_world`
> **User Prompt**: *"Call the hello_world tool on AI Work Memory server."*  
> **Expected Response**: `"Hello from the AI Work Memory MCP server."`

### 2. Test `publish_knowledge`
> **User Prompt**: *"Publish this architecture decision into Company Memory under project 'proj-mcp'."*  
> **Expected Response**: Confirmation returning `item_id`, `status: "PENDING"`, and SHA-256 `content_hash`.

### 3. Test `search_knowledge`
> **User Prompt**: *"Search company memory for 'PostgreSQL setup'."*  
> **Expected Response**: List of matching `APPROVED` knowledge items. *(Unapproved `PENDING` items are strictly excluded).*

### 4. Test `get_knowledge`
> **User Prompt**: *"Get details for knowledge item ID 'e4848cbf-fb7c-4e85-9df0-9486b4675756'."*  
> **Expected Response**: Full item fields, prompt context, and approval metadata.

---

## 7. Security & Governance Safeguards

1. **HTTPS Enforcement**: Remote MCP communication MUST use TLS/HTTPS encryption. Plain HTTP is rejected by remote clients.
2. **CORS Policy**: Configure FastAPI CORS middleware (`CORSMiddleware`) to restrict origin headers to trusted domains.
3. **Authentication Headers**: In multi-tenant/production deployments, configure `Authorization: Bearer <TOKEN>` header verification in FastAPI middleware.
4. **Database Protection**: Database credentials (`DATABASE_URL`) must remain isolated inside `.env` and environment variables. Never expose database credentials to MCP tool payloads or client logs.
