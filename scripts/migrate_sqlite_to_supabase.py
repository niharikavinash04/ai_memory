"""Migration utility to safely copy local SQLite memories into Supabase PostgreSQL.

Reads from local SQLite database (ai_work_memory.db) and writes to active Supabase PostgreSQL
database configured in environment variable DATABASE_URL / SUPABASE_DATABASE_URL.
Uses content_hash deduplication to prevent duplicate records.
"""

import os
import sys
import sqlite3
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.db.base import Base
from app.models.knowledge import KnowledgeItem

def parse_datetime(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    try:
        dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

def migrate(sqlite_db_path: str = "ai_work_memory.db"):
    if not os.path.exists(sqlite_db_path):
        print(f"No local SQLite database found at '{sqlite_db_path}'. Skipping migration.")
        return

    print(f"Connecting to local SQLite database: {sqlite_db_path}")
    sqlite_conn = sqlite3.connect(sqlite_db_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    sqlite_cursor.execute("SELECT * FROM knowledge_items")
    rows = sqlite_cursor.fetchall()
    print(f"Found {len(rows)} records in local SQLite database.")

    if not rows:
        print("No records to migrate.")
        return

    dest_url = settings.database_url
    print(f"Connecting to target database: {dest_url}")

    connect_args = {}
    engine_kwargs = {"pool_pre_ping": True}
    if dest_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    target_engine = create_engine(dest_url, connect_args=connect_args, **engine_kwargs)
    Base.metadata.create_all(bind=target_engine)

    TargetSession = sessionmaker(bind=target_engine)
    db = TargetSession()

    migrated_count = 0
    skipped_count = 0

    try:
        for row in rows:
            content_hash = row["content_hash"]
            existing = db.query(KnowledgeItem).filter(KnowledgeItem.content_hash == content_hash).first()
            if existing:
                skipped_count += 1
                continue

            item = KnowledgeItem(
                id=row["id"],
                title=row["title"],
                context=row["context"],
                final_output=row["final_output"],
                project_id=row["project_id"],
                classification=row["classification"],
                status=row["status"],
                provider=row["provider"],
                author_email=row["author_email"],
                content_hash=row["content_hash"],
                warnings=row["warnings"],
                created_at=parse_datetime(row["created_at"]),
                updated_at=parse_datetime(row["updated_at"]),
                approved_at=parse_datetime(row["approved_at"])
            )
            db.add(item)
            migrated_count += 1

        db.commit()
        print(f"Migration complete: {migrated_count} records migrated, {skipped_count} existing records skipped.")
    except Exception as err:
        db.rollback()
        print(f"Error during migration: {err}")
    finally:
        db.close()
        sqlite_conn.close()

if __name__ == "__main__":
    migrate()
