"""Flight agent: resolves origin/destination and searches Duffel flights."""
from __future__ import annotations

from typing import Any

from clients.duffel_client import DuffelClient
from core.geo import resolve_airport
from core.state import TripState


def flight_agent(state: TripState) -> dict[str, Any]:
    """LangGraph node: search flight offers for the trip request."""
    request = state.get("request")
    if not request:
        return {"flights": [], "errors": ["No trip request"]}

    new_errors: list[str] = []
    new_notes: list[str] = []

    origin = resolve_airport(request.origin)
    destination = resolve_airport(request.destination)

    if not origin:
        new_errors.append(f"Could not resolve origin '{request.origin}'")
        return {"flights": [], "errors": new_errors}
    if not destination:
        new_errors.append(f"Could not resolve destination '{request.destination}'")
        return {"flights": [], "errors": new_errors}

    client = DuffelClient()
    flights = client.search_flights(
        origin=origin["iata"],
        destination=destination["iata"],
        departure_date=request.start_date,
        return_date=request.end_date or None,
        adults=request.travelers,
        max_results=5,
    )
    if not flights and client.last_error:
        new_errors.append(f"Flights: {client.last_error}")
    elif not flights:
        new_notes.append("No flight offers returned for this route/dates.")
    else:
        new_notes.append(f"Found {len(flights)} flight offers.")

    return {"flights": flights, "errors": new_errors, "notes": new_notes}