"""Sidebar trip-builder form with quick presets and API settings."""
from __future__ import annotations

import os
from datetime import date, timedelta
from typing import Any

import streamlit as st

import config
from core.router import route_from_form

PREFERENCE_OPTIONS = [
    "food",
    "culture",
    "adventure",
    "relaxation",
    "beach",
    "shopping",
    "nightlife",
    "nature",
    "family",
]

POPULAR_DESTINATIONS = ["Paris", "Tokyo", "Rome", "Barcelona", "New York", "London", "Bali", "Bangkok"]


def render_sidebar() -> dict[str, Any] | None:
    """Render the trip-builder form and configuration. Returns a TripRequest when submitted."""
    with st.sidebar:
        st.markdown("### 🧭 Trip Builder")
        st.caption("Plan your journey with multi-agent orchestration.")

        # Preset destination chips
        st.markdown("**Quick Destinations:**")
        selected_dest = st.pills(
            "Destinations",
            POPULAR_DESTINATIONS,
            label_visibility="collapsed",
            default=None,
        )

        with st.form("trip_form"):
            origin = st.text_input(
                "Origin (City or Airport)",
                value=st.session_state.get("form_origin", "London"),
                placeholder="e.g. London or LHR",
            )
            destination = st.text_input(
                "Destination (City)",
                value=selected_dest if selected_dest else st.session_state.get("form_dest", "Paris"),
                placeholder="e.g. Paris or CDG",
            )

            col1, col2 = st.columns(2)
            with col1:
                start = st.date_input(
                    "Departure",
                    value=date.today() + timedelta(days=14),
                    min_value=date.today(),
                )
            with col2:
                end = st.date_input(
                    "Return",
                    value=date.today() + timedelta(days=18),
                    min_value=start,
                )

            col_b, col_t = st.columns([3, 2])
            with col_b:
                budget = st.number_input(
                    "Budget (USD)",
                    min_value=100.0,
                    value=1600.0,
                    step=100.0,
                    help="Total planned budget for flights, hotel, and activities.",
                )
            with col_t:
                travelers = st.number_input(
                    "Travelers",
                    min_value=1,
                    max_value=10,
                    value=2,
                    step=1,
                )

            preferences = st.pills(
                "Travel Interests",
                PREFERENCE_OPTIONS,
                selection_mode="multi",
                default=["food", "culture"],
            )

            submitted = st.form_submit_button(
                "Generate Itinerary",
                type="primary",
                icon=":material/auto_awesome:",
                use_container_width=True,
            )

        # External services & LangSmith status
        with st.expander("⚙️ Service Status & API Keys", expanded=False):
            st.markdown("**Active Integrations:**")
            
            # LangSmith
            if config.langsmith_configured():
                st.markdown(f"🟢 **LangSmith Tracing:** Active (`{config.LANGCHAIN_PROJECT}`)")
            else:
                st.markdown("⚪ **LangSmith Tracing:** Inactive")

            # Groq / Ollama
            if config.llm_provider() == "groq":
                st.markdown("🟢 **Groq LLM:** Configured (Llama 3.3)")
            else:
                st.markdown("🟠 **LLM Provider:** Ollama (Local/Fallback)")

            # Duffel
            if config.duffel_configured():
                st.markdown("🟢 **Duffel API:** Connected")
            else:
                st.markdown("🟡 **Duffel:** Realistic Sandbox Mode")

            # OpenWeather
            if config.weather_configured():
                st.markdown("🟢 **OpenWeather:** Live Forecasts")
            else:
                st.markdown("🟡 **OpenWeather:** Curated Weather Mode")

            # OpenTripMap
            if config.opentripmap_configured():
                st.markdown("🟢 **OpenTripMap:** Live POI Search")
            else:
                st.markdown("🟡 **OpenTripMap:** Curated POI Mode")

            st.divider()
            st.markdown("**Update LangSmith Credentials:**")
            new_langsmith_key = st.text_input(
                "LANGSMITH_API_KEY",
                value=config.LANGCHAIN_API_KEY,
                type="password",
                placeholder="lsv2_pt_...",
            )
            new_project = st.text_input(
                "LANGSMITH_PROJECT",
                value=config.LANGCHAIN_PROJECT,
            )
            enable_tracing = st.checkbox(
                "Enable Tracing (LANGSMITH_TRACING=true)",
                value=(config.LANGCHAIN_TRACING_V2.lower() == "true"),
            )

            if st.button("Apply API Settings", use_container_width=True):
                if new_langsmith_key:
                    os.environ["LANGSMITH_API_KEY"] = new_langsmith_key
                    os.environ["LANGCHAIN_API_KEY"] = new_langsmith_key
                    config.LANGCHAIN_API_KEY = new_langsmith_key
                if new_project:
                    os.environ["LANGSMITH_PROJECT"] = new_project
                    os.environ["LANGCHAIN_PROJECT"] = new_project
                    config.LANGCHAIN_PROJECT = new_project
                os.environ["LANGSMITH_TRACING"] = "true" if enable_tracing else "false"
                os.environ["LANGCHAIN_TRACING_V2"] = "true" if enable_tracing else "false"
                config.LANGCHAIN_TRACING_V2 = "true" if enable_tracing else "false"
                st.success("API credentials updated for this session!")
                st.rerun()

        if submitted:
            if not origin.strip() or not destination.strip():
                st.error("Please enter both an origin and destination city.")
                return None
            if end < start:
                st.error("Return date must be on or after departure date.")
                return None

            st.session_state["form_origin"] = origin
            st.session_state["form_dest"] = destination

            return route_from_form(
                origin=origin.strip(),
                destination=destination.strip(),
                departure_date=start,
                return_date=end,
                budget=float(budget),
                travelers=int(travelers),
                preferences=list(preferences or []),
            )

    return None
