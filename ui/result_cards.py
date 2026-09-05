"""Enhanced rendering helpers for trip results:
- Executive summary with metrics & budget progress
- Flight cards with airline & schedule details
- Hotel cards with photos, amenities, and review ratings
- Interactive daily timeline (morning/afternoon/evening slots)
- Weather forecast cards
- Map & POI explorer with category tags
- Export & share actions
"""
from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

import streamlit as st


# ---------------------------------------------------------------------------
# Executive Summary & Metric Banner
# ---------------------------------------------------------------------------
def render_summary_banner(itinerary: dict[str, Any]) -> None:
    dest = itinerary.get("destination_name") or itinerary.get("destination", "Destination")
    origin = itinerary.get("origin_name") or itinerary.get("origin", "Origin")
    days = itinerary.get("days", 0)
    travelers = itinerary.get("travelers", 1)
    budget = float(itinerary.get("budget", 0) or 0)
    total = float(itinerary.get("estimated_total", 0) or 0)
    currency = itinerary.get("currency", "USD")
    current_weather = itinerary.get("current_weather")

    # Metrics row
    col1, col2, col3, col4 = st.columns([3, 2, 3, 2])
    with col1:
        st.metric(
            label="Route & Travelers",
            value=f"{origin} → {dest}",
            delta=f"{days} Days · {travelers} Traveler{'s' if travelers > 1 else ''}",
            delta_color="off",
        )
    with col2:
        delta_val = budget - total
        is_within = delta_val >= 0
        st.metric(
            label="Estimated Total",
            value=f"${total:,.0f} {currency}",
            delta=f"{'+' if is_within else '-'}${abs(delta_val):,.0f} {'remaining' if is_within else 'over budget'}",
            delta_color="normal" if is_within else "inverse",
        )
    with col3:
        pct = min(100.0, (total / budget * 100.0)) if budget > 0 else 100.0
        st.write(f"**Budget Allocation ({pct:.0f}%)**")
        st.progress(pct / 100.0)
        st.caption(f"Planned Target: ${budget:,.0f} {currency}")
    with col4:
        if current_weather:
            st.metric(
                label=f"Weather in {dest}",
                value=f"{current_weather.get('temp', '?')}°C",
                delta=current_weather.get("description", "Pleasant"),
                delta_color="off",
            )
        else:
            st.metric(label="Destination", value=dest)


# ---------------------------------------------------------------------------
# Budget Breakdown
# ---------------------------------------------------------------------------
def render_budget(itinerary: dict[str, Any]) -> None:
    breakdown = itinerary.get("cost_breakdown") or {}
    flight_total = breakdown.get("flight_total", 0)
    hotel_total = breakdown.get("hotel_total", 0)
    act_total = breakdown.get("activities_total", 0)
    food_total = breakdown.get("food_and_incidentals", 0)
    currency = itinerary.get("currency", "USD")

    st.markdown("##### 💳 Cost Synthesis & Breakdown")
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        with st.container(border=True):
            st.caption("✈️ Flights Total")
            st.markdown(f"### ${flight_total:,.0f}")
            st.caption(f"All travelers ({currency})")
    with c2:
        with st.container(border=True):
            st.caption("🏨 Accommodations")
            st.markdown(f"### ${hotel_total:,.0f}")
            st.caption(f"Entire stay ({currency})")
    with c3:
        with st.container(border=True):
            st.caption("🎟️ Activities & Entry")
            st.markdown(f"### ${act_total:,.0f}")
            st.caption("Sightseeing & tours")
    with c4:
        with st.container(border=True):
            st.caption("🍽️ Food & Incidentals")
            st.markdown(f"### ${food_total:,.0f}")
            st.caption("Estimated dining & transit")


