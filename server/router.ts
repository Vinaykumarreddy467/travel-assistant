import { GoogleGenAI } from '@google/genai';
import { CONFIG } from './config.js';
import { resolveCity } from './geo.js';

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

export function routeFromForm(params: {
  origin: string;
  destination: string;
  start_date: string;
  end_date?: string;
  budget?: number;
  travelers?: number;
  preferences?: string[];
}): TripRequest {
  const originInfo = resolveCity(params.origin);
  const destInfo = resolveCity(params.destination);

  return {
    origin: originInfo?.iata || params.origin.trim().toUpperCase(),
    origin_name: originInfo?.name || params.origin.trim(),
    destination: destInfo?.iata || params.destination.trim().toUpperCase(),
    destination_name: destInfo?.name || params.destination.trim(),
    start_date: params.start_date || getDefaultStartDate(),
    end_date: params.end_date || getDefaultEndDate(params.start_date),
    budget: Number(params.budget || 0),
    travelers: Math.max(1, Number(params.travelers || 1)),
    preferences: Array.isArray(params.preferences) ? params.preferences : [],
    currency: 'USD'
  };
}

export async function routeFromText(text: string): Promise<TripRequest> {
  const rules = extractWithRules(text);

  // Attempt LLM structured extraction if GEMINI_API_KEY is available
  if (CONFIG.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
      const prompt = `You are an AI Travel Assistant router.
Extract the trip details from this user query: "${text}".
Current date is: ${new Date().toISOString().slice(0, 10)}.
Output valid JSON only matching this schema:
{
  "origin": "Departure city or airport name (e.g. London)",
  "destination": "Destination city name (e.g. Paris)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD or empty string",
  "budget": number in USD,
  "travelers": number of adult travelers,
  "preferences": ["food", "culture", "adventure", "beach", "nightlife", "nature", "shopping", "relaxation"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return mergeResults(rules, parsed);
      }
    } catch (err) {
      console.warn('[router] Gemini extraction fallback to rules:', err);
    }
  }

  return rules;
}

function mergeResults(rules: TripRequest, llm: any): TripRequest {
  const merged = { ...rules };
  if (llm.origin) {
    const info = resolveCity(llm.origin);
    merged.origin = info?.iata || llm.origin;
    merged.origin_name = info?.name || llm.origin;
  }
  if (llm.destination) {
    const info = resolveCity(llm.destination);
    merged.destination = info?.iata || llm.destination;
    merged.destination_name = info?.name || llm.destination;
  }
  if (llm.start_date && /^\d{4}-\d{2}-\d{2}$/.test(llm.start_date)) {
    merged.start_date = llm.start_date;
  }
  if (llm.end_date && /^\d{4}-\d{2}-\d{2}$/.test(llm.end_date)) {
    merged.end_date = llm.end_date;
  }
  if (llm.budget && Number(llm.budget) > 0) {
    merged.budget = Number(llm.budget);
  }
  if (llm.travelers && Number(llm.travelers) >= 1) {
    merged.travelers = Number(llm.travelers);
  }
  if (Array.isArray(llm.preferences) && llm.preferences.length > 0) {
    merged.preferences = Array.from(new Set([...merged.preferences, ...llm.preferences]));
  }
  return merged;
}

function extractWithRules(text: string): TripRequest {
  let origin = 'London';
  let destination = 'Paris';
  let startDate = '';
  let endDate = '';
  let budget = 0;
  let travelers = 1;
  const preferences: string[] = [];

  // "from X to Y"
  const fromToMatch = text.match(/\bfrom\s+([A-Za-z\s]{2,25}?)\s+to\s+([A-Za-z\s]{2,25}?)(?:\s|$|,|\.)/i);
  if (fromToMatch) {
    origin = fromToMatch[1].trim();
    destination = fromToMatch[2].trim();
  } else {
    // "trip to Paris"
    const toMatch = text.match(/\b(?:to|in|visit|explore)\s+([A-Za-z\s]{2,20}?)(?:\s+for|\s+next|\s+with|\s+in|\s*[,.!?]|$)/i);
    if (toMatch) {
      destination = toMatch[1].trim();
    }
  }

  // Budget matching: "$1500", "1500 dollars", "budget of 2000"
  const budgetMatch = text.match(/\$\s?(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:usd|dollars|bucks)/i);
  if (budgetMatch) {
    budget = parseFloat(budgetMatch[1] || budgetMatch[2]);
  } else {
    const budgetKeyword = text.match(/budget\s*(?:of|is|:)?\s*\$?(\d+)/i);
    if (budgetKeyword) {
      budget = parseFloat(budgetKeyword[1]);
    }
  }

  // Travelers matching: "2 people", "3 adults", "for 4", "solo", "couple"
  const travelersMatch = text.match(/(\d+)\s*(?:people|adults|travelers|travellers|persons)/i);
  if (travelersMatch) {
    travelers = Math.max(1, parseInt(travelersMatch[1], 10));
  } else if (/\bsolo\b/i.test(text)) {
    travelers = 1;
  } else if (/\bcouple\b/i.test(text)) {
    travelers = 2;
  } else if (/\bfamily\b/i.test(text)) {
    travelers = 4;
  }

  // Preferences keywords
  const prefKeywords: Record<string, string[]> = {
    adventure: ['adventure', 'hiking', 'trek', 'outdoor', 'sports', 'climb'],
    food: ['food', 'culinary', 'restaurant', 'eat', 'dining', 'gastronomy', 'wine', 'pastry'],
    culture: ['culture', 'museum', 'history', 'heritage', 'art', 'historic', 'architecture'],
    beach: ['beach', 'sun', 'swimming', 'ocean', 'coastal'],
    shopping: ['shopping', 'mall', 'boutique', 'fashion', 'market'],
    nightlife: ['nightlife', 'party', 'club', 'bars', 'cocktails'],
    nature: ['nature', 'park', 'scenic', 'garden', 'mountain', 'lake'],
    relaxation: ['relax', 'spa', 'quiet', 'wellness', 'peaceful'],
  };

  const lower = text.toLowerCase();
  for (const [key, words] of Object.entries(prefKeywords)) {
    if (words.some(w => lower.includes(w))) {
      preferences.push(key);
    }
  }

  // Dates matching
  const dateMatches = text.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g);
  if (dateMatches && dateMatches.length > 0) {
    startDate = normalizeDate(dateMatches[0]);
    if (dateMatches.length > 1) {
      endDate = normalizeDate(dateMatches[1]);
    }
  }

  // Duration in days: "4 days in Paris", "a week", "3-day trip"
  const daysMatch = text.match(/(\d+)\s*[- ]?day/i);
  let tripDays = daysMatch ? parseInt(daysMatch[1], 10) : 4;
  if (/week/i.test(text)) tripDays = 7;

  if (!startDate) {
    startDate = getDefaultStartDate();
  }
  if (!endDate) {
    const s = new Date(startDate);
    s.setDate(s.getDate() + Math.max(1, tripDays));
    endDate = s.toISOString().slice(0, 10);
  }

  const originInfo = resolveCity(origin);
  const destInfo = resolveCity(destination);

  return {
    origin: originInfo?.iata || origin.toUpperCase(),
    origin_name: originInfo?.name || origin,
    destination: destInfo?.iata || destination.toUpperCase(),
    destination_name: destInfo?.name || destination,
    start_date: startDate,
    end_date: endDate,
    budget: budget || (tripDays * 250 * travelers),
    travelers,
    preferences: preferences.length > 0 ? preferences : ['food', 'culture'],
    currency: 'USD'
  };
}

function normalizeDate(val: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const parts = val.split(/[/-]/);
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (y.length === 2) y = '20' + y;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return getDefaultStartDate();
}

function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function getDefaultEndDate(startDate?: string): string {
  const s = startDate ? new Date(startDate) : new Date();
  if (!startDate) s.setDate(s.getDate() + 14);
  s.setDate(s.getDate() + 4);
  return s.toISOString().slice(0, 10);
}
