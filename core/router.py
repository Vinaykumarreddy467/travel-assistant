"""Router: turns free text or form input into a structured TripRequest.

Two paths:
1. `route_from_form(...)` — direct mapping from the sidebar form (no LLM).
2. `route_from_text(...)` — LLM structured-output extraction from chat text
   (pydantic schema via LangChain `with_structured_output`), with a
   rule-based regex fallback when the LLM is unavailable.
"""
from __future__ import annotations

import re
from datetime import date, timedelta
from typing import Any

from pydantic import BaseModel, Field

from core.state import TripRequest

_SYSTEM_PROMPT = (
    "You are a travel planning assistant. Extract trip details from the user's "
    "message into the TripRequest schema. Use today's date "
    f"({date.today().isoformat()}) as reference when interpreting relative dates "
    "like 'next week'. If a date is ambiguous, pick the nearest sensible future "
    "date. Budget should be a number in USD. Travelers defaults to 1."
)


class _TripRequestExtraction(BaseModel):
    """Minimal schema for LLM extraction (no display-only fields).

    Keeping the schema small avoids confusing small local models, which tend
    to stuff values into extra fields (e.g. putting 'London' into a display
    field instead of `origin`).
    """

    origin: str = Field(default="", description="Departure city or IATA code, e.g. 'London' or 'LHR'")
    destination: str = Field(default="", description="Destination city, e.g. 'Paris'")
    start_date: str = Field(default="", description="Departure date in YYYY-MM-DD")
    end_date: str = Field(default="", description="Return date in YYYY-MM-DD (optional)")
    budget: float = Field(default=0.0, description="Total trip budget in USD")
    travelers: int = Field(default=1, description="Number of adult travelers")
    preferences: list[str] = Field(default_factory=list, description="Trip preferences, e.g. ['adventure', 'food']")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def route_from_form(
    origin: str,
    destination: str,
    departure_date: date,
    return_date: date | None,
    budget: float,
    travelers: int,
    preferences: list[str],
) -> TripRequest:
    """Build a TripRequest directly from sidebar form values."""
    return TripRequest(
        origin=origin,
        origin_name=origin,
        destination=destination,
        destination_name=destination,
        start_date=departure_date.isoformat(),
        end_date=return_date.isoformat() if return_date else "",
        budget=float(budget or 0),
        travelers=int(travelers or 1),
        preferences=list(preferences or []),
        currency="USD",
    )


def route_from_text(text: str, llm: Any) -> TripRequest:
    """Extract a TripRequest from free text via LLM structured output.

    The LLM result is merged with the rule-based parser so any field the
    model missed (or got wrong) is filled from the regex fallback.
    """
    rules = _extract_with_rules(text)
    if llm is not None and llm.available:
        extracted = _extract_with_llm(text, llm)
        if extracted:
            return _merge(rules, extracted)
    return rules


# ---------------------------------------------------------------------------
# LLM extraction (pydantic structured output)
# ---------------------------------------------------------------------------
def _extract_with_llm(text: str, llm: Any) -> TripRequest | None:
    try:
        structured = llm.with_structured_output(_TripRequestExtraction)
        if structured is None:
            return None
        result = structured.invoke(
            [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ]
        )
        if isinstance(result, _TripRequestExtraction):
            return TripRequest(**result.model_dump())
        if isinstance(result, dict):
            return TripRequest(**result)
    except Exception as exc:  # noqa: BLE001
        print(f"[router] LLM structured extraction failed: {exc}")
    return None


def _merge(rules: TripRequest, llm: TripRequest) -> TripRequest:
    """LLM wins for fields it filled; rules fill the gaps."""
    merged = rules.model_copy(deep=True)
    if llm.origin:
        merged.origin = llm.origin
        merged.origin_name = llm.origin
    if llm.destination:
        merged.destination = llm.destination
        merged.destination_name = llm.destination
    if llm.start_date:
        merged.start_date = llm.start_date
    if llm.end_date:
        merged.end_date = llm.end_date
    if llm.budget:
        merged.budget = llm.budget
    if llm.travelers > 1:
        merged.travelers = llm.travelers
    if llm.preferences:
        merged.preferences = llm.preferences
    return merged


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------
def _extract_with_rules(text: str) -> TripRequest:
    """Regex-based extraction used when no LLM is available."""
    req = TripRequest()

    # Dates: YYYY-MM-DD or DD/MM/YYYY.
    date_matches = re.findall(
        r"\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", text
    )
    if date_matches:
        req.start_date = _normalize_date(date_matches[0])
        if len(date_matches) > 1:
            req.end_date = _normalize_date(date_matches[1])

    # Budget: "$1200", "1200 dollars", "budget of 1500".
    budget_match = re.search(
        r"\$\s?(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:usd|dollars|bucks)",
        text,
        re.IGNORECASE,
    )
    if budget_match:
        req.budget = float(budget_match.group(1) or budget_match.group(2))

    # Travelers: "2 people", "3 adults", "for 4".
    travelers_match = re.search(
        r"(\d+)\s*(?:people|adults|travelers|travellers|persons)", text, re.IGNORECASE
    )
    if travelers_match:
        req.travelers = max(1, int(travelers_match.group(1)))

    # Preferences: known keywords.
    pref_keywords = {
        "adventure": ["adventure", "hiking", "trek", "outdoor"],
        "food": ["food", "culinary", "restaurant", "eat"],
        "culture": ["culture", "museum", "history", "heritage"],
        "beach": ["beach", "sun", "relax"],
        "shopping": ["shopping", "mall"],
        "nightlife": ["nightlife", "party", "club"],
        "nature": ["nature", "park", "scenic"],
        "family": ["family", "kids", "children"],
    }
    for label, keywords in pref_keywords.items():
        if any(k in text.lower() for k in keywords):
            req.preferences.append(label)

    # "from X to Y" pattern for origin/destination.
    from_to = re.search(
        r"\bfrom\s+([A-Za-z\s]{2,30}?)\s+to\s+([A-Za-z\s]{2,30}?)(?:\s|$|,|\.)",
        text,
        re.IGNORECASE,
    )
    if from_to:
        req.origin = from_to.group(1).strip().title()
        req.origin_name = req.origin
        req.destination = from_to.group(2).strip().title()
        req.destination_name = req.destination
    else:
        # Fallback: last capitalized word(s) as destination.
        words = re.findall(r"\b[A-Z][a-z]+\b", text)
        if words:
            req.destination = words[-1]
            req.destination_name = words[-1]

    if not req.start_date:
        req.start_date = (date.today() + timedelta(days=14)).isoformat()
    return req


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------
def _normalize_date(value: Any) -> str:
    """Accept YYYY-MM-DD, DD/MM/YYYY, or relative words; return YYYY-MM-DD."""
    if not value:
        return ""
    value = str(value).strip()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return value
    match = re.fullmatch(r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})", value)
    if match:
        d, m, y = match.groups()
        y = f"20{y}" if len(y) == 2 else y
        try:
            return date(int(y), int(m), int(d)).isoformat()
        except ValueError:
            return ""
    today = date.today()
    rel = {
        "today": today,
        "tomorrow": today + timedelta(days=1),
        "next week": today + timedelta(days=7),
        "next month": today + timedelta(days=30),
    }
    lowered = value.lower()
    for key, d in rel.items():
        if key in lowered:
            return d.isoformat()
    weekday_match = re.search(
        r"next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", lowered
    )
    if weekday_match:
        target = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6,
        }[weekday_match.group(1)]
        delta = (target - today.weekday()) % 7
        delta = delta if delta > 0 else 7
        return (today + timedelta(days=delta)).isoformat()
    return ""