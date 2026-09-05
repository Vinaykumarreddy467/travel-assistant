import React, { useState } from 'react';
import { Send, Bot, Sparkles, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface ChatPanelProps {
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  activeStep: number; // 0: idle, 1: router, 2: parallel agents, 3: composer, 4: done
  lastQuery: string;
}

const PRESET_PROMPTS = [
  "Plan a 4-day trip from London to Paris next week for 2 people, $1500, food and museums",
  "5-day solo adventure to Tokyo from San Francisco with $2200 budget focusing on culture and street food",
  "Weekend getaway from New York to Rome for 2 people with historic landmarks and wine tasting",
  "Family trip to Barcelona for 4 days with beaches, parks, and architecture on $1800 budget",
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  onSendMessage,
  isLoading,
  activeStep,
  lastQuery,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleSelectPreset = (preset: string) => {
    if (isLoading) return;
    onSendMessage(preset);
  };

  return (
    <div id="chat-planning-panel" className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Conversational Trip Planner</h2>
            <p className="text-xs text-stone-500">Ask in plain English — the multi-agent router extracts destinations, dates, and budget</p>
          </div>
        </div>
      </div>

      {/* Preset prompt pills */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Example Prompts:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectPreset(prompt)}
              disabled={isLoading}
              className="text-left text-xs text-stone-700 bg-stone-50 hover:bg-amber-50 hover:text-amber-900 border border-stone-200/80 hover:border-amber-200 rounded-xl p-2.5 transition-all group flex items-start justify-between"
            >
              <span className="line-clamp-2">{prompt}</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 shrink-0 ml-1.5 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          id="chat-query-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Where would you like to travel? (e.g., 'Plan a 4-day trip to Rome for 2 people with $1800 budget focusing on food and history')"
          rows={2}
          className="w-full text-sm rounded-xl border border-stone-300 p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-none"
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          id="btn-send-chat"
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-3 bottom-4 p-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Pipeline Progress Indicator */}
      {(isLoading || activeStep > 0) && (
        <div id="pipeline-progress-tracker" className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-stone-600">
            <span className="flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Agent Execution Pipeline
            </span>
            {isLoading && <span className="text-amber-700 animate-pulse font-semibold">Running...</span>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
              activeStep >= 1 ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-stone-100 border-stone-200 text-stone-400'
            }`}>
              {activeStep > 1 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
              <div className="truncate">
                <p className="font-medium">1. Router</p>
                <p className="text-[10px] text-stone-500 truncate">Entities parsed</p>
              </div>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
              activeStep >= 2 ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-stone-100 border-stone-200 text-stone-400'
            }`}>
              {activeStep > 2 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
              <div className="truncate">
                <p className="font-medium">2. Flight & Stay</p>
                <p className="text-[10px] text-stone-500 truncate">Duffel air & hotels</p>
              </div>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
              activeStep >= 2 ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-stone-100 border-stone-200 text-stone-400'
            }`}>
              {activeStep > 2 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
              <div className="truncate">
                <p className="font-medium">3. POI & Weather</p>
                <p className="text-[10px] text-stone-500 truncate">Attractions + 5-day</p>
              </div>
            </div>

            <div className={`p-2 rounded-lg border flex items-center space-x-2 ${
              activeStep >= 3 ? 'bg-white border-emerald-300 text-emerald-900' : 'bg-stone-100 border-stone-200 text-stone-400'
            }`}>
              {activeStep >= 4 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Clock className="w-3.5 h-3.5 shrink-0" />}
              <div className="truncate">
                <p className="font-medium">4. Composer</p>
                <p className="text-[10px] text-stone-500 truncate">Timeline & budget</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
