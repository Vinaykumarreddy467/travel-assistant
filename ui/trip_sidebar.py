"""Sidebar trip-builder form."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import streamlit as st

from core.router import route_from_form

PREFERENCE_OPTIONS = [
    "adventure",
    "food",
    "culture",
    "beach",
    "shopping",
    "nightlife",
    "nature",
    "family",
]


def render_sidebar() -> dict[str, Any] | None:
    """Render the trip-builder form. Returns a TripRequest when submitted."""
    with st.sidebar:
        st.header(":material/travel_explore: Trip builder", icon=":material/travel_explore:")
        st.caption("Fill the form and hit **Plan my trip** — or just type in the chat.")

        with st.form("trip_form"):
            origin = st.text_input("From (city or airport)", placeholder="e.g. London or LHR")
            destination = st.text_input("To (city)", placeholder="e.g. Paris")
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
            budget = st.number_input(
                "Budget (USD)", min_value=0.0, value=2000.0, step=100.0
            )
            travelers = st.number_input(
                "Travelers", min_value=1, max_value=10, value=2, step=1
            )
            preferences = st.pills(
                "Preferences",
                PREFERENCE_OPTIONS,
                selection_mode="multi",
                default=["food", "culture"],
            )
            submitted = st.form_submit_button(
                "Plan my trip", type="primary", icon=":material/auto_awesome:"
            )

        if submitted:
            if not origin or not destination:
                st.error("Please fill in both origin and destination.")
                return None
            if end < start:
                st.error("Return date must be after departure date.")
                return None
            return route_from_form(
                origin=origin,
                destination=destination,
                departure_date=start,
                return_date=end,
                budget=budget,
                travelers=int(travelers),
                preferences=list(preferences or []),
            )

    return None