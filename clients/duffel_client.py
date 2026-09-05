"""Duffel API client wrapper (flights + hotels) using plain `requests`.

Duffel is a REST + JSON API at https://api.duffel.com. Auth is a single
Bearer token (`DUFFEL_ACCESS_TOKEN`). Test tokens (prefix `duffel_test_`)
hit the sandbox: flights come from "Duffel Airways" and stays from the
dedicated Test Hotels (search near lat -24.38, lng -128.32).

Flights flow:  POST /air/offer_requests  ->  offers (search results)
Hotels flow:   POST /stays/search        ->  results with cheapest rate

All methods return plain dicts/lists and degrade to `None` / `[]` on missing
credentials or API errors, with a human-readable message in `last_error`.
"""
from __future__ import annotations

import logging
from typing import Any

import requests

import config

log = logging.getLogger(__name__)

# Duffel's dedicated test hotels live near this point in the sandbox.
TEST_HOTELS_LAT = -24.38
TEST_HOTELS_LNG = -128.32


class DuffelClient:
    """Thin wrapper around the Duffel REST API with graceful degradation."""

    def __init__(self) -> None:
        self.last_error: str | None = None
        self._session = requests.Session()

    # ------------------------------------------------------------------
    @property
    def available(self) -> bool:
        return bool(config.DUFFEL_ACCESS_TOKEN)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {config.DUFFEL_ACCESS_TOKEN}",
            "Duffel-Version": config.DUFFEL_VERSION,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _post(self, path: str, payload: dict) -> dict | None:
        """POST to the Duffel API; returns the `data` envelope or None."""
        try:
            resp = self._session.post(
                f"{config.DUFFEL_API_URL}{path}",
                json={"data": payload},
                headers=self._headers(),
                timeout=30,
            )
            if resp.status_code >= 400:
                self.last_error = _friendly_error(resp)
                log.warning("Duffel %s failed: %s", path, self.last_error)
                return None
            return resp.json().get("data", {})
        except requests.RequestException as exc:
            self.last_error = f"Duffel network error: {exc}"
            log.warning("Duffel %s failed: %s", path, self.last_error)
            return None

    # ------------------------------------------------------------------
    # Flights
    # ------------------------------------------------------------------
    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: str | None = None,
        adults: int = 1,
        cabin_class: str = "economy",
        max_results: int = 5,
    ) -> list[dict[str, Any]]:
        """Search flight offers via POST /air/offer_requests."""
        if not self.available:
            self.last_error = "DUFFEL_ACCESS_TOKEN missing"
            return []
        slices = [
            {
                "origin": origin,
                "destination": destination,
                "departure_date": departure_date,
            }
        ]
        if return_date:
            slices.append(
                {
                    "origin": destination,
                    "destination": origin,
                    "departure_date": return_date,
                }
            )
        payload = {
            "slices": slices,
            "passengers": [{"type": "adult"}] * max(1, adults),
            "cabin_class": cabin_class,
        }
        data = self._post("/air/offer_requests", payload)
        if not data:
            return []
        offers = data.get("offers", [])
        return _simplify_flights(offers, max_results)

    # ------------------------------------------------------------------
    # Hotels
    # ------------------------------------------------------------------
    def search_hotels(
        self,
        latitude: float,
        longitude: float,
        check_in: str,
        check_out: str,
        adults: int = 1,
        rooms: int = 1,
        radius_km: int = 5,
        max_results: int = 5,
    ) -> list[dict[str, Any]]:
        """Search stays via POST /stays/search (returns cheapest rate each)."""
        if not self.available:
            self.last_error = "DUFFEL_ACCESS_TOKEN missing"
            return []
        payload = {
            "check_in_date": check_in,
            "check_out_date": check_out,
            "location": {
                "radius": radius_km,
                "geographic_coordinates": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
            },
            "guests": [{"type": "adult"}] * max(1, adults),
            "rooms": max(1, rooms),
        }
        data = self._post("/stays/search", payload)
        if not data:
            return []
        results = data.get("results", [])
        return _simplify_hotels(results, max_results)


# ---------------------------------------------------------------------------
# Response simplification helpers
# ---------------------------------------------------------------------------
def _simplify_flights(offers: list[dict], max_results: int) -> list[dict]:
    """Extract the fields we care about from Duffel flight offers."""
    simplified: list[dict] = []
    for offer in offers:
        slices = offer.get("slices", [])
        if not slices:
            continue
        outbound = slices[0]
        segments = outbound.get("segments", [])
        if not segments:
            continue
        first = segments[0]
        last = segments[-1]
        owner = offer.get("owner", {})
        simplified.append(
            {
                "id": offer.get("id", ""),
                "airline": owner.get("iata_code", ""),
                "airline_name": owner.get("name", ""),
                "flight_number": f"{first.get('operating_carrier_flight_number', '')}".strip(),
                "origin": first.get("origin", {}).get("iata_code", ""),
                "origin_name": first.get("origin", {}).get("name", ""),
                "destination": last.get("destination", {}).get("iata_code", ""),
                "destination_name": last.get("destination", {}).get("name", ""),
                "departure_at": first.get("departing_at", ""),
                "arrival_at": last.get("arriving_at", ""),
                "duration": outbound.get("duration", ""),
                "stops": len(segments) - 1,
                "price": float(offer.get("total_amount", 0) or 0),
                "currency": offer.get("total_currency", "USD"),
                "is_return": len(slices) > 1,
            }
        )
    return simplified[:max_results]


def _simplify_hotels(results: list[dict], max_results: int) -> list[dict]:
    """Extract the fields we care about from Duffel stays search results."""
    simplified: list[dict] = []
    for result in results:
        location = result.get("location", {})
        geo = location.get("geographic_coordinates", {})
        address = location.get("address", {})
        photos = result.get("photos", [])
        simplified.append(
            {
                "hotel_id": result.get("id", ""),
                "search_result_id": result.get("id", ""),
                "name": result.get("name", "Hotel"),
                "description": result.get("description", ""),
                "city": address.get("city_name", ""),
                "country": address.get("country_code", ""),
                "latitude": geo.get("latitude"),
                "longitude": geo.get("longitude"),
                "check_in": result.get("check_in_date", ""),
                "check_out": result.get("check_out_date", ""),
                "price": float(result.get("cheapest_rate_total_amount", 0) or 0),
                "currency": result.get("cheapest_rate_currency", "USD"),
                "rating": result.get("rating"),
                "review_score": result.get("review_score"),
                "review_count": result.get("review_count"),
                "photo": photos[0].get("url", "") if photos else "",
                "amenities": [a.get("type", "") for a in result.get("amenities", [])][:6],
            }
        )
    return simplified[:max_results]


def _friendly_error(resp: requests.Response) -> str:
    """Turn a Duffel error response into a short, human-readable message."""
    try:
        body = resp.json()
        errors = body.get("errors", [])
        if errors:
            err = errors[0]
            title = err.get("title", "API error")
            detail = err.get("detail", "")
            return f"Duffel API error ({title}): {detail}".strip()
    except Exception:  # noqa: BLE001 - never let error formatting crash
        pass
    return f"Duffel API error: HTTP {resp.status_code}"