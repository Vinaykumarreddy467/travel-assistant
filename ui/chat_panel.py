"""Enhanced chat panel: conversational interface + interactive agent pipeline execution."""
from __future__ import annotations

from typing import Any

import streamlit as st

from core.orchestrator import run_pipeline
from core.router import route_from_text
from ui.result_cards import (
    render_budget,
    render_export_panel,
    render_flights,
    render_hotels,
    render_map,
    render_summary_banner,
    render_timeline,
    render_weather,
)

SUGGESTIONS = {
    "✈️ London → Paris (4 Days, $1600)": (
        "Plan a 4-day romantic getaway to Paris from London next week for 2 people with a $1600 budget. "
        "We love world-class food, art museums, and historic walking tours."
    ),
    "🌸 Tokyo Adventure (7 Days, $3500)": (
        "Plan a 7-day trip to Tokyo from New York for 2 adults with a $3500 budget. "
        "Focus on Japanese cuisine, tech districts, temples, and anime culture."
    ),
    "🏖️ Rome & Amalfi Coast (5 Days, $2200)": (
        "Plan a 5-day cultural and culinary vacation in Rome for 2 travelers, $2200 budget. "
        "Include ancient monuments, local trattorias, and scenic viewpoints."
    ),
    "☀️ Barcelona City Break (3 Days, $1200)": (
        "Plan a 3-day weekend trip to Barcelona from London for 2 with an $1200 budget. "
        "We want beach relaxation, tapas bars, and Gaudí architecture."
    ),
}


def render_chat(llm: Any) -> None:
    """Render the conversational interface and process travel planning prompts."""
    # Suggestion chips
    if not st.session_state.messages:
        st.markdown("#### 💬 Conversational Travel Concierge")
        st.caption("Ask anything in natural language, or pick an inspiration prompt below:")

        cols = st.columns(2)
        for idx, (label, prompt_text) in enumerate(SUGGESTIONS.items()):
            target_col = cols[idx % 2]
            with target_col:
                if st.button(label, use_container_width=True, key=f"sug_{idx}"):
                    st.session_state.messages.append({"role": "user", "content": prompt_text})
                    st.rerun()

    # Render chat history
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"], avatar="👤" if msg["role"] == "user" else "🧭"):
            st.markdown(msg["content"])

    # Chat input
    prompt = st.chat_input("Where would you like to travel? (e.g. 5 days in Rome from London, $2000 budget)")
    if not prompt:
        return

    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user", avatar="👤"):
        st.markdown(prompt)

    with st.chat_message("assistant", avatar="🧭"):
        # Step 1: Extract trip request using router LLM / fallback
        with st.status("🧠 Step 1: Understanding travel intent...", expanded=True) as status:
            st.write("Extracting origin, destination, dates, budget, and travel preferences...")
            request = route_from_text(prompt, llm)
            status.update(
                label=f"Destination recognized: **{request.destination_name or request.destination}** ({request.start_date} to {request.end_date})",
                state="complete",
                expanded=False,
            )

        # Step 2: Execute LangGraph multi-agent pipeline
        with st.status("⚡ Step 2: Multi-agent parallel coordination in progress...", expanded=True) as status:
            st.write("• **Flight Agent:** Querying Duffel airline routes and pricing...")
            st.write("• **Hotel Agent:** Evaluating accommodations, star ratings, and amenities...")
            st.write("• **Weather Agent:** Fetching OpenWeather forecasts and climate conditions...")
            st.write("• **Activity Agent:** Searching OpenTripMap attractions and curated POIs...")
            st.write("• **Composer Agent:** Synthesizing day-by-day schedule within budget constraints...")

            result = run_pipeline(request, source="chat")
            status.update(label="✅ Multi-agent trip orchestration complete!", state="complete", expanded=False)

        st.session_state.last_result = result
        st.session_state.last_itinerary = result.get("itinerary")

        itinerary = result.get("itinerary")
        if itinerary:
            st.success(f"Trip planned successfully for **{itinerary.get('destination_name', 'your trip')}**!")

            # Quick summary banner
            render_summary_banner(itinerary)

            # Tabbed presentation
            tab_timeline, tab_budget, tab_flights, tab_hotels, tab_map, tab_export = st.tabs([
                "📅 Daily Schedule",
                "💰 Budget Synthesis",
                "✈️ Flights",
                "🏨 Accommodations",
                "📍 Map & POIs",
                "📤 Export & Share",
            ])

            with tab_timeline:
                render_timeline(itinerary)
            with tab_budget:
                render_budget(itinerary)
            with tab_flights:
                render_flights(result.get("flights", []))
            with tab_hotels:
                render_hotels(result.get("hotels", []))
            with tab_map:
                render_map(result.get("activities", []))
            with tab_export:
                render_export_panel(result)

        else:
            st.error("Could not construct an itinerary. Please verify destination details and try again.")
            for err in result.get("errors", []):
                st.warning(f"Error detail: {err}")
