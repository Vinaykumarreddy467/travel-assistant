"""Rendering helpers for trip results: flight cards, hotel cards, timeline,
weather strip, and a POI map."""
from __future__ import annotations

from typing import Any

import streamlit as st


# ---------------------------------------------------------------------------
# Flight cards
# ---------------------------------------------------------------------------
def render_flights(flights: list[dict[str, Any]]) -> None:
    if not flights:
        st.caption("No flight offers available.")
        return
    st.subheader(":material/flight_takeoff: Flights", icon=":material/flight_takeoff:")
    for f in flights[:5]:
        with st.container(border=True):
            cols = st.columns([2, 1, 1])
            cols[0].markdown(
                f"**{f.get('airline') or f.get('airline_name', 'Airline')}** "
                f"· {f.get('flight_number') or '—'}"
            )
            cols[1].markdown(
                f"{f.get('origin', '')} → {f.get('destination', '')}"
            )
            cols[2].markdown(
                f"**{f.get('price', 0):,.0f} {f.get('currency', 'USD')}**",
                help=f"Stops: {f.get('stops', 0)}",
            )
            st.caption(
                f"Departs {_fmt_dt(f.get('departure_at'))} · "
                f"Arrives {_fmt_dt(f.get('arrival_at'))} · "
                f"{f.get('duration', '')}"
            )


# ---------------------------------------------------------------------------
# Hotel cards
# ---------------------------------------------------------------------------
def render_hotels(hotels: list[dict[str, Any]]) -> None:
    if not hotels:
        st.caption("No hotel offers available.")
        return
    st.subheader(":material/hotel: Hotels", icon=":material/hotel:")
    for h in hotels[:5]:
        with st.container(border=True):
            cols = st.columns([3, 1])
            cols[0].markdown(f"**{h.get('name', 'Hotel')}**")
            rating = h.get("review_score")
            rating_txt = f" · ⭐ {rating}/10" if rating else ""
            cols[0].caption(
                f"{h.get('city', '')} {h.get('country', '')}{rating_txt}"
            )
            cols[1].markdown(
                f"**{h.get('price', 0):,.0f} {h.get('currency', 'USD')}**",
                help=f"Check-in {h.get('check_in')} → check-out {h.get('check_out')}",
            )
            if h.get("description"):
                cols[0].caption(h["description"][:140] + ("…" if len(h["description"]) > 140 else ""))


# ---------------------------------------------------------------------------
# Weather strip
# ---------------------------------------------------------------------------
def render_weather(current: dict[str, Any] | None, forecast: list[dict[str, Any]]) -> None:
    if not current and not forecast:
        return
    st.subheader(":material/partly_cloudy_day: Weather", icon=":material/partly_cloudy_day:")
    if current:
        st.markdown(
            f"**Now:** {current.get('temp', '?')}°C · {current.get('description', '')} · "
            f"feels like {current.get('feels_like', '?')}°C"
        )
    if forecast:
        cols = st.columns(len(forecast))
        for col, day in zip(cols, forecast):
            with col:
                st.markdown(f"**{_fmt_day(day.get('date', ''))}**")
                st.markdown(
                    f"{day.get('temp_min', '?')}° / {day.get('temp_max', '?')}°"
                )
                st.caption(day.get("description", ""))


# ---------------------------------------------------------------------------
# Day-by-day timeline
# ---------------------------------------------------------------------------
def render_timeline(itinerary: dict[str, Any]) -> None:
    timeline = itinerary.get("timeline", [])
    if not timeline:
        return
    st.subheader(":material/calendar_month: Day-by-day plan", icon=":material/calendar_month:")
    for day in timeline:
        with st.container(border=True):
            st.markdown(f"**Day {day['day']} — {_fmt_day(day.get('date', ''))}**")
            weather = day.get("weather")
            if weather:
                st.caption(
                    f"☀️ {weather.get('temp_min')}° / {weather.get('temp_max')}° · "
                    f"{weather.get('description', '')}"
                )
            acts = day.get("activities", [])
            if acts:
                for act in acts:
                    price = act.get("price", 0) or 0
                    price_txt = f" · {price:,.0f} {act.get('currency', 'USD')}" if price else ""
                    st.markdown(f"- {act.get('name', 'Activity')}{price_txt}")
                    if act.get("short_description"):
                        st.caption(act["short_description"][:120])
            else:
                st.caption("Free day — explore at your own pace.")


# ---------------------------------------------------------------------------
# POI map
# ---------------------------------------------------------------------------
def render_map(activities: list[dict[str, Any]]) -> None:
    points = [
        {"lat": a["latitude"], "lon": a["longitude"], "name": a.get("name", "")}
        for a in activities
        if a.get("latitude") is not None and a.get("longitude") is not None
    ]
    if not points:
        return
    st.subheader(":material/map: Points of interest", icon=":material/map:")
    st.map(points, size=100, color="#ff4b4b")
    for p in points:
        st.caption(f"📍 {p['name']}")


# ---------------------------------------------------------------------------
# Budget summary
# ---------------------------------------------------------------------------
def render_budget(itinerary: dict[str, Any]) -> None:
    budget = itinerary.get("budget", 0) or 0
    total = itinerary.get("estimated_total", 0) or 0
    currency = itinerary.get("currency", "USD")
    if budget <= 0:
        st.caption(f"Estimated total: **{total:,.0f} {currency}** (no budget set)")
        return
    within = itinerary.get("within_budget", True)
    if within:
        st.success(
            f"Estimated total **{total:,.0f} {currency}** is within your "
            f"**{budget:,.0f} {currency}** budget.",
            icon=":material/check_circle:",
        )
    else:
        st.warning(
            f"Estimated total **{total:,.0f} {currency}** exceeds your "
            f"**{budget:,.0f} {currency}** budget.",
            icon=":material/warning:",
        )


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def _fmt_dt(value: str) -> str:
    if not value:
        return "—"
    try:
        from datetime import datetime

        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.strftime("%a %d %b, %H:%M")
    except ValueError:
        return value


def _fmt_day(value: str) -> str:
    if not value:
        return ""
    try:
        from datetime import date

        return date.fromisoformat(value).strftime("%a %d %b")
    except ValueError:
        return value