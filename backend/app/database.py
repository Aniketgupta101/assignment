import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_FILE = Path(__file__).resolve().parent.parent / "assistant.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the SQLite database schema if not present."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_text TEXT NOT NULL,
                summary TEXT NOT NULL,
                tags TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def create_entry(original_text: str, summary: str, tags: List[str]) -> Dict[str, Any]:
    """Persist a new entry and return the saved record."""
    tags_json = json.dumps(tags)
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO entries (original_text, summary, tags)
            VALUES (?, ?, ?)
            """,
            (original_text, summary, tags_json),
        )
        conn.commit()
        entry_id = cursor.lastrowid
        return get_entry_by_id(entry_id)  # type: ignore


def get_all_entries() -> List[Dict[str, Any]]:
    """Retrieve all entries ordered by most recent."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, original_text, summary, tags, created_at
            FROM entries
            ORDER BY id DESC
            """
        )
        rows = cursor.fetchall()
        results = []
        for row in rows:
            results.append(
                {
                    "id": row["id"],
                    "original_text": row["original_text"],
                    "summary": row["summary"],
                    "tags": json.loads(row["tags"]),
                    "created_at": row["created_at"],
                }
            )
        return results


def get_entry_by_id(entry_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve a single entry by id."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, original_text, summary, tags, created_at
            FROM entries
            WHERE id = ?
            """,
            (entry_id,),
        )
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "original_text": row["original_text"],
            "summary": row["summary"],
            "tags": json.loads(row["tags"]),
            "created_at": row["created_at"],
        }
