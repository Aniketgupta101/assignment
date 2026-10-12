from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class EntryCreate(BaseModel):
    text: str = Field(
        ...,
        description="Text content to be summarized and tagged",
    )

    @field_validator("text")
    def validate_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Input text cannot be empty or solely whitespace.")
        if len(stripped) > 10000:
            raise ValueError("Input text exceeds maximum allowed length of 10,000 characters.")
        return stripped


class AIAnalysisResult(BaseModel):
    summary: str
    tags: List[str]

    @field_validator("tags")
    def validate_tags(cls, tags: List[str]) -> List[str]:
        cleaned = [t.strip().lower() for t in tags if isinstance(t, str) and t.strip()]
        if len(cleaned) != 3:
            raise ValueError(f"Expected exactly 3 tags, received {len(cleaned)}.")
        return cleaned


class EntryResponse(BaseModel):
    id: int
    original_text: str
    summary: str
    tags: List[str]
    created_at: Optional[str] = None
