# AI Content Assistant

A full-stack prototype application designed to accept arbitrary text input (such as meeting transcripts, draft notes, or memos), call a large language model to generate a concise summary and exactly three tags, and persist entries in an SQLite database.

Built as part of the **Full Stack Developer Screening Assignment (IIFL Finance)**.

---

## 🏗️ Architecture & Request Flow

1. **Frontend Input**: The user pastes text into the React frontend and clicks "Analyze & Save Entry".
2. **Backend Validation**: The FastAPI backend validates the payload using Pydantic (rejects empty/whitespace text and enforces a 10,000-character maximum).
3. **AI Generation**: The backend dispatches a structured prompt to the configured LLM provider (Google Gemini or OpenAI) enforcing a strict JSON contract (`summary` and `tags`).
4. **Parsing & Normalization**: The backend cleans markdown fences, parses JSON, and normalizes tags to ensure exactly three lowercase tags are returned.
5. **Persistence**: The original text, summary, and tags are persisted in a local SQLite database (`assistant.db`).
6. **UI Refresh**: The backend returns the saved entry (HTTP 201), and the frontend immediately updates the entries list and provides a detail modal.

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment and activate it
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and insert your GEMINI_API_KEY or OPENAI_API_KEY
```

To run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```
*API will run on [http://localhost:8000](http://localhost:8000). Interactive Swagger documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 2. Frontend Setup

In a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend will run on [http://localhost:5173](http://localhost:5173).*

### 3. Running Automated Tests

Run the backend test suite (unit validation, error handling, SQLite persistence, and API endpoints):
```bash
cd backend
pytest -v
```

---

## 📷 Application Screenshot

![AI Content Assistant Screenshot](screenshot.png)

*(Place a screenshot of the working application at `screenshot.png` in the project root).*

---

## 📋 Evaluation Questions

### 1. Architecture: How does the request flow from frontend to backend, LLM, and database?
The React client sends a `POST /entries` request with user-submitted text. FastAPI receives the request and validates the input using Pydantic models. The backend constructs a prompt with structured JSON formatting rules and invokes the LLM API via a non-blocking asynchronous call. Once the model responds, the backend sanitizes the output, extracts the summary and exactly three tags, and writes the record into SQLite (`assistant.db`). The saved row is returned to the frontend as JSON, which optimistically renders the new entry in the UI and enables instant modal inspection.

### 2. AI choice: Which model/provider did you use, and why?
The system supports both **Google Gemini (`gemini-1.5-flash`)** and **OpenAI (`gpt-4o-mini`)**, configurable via `.env`. These flash/mini models were chosen because summarization and tagging are high-frequency, low-latency tasks where large frontier models introduce unnecessary latency and cost without meaningful quality gains. Both models also reliably adhere to JSON schema constraints and structured outputs.

### 3. Reliability: What happens if the model is slow or returns malformed output?
The HTTP client enforces an explicit 20-second timeout to avoid hung connections, returning an HTTP 504 Gateway Timeout if the provider stalls. For malformed outputs, a regex stripper removes extraneous markdown fences before parsing. If JSON decoding fails or required keys are missing, the service raises an HTTP 502 Bad Gateway with a descriptive error rather than crashing. Finally, a fallback normalization layer guarantees that tags are always clamped or padded to exactly three tags.

### 4. Privacy: What data is sent to the LLM provider, and what would you avoid sending in a financial-services environment?
Only the user-submitted text and instruction prompt are transmitted to the LLM provider. In a financial-services environment (such as IIFL Finance), we would strictly avoid sending Personally Identifiable Information (PII) like PAN, Aadhaar, account numbers, credit scores, KYC identity documents, or salary slips. In production, we would deploy an on-premise regex/NER redaction layer (e.g., Microsoft Presidio) before forwarding text to any external model, or use private Azure/GCP VPC-isolated tenant endpoints with zero-data-retention agreements.

### 5. Production next steps: If given one more day, what are the top three improvements you would make?
* **Async Job Queue**: Offload LLM summarization to background tasks (Celery/Redis or FastAPI BackgroundTasks) with WebSocket or SSE updates so long inputs do not block HTTP request threads.
* **PII Redaction & Guardrails Layer**: Integrate automated masking for financial and personal identifiers (PAN, credit card numbers, phone numbers) before LLM egress.
* **Migration & Production DB**: Move from SQLite to PostgreSQL with Alembic migrations, connection pooling, and tenant-level encryption at rest.

### 6. AI coding tools: Which AI tools did you use while building the assignment, and how did you validate their output?
I utilized an AI coding assistant to quickly draft initial FastAPI route scaffolding, Pydantic schemas, and the React UI skeleton. I manually reviewed and refined the code by adding strict boundary validation on tag counts, writing robust exception handling for provider timeouts and malformed JSON, creating 12 automated unit and integration tests in pytest, and verifying end-to-end functionality across multiple sample inputs.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application & REST endpoints
│   │   ├── database.py      # SQLite connection & CRUD operations
│   │   ├── models.py        # Pydantic schemas for validation
│   │   └── ai_service.py    # LLM integration (Gemini & OpenAI) + parsing
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py      # Automated tests (12 passing tests)
│   ├── .env.example         # Template for environment keys
│   ├── pytest.ini           # Pytest configuration
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EntryForm.jsx        # Submission form + sample buttons
│   │   │   ├── EntryList.jsx        # Saved entries card list
│   │   │   └── EntryDetailModal.jsx # Detailed inspector view
│   │   ├── api.js                   # Backend API client
│   │   ├── App.jsx                  # Root state & coordinator
│   │   ├── index.css                # Styling & design system
│   │   └── main.jsx                 # Entry point
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```
