# Knowledge Item Data Model & Lifecycle Specification

## 1. Overview

The **Knowledge Item** is the core entity of the **AI Work Memory** system. It captures AI-generated responses, developer prompt context, project boundaries, confidentiality levels, exact content hashes, and human approval metadata.

---

## 2. Entity Schema (`knowledge_items`)

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| **`id`** | String(36) | Primary Key, UUID | Unique internal item identifier. |
| **`title`** | String(255) | Not Null | Human-readable item title. |
| **`context`** | Text | Not Null | User prompt, background requirement, or prompt context. |
| **`final_output`** | Text | Not Null | User-visible assistant response text. |
| **`project_id`** | String(100) | Not Null, Indexed | Project identifier boundary. |
| **`classification`** | String(50) | Not Null, Default: `"internal"` | Access level (`private`, `internal`, `project-confidential`, `restricted`). |
| **`status`** | String(50) | Not Null, Indexed, Default: `"PENDING"` | Lifecycle status (`PENDING`, `APPROVED`, `REJECTED`, `ARCHIVED`, `DELETED`). |
| **`provider`** | String(50) | Not Null, Default: `"manual"` | Originating agent surface (`claude`, `codex`, `manual`, `imported`). |
| **`author_email`** | String(255) | Not Null | Author email address. |
| **`content_hash`** | String(64) | Not Null, Unique, Indexed | Deterministic SHA-256 content digest. |
| **`warnings`** | JSON | Nullable | Array of findings or warnings (e.g. duplicate flags). |
| **`created_at`** | DateTime(UTC) | Not Null | Ingestion creation timestamp. |
| **`updated_at`** | DateTime(UTC) | Not Null | Last modification timestamp. |
| **`approved_at`** | DateTime(UTC) | Nullable | Timestamp when human curator approved publication. |

---

## 3. Lifecycle States & Approval Workflow

```
               POST /api/v1/knowledge/publish
                             │
                             ▼
                    ┌─────────────────┐
                    │     PENDING     │  (In Knowledge Inbox;
                    └────────┬────────┘   excluded from search)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   POST /inbox/{id}/approve          POST /inbox/{id}/reject
            │                                 │
            ▼                                 ▼
    ┌───────────────┐                 ┌───────────────┐
    │   APPROVED    │                 │   REJECTED    │
    └───────┬───────┘                 └───────────────┘
            │                                 │
            ▼                                 ▼
   Searchable by Knowledge            Excluded from Search
      Seekers via API                 Permanently
```

### Lifecycle Rules:
1. **Initial State**: All items submitted via API or MCP enter status `PENDING`.
2. **Approval Transition**: Invoking `POST /api/v1/inbox/{id}/approve` transitions item state from `PENDING` $\rightarrow$ `APPROVED` and populates `approved_at`.
3. **Rejection Transition**: Invoking `POST /api/v1/inbox/{id}/reject` transitions item state from `PENDING` $\rightarrow$ `REJECTED`.
4. **Invalid Transitions**: Direct transitions from `APPROVED` $\rightarrow$ `PENDING` or `REJECTED` $\rightarrow$ `APPROVED` are disallowed to maintain strict audit integrity.

---

## 4. Exact Content Hash & Deduplication Algorithm

To prevent duplicate submissions of identical work:

### 1. Normalization & Concatenation
```python
norm_title = title.strip()
norm_context = context.strip()
norm_final_output = final_output.strip()
raw_content = f"{norm_title}\n{norm_context}\n{norm_final_output}"
```

### 2. Hash Calculation
```python
content_hash = hashlib.sha256(raw_content.encode("utf-8")).hexdigest()
```

### 3. Deduplication Behavior
- Before persisting a new item, the system checks whether `content_hash` exists in the database.
- If a match is found, the system does **NOT** insert a new row. Instead, it returns `is_duplicate=True` along with the existing `item_id` and duplicate warning details.

---

## 5. Search Rules

1. **Strict Status Filtering**: Keyword search (`GET /api/v1/knowledge/search`) queries ONLY items with `status == "APPROVED"`.
2. **Exclusion**: Unapproved items (`PENDING`, `REJECTED`, `ARCHIVED`, `DELETED`) are strictly filtered out at the SQL query layer.
3. **Matching Logic**: Case-insensitive substring matching (`ILIKE`) across `title`, `context`, and `final_output`.
