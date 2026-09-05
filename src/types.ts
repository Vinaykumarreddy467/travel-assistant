export interface FlightOffer {
  id: string;
  airline: string;
  airline_name: string;
  flight_number: string;
  origin: string;
  origin_name: string;
  destination: string;
  destination_name: string;
  departure_at: string;
  arrival_at: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  is_return: boolean;
}

export interface HotelStay {
  hotel_id: string;
  search_result_id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  check_in: string;
  check_out: string;
  price: number;
  currency: string;
  rating: number;
  review_score: number;
  review_count: number;
  photo: string;
  amenities: string[];
}

export interface DayForecast {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city: string;
}

export interface Activity {
  xid: string;
  name: string;
  short_description: string;
  description: string;
  image: string;
  url: string;
  kinds: string;
  category: string;
  latitude: number;
  longitude: number;
  price: number;
  currency: string;
}

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

export interface TripRequest {
  origin: string;
  origin_name: string;
  destination: string;
  destination_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  travelers: number;
  preferences: string[];
  currency: string;
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

export interface ServiceStatus {
  duffel: boolean;
  openweather: boolean;
  opentripmap: boolean;
  groq: boolean;
  gemini: boolean;
  langchain?: boolean;
}