# ---------------------------------------------------------------------------
# Flight Cards
# ---------------------------------------------------------------------------
def render_flights(flights: list[dict[str, Any]]) -> None:
    if not flights:
        st.info("No flight options found for the specified criteria.")
        return

    st.markdown("##### ✈️ Recommended Flights")
    for idx, f in enumerate(flights[:4]):
        with st.container(border=True):
            cols = st.columns([3, 2, 2])
            airline = f.get("airline") or f.get("airline_name") or "Direct Carrier"
            flight_no = f.get("flight_number") or f"FL-{100 + idx}"
            stops = f.get("stops", 0)
            stops_label = "Direct" if stops == 0 else f"{stops} stop{'s' if stops > 1 else ''}"

            with cols[0]:
                st.markdown(f"**{airline}** · `{flight_no}`")
                st.caption(
                    f"🛫 Departs {_fmt_dt(f.get('departure_at'))}  \n"
                    f"🛬 Arrives {_fmt_dt(f.get('arrival_at'))}"
                )

            with cols[1]:
                st.markdown(f"**{f.get('origin', '')} → {f.get('destination', '')}**")
                st.caption(f"⏱️ Duration: {f.get('duration', '2h 15m')} · {stops_label}")
                if f.get("is_return"):
                    st.badge("Round-trip included", color="green")

            with cols[2]:
                price = f.get("price", 0)
                st.markdown(f"### ${price:,.0f}")
                st.caption(f"{f.get('currency', 'USD')} total for all travelers")


# ---------------------------------------------------------------------------
# Hotel Cards
# ---------------------------------------------------------------------------
def render_hotels(hotels: list[dict[str, Any]]) -> None:
    if not hotels:
        st.info("No hotel options found for the specified destination.")
        return

    st.markdown("##### 🏨 Handpicked Accommodations")
    for h in hotels[:4]:
        with st.container(border=True):
            cols = st.columns([1, 3, 1.5])

            photo = h.get("photo")
            with cols[0]:
                if photo:
                    st.image(photo, use_container_width=True)
                else:
                    st.markdown("🏨")

            with cols[1]:
                st.markdown(f"**{h.get('name', 'Hotel')}**")
                rating = h.get("review_score") or 8.5
                stars = "⭐" * int(h.get("rating", 4))
                st.caption(f"{stars} · **Score: {rating}/10** · {h.get('city', '')} {h.get('country', '')}")
                if h.get("description"):
                    st.caption(h["description"])

                amenities = h.get("amenities", [])
                if amenities:
                    amenity_str = " · ".join([a.replace("_", " ").title() for a in amenities[:4]])
                    st.caption(f"✨ *Amenities:* {amenity_str}")

            with cols[2]:
                price = h.get("price", 0)
                st.markdown(f"### ${price:,.0f}")
                st.caption(f"Total stay ({h.get('currency', 'USD')})")
                st.caption(f"Check-in: {h.get('check_in', '—')}  \nCheck-out: {h.get('check_out', '—')}")


# ---------------------------------------------------------------------------
# Weather Strip
# ---------------------------------------------------------------------------
def render_weather(current: dict[str, Any] | None, forecast: list[dict[str, Any]]) -> None:
    if not current and not forecast:
        return

    st.markdown("##### ⛅ Weather & Forecast")
    if current:
        st.caption(
            f"**Current Condition:** {current.get('description', 'Clear')} · "
            f"Temp: {current.get('temp', '?')}°C (feels like {current.get('feels_like', '?')}°C) · "
            f"Humidity: {current.get('humidity', '?')}% · Wind: {current.get('wind_speed', '?')} m/s"
        )

    if forecast:
        cols = st.columns(min(len(forecast), 5))
        for col, day in zip(cols, forecast[:5]):
            with col:
                with st.container(border=True):
                    st.markdown(f"**{_fmt_day(day.get('date', ''))}**")
                    st.markdown(f"### {day.get('temp_max', '?')}°C")
                    st.caption(f"Low: {day.get('temp_min', '?')}°C")
                    st.caption(f"☁️ {day.get('description', '')}")


# ---------------------------------------------------------------------------
# Day-by-Day Timeline
# ---------------------------------------------------------------------------
def render_timeline(itinerary: dict[str, Any]) -> None:
    timeline = itinerary.get("timeline", [])
    if not timeline:
        st.info("No timeline schedule generated.")
        return

    st.markdown("##### 📅 Day-by-Day Itinerary Schedule")
    for day in timeline:
        day_num = day.get("day", 1)
        day_date = _fmt_day(day.get("date", ""))
        weather = day.get("weather")
        weather_info = f" · ☀️ {weather.get('temp_min')}°–{weather.get('temp_max')}°C ({weather.get('description', '')})" if weather else ""

        with st.expander(f"**Day {day_num}** — {day_date}{weather_info}", expanded=(day_num <= 2)):
            acts = day.get("activities", [])
            if not acts:
                st.caption("Free day — leisure and self-guided exploration.")
                continue

            # Time slots (Morning / Afternoon / Evening)
            slots = [("Morning", day.get("morning")), ("Afternoon", day.get("afternoon")), ("Evening", day.get("evening"))]
            has_slots = any(s[1] for s in slots)

            if has_slots:
                for slot_name, act in slots:
                    if not act:
                        continue
                    _render_activity_row(slot_name, act)
            else:
                for idx, act in enumerate(acts):
                    slot_name = "Morning" if idx == 0 else ("Afternoon" if idx == 1 else "Evening")
                    _render_activity_row(slot_name, act)


