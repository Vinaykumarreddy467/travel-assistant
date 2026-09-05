"""Central configuration for the AI Travel Assistant.

Loads environment variables from a local `.env` file (if present) and exposes
them as module-level constants. All external service credentials live here so
the rest of the app never touches `os.environ` directly.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the project root (one level above this file).
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# LLM (Groq only)
# ---------------------------------------------------------------------------
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
# Optional second key used as automatic failover when the primary errors.
GROQ_API_KEY_2: str = os.getenv("GROQ_API_KEY_2", "")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Ollama fallback (used only when no Groq key is set — offline dev/testing).
OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# ---------------------------------------------------------------------------
# Duffel (flights + hotels; test mode uses Duffel Airways + Test Hotels)
# ---------------------------------------------------------------------------
DUFFEL_ACCESS_TOKEN: str = os.getenv("DUFFEL_ACCESS_TOKEN", "")
DUFFEL_API_URL: str = os.getenv("DUFFEL_API_URL", "https://api.duffel.com")
DUFFEL_VERSION: str = os.getenv("DUFFEL_VERSION", "v2")

# ---------------------------------------------------------------------------
# OpenTripMap (points of interest / activities)
# ---------------------------------------------------------------------------
OPENTRIPMAP_API_KEY: str = os.getenv("OPENTRIPMAP_API_KEY", "")

# ---------------------------------------------------------------------------
# OpenWeather
# ---------------------------------------------------------------------------
OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

# ---------------------------------------------------------------------------
# LangSmith tracing (optional)
# ---------------------------------------------------------------------------
LANGCHAIN_TRACING_V2: str = os.getenv("LANGCHAIN_TRACING_V2", "false")
LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "travel-assistant-hackathon")

# ---------------------------------------------------------------------------
# Derived helpers
# ---------------------------------------------------------------------------
def llm_provider() -> str:
    """Return 'groq' when a Groq key is present, 'ollama' otherwise."""
    return "groq" if GROQ_API_KEY else "ollama"


def duffel_configured() -> bool:
    return bool(DUFFEL_ACCESS_TOKEN)


def opentripmap_configured() -> bool:
    return bool(OPENTRIPMAP_API_KEY)


def weather_configured() -> bool:
    return bool(OPENWEATHER_API_KEY)
