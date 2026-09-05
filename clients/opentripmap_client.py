"""OpenTripMap client wrapper (points of interest / activities).

Plain REST against https://api.opentripmap.com (no SDK needed).

- Radius search:  GET /0.1/en/places/radius?radius=..&lon=..&lat=..&format=json
- Place details:  GET /0.1/en/places/xid/{xid}?apikey=..

All methods return plain dicts/lists and degrade to `None` / `[]` on missing
credentials or API errors, with a human-readable message in `last_error`.
"""
from __future__ import annotations

import logging
from typing import Any

import requests

import config

log = logging.getLogger(__name__)

_BASE = "https://api.opentripmap.com/0.1/en/places"

# OpenTripMap "kinds" buckets we map preference labels onto.
KIND_FILTERS = {
    "adventure": ["adventure", "sports", "hiking", "climbing"],
    "food": ["foods", "restaurants", "cafes"],
    "culture": ["museums", "cultural", "historic", "architecture", "religion"],
    "beach": ["beaches", "water", "swimming"],
    "shopping": ["shops", "mall"],
    "nightlife": ["nightlife", "bars", "clubs"],
    "nature": ["natural", "parks", "gardens", "viewpoints"],
    "family": ["amusements", "aquarium", "zoo", "theme_park"],
}


class OpenTripMapClient:
    """Thin wrapper around the OpenTripMap REST API."""

    def __init__(self) -> None:
        self.last_error: str | None = None
        self._session = requests.Session()

    @property
    def available(self) -> bool:
        return bool(config.OPENTRIPMAP_API_KEY)

    # ------------------------------------------------------------------
    def search_places(
        self,
        latitude: float,
        longitude: float,
        radius_m: int = 10000,
        kinds: str | None = None,
        max_results: int = 10,
    ) -> list[dict[str, Any]]:
        """Search POIs around a geo point (radius in meters)."""
        if not self.available:
            self.last_error = "OPENTRIPMAP_API_KEY missing"
            return []
        params: dict[str, Any] = {
            "radius": radius_m,
            "lon": longitude,
            "lat": latitude,
            "format": "json",
            "limit": max_results,
            "apikey": config.OPENTRIPMAP_API_KEY,
        }
        if kinds:
            params["kinds"] = kinds
        try:
            resp = self._session.get(f"{_BASE}/radius", params=params, timeout=15)
            resp.raise_for_status()
            places = resp.json()
            return _simplify_places(places, max_results)
        except requests.RequestException as exc:
            self.last_error = f"OpenTripMap error: {exc}"
            log.warning("OpenTripMap radius search failed: %s", self.last_error)
            return []

    # ------------------------------------------------------------------
    def place_details(self, xid: str) -> dict[str, Any] | None:
        """Fetch rich details (description, image, url) for one place."""
        if not self.available:
            self.last_error = "OPENTRIPMAP_API_KEY missing"
            return None
        try:
            resp = self._session.get(
                f"{_BASE}/xid/{xid}",
                params={"apikey": config.OPENTRIPMAP_API_KEY},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            extract = data.get("wikipedia_extracts", {}) or {}
            return {
                "xid": xid,
                "name": data.get("name", ""),
                "description": extract.get("text", "") or data.get("description", ""),
                "image": data.get("image", ""),
                "url": data.get("url", ""),
                "kinds": data.get("kinds", ""),
                "rate": data.get("rate", ""),
                "latitude": data.get("point", {}).get("lat"),
                "longitude": data.get("point", {}).get("lon"),
            }
        except requests.RequestException as exc:
            self.last_error = f"OpenTripMap error: {exc}"
            log.warning("OpenTripMap details failed: %s", self.last_error)
            return None

    # ------------------------------------------------------------------
    def search_activities(
        self,
        latitude: float,
        longitude: float,
        preferences: list[str] | None = None,
        radius_m: int = 10000,
        max_results: int = 8,
    ) -> list[dict[str, Any]]:
        """Search activities/POIs, optionally filtered by preference kinds."""
        kinds = None
        if preferences:
            matched = []
            for pref in preferences:
                matched.extend(KIND_FILTERS.get(pref.lower(), []))
            if matched:
                kinds = ",".join(matched)
        places = self.search_places(latitude, longitude, radius_m, kinds, max_results)
        # Enrich the top few with details (description + image).
        enriched = []
        for place in places[: max_results]:
            details = self.place_details(place["xid"]) or {}
            enriched.append({**place, **details})
        return enriched


# ---------------------------------------------------------------------------
def _simplify_places(places: list[dict], max_results: int) -> list[dict]:
    """Extract the fields we care about from radius-search results."""
    simplified: list[dict] = []
    for place in places:
        point = place.get("point", {})
        simplified.append(
            {
                "xid": place.get("xid", ""),
                "name": place.get("name", "Place"),
                "kinds": place.get("kinds", ""),
                "rate": place.get("rate", ""),
                "latitude": point.get("lat"),
                "longitude": point.get("lon"),
                "distance_m": place.get("dist", 0),
            }
        )
    return simplified[:max_results]