def _render_activity_row(slot_name: str, act: dict[str, Any]) -> None:
    with st.container(border=True):
        c1, c2 = st.columns([1, 4])
        with c1:
            img = act.get("image")
            if img:
                st.image(img, use_container_width=True)
            else:
                st.markdown(f"📍 **{slot_name}**")
        with c2:
            st.markdown(f"**[{slot_name}] {act.get('name', 'Attraction')}**")
            cat = act.get("category") or act.get("kinds", "sightseeing")
            price = act.get("price", 0)
            price_badge = f"${price:,.0f} {act.get('currency', 'USD')}" if price else "Free Admission"
            st.caption(f"🏷️ Category: `{cat}` · 🎟️ {price_badge}")
            desc = act.get("short_description") or act.get("description")
            if desc:
                st.write(desc)


# ---------------------------------------------------------------------------
# POI Map & Attractions List
# ---------------------------------------------------------------------------
def render_map(activities: list[dict[str, Any]]) -> None:
    points = [
        {"lat": a["latitude"], "lon": a["longitude"], "name": a.get("name", ""), "category": a.get("category", "")}
        for a in activities
        if a.get("latitude") is not None and a.get("longitude") is not None
    ]

    st.markdown("##### 📍 Destination Map & Points of Interest")
    if points:
        st.map(points, zoom=12, size=150, color="#d97706")

    with st.expander(f"View all {len(activities)} plotted attractions", expanded=False):
        for a in activities:
            st.markdown(f"• **{a.get('name')}** (`{a.get('category', 'sightseeing')}`) — {a.get('short_description', '')}")


# ---------------------------------------------------------------------------
# Export & Share
# ---------------------------------------------------------------------------
def render_export_panel(result: dict[str, Any]) -> None:
    itinerary = result.get("itinerary", {})
    if not itinerary:
        return

    dest = itinerary.get("destination_name") or itinerary.get("destination", "Trip")
    days = itinerary.get("days", 4)
    total = itinerary.get("estimated_total", 0)

    summary_text = (
        f"# AI Travel Assistant Itinerary: {dest} ({days} Days)\n\n"
        f"- Origin: {itinerary.get('origin')}\n"
        f"- Destination: {dest}\n"
        f"- Dates: {itinerary.get('start_date')} to {itinerary.get('end_date')}\n"
        f"- Estimated Total: ${total:,.0f} {itinerary.get('currency', 'USD')}\n"
        f"- Travelers: {itinerary.get('travelers')}\n\n"
        f"## Day-by-Day Summary:\n"
    )

    for day in itinerary.get("timeline", []):
        summary_text += f"\n### Day {day.get('day')} ({day.get('date')}):\n"
        for act in day.get("activities", []):
            summary_text += f"- {act.get('name')} (${act.get('price', 0)} USD)\n"

    col1, col2 = st.columns(2)
    with col1:
        st.download_button(
            label="📥 Download Itinerary (Markdown)",
            data=summary_text,
            file_name=f"{dest.lower()}_itinerary.md",
            mime="text/markdown",
            use_container_width=True,
        )
    with col2:
        st.download_button(
            label="📦 Download Full Data (JSON)",
            data=json.dumps(result, indent=2),
            file_name=f"{dest.lower()}_trip_pipeline.json",
            mime="application/json",
            use_container_width=True,
        )


# ---------------------------------------------------------------------------
# Small formatting helpers
# ---------------------------------------------------------------------------
def _fmt_dt(value: str | None) -> str:
    if not value:
        return "—"
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.strftime("%a %d %b, %H:%M")
    except Exception:
        return str(value)


def _fmt_day(value: str | None) -> str:
    if not value:
        return ""
    try:
        return date.fromisoformat(str(value)).strftime("%A, %d %B")
    except Exception:
        return str(value)
