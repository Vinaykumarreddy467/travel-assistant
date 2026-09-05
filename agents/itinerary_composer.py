"""Itinerary composer: merges agent results into a day-by-day plan."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from core.state import TripState


def itinerary_composer(state: TripState) -> dict[str, Any]:
    """LangGraph node: compose flights + hotels + activities + weather into
    a day-by-day itinerary, and estimate cost against the budget."""
    request = state.get("request")
    if not request:
        return {"itinerary": None, "errors": ["No trip request"]}

    new_notes: list[str] = []

    flights = state.get("flights", [])
    hotels = state.get("hotels", [])
    activities = state.get("activities", [])
    weather = state.get("weather", [])
    current_weather = state.get("current_weather")

    # --- Trip length -----------------------------------------------------
    days = _trip_days(request.start_date, request.end_date)
    if days < 1:
        days = 1

    # --- Pick best flight (cheapest) -------------------------------------
    best_flight = None
    if flights:
        best_flight = min(flights, key=lambda f: f.get("price", 0) or 0)

    # --- Pick best hotel (cheapest) --------------------------------------
    best_hotel = None
    if hotels:
        best_hotel = min(hotels, key=lambda h: h.get("price", 0) or 0)

    # --- Distribute activities across days -------------------------------
    per_day = _distribute_activities(activities, days)

    # --- Weather per day --------------------------------------------------
    weather_by_day = {w.get("date", "")[:10]: w for w in weather}

    # --- Budget estimate --------------------------------------------------
    flight_cost = (best_flight.get("price", 0) or 0) if best_flight else 0
    hotel_cost = (best_hotel.get("price", 0) or 0) if best_hotel else 0
    activity_cost = sum((a.get("price", 0) or 0) for a in activities[: days * 2])
    estimated_total = flight_cost + hotel_cost + activity_cost
    budget = request.budget or 0
    within_budget = budget <= 0 or estimated_total <= budget

    # --- Build day-by-day timeline ----------------------------------------
    timeline = []
    for i in range(days):
        day_date = _date_from(request.start_date, i)
        day_weather = weather_by_day.get(day_date.isoformat())
        timeline.append(
            {
                "day": i + 1,
                "date": day_date.isoformat(),
                "weather": day_weather,
                "activities": per_day[i] if i < len(per_day) else [],
            }
        )

    itinerary = {
        "destination": request.destination_name or request.destination,
        "origin": request.origin_name or request.origin,
        "start_date": request.start_date,
        "end_date": request.end_date,
        "days": days,
        "travelers": request.travelers,
        "budget": budget,
        "currency": request.currency or "USD",
        "best_flight": best_flight,
        "best_hotel": best_hotel,
        "timeline": timeline,
        "estimated_total": round(estimated_total, 2),
        "within_budget": within_budget,
        "current_weather": current_weather,
        "preferences": request.preferences,
    }

    if best_flight:
        new_notes.append(f"Best flight: {best_flight.get('flight_number') or best_flight.get('airline')} at {best_flight.get('price')} {best_flight.get('currency')}.")
    if best_hotel:
        new_notes.append(f"Best hotel: {best_hotel.get('name')} at {best_hotel.get('price')} {best_hotel.get('currency')}.")
    if budget > 0:
        status = "within" if within_budget else "over"
        new_notes.append(f"Estimated total {estimated_total:.2f} {request.currency} is {status} budget of {budget:.2f}.")

    return {"itinerary": itinerary, "notes": new_notes}


# ---------------------------------------------------------------------------
def _trip_days(start: str, end: str) -> int:
    """Number of calendar days between start and end (inclusive)."""
    try:
        s = date.fromisoformat(start)
        if end:
            e = date.fromisoformat(end)
            return max(1, (e - s).days + 1)
        return 1
    except ValueError:
        return 1


def _date_from(start: str, offset: int) -> date:
    try:
        return date.fromisoformat(start) + timedelta(days=offset)
    except ValueError:
        return date.today() + timedelta(days=offset)


def _distribute_activities(activities: list[dict], days: int) -> list[list[dict]]:
    """Spread activities across days, ~2 per day, keeping order."""
    per_day: list[list[dict]] = [[] for _ in range(days)]
    for idx, act in enumerate(activities):
        day_idx = idx % days
        if len(per_day[day_idx]) >= 2:
            # Find the next day with space.
            for d in range(days):
                if len(per_day[d]) < 2:
                    day_idx = d
                    break
        per_day[day_idx].append(act)
    return per_day