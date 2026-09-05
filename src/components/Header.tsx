import React from 'react';
import { Compass, RotateCcw, Share2, Sparkles, KeyRound, Activity } from 'lucide-react';
import { ServiceStatus } from '../types';

interface HeaderProps {
  status: ServiceStatus | null;
  onReset: () => void;
  onShare: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onReset, onShare, onOpenSettings }) => {
  return (
    <header id="app-header" className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display text-xl font-bold tracking-tight text-stone-900">
                AI Travel Assistant
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                <Sparkles className="w-3 h-3 mr-1" /> Multi-Agent
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              Flights · Hotels · Activities · Weather · Day-by-Day Synthesis
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-2 text-xs text-stone-600 bg-stone-100/80 px-3 py-1.5 rounded-lg border border-stone-200">
            <span className="text-stone-400 font-medium">Agents:</span>
            <span className="inline-flex items-center space-x-1" title={status?.duffel ? 'Duffel API Active' : 'Duffel Sandbox Preview'}>
              <span className={`w-2 h-2 rounded-full ${status?.duffel ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span>Duffel</span>
            </span>
            <span className="text-stone-300">·</span>
            <span className="inline-flex items-center space-x-1" title={status?.openweather ? 'OpenWeather API Active' : 'OpenWeather Preview'}>
              <span className={`w-2 h-2 rounded-full ${status?.openweather ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span>Weather</span>
            </span>
            <span className="text-stone-300">·</span>
            <span className="inline-flex items-center space-x-1" title={status?.opentripmap ? 'OpenTripMap API Active' : 'OpenTripMap Preview'}>
              <span className={`w-2 h-2 rounded-full ${status?.opentripmap ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span>Attractions</span>
            </span>
            <span className="text-stone-300">·</span>
            <span className="inline-flex items-center space-x-1" title={status?.langchain ? 'LangSmith Tracing Active' : 'LangSmith Inactive'}>
              <span className={`w-2 h-2 rounded-full ${status?.langchain ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
              <span>LangSmith</span>
            </span>
          </div>

          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors shadow-xs ${
              status?.langchain 
                ? 'text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100'
                : 'text-amber-800 bg-amber-50 border border-amber-300 hover:bg-amber-100'
            }`}
            title="Configure API Keys & LangSmith Tracing"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            <span>API Keys</span>
            {status?.langchain && (
              <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            id="btn-share-trip"
            onClick={onShare}
            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 transition-colors shadow-xs"
            title="Export or copy itinerary summary"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
            Share
          </button>

          <button
            id="btn-reset-trip"
            onClick={onReset}
            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 transition-colors shadow-xs"
            title="Reset form"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
            Reset
          </button>
        </div>
      </div>
    </header>
  );
};
