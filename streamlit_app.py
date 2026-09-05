"""AI Travel Assistant — Enhanced Streamlit Application.

Run locally with:
    streamlit run streamlit_app.py
"""
from __future__ import annotations

import streamlit as st

import config
from clients.llm_client import LLMClient
from core.orchestrator import run_pipeline
from core.router import route_from_form
from ui.chat_panel import render_chat
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
from ui.trip_sidebar import render_sidebar

# ---------------------------------------------------------------------------
# Streamlit Page Setup
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="AI Travel Assistant · Multi-Agent Planner",
    page_icon="✈️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Session State Initialization
# ---------------------------------------------------------------------------
st.session_state.setdefault("messages", [])
st.session_state.setdefault("last_itinerary", None)
st.session_state.setdefault("last_result", None)

# ---------------------------------------------------------------------------
# Top Header & Status Badges
# ---------------------------------------------------------------------------
header_col1, header_col2 = st.columns([3, 1])

with header_col1:
    st.title("✈️ AI Travel Assistant")
    st.caption(
        "Autonomous multi-agent trip planner powered by LangGraph, Groq LLaMA-3.3, "
        "Duffel Flights & Hotels, OpenTripMap attractions, and OpenWeather."
    )

with header_col2:
    st.write("")
    # Provider & Tracing Badges
    b_col1, b_col2 = st.columns(2)
    with b_col1:
        if config.llm_provider() == "groq":
            st.success("⚡ Groq LLaMA-3.3", icon="⚡")
        else:
            st.info("💻 Ollama / Fallback", icon="💻")
    with b_col2:
        if config.langsmith_configured():
            st.success(f"🟢 LangSmith Tracing", icon="🔍")
        else:
            st.warning("⚪ Tracing Inactive", icon="⚪")

# Demo & Action toolbar
tb_col1, tb_col2, tb_col3 = st.columns([2, 2, 4])
with tb_col1:
    if st.button("🌟 Load Example Paris Itinerary", use_container_width=True):
        from datetime import date, timedelta
        start = date.today() + timedelta(days=14)
        end = date.today() + timedelta(days=18)
        demo_request = route_from_form(
            origin="London",
            destination="Paris",
            departure_date=start,
            return_date=end,
            budget=1600.0,
            travelers=2,
            preferences=["food", "culture", "relaxation"],
        )
        with st.spinner("Orchestrating agents for Paris demo..."):
            demo_result = run_pipeline(demo_request, source="demo")
            st.session_state.last_result = demo_result
            st.session_state.last_itinerary = demo_result.get("itinerary")
            st.rerun()

with tb_col2:
    if st.button("🔄 Reset Plan & Chat", use_container_width=True):
        st.session_state.messages = []
        st.session_state.last_result = None
        st.session_state.last_itinerary = None
        st.rerun()

st.divider()

# ---------------------------------------------------------------------------
# Sidebar: Trip Builder Form & Configuration
# ---------------------------------------------------------------------------
form_request = render_sidebar()

# Handle form submission if submitted in sidebar
if form_request is not None:
    with st.status("🚀 Orchestrating AI Travel Agents...", expanded=True) as status:
        st.write("• **Flight Agent:** Searching flight offers on Duffel...")
        st.write("• **Hotel Agent:** Scouting accommodations and guest ratings...")
        st.write("• **Activity Agent:** Discovering high-rated points of interest...")
        st.write("• **Weather Agent:** Checking meteorological forecasts...")
        st.write("• **Composer Agent:** Assembling optimal daily schedule & budget...")

        res = run_pipeline(form_request, source="form")
        status.update(label="✅ Itinerary generation complete!", state="complete", expanded=False)

    st.session_state.last_result = res
    st.session_state.last_itinerary = res.get("itinerary")

# ---------------------------------------------------------------------------
# Main Content Area: Itinerary View + Chat Assistant
# ---------------------------------------------------------------------------
llm = LLMClient()
active_result = st.session_state.get("last_result")
active_itinerary = st.session_state.get("last_itinerary")

if active_result and active_itinerary:
    # 1. High-Level Executive Summary Banner
    render_summary_banner(active_itinerary)

    # 2. Main Tabs for Deep Dive
    tab_overview, tab_flights, tab_hotels, tab_map, tab_chat, tab_telemetry = st.tabs([
        "📅 Daily Schedule & Budget",
        "✈️ Flights",
        "🏨 Accommodations",
        "📍 Map & Attractions",
        "💬 Interactive Chat",
        "🔬 Agent Telemetry",
    ])

    with tab_overview:
        render_budget(active_itinerary)
        st.divider()
        weather = active_result.get("weather", [])
        current_w = active_result.get("current_weather")
        if weather or current_w:
            render_weather(current_w, weather)
            st.divider()
        render_timeline(active_itinerary)
        st.divider()
        render_export_panel(active_result)

    with tab_flights:
        render_flights(active_result.get("flights", []))

    with tab_hotels:
        render_hotels(active_result.get("hotels", []))

    with tab_map:
        render_map(active_result.get("activities", []))

    with tab_chat:
        st.markdown("##### 💬 Chat with your Travel Agent")
        st.caption("Ask questions about this itinerary, request adjustments, or explore additional activities.")
        render_chat(llm)

    with tab_telemetry:
        st.markdown("##### 🔬 Multi-Agent Execution Telemetry")
        notes = active_result.get("notes", [])
        errors = active_result.get("errors", [])

        col_t1, col_t2 = st.columns(2)
        with col_t1:
            st.markdown("**LangSmith Observability:**")
            if config.langsmith_configured():
                st.success(
                    f"Tracing is **ENABLED** on project `{config.LANGCHAIN_PROJECT}`.  \n"
                    f"Traces are automatically streamed to `{config.LANGCHAIN_ENDPOINT}`."
                )
            else:
                st.info("LangSmith tracing is currently disabled or key is missing.")

        with col_t2:
            st.markdown(f"**Execution Log ({len(notes)} notes, {len(errors)} warnings):**")
            for n in notes:
                st.caption(f"ℹ️ {n}")
            for e in errors:
                st.caption(f"⚠️ {e}")

else:
    # If no itinerary loaded yet, highlight the Chat Concierge and Quick Builder
    st.info("👋 Welcome! Use the **Trip Builder** in the sidebar to configure a trip, click **Load Example Paris Itinerary** above, or chat with the AI below.")
    render_chat(llm)
