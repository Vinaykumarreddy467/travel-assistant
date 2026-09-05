import React, { useState } from 'react';
import {
  Plane, Hotel, CloudSun, Calendar, MapPin, DollarSign,
  CheckCircle2, AlertTriangle, ExternalLink, Star, Compass,
  Info, Clock, ArrowRight, ShieldCheck
} from 'lucide-react';
import { PipelineResult, Activity } from '../types';

interface ResultCardsProps {
  data: PipelineResult;
}

export const ResultCards: React.FC<ResultCardsProps> = ({ data }) => {
  const { itinerary, flights, hotels, activities, weather, current_weather, notes } = data;
  const [activeTab, setActiveTab] = useState<'itinerary' | 'flights' | 'hotels' | 'attractions' | 'map'>('itinerary');
  const [selectedDay, setSelectedDay] = useState<number>(1);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="trip-results-container" className="space-y-6">
      {/* 1. Trip Header Overview Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              <span>Trip Itinerary</span>
              <span>•</span>
              <span>{itinerary.days} Days / {Math.max(1, itinerary.days - 1)} Nights</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 flex items-center">
              {itinerary.origin_name || itinerary.origin}
              <ArrowRight className="w-5 h-5 mx-2.5 text-stone-400" />
              {itinerary.destination_name || itinerary.destination}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {formatDate(itinerary.start_date)} — {formatDate(itinerary.end_date)} · {itinerary.travelers} {itinerary.travelers === 1 ? 'Traveler' : 'Travelers'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl px-4 py-2.5 text-right sm:text-left">
              <span className="text-xs text-stone-500 block">Estimated Total</span>
              <span className="text-xl font-bold text-stone-900">
                ${itinerary.estimated_total.toLocaleString()} {itinerary.currency}
              </span>
            </div>

            {itinerary.budget > 0 && (
              <div className={`rounded-xl px-3.5 py-2.5 border flex items-center space-x-2 text-xs font-medium ${
                itinerary.within_budget
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                {itinerary.within_budget ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">Within Budget</p>
                      <p className="text-[11px] text-emerald-700">${(itinerary.budget - itinerary.estimated_total).toLocaleString()} buffer</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Exceeds Budget</p>
                      <p className="text-[11px] text-amber-700">+${(itinerary.estimated_total - itinerary.budget).toLocaleString()} over ${itinerary.budget.toLocaleString()}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Weather Strip */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center">
              <CloudSun className="w-4 h-4 mr-1.5 text-amber-600" />
              Destination Weather Forecast
            </span>
            {current_weather && (
              <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                Current: {current_weather.temp}°C · {current_weather.description} (feels like {current_weather.feels_like}°C)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {weather.map((day, i) => (
              <div key={i} className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/70 text-center">
                <span className="text-xs font-medium text-stone-600 block">{formatDate(day.date)}</span>
                <span className="text-lg font-bold text-stone-900 block my-0.5">
                  {day.temp_max}° <span className="text-xs text-stone-400 font-normal">/ {day.temp_min}°</span>
                </span>
                <span className="text-[11px] text-stone-500 block truncate" title={day.description}>
                  {day.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-stone-200 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`pb-3 px-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'itinerary'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Calendar className="w-4 h-4 inline-block mr-1.5" />
          Day-by-Day Timeline ({itinerary.timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('flights')}
          className={`pb-3 px-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'flights'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Plane className="w-4 h-4 inline-block mr-1.5" />
          Flight Offers ({flights.length})
        </button>

        <button
          onClick={() => setActiveTab('hotels')}
          className={`pb-3 px-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'hotels'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Hotel className="w-4 h-4 inline-block mr-1.5" />
          Accommodations ({hotels.length})
        </button>

        <button
          onClick={() => setActiveTab('attractions')}
          className={`pb-3 px-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'attractions'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <Compass className="w-4 h-4 inline-block mr-1.5" />
          Attractions & POIs ({activities.length})
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`pb-3 px-3 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'map'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
          }`}
        >
          <MapPin className="w-4 h-4 inline-block mr-1.5" />
          Location Map
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* Tab: Day-by-Day Timeline */}
      {activeTab === 'itinerary' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {itinerary.timeline.map(day => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all shrink-0 ${
                  selectedDay === day.day
                    ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                Day {day.day} · {formatDate(day.date)}
              </button>
            ))}
          </div>

          {itinerary.timeline.filter(d => d.day === selectedDay).map(day => (
            <div key={day.day} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Day {day.day} Schedule</span>
                  <h3 className="text-lg font-semibold text-stone-900">{formatDate(day.date)}</h3>
                </div>
                {day.weather && (
                  <div className="text-right text-xs bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80">
                    <span className="font-semibold text-stone-800">{day.weather.temp_max}° / {day.weather.temp_min}°C</span>
                    <span className="text-stone-500 block truncate">{day.weather.description}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {day.morning && (
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Morning
                      </span>
                      <span className="text-xs font-semibold text-stone-700">
                        {day.morning.price ? `$${day.morning.price} USD` : 'Free Admission'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm">{day.morning.name}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{day.morning.short_description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-stone-600 border border-stone-200">
                        {day.morning.category}
                      </span>
                    </div>
                  </div>
                )}

                {day.afternoon && (
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Afternoon
                      </span>
                      <span className="text-xs font-semibold text-stone-700">
                        {day.afternoon.price ? `$${day.afternoon.price} USD` : 'Free Admission'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm">{day.afternoon.name}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{day.afternoon.short_description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-stone-600 border border-stone-200">
                        {day.afternoon.category}
                      </span>
                    </div>
                  </div>
                )}

                {day.evening && (
                  <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Evening
                      </span>
                      <span className="text-xs font-semibold text-stone-700">
                        {day.evening.price ? `$${day.evening.price} USD` : 'Free Admission'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-stone-900 text-sm">{day.evening.name}</h4>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{day.evening.short_description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white text-stone-600 border border-stone-200">
                        {day.evening.category}
                      </span>
                    </div>
                  </div>
                )}

                {!day.morning && !day.afternoon && !day.evening && (
                  <p className="text-sm text-stone-500 py-4 text-center">
                    Free leisure day — explore local cafes, squares, and neighborhood shops at your own pace.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Flights */}
      {activeTab === 'flights' && (
        <div className="space-y-3">
          {flights.map((flight, idx) => {
            const isBest = itinerary.best_flight?.id === flight.id;
            return (
              <div
                key={flight.id || idx}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                  isBest ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-stone-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-stone-900 text-base">
                        {flight.airline_name}
                      </span>
                      <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        Flight {flight.flight_number}
                      </span>
                      {isBest && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          Best Value
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-stone-600">
                      <div>
                        <span className="font-semibold text-stone-800">{formatTime(flight.departure_at)}</span>
                        <span className="text-xs text-stone-400 block">{flight.origin}</span>
                      </div>
                      <div className="text-center text-xs text-stone-400 px-2 border-b border-stone-200 pb-1">
                        <span>{flight.duration}</span>
                        <span className="block text-[10px] text-stone-500">
                          {flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop`}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-800">{formatTime(flight.arrival_at)}</span>
                        <span className="text-xs text-stone-400 block">{flight.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-stone-100 sm:pl-6">
                    <span className="text-2xl font-bold text-stone-900 block">
                      ${flight.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-stone-500 block mb-2">
                      Total ({itinerary.travelers} {itinerary.travelers === 1 ? 'traveler' : 'travelers'})
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Selected flight offer ${flight.flight_number} with ${flight.airline_name}.`)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 transition-colors"
                    >
                      Select Flight
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Hotels */}
      {activeTab === 'hotels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hotels.map((hotel, idx) => {
            const isBest = itinerary.best_hotel?.hotel_id === hotel.hotel_id;
            return (
              <div
                key={hotel.hotel_id || idx}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between ${
                  isBest ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-stone-200'
                }`}
              >
                <div>
                  <div className="h-44 w-full bg-stone-200 relative overflow-hidden">
                    <img
                      src={hotel.photo}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    {isBest && (
                      <span className="absolute top-3 left-3 text-xs font-bold text-white bg-amber-600 px-2.5 py-1 rounded-md shadow-xs">
                        Top Recommendation
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 text-xs font-bold text-stone-900 bg-white/95 px-2 py-0.5 rounded-md shadow-xs flex items-center">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                      {hotel.review_score}/10
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-stone-900 text-base">{hotel.name}</h3>
                    <p className="text-xs text-stone-500 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400 shrink-0" />
                      {hotel.city}
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">{hotel.description}</p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {hotel.amenities.map(a => (
                        <span key={a} className="text-[10px] text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md capitalize">
                          {a.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-xs text-stone-400 block">Total Stay</span>
                    <span className="text-xl font-bold text-stone-900">${hotel.price.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Selected stay at ${hotel.name}.`)}
                    className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 transition-colors"
                  >
                    Select Room
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Attractions */}
      {activeTab === 'attractions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((act, idx) => (
            <div key={act.xid || idx} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                {act.image && (
                  <div className="h-36 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={act.image}
                      alt={act.name}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-4 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                    {act.category}
                  </span>
                  <h4 className="font-semibold text-stone-900 text-sm">{act.name}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                    {act.short_description || act.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-stone-100 flex items-center justify-between mt-2">
                <span className="text-xs font-semibold text-stone-700">
                  {act.price ? `$${act.price} USD` : 'Free entry'}
                </span>
                <span className="text-[11px] text-stone-400">
                  📍 {act.latitude.toFixed(2)}, {act.longitude.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Location Map */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-stone-900">Destination Coordinate Map</h3>
              <p className="text-xs text-stone-500">Points of interest and accommodations plotted for {itinerary.destination_name}</p>
            </div>
            <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-md">
              {activities.length} POIs Plotted
            </span>
          </div>

          {/* Interactive SVG Radar/Map Canvas */}
          <div className="w-full h-80 bg-stone-900 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Compass Rings */}
            <div className="w-64 h-64 rounded-full border border-stone-700/60 absolute" />
            <div className="w-40 h-40 rounded-full border border-stone-700/40 absolute" />
            <div className="w-16 h-16 rounded-full border border-amber-500/40 absolute" />

            {/* Destination Center Marker */}
            <div className="absolute flex flex-col items-center z-10">
              <div className="w-4 h-4 bg-amber-500 rounded-full ring-4 ring-amber-500/30 animate-pulse" />
              <span className="text-[11px] font-bold text-white bg-stone-800/90 px-2 py-0.5 rounded mt-1 shadow-xs">
                {itinerary.destination_name} Center
              </span>
            </div>

            {/* Plotted POI markers */}
            {activities.map((act, i) => {
              const angle = (i / activities.length) * 2 * Math.PI;
              const radius = 80 + (i % 3) * 35;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <div
                  key={act.xid || i}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                  className="absolute flex flex-col items-center group cursor-pointer"
                  title={`${act.name} (${act.category})`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white/50 group-hover:scale-150 transition-transform" />
                  <span className="text-[9px] font-medium text-stone-200 bg-black/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mt-1 pointer-events-none">
                    {act.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
            {activities.map((act, i) => (
              <div key={act.xid || i} className="text-xs text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-200 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate font-medium">{act.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Budget Synthesis Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-stone-900 flex items-center">
          <DollarSign className="w-4 h-4 mr-1.5 text-amber-600" />
          Budget Synthesis & Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
            <span className="text-stone-500 block">Flight Total</span>
            <span className="text-lg font-bold text-stone-900 block mt-0.5">
              ${itinerary.cost_breakdown.flight_total.toLocaleString()}
            </span>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
            <span className="text-stone-500 block">Accommodations</span>
            <span className="text-lg font-bold text-stone-900 block mt-0.5">
              ${itinerary.cost_breakdown.hotel_total.toLocaleString()}
            </span>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
            <span className="text-stone-500 block">Activities & Entry</span>
            <span className="text-lg font-bold text-stone-900 block mt-0.5">
              ${itinerary.cost_breakdown.activities_total.toLocaleString()}
            </span>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
            <span className="text-stone-500 block">Food & Incidentals</span>
            <span className="text-lg font-bold text-stone-900 block mt-0.5">
              ${itinerary.cost_breakdown.food_and_incidentals.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Notes & Advice */}
        {notes.length > 0 && (
          <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/60 text-xs text-amber-900 space-y-1">
            <span className="font-semibold flex items-center mb-1">
              <Info className="w-3.5 h-3.5 mr-1 text-amber-700" />
              Agent Composer Notes:
            </span>
            {notes.map((note, i) => (
              <p key={i} className="text-stone-700 leading-relaxed">• {note}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
