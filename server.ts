import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { CONFIG } from './server/config.js';
import { CITIES, resolveCity } from './server/geo.js';
import { routeFromForm, routeFromText } from './server/router.js';
import { runPipeline } from './server/orchestrator.js';
import { sendLangSmithTrace, sendTestTrace } from './server/tracer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Mask utility for safe display
  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
  };

  // API Status & Configuration summary
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'online',
      services: {
        duffel: Boolean(CONFIG.DUFFEL_ACCESS_TOKEN),
        openweather: Boolean(CONFIG.OPENWEATHER_API_KEY),
        opentripmap: Boolean(CONFIG.OPENTRIPMAP_API_KEY),
        groq: Boolean(CONFIG.GROQ_API_KEY),
        gemini: Boolean(CONFIG.GEMINI_API_KEY),
        langchain: Boolean(CONFIG.LANGCHAIN_API_KEY && String(CONFIG.LANGCHAIN_TRACING_V2).toLowerCase() === 'true'),
      },
      cityCount: Object.keys(CITIES).length,
    });
  });

  // Get current config keys status (masked)
  app.get('/api/config', (req, res) => {
    res.json({
      duffel_access_token: maskKey(CONFIG.DUFFEL_ACCESS_TOKEN),
      has_duffel: Boolean(CONFIG.DUFFEL_ACCESS_TOKEN),
      openweather_api_key: maskKey(CONFIG.OPENWEATHER_API_KEY),
      has_openweather: Boolean(CONFIG.OPENWEATHER_API_KEY),
      opentripmap_api_key: maskKey(CONFIG.OPENTRIPMAP_API_KEY),
      has_opentripmap: Boolean(CONFIG.OPENTRIPMAP_API_KEY),
      groq_api_key: maskKey(CONFIG.GROQ_API_KEY),
      has_groq: Boolean(CONFIG.GROQ_API_KEY),
      gemini_api_key: maskKey(CONFIG.GEMINI_API_KEY),
      has_gemini: Boolean(CONFIG.GEMINI_API_KEY),
      langchain_api_key: maskKey(CONFIG.LANGCHAIN_API_KEY),
      has_langchain: Boolean(CONFIG.LANGCHAIN_API_KEY),
      langchain_project: CONFIG.LANGCHAIN_PROJECT,
      langchain_tracing_v2: String(CONFIG.LANGCHAIN_TRACING_V2).toLowerCase() === 'true',
    });
  });

  // Save/Update config keys at runtime
  app.post('/api/config', async (req, res) => {
    try {
      const {
        duffel_access_token,
        openweather_api_key,
        opentripmap_api_key,
        groq_api_key,
        gemini_api_key,
        langchain_api_key,
        langchain_project,
        langchain_tracing_v2,
      } = req.body;

      if (duffel_access_token !== undefined) {
        CONFIG.DUFFEL_ACCESS_TOKEN = duffel_access_token;
        process.env.DUFFEL_ACCESS_TOKEN = duffel_access_token;
      }
      if (openweather_api_key !== undefined) {
        CONFIG.OPENWEATHER_API_KEY = openweather_api_key;
        process.env.OPENWEATHER_API_KEY = openweather_api_key;
      }
      if (opentripmap_api_key !== undefined) {
        CONFIG.OPENTRIPMAP_API_KEY = opentripmap_api_key;
        process.env.OPENTRIPMAP_API_KEY = opentripmap_api_key;
      }
      if (groq_api_key !== undefined) {
        CONFIG.GROQ_API_KEY = groq_api_key;
        process.env.GROQ_API_KEY = groq_api_key;
      }
      if (gemini_api_key !== undefined) {
        CONFIG.GEMINI_API_KEY = gemini_api_key;
        process.env.GEMINI_API_KEY = gemini_api_key;
      }
      if (langchain_api_key !== undefined) {
        CONFIG.LANGCHAIN_API_KEY = langchain_api_key;
        process.env.LANGCHAIN_API_KEY = langchain_api_key;
      }
      if (langchain_project !== undefined) {
        CONFIG.LANGCHAIN_PROJECT = langchain_project || 'ai-travel-assistant';
        process.env.LANGCHAIN_PROJECT = CONFIG.LANGCHAIN_PROJECT;
      }
      if (langchain_tracing_v2 !== undefined) {
        CONFIG.LANGCHAIN_TRACING_V2 = String(langchain_tracing_v2);
        process.env.LANGCHAIN_TRACING_V2 = String(langchain_tracing_v2);
      }

      let testTraceResult: { success: boolean; error?: string } | null = null;
      if (CONFIG.LANGCHAIN_API_KEY && String(CONFIG.LANGCHAIN_TRACING_V2).toLowerCase() === 'true') {
        testTraceResult = await sendTestTrace();
      }

      res.json({
        success: true,
        message: 'Settings updated successfully.',
        trace: testTraceResult,
        services: {
          duffel: Boolean(CONFIG.DUFFEL_ACCESS_TOKEN),
          openweather: Boolean(CONFIG.OPENWEATHER_API_KEY),
          opentripmap: Boolean(CONFIG.OPENTRIPMAP_API_KEY),
          groq: Boolean(CONFIG.GROQ_API_KEY),
          gemini: Boolean(CONFIG.GEMINI_API_KEY),
          langchain: Boolean(CONFIG.LANGCHAIN_API_KEY && String(CONFIG.LANGCHAIN_TRACING_V2).toLowerCase() === 'true'),
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update configuration' });
    }
  });

  // Explicit test endpoint for LangSmith
  app.post('/api/test-langsmith', async (req, res) => {
    try {
      const { api_key, project } = req.body;
      if (api_key) {
        CONFIG.LANGCHAIN_API_KEY = api_key;
        process.env.LANGCHAIN_API_KEY = api_key;
      }
      if (project) {
        CONFIG.LANGCHAIN_PROJECT = project;
        process.env.LANGCHAIN_PROJECT = project;
      }
      CONFIG.LANGCHAIN_TRACING_V2 = 'true';
      process.env.LANGCHAIN_TRACING_V2 = 'true';

      const result = await sendTestTrace();
      if (result.success) {
        res.json({ success: true, message: `Trace successfully sent to LangSmith project "${CONFIG.LANGCHAIN_PROJECT}"!` });
      } else {
        res.status(400).json({ success: false, error: result.error || 'Failed to connect to LangSmith' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Cities autocomplete / suggestions
  app.get('/api/cities', (req, res) => {
    const q = (req.query.q as string || '').toLowerCase().trim();
    if (!q) {
      const top = ['Paris', 'London', 'Tokyo', 'Rome', 'New York', 'Barcelona', 'Bali', 'Bangkok', 'Dubai', 'Sydney'];
      return res.json(top.map(c => resolveCity(c)));
    }
    const matches = Object.entries(CITIES)
      .filter(([name, info]) => name.includes(q) || info.iata.toLowerCase().includes(q))
      .slice(0, 10)
      .map(([name, info]) => ({
        iata: info.iata,
        name: name.replace(/\b\w/g, c => c.toUpperCase()),
        country: info.country,
        lat: info.lat,
        lng: info.lng,
      }));
    res.json(matches);
  });

  // Router extraction from natural language
  app.post('/api/route', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text query is required' });
      }
      const tripRequest = await routeFromText(text);
      res.json(tripRequest);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Route extraction failed' });
    }
  });

  // Full Pipeline Execution (Router -> 4 Agents -> Composer)
  app.post('/api/pipeline', async (req, res) => {
    const startTime = new Date().toISOString();
    try {
      const { mode, text, form } = req.body;
      let request;

      if (mode === 'chat' && text) {
        request = await routeFromText(text);
      } else if (form) {
        request = routeFromForm(form);
      } else {
        request = routeFromForm({
          origin: 'London',
          destination: 'Paris',
          start_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          budget: 1500,
          travelers: 2,
          preferences: ['food', 'culture']
        });
      }

      const result = await runPipeline(request);
      const endTime = new Date().toISOString();

      // Async send trace to LangSmith if configured
      sendLangSmithTrace({
        name: 'ai-travel-orchestrator',
        runType: 'chain',
        startTime,
        endTime,
        inputs: { mode, query: text, request },
        outputs: {
          days: result.itinerary?.days,
          total: result.itinerary?.estimated_total,
          destination: result.itinerary?.destination_name,
          flights_found: result.flights?.length,
          hotels_found: result.hotels?.length,
          activities_found: result.activities?.length,
        },
        metadata: {
          destination: request.destination,
          origin: request.origin,
          travelers: request.travelers,
          budget: request.budget,
        }
      }).catch(err => console.warn('[LangSmith] Background trace error:', err));

      res.json(result);
    } catch (err: any) {
      console.error('[pipeline error]', err);
      const endTime = new Date().toISOString();
      sendLangSmithTrace({
        name: 'ai-travel-orchestrator',
        runType: 'chain',
        startTime,
        endTime,
        inputs: req.body,
        outputs: {},
        error: err.message,
      }).catch(() => {});
      res.status(500).json({ error: err.message || 'Pipeline execution failed' });
    }
  });

  // Vite middleware in dev or static files in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Travel Assistant] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
