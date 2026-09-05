import { CONFIG } from './config.js';
import crypto from 'node:crypto';

export async function sendLangSmithTrace(data: {
  name: string;
  runType?: 'chain' | 'llm' | 'tool';
  startTime: string;
  endTime: string;
  inputs: any;
  outputs: any;
  error?: string | null;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = CONFIG.LANGCHAIN_API_KEY;
  const isTracing = String(CONFIG.LANGCHAIN_TRACING_V2).toLowerCase() === 'true';

  if (!apiKey || !isTracing) {
    return { success: false, error: 'LangSmith tracing not enabled or API key missing' };
  }

  const runId = crypto.randomUUID();
  const projectName = CONFIG.LANGCHAIN_PROJECT || 'ai-travel-assistant';

  const payload = {
    id: runId,
    name: data.name,
    run_type: data.runType || 'chain',
    start_time: data.startTime,
    end_time: data.endTime,
    inputs: data.inputs || {},
    outputs: data.outputs || {},
    error: data.error || undefined,
    session_name: projectName,
    extra: {
      metadata: {
        platform: 'ai-studio',
        framework: 'langchain-langgraph-orchestrator',
        ...(data.metadata || {}),
      },
    },
  };

  const baseUrl = (CONFIG.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com').replace(/\/+$/, '');

  try {
    const response = await fetch(`${baseUrl}/runs`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[LangSmith] Trace submission warning:', response.status, errText);
      return { success: false, error: `LangSmith HTTP ${response.status}: ${errText}` };
    }

    console.log(`[LangSmith] Successfully recorded trace run ${runId} in project "${projectName}"`);
    return { success: true, id: runId };
  } catch (err: any) {
    console.warn('[LangSmith] Trace transmission failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendTestTrace(): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  return sendLangSmithTrace({
    name: 'langsmith-connection-verification',
    runType: 'chain',
    startTime: now,
    endTime: now,
    inputs: { status: 'Connected from AI Travel Assistant UI' },
    outputs: { result: 'Tracing pipeline active and ready for agent runs' },
    metadata: { test: true },
  });
}
