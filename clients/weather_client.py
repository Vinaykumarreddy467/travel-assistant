"""OpenWeather client wrapper (Current Weather + 5-day forecast, free tier).

Uses plain `requests` against the OpenWeather API. All methods return plain
dicts and degrade to `None` / `[]` when the API key is missing or the request
fails, with a human-readable message in `last_error`.
"""
from __future__ import annotations

import logging
from typing import Any

import requests

import config

log = logging.getLogger(__name__)

_BASE = "https://api.openweathermap.org/data/2.5"


class WeatherClient:
    """Thin wrapper around OpenWeather current + forecast endpoints."""

    def __init__(self) -> None:
        self.last_error: str | None = None

    @property
    def available(self) -> bool:
        return bool(config.OPENWEATHER_API_KEY)

    # ------------------------------------------------------------------
    def current(self, lat: float, lon: float, units: str = "metric") -> dict[str, Any] | None:
        """Current weather for a geo point."""
        if not self.available:
            self.last_error = "OpenWeather API key missing"
            return None
        try:
            resp = requests.get(
                f"{_BASE}/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": config.OPENWEATHER_API_KEY,
                    "units": units,
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "temp": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "description": data["weather"][0]["description"].capitalize(),
                "icon": data["weather"][0]["icon"],
                "wind_speed": data["wind"]["speed"],
                "city": data.get("name", ""),
            }
        except requests.RequestException as exc:
            self.last_error = f"OpenWeather error: {exc}"
            log.warning("OpenWeather current failed: %s", self.last_error)
            return None

    # ------------------------------------------------------------------
    def forecast(
        self, lat: float, lon: float, units: str = "metric", days: int = 5
    ) -> list[dict[str, Any]]:
        """5-day / 3-hour forecast, collapsed into one entry per day."""
        if not self.available:
            self.last_error = "OpenWeather API key missing"
            return []
        try:
            resp = requests.get(
                f"{_BASE}/forecast",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": config.OPENWEATHER_API_KEY,
                    "units": units,
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            return _collapse_daily(data.get("list", []), days)
        except requests.RequestException as exc:
            self.last_error = f"OpenWeather error: {exc}"
            log.warning("OpenWeather forecast failed: %s", self.last_error)
            return []


# ---------------------------------------------------------------------------
def _collapse_daily(entries: list[dict], days: int) -> list[dict]:
    """Collapse 3-hourly forecast entries into one summary per calendar day."""
    by_day: dict[str, list[dict]] = {}
    for entry in entries:
        day = entry["dt_txt"][:10]
        by_day.setdefault(day, []).append(entry)

    daily: list[dict] = []
    for day in sorted(by_day)[:days]:
        entries = by_day[day]
        temps = [e["main"]["temp"] for e in entries]
        daily.append(
            {
                "date": day,
                "temp_min": round(min(temps), 1),
                "temp_max": round(max(temps), 1),
                "description": entries[len(entries) // 2]["weather"][0][
                    "description"
                ].capitalize(),
                "icon": entries[len(entries) // 2]["weather"][0]["icon"],
                "humidity": entries[len(entries) // 2]["main"]["humidity"],
                "wind_speed": entries[len(entries) // 2]["wind"]["speed"],
            }
        )
    return daily