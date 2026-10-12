import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend root is always on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List

# Load environment variables from .env file
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

from app.database import init_db, create_entry, get_all_entries, get_entry_by_id
from app.models import EntryCreate, EntryResponse
from app.ai_service import generate_summary_and_tags, AIServiceError


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database on startup
    init_db()
    yield


app = FastAPI(
    title="AI Content Assistant API",
    description="Backend service for summarizing text and generating tags with persistent SQLite storage.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check():
    has_groq = bool(os.getenv("GROQ_API_KEY", "").strip())
    has_gemini = bool(os.getenv("GEMINI_API_KEY", "").strip())
    has_openai = bool(os.getenv("OPENAI_API_KEY", "").strip())
    
    provider = "none"
    if has_groq:
        provider = f"groq ({os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')})"
    elif has_gemini:
        provider = f"gemini ({os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')})"
    elif has_openai:
        provider = f"openai ({os.getenv('OPENAI_MODEL', 'gpt-4o-mini')})"

    return {
        "status": "healthy",
        "configured_provider": provider,
    }


@app.post(
    "/entries",
    response_model=EntryResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Entries"],
)
async def submit_entry(payload: EntryCreate):
    """
    Submit text for AI processing:
    1. Validates text payload (non-empty, max length).
    2. Calls LLM to produce summary and 3 tags.
    3. Persists original text, summary, and tags into SQLite.
    4. Returns the created entry.
    """
    try:
        ai_result = await generate_summary_and_tags(payload.text)
    except AIServiceError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during AI analysis: {str(err)}",
        )

    # Persist in SQLite
    saved_entry = create_entry(
        original_text=payload.text,
        summary=ai_result.summary,
        tags=ai_result.tags,
    )
    return saved_entry


@app.get("/entries", response_model=List[EntryResponse], tags=["Entries"])
def list_entries():
    """Retrieve all saved entries in descending order of creation."""
    return get_all_entries()


@app.get("/entries/{entry_id}", response_model=EntryResponse, tags=["Entries"])
def get_entry(entry_id: int):
    """Retrieve details for a single entry by its ID."""
    entry = get_entry_by_id(entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry with ID {entry_id} was not found.",
        )
    return entry
