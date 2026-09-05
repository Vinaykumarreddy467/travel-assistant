"""LangGraph orchestrator: router -> [flight, hotel, activity, weather] -> composer.

Deterministic edges (not a free-roaming tool-calling agent) for a reliable
hackathon demo. With LANGCHAIN_TRACING_V2=true every node execution is
automatically traced in LangSmith.
"""
from __future__ import annotations

from typing import Any

from langgraph.graph import END, START, StateGraph

from agents.activity_agent import activity_agent
from agents.flight_agent import flight_agent
from agents.hotel_agent import hotel_agent
from agents.itinerary_composer import itinerary_composer
from agents.weather_agent import weather_agent
from core.state import TripState


def build_graph():
    """Build and compile the travel-planning LangGraph."""
    graph = StateGraph(TripState)

    graph.add_node("flight", flight_agent)
    graph.add_node("hotel", hotel_agent)
    graph.add_node("activity", activity_agent)
    graph.add_node("weather", weather_agent)
    graph.add_node("composer", itinerary_composer)

    # Deterministic fan-out: all four data agents run after the router.
    graph.add_edge(START, "flight")
    graph.add_edge(START, "hotel")
    graph.add_edge(START, "activity")
    graph.add_edge(START, "weather")

    graph.add_edge("flight", "composer")
    graph.add_edge("hotel", "composer")
    graph.add_edge("activity", "composer")
    graph.add_edge("weather", "composer")

    graph.add_edge("composer", END)

    return graph.compile()


def run_pipeline(request: Any, source: str = "form") -> dict[str, Any]:
    """Run the full pipeline for a TripRequest and return the final state."""
    graph = build_graph()
    initial: TripState = {
        "request": request,
        "source": source,
        "messages": [],
        "user_input": "",
        "flights": [],
        "hotels": [],
        "activities": [],
        "weather": [],
        "current_weather": None,
        "itinerary": None,
        "errors": [],
        "notes": [],
    }
    result = graph.invoke(initial)
    return result