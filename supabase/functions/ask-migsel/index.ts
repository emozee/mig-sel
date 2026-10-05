import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  MAX_HISTORY_CHARACTERS,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_LENGTH,
  REQUESTS_PER_MINUTE,
} from './constants.ts';
import {
  classifyDeterministically,
  classifyWithModel,
  unknownClassification,
} from './classification.ts';
import {
  clarificationResponse,
  emergencyResponse,
  followupResponse,
  grievanceResponse,
  retrieveClarificationQuestion,
  retrieveMigselKnowledge,
  retrieveServices,
  serviceResponse,
} from './retrieval.ts';
import type { AskMigselResponse, Classification, HistoryMessage, MigselIntent } from './types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const HF_TOKEN = Deno.env.get('HUGGINGFACE_API_KEY');
const MODEL = Deno.env.get('ASK_MIGSEL_MODEL') ?? 'Qwen/Qwen3-VL-30B-A3B-Instruct:deepinfra';
const ENABLED = Deno.env.get('ASK_MIGSEL_ENABLED') !== 'false';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(body: Record<string, unknown> | AskMigselResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

class DatabaseClient {
  constructor() {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error('Supabase configuration missing');
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Database request failed (${response.status}): ${detail}`);
    }
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  async rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
    return await this.request<T>(`rpc/${name}`, { method: 'POST', body: JSON.stringify(body) });
  }
}

async function authenticate(req: Request): Promise<string | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: unknown };
  return isUuid(user.id) ? user.id : null;
}

function parseHistory(value: unknown): HistoryMessage[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_MESSAGES) return null;
  const history: HistoryMessage[] = [];
  let total = 0;
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    if (
      (row.role !== 'user' && row.role !== 'assistant') ||
      typeof row.content !== 'string' ||
      row.content.length < 1 ||
      row.content.length > MAX_MESSAGE_LENGTH
    )
      return null;
    total += row.content.length;
    if (total > MAX_HISTORY_CHARACTERS) return null;
    history.push({ role: row.role, content: row.content });
  }
  return history;
}

async function getOrCreateConversation(
  db: DatabaseClient,
  userId: string,
  sessionId: string,
  requestedId: unknown,
): Promise<string> {
  if (isUuid(requestedId)) {
    const existing = await db.request<Array<{ id: string }>>(
      `ai_conversations?select=id&id=eq.${encodeURIComponent(requestedId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    );
    if (existing[0]) return existing[0].id;
  }

  const created = await db.request<Array<{ id: string }>>('ai_conversations?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: userId, session_id: sessionId }),
  });
  if (!created[0]?.id) throw new Error('Conversation could not be created');
  return created[0].id;
}

async function persistMessage(
  db: DatabaseClient,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  intent?: MigselIntent,
  confidence?: number,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.request('ai_messages', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: conversationId,
      role,
      content: content.slice(0, 4000),
      intent: intent ?? null,
      confidence: confidence ?? null,
      metadata,
    }),
  });
}

async function loadConversationHistory(
  db: DatabaseClient,
  conversationId: string,
): Promise<HistoryMessage[]> {
  const rows = await db.request<Array<{ role: string; content: string }>>(
    `ai_messages?select=role,content&conversation_id=eq.${encodeURIComponent(conversationId)}&role=in.(user,assistant)&order=created_at.desc&limit=${MAX_HISTORY_MESSAGES}`,
  );
  return rows
    .reverse()
    .filter(
      (item): item is HistoryMessage =>
        (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string',
    );
}

async function persistOutcome(db: DatabaseClient, response: AskMigselResponse): Promise<void> {
  const resolved = Boolean(
    response.service || response.intent === 'grievance' || response.intent === 'emergency',
  );
  await db.request(`ai_conversations?id=eq.${encodeURIComponent(response.conversationId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      final_intent: response.intent,
      confidence: response.confidence,
      resolved,
      status: resolved ? 'resolved' : 'active',
      resolved_service_id: response.service?.id ?? null,
    }),
  });
  await persistMessage(
    db,
    response.conversationId,
    'assistant',
    response.message,
    response.intent,
    response.confidence,
    {
      needs_clarification: response.needsClarification,
      service_id: response.service?.id ?? null,
      service_verified: response.service?.verified ?? null,
      action_types: response.actions.map((action) => action.type),
    },
  );
}

async function logEvent(
  db: DatabaseClient,
  userId: string,
  conversationId: string | null,
  eventName: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.request('ask_migsel_events', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      conversation_id: conversationId,
      event_name: eventName,
      metadata,
    }),
  });
}

async function handleFeedback(
  db: DatabaseClient,
  userId: string,
  value: Record<string, unknown>,
): Promise<Response> {
  if (!isUuid(value.conversationId) || typeof value.helpful !== 'boolean') {
    return json({ error: 'Invalid feedback' }, 400);
  }
  const owned = await db.request<Array<{ id: string }>>(
    `ai_conversations?select=id&id=eq.${encodeURIComponent(value.conversationId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
  );
  if (!owned[0]) return json({ error: 'Conversation not found' }, 404);
  const feedbackText =
    typeof value.feedbackText === 'string' ? value.feedbackText.trim().slice(0, 1000) : null;
  await db.request('service_feedback', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: value.conversationId,
      service_id: isUuid(value.serviceId) ? value.serviceId : null,
      user_id: userId,
      helpful: value.helpful,
      feedback_text: feedbackText || null,
    }),
  });
  await logEvent(
    db,
    userId,
    value.conversationId,
    value.helpful ? 'answer_feedback_positive' : 'answer_feedback_negative',
  );
  return json({ saved: true });
}

