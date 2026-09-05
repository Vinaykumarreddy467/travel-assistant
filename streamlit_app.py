"""AI Travel Assistant — Streamlit entry point.

Run with:  streamlit run streamlit_app.py
"""
from __future__ import annotations

import streamlit as st

import config
from clients.llm_client import LLMClient
from core.orchestrator import run_pipeline
from ui.chat_panel import render_chat
from ui.result_cards import (
    render_budget,
    render_flights,
    render_hotels,
    render_map,
    render_timeline,
    render_weather,
)
from ui.trip_sidebar import render_sidebar

st.set_page_config(
    page_title="AI Travel Assistant",
    page_icon=":material/travel_explore:",
    layout="wide",
)

# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------
st.session_state.setdefault("messages", [])
st.session_state.setdefault("last_itinerary", None)
st.session_state.setdefault("last_result", None)

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
st.title(":material/travel_explore: AI Travel Assistant", icon=":material/travel_explore:")
st.caption(
    "Groq-powered trip planning · Duffel flights & hotels · OpenTripMap POIs · "
    "OpenWeather forecast"
)

# Provider badge
provider = config.llm_provider()
if provider == "groq":
    st.badge("Groq LLM", icon=":material/bolt:", color="green")
else:
    st.badge("Ollama LLM (offline)", icon=":material/computer:", color="orange")

# ---------------------------------------------------------------------------
# Sidebar: trip builder
# ---------------------------------------------------------------------------
request = render_sidebar()

# ---------------------------------------------------------------------------
# Main area: chat + results
# ---------------------------------------------------------------------------
llm = LLMClient()

if request is not None:
    # Form submission: run the pipeline and render results in the main area.
    with st.status(":shimmer[Planning your trip…]", type="compact") as status:
        result = run_pipeline(request, source="form")
        status.update(label="Trip planned", state="complete")

    st.session_state.last_result = result
    st.session_state.last_itinerary = result.get("itinerary")

    itinerary = result.get("itinerary")
    if itinerary:
        st.header(
            f":material/map: {itinerary.get('destination', '')} itinerary",
            icon=":material/map:",
        )
        render_budget(itinerary)
        render_flights(result.get("flights", []))
        render_hotels(result.get("hotels", []))
        render_weather(result.get("current_weather"), result.get("weather", []))
        render_timeline(itinerary)
        render_map(result.get("activities", []))

        errors = result.get("errors", [])
        notes = result.get("notes", [])
        if errors or notes:
            with st.expander("Pipeline details", icon=":material/tune:"):
                for note in notes:
                    st.caption(f"• {note}")
                for err in errors:
                    st.caption(f":orange[⚠ {err}]")
    else:
        st.error("Could not build an itinerary. Check the pipeline details.")
        for err in result.get("errors", []):
            st.caption(f":orange[⚠ {err}]")

# Chat interface (always available).
render_chat(llm)