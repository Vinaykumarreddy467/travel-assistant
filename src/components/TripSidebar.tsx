import React from 'react';
import { PlaneTakeoff, PlaneLanding, Calendar, DollarSign, Users, Sparkles, MapPin, Tag } from 'lucide-react';

interface TripSidebarProps {
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  budget: number;
  setBudget: (v: number) => void;
  travelers: number;
  setTravelers: (v: number) => void;
  preferences: string[];
  setPreferences: (v: string[]) => void;
  onPlanTrip: () => void;
  isLoading: boolean;
}

const POPULAR_DESTINATIONS = ['Paris', 'Tokyo', 'Rome', 'Barcelona', 'Bali', 'New York', 'London', 'Dubai'];
const AVAILABLE_PREFERENCES = [
  { id: 'culture', label: 'Museums & Culture' },
  { id: 'food', label: 'Food & Culinary' },
  { id: 'adventure', label: 'Adventure & Sport' },
  { id: 'nature', label: 'Nature & Parks' },
  { id: 'relaxation', label: 'Relaxation & Spa' },
  { id: 'beach', label: 'Beach & Sun' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'shopping', label: 'Shopping' },
];

export const TripSidebar: React.FC<TripSidebarProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  budget,
  setBudget,
  travelers,
  setTravelers,
  preferences,
  setPreferences,
  onPlanTrip,
  isLoading,
}) => {
  const togglePref = (id: string) => {
    if (preferences.includes(id)) {
      setPreferences(preferences.filter(p => p !== id));
    } else {
      setPreferences([...preferences, id]);
    }
  };

  return (
    <div id="trip-builder-sidebar" className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-5">
      <div className="border-b border-stone-100 pb-3">
        <h2 className="text-base font-semibold text-stone-900 flex items-center">
          <PlaneTakeoff className="w-4 h-4 mr-2 text-amber-600" />
          Trip Builder
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Configure destinations, dates, budget and travel style
        </p>
      </div>

      {/* Origin & Destination */}
      <div className="space-y-3">
        <div>
          <label htmlFor="input-origin" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Origin City or Airport
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              id="input-origin"
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="e.g. London (LON) or LHR"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="input-destination" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Destination
          </label>
          <div className="relative">
            <PlaneLanding className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              id="input-destination"
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Paris, Tokyo, Rome"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          {/* Quick select pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {POPULAR_DESTINATIONS.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => setDestination(city)}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  destination.toLowerCase() === city.toLowerCase()
                    ? 'bg-amber-100 text-amber-800 font-medium'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="input-start-date" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Departure
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-stone-400 pointer-events-none" />
            <input
              id="input-start-date"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full pl-9 pr-2 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="input-end-date" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Return
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-3 text-stone-400 pointer-events-none" />
            <input
              id="input-end-date"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full pl-9 pr-2 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Budget & Travelers */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="input-budget" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Total Budget
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              id="input-budget"
              type="number"
              min="0"
              step="50"
              value={budget || ''}
              onChange={e => setBudget(Number(e.target.value))}
              placeholder="1500"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Travelers
          </label>
          <div className="flex items-center border border-stone-300 rounded-xl px-2 py-1.5 justify-between">
            <button
              type="button"
              onClick={() => setTravelers(Math.max(1, travelers - 1))}
              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              -
            </button>
            <span className="text-sm font-semibold text-stone-800 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-stone-400" />
              {travelers}
            </span>
            <button
              type="button"
              onClick={() => setTravelers(Math.min(9, travelers + 1))}
              className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Travel Style / Preferences */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 flex items-center">
          <Tag className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
          Travel Style Preferences
        </label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_PREFERENCES.map(pref => {
            const active = preferences.includes(pref.id);
            return (
              <button
                key={pref.id}
                type="button"
                onClick={() => togglePref(pref.id)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                  active
                    ? 'bg-amber-600 text-white font-medium shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {pref.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Trip Button */}
      <button
        id="btn-plan-trip-form"
        type="button"
        disabled={isLoading || !origin || !destination}
        onClick={onPlanTrip}
        className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Orchestrating Agents...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate Itinerary</span>
          </>
        )}
      </button>
    </div>
  );
};
