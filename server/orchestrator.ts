import { resolveCity } from './geo.js';
import { TripRequest } from './router.js';
import { DuffelClient, FlightOffer, HotelStay } from './clients/duffel.js';
import { WeatherClient, CurrentWeather, DayForecast } from './clients/weather.js';
import { OpenTripMapClient, Activity } from './clients/opentripmap.js';

export interface DaySchedule {
  day: number;
  date: string;
  weather?: DayForecast;
  morning?: Activity;
  afternoon?: Activity;
  evening?: Activity;
  activities: Activity[];
}

export interface ComposedItinerary {
  destination: string;
  destination_name: string;
  origin: string;
  origin_name: string;
  start_date: string;
  end_date: string;
  days: number;
  travelers: number;
  budget: number;
  currency: string;
  best_flight: FlightOffer | null;
  best_hotel: HotelStay | null;
  timeline: DaySchedule[];
  estimated_total: number;
  within_budget: boolean;
  cost_breakdown: {
    flight_total: number;
    hotel_total: number;
    activities_total: number;
    food_and_incidentals: number;
  };
  current_weather: CurrentWeather | null;
  preferences: string[];
}

export interface PipelineResult {
  request: TripRequest;
  flights: FlightOffer[];
  hotels: HotelStay[];
  activities: Activity[];
  weather: DayForecast[];
  current_weather: CurrentWeather | null;
  itinerary: ComposedItinerary;
  errors: string[];
  notes: string[];
}

export async function runPipeline(request: TripRequest): Promise<PipelineResult> {
  const errors: string[] = [];
  const notes: string[] = [];

  const destCity = resolveCity(request.destination) || resolveCity(request.destination_name) || {
    iata: request.destination.toUpperCase(),
    name: request.destination_name || request.destination,
    lat: 48.8566,
    lng: 2.3522,
    country: ''
  };

  const originCity = resolveCity(request.origin) || resolveCity(request.origin_name) || {
    iata: request.origin.toUpperCase(),
    name: request.origin_name || request.origin,
    lat: 51.5074,
    lng: -0.1278,
    country: ''
  };

  const duffelClient = new DuffelClient();
  const weatherClient = new WeatherClient();
  const otmClient = new OpenTripMapClient();

  // Run 4 agents in parallel
  const [flights, hotels, activities, weatherCurrent, weatherForecast] = await Promise.all([
    duffelClient.searchFlights(
      originCity.iata,
      destCity.iata,
      request.start_date,
      request.end_date,
      request.travelers,
      'economy',
      5
    ),
    duffelClient.searchHotels(
      destCity.lat,
      destCity.lng,
      destCity.name || request.destination,
      request.start_date,
      request.end_date || request.start_date,
      request.travelers,
      1,
      5
    ),
    otmClient.searchActivities(
      destCity.name || request.destination,
      destCity.lat,
      destCity.lng,
      request.preferences,
      8
    ),
    weatherClient.current(destCity.lat, destCity.lng),
    weatherClient.forecast(destCity.lat, destCity.lng, 'metric', 5)
  ]);

  if (duffelClient.lastError) notes.push(duffelClient.lastError);
  if (weatherClient.lastError) notes.push(weatherClient.lastError);
  if (otmClient.lastError) notes.push(otmClient.lastError);

  // Itinerary Composer
  const days = calculateTripDays(request.start_date, request.end_date);
  const bestFlight = flights.length > 0 ? [...flights].sort((a, b) => a.price - b.price)[0] : null;
  const bestHotel = hotels.length > 0 ? [...hotels].sort((a, b) => a.price - b.price)[0] : null;

  const weatherByDate: Record<string, DayForecast> = {};
  for (const w of weatherForecast) {
    weatherByDate[w.date] = w;
  }

  // Distribute activities across days
  const distributed = distributeActivities(activities, days);

  const timeline: DaySchedule[] = [];
  let totalActivityCost = 0;

  for (let i = 0; i < days; i++) {
    const dayDate = getDateOffset(request.start_date, i);
    const dayActs = distributed[i] || [];
    const dayWeather = weatherByDate[dayDate] || weatherForecast[i % Math.max(1, weatherForecast.length)];

    dayActs.forEach(a => {
      totalActivityCost += (a.price || 0);
    });

    timeline.push({
      day: i + 1,
      date: dayDate,
      weather: dayWeather,
      morning: dayActs[0],
      afternoon: dayActs[1],
      evening: dayActs[2],
      activities: dayActs,
    });
  }

  const flightTotal = bestFlight ? bestFlight.price : 0;
  const hotelTotal = bestHotel ? bestHotel.price : 0;
  const dailyIncidentals = 50 * request.travelers * days;
  const estimatedTotal = flightTotal + hotelTotal + totalActivityCost + dailyIncidentals;
  const budget = request.budget || 0;
  const withinBudget = budget <= 0 || estimatedTotal <= budget;

  if (bestFlight) {
    notes.push(`Selected flight: ${bestFlight.airline_name} (${bestFlight.flight_number}) for $${bestFlight.price.toLocaleString()} ${bestFlight.currency}.`);
  }
  if (bestHotel) {
    notes.push(`Selected stay: ${bestHotel.name} (rated ${bestHotel.review_score}/10) for $${bestHotel.price.toLocaleString()} total.`);
  }
  if (budget > 0) {
    const diff = Math.abs(budget - estimatedTotal);
    if (withinBudget) {
      notes.push(`Trip estimate is $${diff.toLocaleString()} under your $${budget.toLocaleString()} target budget.`);
    } else {
      notes.push(`Trip estimate exceeds target budget by $${diff.toLocaleString()}. Consider alternative accommodations or dates.`);
    }
  }

  const itinerary: ComposedItinerary = {
    destination: destCity.iata,
    destination_name: destCity.name || request.destination_name || request.destination,
    origin: originCity.iata,
    origin_name: originCity.name || request.origin_name || request.origin,
    start_date: request.start_date,
    end_date: request.end_date,
    days,
    travelers: request.travelers,
    budget,
    currency: request.currency || 'USD',
    best_flight: bestFlight,
    best_hotel: bestHotel,
    timeline,
    estimated_total: Math.round(estimatedTotal),
    within_budget: withinBudget,
    cost_breakdown: {
      flight_total: Math.round(flightTotal),
      hotel_total: Math.round(hotelTotal),
      activities_total: Math.round(totalActivityCost),
      food_and_incidentals: Math.round(dailyIncidentals)
    },
    current_weather: weatherCurrent,
    preferences: request.preferences
  };

  return {
    request,
    flights,
    hotels,
    activities,
    weather: weatherForecast,
    current_weather: weatherCurrent,
    itinerary,
    errors,
    notes
  };
}

function calculateTripDays(startStr: string, endStr?: string): number {
  try {
    const s = new Date(startStr);
    if (endStr) {
      const e = new Date(endStr);
      const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24));
      return Math.max(1, diff + 1);
    }
    return 3;
  } catch {
    return 3;
  }
}

function getDateOffset(startStr: string, offsetDays: number): string {
  try {
    const d = new Date(startStr);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  } catch {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }
}

function distributeActivities(activities: Activity[], days: number): Activity[][] {
  const perDay: Activity[][] = Array.from({ length: days }, () => []);
  if (!activities.length) return perDay;

  activities.forEach((act, idx) => {
    let dayIdx = idx % days;
    if (perDay[dayIdx].length >= 2) {
      for (let d = 0; d < days; d++) {
        if (perDay[d].length < 2) {
          dayIdx = d;
          break;
        }
      }
    }
    perDay[dayIdx].push(act);
  });

  return perDay;
}
