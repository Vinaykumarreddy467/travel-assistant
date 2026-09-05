import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  DUFFEL_ACCESS_TOKEN: process.env.DUFFEL_ACCESS_TOKEN || '',
  DUFFEL_API_URL: process.env.DUFFEL_API_URL || 'https://api.duffel.com',
  DUFFEL_VERSION: process.env.DUFFEL_VERSION || 'v2',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_API_KEY_2: process.env.GROQ_API_KEY_2 || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENTRIPMAP_API_KEY: process.env.OPENTRIPMAP_API_KEY || '',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
  LANGCHAIN_API_KEY: process.env.LANGSMITH_API_KEY || process.env.LANGCHAIN_API_KEY || '',
  LANGCHAIN_TRACING_V2: process.env.LANGSMITH_TRACING || process.env.LANGCHAIN_TRACING_V2 || 'true',
  LANGCHAIN_PROJECT: process.env.LANGSMITH_PROJECT || process.env.LANGCHAIN_PROJECT || 'ai-travel-assistant',
  LANGCHAIN_ENDPOINT: process.env.LANGSMITH_ENDPOINT || process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
  PORT: 3000,
};
