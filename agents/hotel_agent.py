"""Hotel agent: resolves destination coordinates and searches Duffel stays."""
from __future__ import annotations

from typing import Any

from clients.duffel_client import DuffelClient
from core.geo import resolve_city
from core.state import TripState


def hotel_agent(state: TripState) -> dict[str, Any]:
    """LangGraph node: search hotel offers for the destination."""
    request = state.get("request")
    if not request:
        return {"hotels": [], "errors": ["No trip request"]}

    new_errors: list[str] = []
    new_notes: list[str] = []

    destination = resolve_city(request.destination)
    if not destination:
        new_errors.append(f"Could not resolve destination '{request.destination}'")
        return {"hotels": [], "errors": new_errors}

    client = DuffelClient()
    hotels = client.search_hotels(
        latitude=destination["lat"],
        longitude=destination["lng"],
        check_in=request.start_date,
        check_out=request.end_date or request.start_date,
        adults=request.travelers,
        max_results=5,
    )
    if not hotels and client.last_error:
        new_errors.append(f"Hotels: {client.last_error}")
    elif not hotels:
        new_notes.append("No hotel offers returned for this destination/dates.")
    else:
        new_notes.append(f"Found {len(hotels)} hotel offers.")

    return {"hotels": hotels, "errors": new_errors, "notes": new_notes}