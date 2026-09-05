import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TripSidebar } from './components/TripSidebar';
import { ChatPanel } from './components/ChatPanel';
import { ResultCards } from './components/ResultCards';
import { ApiKeysModal } from './components/ApiKeysModal';
import { PipelineResult, ServiceStatus } from './types';
import { Sparkles, AlertCircle, Check } from 'lucide-react';

export function App() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form State
  const [origin, setOrigin] = useState('London');
  const [destination, setDestination] = useState('Paris');

  const defaultStart = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const defaultEnd = new Date(Date.now() + 18 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [budget, setBudget] = useState(1500);
  const [travelers, setTravelers] = useState(2);
  const [preferences, setPreferences] = useState<string[]>(['culture', 'food']);

  // Execution & Result State
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [lastQuery, setLastQuery] = useState('');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fetch status on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.services) {
          setStatus(data.services);
        }
      })
      .catch(() => {});

    // Initial plan run so app immediately showcases value
    executePipeline({
      mode: 'form',
      form: {
        origin: 'London',
        destination: 'Paris',
        start_date: defaultStart,
        end_date: defaultEnd,
        budget: 1500,
        travelers: 2,
        preferences: ['culture', 'food']
      }
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const executePipeline = async (payload: { mode: 'form' | 'chat'; text?: string; form?: any }) => {
    setIsLoading(true);
    setError(null);
    setActiveStep(1);

    const stepInterval = setInterval(() => {
      setActiveStep(s => (s < 3 ? s + 1 : s));
    }, 450);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Trip planning pipeline failed.');
      }

      const data: PipelineResult = await res.json();
      setResult(data);
      setActiveStep(4);

      // Sync form fields if routed from chat
      if (payload.mode === 'chat' && data.request) {
        setOrigin(data.request.origin_name || data.request.origin);
        setDestination(data.request.destination_name || data.request.destination);
        if (data.request.start_date) setStartDate(data.request.start_date);
        if (data.request.end_date) setEndDate(data.request.end_date);
        if (data.request.budget) setBudget(data.request.budget);
        if (data.request.travelers) setTravelers(data.request.travelers);
        if (data.request.preferences) setPreferences(data.request.preferences);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handlePlanTripForm = () => {
    executePipeline({
      mode: 'form',
      form: {
        origin,
        destination,
        start_date: startDate,
        end_date: endDate,
        budget,
        travelers,
        preferences
      }
    });
  };

  const handleSendMessage = (msg: string) => {
    setLastQuery(msg);
    executePipeline({
      mode: 'chat',
      text: msg
    });
  };

  const handleReset = () => {
    setOrigin('London');
    setDestination('Paris');
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setBudget(1500);
    setTravelers(2);
    setPreferences(['culture', 'food']);
    setResult(null);
    setActiveStep(0);
    showToast('Trip parameters reset to default.');
  };

  const handleShare = () => {
    if (!result) return;
    const shareText = `Check out my ${result.itinerary.days}-day trip to ${result.itinerary.destination_name}! Estimated total: $${result.itinerary.estimated_total} ${result.itinerary.currency} for ${result.itinerary.travelers} travelers.`;
    navigator.clipboard.writeText(shareText);
    showToast('Itinerary summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans">
      <Header
        status={status}
        onReset={handleReset}
        onShare={handleShare}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* API Keys and Observability Modal */}
      <ApiKeysModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        status={status}
        onStatusUpdate={newStatus => setStatus(newStatus)}
        onShowToast={showToast}
      />

      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold">Planning Error</p>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Sidebar + Chat */}
          <div className="lg:col-span-4 space-y-6">
            <ChatPanel
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              activeStep={activeStep}
              lastQuery={lastQuery}
            />

            <TripSidebar
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              budget={budget}
              setBudget={setBudget}
              travelers={travelers}
              setTravelers={setTravelers}
              preferences={preferences}
              setPreferences={setPreferences}
              onPlanTrip={handlePlanTripForm}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column: Result Cards & Itinerary */}
          <div className="lg:col-span-8">
            {isLoading && !result && (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-600 rounded-full animate-spin" />
                <div>
                  <h3 className="text-base font-semibold text-stone-800">Orchestrating AI Travel Agents</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm">
                    Querying Duffel flight offers, stay availability, OpenWeather forecasts, and OpenTripMap attractions in parallel...
                  </p>
                </div>
              </div>
            )}

            {result && <ResultCards data={result} />}
          </div>
        </div>
      </main>
    </div>
  );
}
export default App;
