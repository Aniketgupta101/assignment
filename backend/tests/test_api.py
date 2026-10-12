import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.models import EntryCreate, AIAnalysisResult
from app.ai_service import _clean_and_parse_json, AIServiceError
from app.database import init_db, create_entry, get_all_entries, get_entry_by_id

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Ensure database is ready before each test."""
    init_db()


# -------------------------------------------------------------------------
# 1. Non-AI / Model & Input Validation Tests
# -------------------------------------------------------------------------

def test_entry_create_valid():
    entry = EntryCreate(text="   This is valid meeting notes text.   ")
    assert entry.text == "This is valid meeting notes text."


def test_entry_create_rejects_empty_string():
    with pytest.raises(ValueError, match="Input text cannot be empty"):
        EntryCreate(text="")


def test_entry_create_rejects_whitespace_only():
    with pytest.raises(ValueError, match="Input text cannot be empty"):
        EntryCreate(text="     \n  \t ")


def test_entry_create_rejects_exceeding_max_length():
    oversized = "a" * 10001
    with pytest.raises(ValueError, match="exceeds maximum allowed length"):
        EntryCreate(text=oversized)


def test_ai_analysis_result_requires_three_tags():
    # Valid with exactly 3 tags
    result = AIAnalysisResult(summary="A good summary.", tags=["Alpha", "BETA", "gamma"])
    assert result.tags == ["alpha", "beta", "gamma"]

    # Fails when fewer or more than 3 tags
    with pytest.raises(ValueError, match="Expected exactly 3 tags"):
        AIAnalysisResult(summary="A good summary.", tags=["tag1", "tag2"])

    with pytest.raises(ValueError, match="Expected exactly 3 tags"):
        AIAnalysisResult(summary="A good summary.", tags=["tag1", "tag2", "tag3", "tag4"])


# -------------------------------------------------------------------------
# 2. JSON Parser & Normalizer Tests (Failure & Boundary Handling)
# -------------------------------------------------------------------------

def test_parse_clean_json_from_markdown():
    raw_response = '```json\n{"summary": "Quarterly earnings report.", "tags": ["finance", "q3", "revenue"]}\n```'
    parsed = _clean_and_parse_json(raw_response)
    assert parsed["summary"] == "Quarterly earnings report."
    assert parsed["tags"] == ["finance", "q3", "revenue"]


def test_parse_malformed_json_raises_error():
    malformed = "This is not valid json at all."
    with pytest.raises(AIServiceError) as exc_info:
        _clean_and_parse_json(malformed)
    assert exc_info.value.status_code == 502
    assert "Failed to parse LLM response" in exc_info.value.message


# -------------------------------------------------------------------------
# 3. Database Persistence Tests
# -------------------------------------------------------------------------

def test_database_persistence_roundtrip():
    test_text = "Persisted database test note."
    test_summary = "Persisted summary."
    test_tags = ["test", "sqlite", "persistence"]

    created = create_entry(test_text, test_summary, test_tags)
    assert created["id"] is not None
    assert created["original_text"] == test_text
    assert created["summary"] == test_summary
    assert created["tags"] == test_tags

    fetched = get_entry_by_id(created["id"])
    assert fetched is not None
    assert fetched["id"] == created["id"]
    assert fetched["summary"] == test_summary
    assert fetched["tags"] == test_tags


# -------------------------------------------------------------------------
# 4. API Endpoint Integration Tests
# -------------------------------------------------------------------------

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_post_entry_validation_failure():
    # Empty payload should return 422 Unprocessable Entity
    res = client.post("/entries", json={"text": "   "})
    assert res.status_code == 422


@patch("app.main.generate_summary_and_tags", new_callable=AsyncMock)
def test_post_entry_successful_flow(mock_ai):
    mock_ai.return_value = AIAnalysisResult(
        summary="A concise summary of AI tools.",
        tags=["ai", "tools", "developer"],
    )

    payload = {"text": "Developers are using AI tools like Copilot and Gemini to increase velocity."}
    response = client.post("/entries", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["summary"] == "A concise summary of AI tools."
    assert data["tags"] == ["ai", "tools", "developer"]
    assert data["original_text"] == payload["text"]

    # Verify we can fetch it via GET /entries/{id}
    detail_res = client.get(f"/entries/{data['id']}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == data["id"]


def test_get_entry_not_found():
    response = client.get("/entries/9999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
