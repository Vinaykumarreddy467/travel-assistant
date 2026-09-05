"""Shared state definitions for the LangGraph travel pipeline."""
from __future__ import annotations

import operator
from typing import Annotated, Any, TypedDict

from pydantic import BaseModel, Field


class TripRequest(BaseModel):
    """Structured trip request extracted by the router (LLM or form)."""

    origin: str = Field(default="", description="Departure city or IATA code, e.g. 'London' or 'LHR'")
    destination: str = Field(default="", description="Destination city, e.g. 'Paris'")
    start_date: str = Field(default="", description="Departure date in YYYY-MM-DD")
    end_date: str = Field(default="", description="Return date in YYYY-MM-DD (optional)")
    budget: float = Field(default=0.0, description="Total trip budget in USD")
    travelers: int = Field(default=1, description="Number of adult travelers")
    preferences: list[str] = Field(default_factory=list, description="Trip preferences, e.g. ['adventure', 'food']")

    # Display-only fields (not part of LLM extraction).
    origin_name: str = Field(default="", description="Human-readable origin")
    destination_name: str = Field(default="", description="Human-readable destination")
    currency: str = Field(default="USD")


class TripState(TypedDict, total=False):
    """Full graph state flowing through the orchestrator."""

    request: TripRequest
    messages: list[dict[str, str]]   # conversation history
    user_input: str                  # latest free-text input
    source: str                      # "form" | "chat"

    # Agent outputs
    flights: list[dict[str, Any]]
    hotels: list[dict[str, Any]]
    activities: list[dict[str, Any]]
    weather: list[dict[str, Any]]    # daily forecast entries
    current_weather: dict[str, Any] | None

    # Composed output
    itinerary: dict[str, Any] | None

    # Diagnostics (multiple parallel nodes write these -> use reducers)
    errors: Annotated[list[str], operator.add]
    notes: Annotated[list[str], operator.add]