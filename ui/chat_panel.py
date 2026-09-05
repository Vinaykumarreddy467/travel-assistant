"""Chat panel: conversation UI + pipeline execution with progress steps."""
from __future__ import annotations

from typing import Any

import streamlit as st

from core.orchestrator import run_pipeline
from core.router import route_from_text
from ui.result_cards import (
    render_budget,
    render_flights,
    render_hotels,
    render_map,
    render_timeline,
    render_weather,
)

SUGGESTIONS = {
    ":blue[:material/flight:] London → Paris, next week, $1500, food & museums": (
        "Plan a trip from London to Paris next week for 2 people with a budget "
        "of $1500. We love food and museums."
    ),
    ":green[:material/beach:] Tokyo, 5 days, adventure + beach": (
        "Trip to Tokyo on 2026-12-01 returning 2026-12-08, 3 adults, 3000 "
        "dollars, adventure and beach."
    ),
    ":orange[:material/restaurant:] Barcelona city break": (
        "Plan a weekend trip from Madrid to Barcelona, budget 800 dollars, "
        "food and nightlife."
    ),
}


def render_chat(llm: Any) -> None:
    """Render the chat interface and handle new messages."""
    # Suggestion chips before the first message.
    if not st.session_state.messages:
        st.markdown("### :material/travel_explore: Plan your next trip")
        st.caption(
            "Type a request like *\"London to Paris next week for 2, $1500, "
            "food and museums\"* — or use the trip builder in the sidebar."
        )
        selected = st.pills(
            "Try asking:",
            list(SUGGESTIONS.keys()),
            label_visibility="collapsed",
        )
        if selected:
            st.session_state.messages.append(
                {"role": "user", "content": SUGGESTIONS[selected]}
            )
            st.rerun()

    # Render history.
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])

    # Handle new input.
    prompt = st.chat_input("Plan a trip…", submit_mode="disable")
    if not prompt:
        return

    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.write(prompt)

    with st.chat_message("assistant", avatar=":material/robot:"):
        # Step 1: extract the trip request.
        with st.status(":shimmer[Extracting trip details…]", type="compact") as status:
            request = route_from_text(prompt, llm)
            status.update(
                label=(
                    f"{request.destination_name or request.destination} · "
                    f"{request.start_date} · {request.travelers} traveler(s)"
                ),
                state="complete",
            )

        # Step 2: run the LangGraph pipeline.
        with st.status(":shimmer[Searching flights, hotels, activities, weather…]", type="compact") as status:
            result = run_pipeline(request, source="chat")
            status.update(label="Search complete", state="complete")

        # Step 3: render results.
        itinerary = result.get("itinerary")
        if itinerary:
            render_budget(itinerary)
            render_flights(result.get("flights", []))
            render_hotels(result.get("hotels", []))
            render_weather(result.get("current_weather"), result.get("weather", []))
            render_timeline(itinerary)
            render_map(result.get("activities", []))
        else:
            st.error("Could not build an itinerary. Please try again.")

        # Diagnostics (errors/notes) in a collapsible expander.
        errors = result.get("errors", [])
        notes = result.get("notes", [])
        if errors or notes:
            with st.expander("Pipeline details", icon=":material/tune:"):
                for note in notes:
                    st.caption(f"• {note}")
                for err in errors:
                    st.caption(f":orange[⚠ {err}]")

        # Summary line for the transcript.
        if itinerary:
            dest = itinerary.get("destination", "")
            total = itinerary.get("estimated_total", 0)
            currency = itinerary.get("currency", "USD")
            summary = (
                f"Here's your plan for **{dest}** — "
                f"estimated **{total:,.0f} {currency}** total. "
                "Scroll up for flights, hotels, weather, and the day-by-day timeline."
            )
            st.session_state.messages.append({"role": "assistant", "content": summary})
        else:
            st.session_state.messages.append(
                {
                    "role": "assistant",
                    "content": "I couldn't build an itinerary for that request — "
                    "check the pipeline details above.",
                }
            )