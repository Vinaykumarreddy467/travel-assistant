import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Sparkles, 
  X, 
  Loader2,
  Send
} from 'lucide-react';
import { ServiceStatus } from '../types';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ServiceStatus | null;
  onStatusUpdate: (status: ServiceStatus) => void;
  onShowToast: (msg: string) => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  status,
  onStatusUpdate,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'langchain' | 'apis'>('langchain');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingTrace, setIsTestingTrace] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form Fields
  const [langchainKey, setLangchainKey] = useState('');
  const [langchainProject, setLangchainProject] = useState('ai-travel-assistant');
  const [langchainTracing, setLangchainTracing] = useState(true);

  const [opentripmapKey, setOpentripmapKey] = useState('');
  const [openweatherKey, setOpenweatherKey] = useState('');
  const [duffelToken, setDuffelToken] = useState('');
  const [groqKey, setGroqKey] = useState('');

  // Field visibility toggles
  const [showLangchainKey, setShowLangchainKey] = useState(false);
  const [showOtmKey, setShowOtmKey] = useState(false);
  const [showWeatherKey, setShowWeatherKey] = useState(false);
  const [showDuffelToken, setShowDuffelToken] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);

  // Load existing config on open
  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      fetch('/api/config')
        .then(res => res.json())
        .then(data => {
          if (data.langchain_project) setLangchainProject(data.langchain_project);
          if (typeof data.langchain_tracing_v2 === 'boolean') setLangchainTracing(data.langchain_tracing_v2);
          // Load any locally cached keys from localStorage as helper
          const localLangchain = localStorage.getItem('cfg_langchain_key');
          if (localLangchain) setLangchainKey(localLangchain);
          const localOtm = localStorage.getItem('cfg_opentripmap_key');
          if (localOtm) setOpentripmapKey(localOtm);
          const localWeather = localStorage.getItem('cfg_openweather_key');
          if (localWeather) setOpenweatherKey(localWeather);
          const localDuffel = localStorage.getItem('cfg_duffel_token');
          if (localDuffel) setDuffelToken(localDuffel);
          const localGroq = localStorage.getItem('cfg_groq_key');
          if (localGroq) setGroqKey(localGroq);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestLangSmith = async () => {
    if (!langchainKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter your LANGCHAIN_API_KEY before testing.',
      });
      return;
    }
    setIsTestingTrace(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-langsmith', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: langchainKey.trim(),
          project: langchainProject.trim() || 'ai-travel-assistant',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Trace successfully sent to LangSmith! Check your dashboard.',
        });
        localStorage.setItem('cfg_langchain_key', langchainKey.trim());
        onShowToast('LangSmith trace sent successfully!');
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to connect to LangSmith. Please check your API key.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while contacting LangSmith.',
      });
    } finally {
      setIsTestingTrace(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setTestResult(null);

    const payload: Record<string, any> = {
      langchain_project: langchainProject.trim() || 'ai-travel-assistant',
      langchain_tracing_v2: langchainTracing,
    };

    if (langchainKey.trim()) {
      payload.langchain_api_key = langchainKey.trim();
      localStorage.setItem('cfg_langchain_key', langchainKey.trim());
    }
    if (opentripmapKey.trim()) {
      payload.opentripmap_api_key = opentripmapKey.trim();
      localStorage.setItem('cfg_opentripmap_key', opentripmapKey.trim());
    }
    if (openweatherKey.trim()) {
      payload.openweather_api_key = openweatherKey.trim();
      localStorage.setItem('cfg_openweather_key', openweatherKey.trim());
    }
    if (duffelToken.trim()) {
      payload.duffel_access_token = duffelToken.trim();
      localStorage.setItem('cfg_duffel_token', duffelToken.trim());
    }
    if (groqKey.trim()) {
      payload.groq_api_key = groqKey.trim();
      localStorage.setItem('cfg_groq_key', groqKey.trim());
    }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.services) {
        onStatusUpdate(data.services);
        onShowToast('API configuration saved successfully!');
        if (data.trace && data.trace.success) {
          onShowToast('LangSmith verified & connected!');
        }
        onClose();
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to save configuration.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error saving configuration.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        id="api-keys-modal"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-200/60">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">API Keys & Tracing Configuration</h2>
              <p className="text-xs text-stone-500">Configure LangSmith observability and external travel providers</p>
            </div>
          </div>
          <button
            id="btn-close-keys-modal"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Highlights */}
        <div className="px-6 py-3 bg-stone-100/60 border-b border-stone-200 text-xs flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-stone-500 font-medium">Status:</span>
            <span className="inline-flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-md border border-stone-200">
              <span className={`w-2 h-2 rounded-full ${status?.langchain ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="font-semibold text-stone-800">LangSmith:</span>
              <span className="text-stone-600">{status?.langchain ? 'Active & Tracing' : 'Idle / Not Connected'}</span>
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('langchain')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                activeTab === 'langchain'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
              }`}
            >
              LangSmith / Tracing
            </button>
            <button
              onClick={() => setActiveTab('apis')}
              className={`px-3 py-1 rounded-md font-medium text-xs transition-colors ${
                activeTab === 'apis'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-200/70 text-stone-700 hover:bg-stone-200'
              }`}
            >
              Travel APIs
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{testResult.message}</div>
            </div>
          )}

          {activeTab === 'langchain' ? (
            <div className="space-y-4">
              <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>LangSmith Tracing Connection</span>
                  </div>
                  <a
                    href="https://smith.langchain.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-medium inline-flex items-center space-x-1"
                  >
                    <span>Open Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Enter your LangSmith API key below. When enabled, every trip planning query sends a trace graph with agent latency, input parameters, and generated schedules.
                </p>
              </div>

              {/* LANGCHAIN_API_KEY */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  LANGCHAIN_API_KEY
                  <span className="text-amber-600 ml-1 font-normal">(starts with lsv2_pt_...)</span>
                </label>
                <div className="relative">
                  <input
                    id="input-langchain-key"
                    type={showLangchainKey ? 'text' : 'password'}
                    value={langchainKey}
                    onChange={e => setLangchainKey(e.target.value)}
                    placeholder="lsv2_pt_..."
                    className="w-full text-xs font-mono px-3.5 py-2.5 pr-10 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-stone-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLangchainKey(!showLangchainKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showLangchainKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Project & Tracing Toggle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    LANGCHAIN_PROJECT
                  </label>
                  <input
                    id="input-langchain-project"
                    type="text"
                    value={langchainProject}
                    onChange={e => setLangchainProject(e.target.value)}
                    placeholder="ai-travel-assistant"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50/40"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">Project name in LangSmith dashboard</span>
                </div>

                <div className="flex flex-col justify-center pt-2 sm:pt-4">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={langchainTracing}
                      onChange={e => setLangchainTracing(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                    />
                    <span className="text-xs font-medium text-stone-800">
                      Enable Tracing (<code className="text-[11px] text-amber-800">LANGCHAIN_TRACING_V2=true</code>)
                    </span>
                  </label>
                  <span className="text-[10px] text-stone-400 mt-1 pl-6.5">Captures graph runs automatically</span>
                </div>
              </div>

              {/* Test Button */}
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-test-langsmith"
                  onClick={handleTestLangSmith}
                  disabled={isTestingTrace || !langchainKey.trim()}
                  className="inline-flex items-center space-x-2 text-xs font-medium px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  {isTestingTrace ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test Trace...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>Send Test Trace to LangSmith</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-stone-500 ml-3">
                  Instantly sends a ping run so LangSmith detects the application.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Optionally provide direct API keys to override sandbox fallback data with live provider data:
              </p>

              {/* OPENTRIPMAP_API_KEY */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  OPENTRIPMAP_API_KEY
                  <span className="text-stone-400 font-normal ml-1">(Points of interest & coordinates)</span>
                </label>
                <div className="relative">
                  <input
                    id="input-otm-key"
                    type={showOtmKey ? 'text' : 'password'}
                    value={opentripmapKey}
                    onChange={e => setOpentripmapKey(e.target.value)}
                    placeholder="5ae2e3f221c38a28845f05b6..."
                    className="w-full text-xs font-mono px-3.5 py-2 pr-10 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOtmKey(!showOtmKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showOtmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* OPENWEATHER_API_KEY */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  OPENWEATHER_API_KEY
                  <span className="text-stone-400 font-normal ml-1">(Live forecasts & current weather)</span>
                </label>
                <div className="relative">
                  <input
                    id="input-weather-key"
                    type={showWeatherKey ? 'text' : 'password'}
                    value={openweatherKey}
                    onChange={e => setOpenweatherKey(e.target.value)}
                    placeholder="Enter OpenWeather API key"
                    className="w-full text-xs font-mono px-3.5 py-2 pr-10 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWeatherKey(!showWeatherKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showWeatherKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* DUFFEL_ACCESS_TOKEN */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  DUFFEL_ACCESS_TOKEN
                  <span className="text-stone-400 font-normal ml-1">(Live flight & hotel availability)</span>
                </label>
                <div className="relative">
                  <input
                    id="input-duffel-token"
                    type={showDuffelToken ? 'text' : 'password'}
                    value={duffelToken}
                    onChange={e => setDuffelToken(e.target.value)}
                    placeholder="duffel_test_..."
                    className="w-full text-xs font-mono px-3.5 py-2 pr-10 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDuffelToken(!showDuffelToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showDuffelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* GROQ_API_KEY */}
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  GROQ_API_KEY
                  <span className="text-stone-400 font-normal ml-1">(Fast Llama 3.3 agent synthesis)</span>
                </label>
                <div className="relative">
                  <input
                    id="input-groq-key"
                    type={showGroqKey ? 'text' : 'password'}
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    placeholder="gsk_..."
                    className="w-full text-xs font-mono px-3.5 py-2 pr-10 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGroqKey(!showGroqKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Keys are securely applied to the server environment
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-save-keys"
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-medium rounded-xl text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
