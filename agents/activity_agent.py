"""Activity agent: searches points of interest via OpenTripMap."""
from __future__ import annotations

from typing import Any

from clients.opentripmap_client import OpenTripMapClient
from core.geo import resolve_city
from core.state import TripState


def activity_agent(state: TripState) -> dict[str, Any]:
    """LangGraph node: search activities/POIs around the destination."""
    request = state.get("request")
    if not request:
        return {"activities": [], "errors": ["No trip request"]}

    new_errors: list[str] = []
    new_notes: list[str] = []

    destination = resolve_city(request.destination)
    if not destination:
        new_errors.append(f"Could not resolve destination '{request.destination}'")
        return {"activities": [], "errors": new_errors}

    client = OpenTripMapClient()
    activities = client.search_activities(
        latitude=destination["lat"],
        longitude=destination["lng"],
        preferences=request.preferences,
        max_results=8,
    )
    if not activities and client.last_error:
        new_errors.append(f"Activities: {client.last_error}")
    elif not activities:
        new_notes.append("No activities found for this destination.")
    else:
        new_notes.append(f"Found {len(activities)} activities/POIs.")

    return {"activities": activities, "errors": new_errors, "notes": new_notes}