"""Weather agent: fetches current weather + 5-day forecast via OpenWeather."""
from __future__ import annotations

from typing import Any

from clients.weather_client import WeatherClient
from core.geo import resolve_city
from core.state import TripState


def weather_agent(state: TripState) -> dict[str, Any]:
    """LangGraph node: fetch current + forecast weather for the destination."""
    request = state.get("request")
    if not request:
        return {"weather": [], "current_weather": None, "errors": ["No trip request"]}

    new_errors: list[str] = []
    new_notes: list[str] = []

    destination = resolve_city(request.destination)
    if not destination:
        new_errors.append(f"Could not resolve destination '{request.destination}'")
        return {"weather": [], "current_weather": None, "errors": new_errors}

    client = WeatherClient()
    current = client.current(destination["lat"], destination["lng"])
    forecast = client.forecast(destination["lat"], destination["lng"], days=5)

    if current is None and client.last_error:
        new_errors.append(f"Weather: {client.last_error}")
    elif current:
        new_notes.append(f"Current weather in {destination['name']}: {current['description']}.")

    return {
        "weather": forecast,
        "current_weather": current,
        "errors": new_errors,
        "notes": new_notes,
    }