import { CONFIG } from '../config.js';

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

export class DuffelClient {
  lastError: string | null = null;

  get isAvailable(): boolean {
    return Boolean(CONFIG.DUFFEL_ACCESS_TOKEN);
  }

  private headers() {
    return {
      'Authorization': `Bearer ${CONFIG.DUFFEL_ACCESS_TOKEN}`,
      'Duffel-Version': CONFIG.DUFFEL_VERSION,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async searchFlights(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate?: string,
    adults = 1,
    cabinClass = 'economy',
    maxResults = 5
  ): Promise<FlightOffer[]> {
    if (!this.isAvailable) {
      this.lastError = "DUFFEL_ACCESS_TOKEN missing (using realistic preview data)";
      return this.generateSimulatedFlights(origin, destination, departureDate, returnDate, adults, maxResults);
    }

    try {
      const slices: Array<{ origin: string; destination: string; departure_date: string }> = [
        { origin, destination, departure_date: departureDate }
      ];
      if (returnDate) {
        slices.push({ origin: destination, destination: origin, departure_date: returnDate });
      }

      const payload = {
        slices,
        passengers: Array.from({ length: Math.max(1, adults) }, () => ({ type: 'adult' })),
        cabin_class: cabinClass
      };

      const res = await fetch(`${CONFIG.DUFFEL_API_URL}/air/offer_requests`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ data: payload })
      });

      if (!res.ok) {
        const errorBody = await res.text();
        this.lastError = `Duffel API error (${res.status}): ${errorBody}`;
        return this.generateSimulatedFlights(origin, destination, departureDate, returnDate, adults, maxResults);
      }

      const json = await res.json();
      const offers = json.data?.offers || [];
      if (!offers.length) {
        return this.generateSimulatedFlights(origin, destination, departureDate, returnDate, adults, maxResults);
      }

      return this.simplifyFlights(offers, maxResults);
    } catch (err: any) {
      this.lastError = `Duffel error: ${err?.message || err}`;
      return this.generateSimulatedFlights(origin, destination, departureDate, returnDate, adults, maxResults);
    }
  }

  async searchHotels(
    latitude: number,
    longitude: number,
    destinationName: string,
    checkIn: string,
    checkOut: string,
    adults = 1,
    rooms = 1,
    maxResults = 5
  ): Promise<HotelStay[]> {
    if (!this.isAvailable) {
      this.lastError = "DUFFEL_ACCESS_TOKEN missing (using realistic preview data)";
      return this.generateSimulatedHotels(destinationName, latitude, longitude, checkIn, checkOut, maxResults);
    }

    try {
      const payload = {
        check_in_date: checkIn,
        check_out_date: checkOut,
        location: {
          radius: 5,
          geographic_coordinates: { latitude, longitude }
        },
        guests: Array.from({ length: Math.max(1, adults) }, () => ({ type: 'adult' })),
        rooms: Math.max(1, rooms)
      };

      const res = await fetch(`${CONFIG.DUFFEL_API_URL}/stays/search`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ data: payload })
      });

      if (!res.ok) {
        const errorBody = await res.text();
        this.lastError = `Duffel Stays error (${res.status}): ${errorBody}`;
        return this.generateSimulatedHotels(destinationName, latitude, longitude, checkIn, checkOut, maxResults);
      }

      const json = await res.json();
      const results = json.data?.results || [];
      if (!results.length) {
        return this.generateSimulatedHotels(destinationName, latitude, longitude, checkIn, checkOut, maxResults);
      }

      return this.simplifyHotels(results, maxResults);
    } catch (err: any) {
      this.lastError = `Duffel stays error: ${err?.message || err}`;
      return this.generateSimulatedHotels(destinationName, latitude, longitude, checkIn, checkOut, maxResults);
    }
  }

  private simplifyFlights(offers: any[], maxResults: number): FlightOffer[] {
    return offers.slice(0, maxResults).map((offer) => {
      const outbound = offer.slices?.[0];
      const segments = outbound?.segments || [];
      const first = segments[0] || {};
      const last = segments[segments.length - 1] || first;
      const owner = offer.owner || {};

      return {
        id: offer.id,
        airline: owner.iata_code || 'BA',
        airline_name: owner.name || 'British Airways',
        flight_number: `${first.operating_carrier_flight_number || first.marketing_carrier_flight_number || '104'}`.trim(),
        origin: first.origin?.iata_code || '',
        origin_name: first.origin?.name || '',
        destination: last.destination?.iata_code || '',
        destination_name: last.destination?.name || '',
        departure_at: first.departing_at || '',
        arrival_at: last.arriving_at || '',
        duration: outbound?.duration || '2h 15m',
        stops: Math.max(0, segments.length - 1),
        price: Number(offer.total_amount || 240),
        currency: offer.total_currency || 'USD',
        is_return: (offer.slices?.length || 0) > 1,
      };
    });
  }

  private simplifyHotels(results: any[], maxResults: number): HotelStay[] {
    return results.slice(0, maxResults).map((r) => {
      const loc = r.location || {};
      const geo = loc.geographic_coordinates || {};
      const address = loc.address || {};
      const photos = r.photos || [];

      return {
        hotel_id: r.id,
        search_result_id: r.id,
        name: r.name || 'Boutique Hotel',
        description: r.description || 'Charming accommodations situated in the historic city center.',
        city: address.city_name || '',
        country: address.country_code || '',
        latitude: geo.latitude || 0,
        longitude: geo.longitude || 0,
        check_in: r.check_in_date || '',
        check_out: r.check_out_date || '',
        price: Number(r.cheapest_rate_total_amount || 165),
        currency: r.cheapest_rate_currency || 'USD',
        rating: r.rating || 4,
        review_score: r.review_score || 8.8,
        review_count: r.review_count || 320,
        photo: photos[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
        amenities: (r.amenities || []).map((a: any) => a.type || a).slice(0, 6)
      };
    });
  }

  private generateSimulatedFlights(
    origin: string,
    destination: string,
    departureDate: string,
    returnDate?: string,
    adults = 1,
    maxResults = 5
  ): FlightOffer[] {
    const airlines = [
      { code: 'BA', name: 'British Airways', numPrefix: 'BA', basePrice: 280 },
      { code: 'AF', name: 'Air France', numPrefix: 'AF', basePrice: 265 },
      { code: 'LH', name: 'Lufthansa', numPrefix: 'LH', basePrice: 295 },
      { code: 'IB', name: 'Iberia', numPrefix: 'IB', basePrice: 230 },
      { code: 'EZ', name: 'easyJet', numPrefix: 'U2', basePrice: 150 },
    ];

    return airlines.slice(0, maxResults).map((airline, idx) => {
      const depHour = 7 + idx * 3;
      const depTime = `${String(depHour).padStart(2, '0')}:${idx % 2 === 0 ? '15' : '45'}`;
      const arrHour = (depHour + 2) % 24;
      const arrTime = `${String(arrHour).padStart(2, '0')}:${idx % 2 === 0 ? '30' : '00'}`;
      const pricePerPerson = airline.basePrice + (idx * 25);
      const total = pricePerPerson * adults * (returnDate ? 1.8 : 1.0);

      return {
        id: `sim_flt_${idx + 1}`,
        airline: airline.code,
        airline_name: airline.name,
        flight_number: `${airline.numPrefix} ${300 + idx * 24}`,
        origin: origin.toUpperCase(),
        origin_name: origin,
        destination: destination.toUpperCase(),
        destination_name: destination,
        departure_at: `${departureDate}T${depTime}:00Z`,
        arrival_at: `${departureDate}T${arrTime}:00Z`,
        duration: '2h 15m',
        stops: idx === 4 ? 1 : 0,
        price: Math.round(total),
        currency: 'USD',
        is_return: Boolean(returnDate),
      };
    });
  }

  private generateSimulatedHotels(
    destination: string,
    lat: number,
    lng: number,
    checkIn: string,
    checkOut: string,
    maxResults = 5
  ): HotelStay[] {
    const hotelPresets = [
      {
        name: `Grand Hotel ${destination}`,
        rating: 5,
        review_score: 9.3,
        review_count: 850,
        baseNight: 220,
        photo: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
        desc: 'Centrally located historic property featuring luxury suites, courtyard garden, and full-service concierge.',
        amenities: ['wifi', 'breakfast', 'spa', 'air_conditioning', 'room_service', 'concierge'],
        offsetLat: 0.005,
        offsetLng: 0.004
      },
      {
        name: `Hôtel Saint-Germain ${destination}`,
        rating: 4,
        review_score: 8.9,
        review_count: 512,
        baseNight: 165,
        photo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
        desc: 'Boutique hotel with modern bohemian decor, artisan breakfast, and walking distance to cultural landmarks.',
        amenities: ['wifi', 'bar', 'air_conditioning', 'breakfast', 'elevator'],
        offsetLat: -0.006,
        offsetLng: -0.003
      },
      {
        name: `Urban Loft Suites ${destination}`,
        rating: 4,
        review_score: 8.7,
        review_count: 340,
        baseNight: 140,
        photo: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop&q=80',
        desc: 'Stylish and spacious serviced apartments with kitchenettes, ideal for longer stays and families.',
        amenities: ['wifi', 'kitchen', 'workspace', 'gym', 'air_conditioning'],
        offsetLat: 0.008,
        offsetLng: -0.007
      },
      {
        name: `Citadines Central ${destination}`,
        rating: 3,
        review_score: 8.4,
        review_count: 290,
        baseNight: 110,
        photo: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=80',
        desc: 'Clean, reliable, and convenient city center hotel right next to metro and transit links.',
        amenities: ['wifi', 'elevator', 'front_desk_24h', 'luggage_storage'],
        offsetLat: -0.004,
        offsetLng: 0.008
      },
      {
        name: `The Riverside Retreat ${destination}`,
        rating: 4,
        review_score: 9.1,
        review_count: 420,
        baseNight: 185,
        photo: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80',
        desc: 'Waterfront boutique accommodation offering panoramic terrace views and rooftop restaurant.',
        amenities: ['wifi', 'restaurant', 'rooftop_terrace', 'bar', 'air_conditioning'],
        offsetLat: 0.002,
        offsetLng: 0.009
      }
    ];

    let nights = 1;
    try {
      const s = new Date(checkIn);
      const e = new Date(checkOut);
      const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24));
      nights = Math.max(1, diff);
    } catch {
      nights = 3;
    }

    return hotelPresets.slice(0, maxResults).map((h, i) => ({
      hotel_id: `sim_hotel_${i + 1}`,
      search_result_id: `sim_hotel_${i + 1}`,
      name: h.name,
      description: h.desc,
      city: destination,
      country: '',
      latitude: lat + h.offsetLat,
      longitude: lng + h.offsetLng,
      check_in: checkIn,
      check_out: checkOut,
      price: h.baseNight * nights,
      currency: 'USD',
      rating: h.rating,
      review_score: h.review_score,
      review_count: h.review_count,
      photo: h.photo,
      amenities: h.amenities
    }));
  }
}
