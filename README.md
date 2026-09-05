# AI Travel Assistant

A Streamlit-based AI travel planning assistant for the Travel Tech Hackathon.
Runs entirely on **localhost** — a single Python process, no separate backend.

## Stack

| Layer | Tech |
|---|---|
| UI | Streamlit (chat interface + sidebar trip-builder form) |
| Orchestration | LangGraph (deterministic state graph: router → agents → composer) |
| LLM | Groq (`llama-3.3-70b-versatile`) via LangChain — dual-key failover; Ollama fallback for offline dev |
| Flights + Hotels | Duffel API (`/air/offer_requests`, `/stays/search`) |
| POI / Activities | OpenTripMap (radius search + place details) |
| Weather | OpenWeather (current + 5-day forecast) |
| Tracing | LangSmith (automatic when `LANGCHAIN_TRACING_V2=true`) |
| State | `st.session_state` (no database needed for the MVP) |

## Folder structure

```
travel_assistant/
├── streamlit_app.py          # entry point
├── config.py                 # env vars + provider helpers
├── core/
│   ├── orchestrator.py       # LangGraph StateGraph (deterministic edges)
│   ├── state.py              # pydantic TripRequest + TripState
│   ├── router.py             # LLM structured-output extraction + rules merge
│   └── geo.py                # city/airport → IATA + lat/lng resolver
├── agents/
│   ├── flight_agent.py       # Duffel flight offers
│   ├── hotel_agent.py        # Duffel stays search
│   ├── activity_agent.py     # OpenTripMap POIs
│   ├── weather_agent.py      # OpenWeather current + forecast
│   └── itinerary_composer.py # day-by-day plan + budget estimate
├── clients/
│   ├── duffel_client.py      # flights + hotels (plain requests)
│   ├── opentripmap_client.py # POI radius search + details
│   ├── weather_client.py     # OpenWeather
│   └── llm_client.py         # Groq primary, Ollama fallback
├── ui/
│   ├── chat_panel.py         # chat + pipeline progress steps
│   ├── trip_sidebar.py       # trip-builder form
│   └── result_cards.py       # flight/hotel cards, timeline, weather, map
├── requirements.txt
└── .env.example
```

## Setup

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
streamlit run streamlit_app.py
```

### Required keys

| Env var | Service | Notes |
|---|---|---|
| `GROQ_API_KEY` | Groq LLM | Free tier; `GROQ_API_KEY_2` = optional failover key |
| `DUFFEL_ACCESS_TOKEN` | Duffel flights + hotels | Test token starts with `duffel_test_` |
| `OPENTRIPMAP_API_KEY` | OpenTripMap POIs | Free tier |
| `OPENWEATHER_API_KEY` | Weather | Free tier |

The app **degrades gracefully** — missing keys show friendly errors in the
pipeline details instead of crashing. Without Duffel keys, the built-in
city dictionary (`core/geo.py`) still resolves common cities for the demo.

### Optional

| Env var | Purpose |
|---|---|
| `OLLAMA_HOST` / `OLLAMA_MODEL` | Offline LLM fallback when no Groq key is set |
| `LANGCHAIN_TRACING_V2=true` + `LANGCHAIN_API_KEY` | LangSmith tracing of every graph node |

## How it works

1. **Input** — sidebar form *or* free text in chat.
2. **Router** — LLM structured output (pydantic `TripRequest`) extracts
   origin, destination, dates, budget, travelers, preferences; a regex
   parser fills any fields the model missed.
3. **Agents** — four nodes run in parallel: flight, hotel, activity, weather.
4. **Composer** — merges results into a day-by-day timeline and estimates
   the total cost against the budget.
5. **UI** — flight cards, hotel cards, weather strip, day-by-day plan, and a
   map of points of interest.

## Stretch goals (not in MVP)

- **Firebase Auth** — user accounts, saved trips, and social login.
- **Real payments** — Razorpay/Stripe checkout on a "Book this trip" button.
- **Separate FastAPI backend** — for multi-user persistence and background jobs.
- **Parallel agent fan-out tuning** — the graph already fans out; add
  per-agent retries and caching.
- **Live pricing** — Duffel order creation (offer → order) for real bookings.