async function buildResponse(
  db: DatabaseClient,
  conversationId: string,
  message: string,
  classification: Classification,
): Promise<AskMigselResponse> {
  if (classification.intent === 'emergency') {
    return emergencyResponse(conversationId, classification.confidence);
  }
  if (classification.intent === 'grievance') {
    return grievanceResponse(conversationId, classification, message);
  }
  if (classification.needsClarification) {
    const response = clarificationResponse(conversationId, classification);
    if (classification.questionKey) {
      const configured = await retrieveClarificationQuestion(db, classification.questionKey);
      if (configured) {
        response.message = configured.question;
        response.clarificationQuestion = configured.question;
        response.actions = configured.actions;
      }
    }
    return response;
  }

  const query =
    classification.serviceSearchQuery ??
    classification.possibleServiceCategory ??
    classification.normalizedQuery;
  const rows = query ? await retrieveServices(db, query) : [];
  const found = serviceResponse(conversationId, classification, rows);
  if (classification.intent === 'application_followup') {
    return followupResponse(conversationId, classification, found);
  }
  if (found) return found;

  const productKnowledge = await retrieveMigselKnowledge(db, classification.normalizedQuery);
  if (productKnowledge) {
    return {
      conversationId,
      message: productKnowledge.answer,
      intent: 'information',
      confidence: productKnowledge.score,
      needsClarification: false,
      actions: [],
    };
  }

  return {
    conversationId,
    message:
      'I could not identify a verified service confidently. Could you tell me a little more about what you are trying to do?',
    intent: 'unknown',
    confidence: Math.min(classification.confidence, 0.45),
    needsClarification: true,
    clarificationQuestion: 'Could you tell me a little more about what you are trying to do?',
    actions: [],
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!ENABLED) return json({ error: 'Ask MIGSEL is temporarily unavailable' }, 503);

  try {
    const userId = await authenticate(req);
    if (!userId) return json({ error: 'Authentication required' }, 401);
    const db = new DatabaseClient();
    const allowed = await db.rpc<boolean>('check_ask_migsel_rate_limit', {
      request_identity: `user:${userId}`,
      maximum_requests: REQUESTS_PER_MINUTE,
      window_seconds: 60,
    });
    if (!allowed)
      return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429);

    const body = (await req.json()) as Record<string, unknown>;
    if (body.feedback && typeof body.feedback === 'object') {
      return await handleFeedback(db, userId, body.feedback as Record<string, unknown>);
    }

    if (typeof body.message !== 'string') return json({ error: 'A message is required' }, 400);
    const message = body.message.trim();
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters` }, 400);
    }
    if (!isUuid(body.sessionId)) return json({ error: 'A valid sessionId is required' }, 400);
    if (!parseHistory(body.history)) {
      return json({ error: 'Conversation history is invalid or too long' }, 400);
    }

    const conversationId = await getOrCreateConversation(
      db,
      userId,
      body.sessionId,
      body.conversationId,
    );
    const trustedHistory = await loadConversationHistory(db, conversationId);
    await persistMessage(db, conversationId, 'user', message);
    await logEvent(db, userId, conversationId, 'ask_migsel_question_submitted');

    let classification = classifyDeterministically(message, trustedHistory);
    if (!classification && HF_TOKEN) {
      classification = await classifyWithModel(message, trustedHistory, HF_TOKEN, MODEL);
    }
    classification ??= unknownClassification(message);

    const response = await buildResponse(db, conversationId, message, classification);
    await persistOutcome(db, response);
    await logEvent(db, userId, conversationId, 'intent_detected', {
      intent: response.intent,
      confidence: response.confidence,
    });
    if (response.needsClarification) {
      await logEvent(db, userId, conversationId, 'clarification_requested');
    } else if (response.service) {
      await logEvent(db, userId, conversationId, 'service_found', {
        service_id: response.service.id,
        verified: response.service.verified,
      });
    } else if (response.intent === 'unknown') {
      await logEvent(db, userId, conversationId, 'service_not_found');
    }

    return json(response);
  } catch (error) {
    console.error('Ask MIGSEL request failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return json(
      {
        error:
          'I could not look that up right now. Please try again without including personal information.',
      },
      500,
    );
  }
});
