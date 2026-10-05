import { supabase } from '@/lib/supabase';
import type { AskMigselHistoryMessage, AskMigselResponse } from '@/features/chatbot/types';

const REQUEST_TIMEOUT_MS = 15_000;

interface AskMigselRequest {
  message: string;
  sessionId: string;
  conversationId?: string;
  history: AskMigselHistoryMessage[];
}

export class AskMigselRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callAskMigsel(
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AskMigselRequestError('Please sign in to use Ask MIGSEL.', 401);

  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-migsel`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

async function execute(body: Record<string, unknown>): Promise<unknown> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response = await callAskMigsel(body, controller.signal);
    if (response.status === 401 || response.status === 403) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session) response = await callAskMigsel(body, controller.signal);
    }
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok) {
      const message =
        typeof payload?.error === 'string'
          ? payload.error
          : 'Ask MIGSEL is unavailable right now. Please try again.';
      throw new AskMigselRequestError(message, response.status);
    }
    return payload;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AskMigselRequestError(
        'Ask MIGSEL took too long to respond. Please try again.',
        408,
      );
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function isAskMigselResponse(value: unknown): value is AskMigselResponse {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.conversationId === 'string' &&
    typeof item.message === 'string' &&
    typeof item.intent === 'string' &&
    typeof item.confidence === 'number' &&
    typeof item.needsClarification === 'boolean' &&
    Array.isArray(item.actions)
  );
}

export async function askMigsel(input: AskMigselRequest): Promise<AskMigselResponse> {
  const payload = await execute(input as unknown as Record<string, unknown>);
  if (!isAskMigselResponse(payload)) {
    throw new AskMigselRequestError(
      'Ask MIGSEL returned an invalid response. Please try again.',
      502,
    );
  }
  return payload;
}

export async function submitAskMigselFeedback(input: {
  conversationId: string;
  serviceId?: string;
  helpful: boolean;
}): Promise<void> {
  await execute({ feedback: input });
}
