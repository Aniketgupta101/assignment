import json
import os
import re
from typing import Dict, List, Any
import httpx
from openai import OpenAI
from app.models import AIAnalysisResult

# Prompt definition
SYSTEM_PROMPT = """You are a precise content analysis assistant.
Your task is to analyze the user-provided text and respond ONLY with a valid JSON object.
Do not include any introductory commentary, markdown fences, or extra text.

The JSON object must have this exact structure:
{
  "summary": "A concise, 1-3 sentence summary capturing the key points of the text.",
  "tags": ["tag1", "tag2", "tag3"]
}

Important constraints:
- "tags" must contain exactly three short, relevant, lowercase, single-word or hyphenated keywords.
"""

USER_PROMPT_TEMPLATE = """Please analyze the following text:

---
{text}
---
"""


class AIServiceError(Exception):
    """Custom exception for AI provider or parsing errors."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """Extract and parse JSON safely from model response."""
    cleaned = raw_text.strip()
    
    # Remove markdown code block if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as err:
        raise AIServiceError(
            f"Failed to parse LLM response as JSON: {str(err)}. Raw output: {raw_text[:200]}",
            status_code=502,
        )

    if not isinstance(data, dict):
        raise AIServiceError("LLM response is not a valid JSON object.", status_code=502)

    summary = data.get("summary")
    tags = data.get("tags")

    if not summary or not isinstance(summary, str):
        raise AIServiceError("LLM response did not contain a valid 'summary' string.", status_code=502)

    if not isinstance(tags, list):
        raise AIServiceError("LLM response did not contain a valid 'tags' array.", status_code=502)

    # Clean and normalize tags
    clean_tags = [str(t).strip().lower().replace(" ", "-") for t in tags if str(t).strip()]

    # Normalize to exactly 3 tags if model gave slightly different count
    if len(clean_tags) < 3:
        # Pad with general tag if needed
        clean_tags.extend(["general", "note", "content"][: 3 - len(clean_tags)])
    elif len(clean_tags) > 3:
        clean_tags = clean_tags[:3]

    return {"summary": summary.strip(), "tags": clean_tags}


async def _generate_with_gemini(api_key: str, text: str) -> Dict[str, Any]:
    """Call Google Gemini API using REST endpoint."""
    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(text=text)}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                raise AIServiceError(
                    f"Gemini API returned status {response.status_code}: {response.text[:300]}",
                    status_code=502,
                )
            res_data = response.json()
            candidates = res_data.get("candidates", [])
            if not candidates:
                raise AIServiceError("Gemini API returned no candidates.", status_code=502)
            raw_text = candidates[0]["content"]["parts"][0]["text"]
            return _clean_and_parse_json(raw_text)
    except httpx.TimeoutException:
        raise AIServiceError("Request to Gemini API timed out after 20 seconds.", status_code=504)
    except httpx.RequestError as err:
        raise AIServiceError(f"Network error connecting to Gemini API: {str(err)}", status_code=502)


async def _generate_with_openai(api_key: str, text: str) -> Dict[str, Any]:
    """Call OpenAI / OpenAI-compatible API."""
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    base_url = os.getenv("OPENAI_BASE_URL", None)

    try:
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=20.0)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": USER_PROMPT_TEMPLATE.format(text=text)},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw_text = completion.choices[0].message.content or ""
        return _clean_and_parse_json(raw_text)
    except Exception as err:
        error_msg = str(err)
        if "timeout" in error_msg.lower():
            raise AIServiceError("Request to OpenAI API timed out.", status_code=504)
        raise AIServiceError(f"OpenAI API call failed: {error_msg}", status_code=502)


async def generate_summary_and_tags(text: str) -> AIAnalysisResult:
    """
    Main entry point for AI generation.
    Picks either Gemini or OpenAI depending on configured environment keys.
    """
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if gemini_key:
        result_dict = await _generate_with_gemini(gemini_key, text)
    elif openai_key:
        result_dict = await _generate_with_openai(openai_key, text)
    else:
        raise AIServiceError(
            "No AI API key found. Please set GEMINI_API_KEY or OPENAI_API_KEY in your .env file.",
            status_code=500,
        )

    # Validate against strict Pydantic model
    return AIAnalysisResult(**result_dict)
