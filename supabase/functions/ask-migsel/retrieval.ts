import { SERVICE_CHOICE_CONFIDENCE, SERVICE_MATCH_CONFIDENCE } from './constants.ts';
import type {
  AskMigselAction,
  AskMigselResponse,
  AskMigselService,
  Classification,
  ServiceSearchRow,
} from './types.ts';

export interface DatabaseClient {
  rpc<T>(name: string, body: Record<string, unknown>): Promise<T>;
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

function safeHttpUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function mapService(row: ServiceSearchRow): AskMigselService {
  return {
    id: row.id,
    name: row.name,
    providerName: row.provider_name,
    category: row.service_category,
    description: row.description ?? undefined,
    officialUrl: row.verified ? safeHttpUrl(row.official_url) : undefined,
    requirements: row.verified ? (row.requirements ?? undefined) : undefined,
    fees: row.verified ? (row.fees ?? undefined) : undefined,
    processingTime: row.verified ? (row.processing_time ?? undefined) : undefined,
    verified: row.verified,
    lastVerifiedAt: row.verified ? (row.last_verified_at ?? undefined) : undefined,
    sourceName: row.verified ? (row.source_name ?? undefined) : undefined,
    sourceUrl: row.verified ? safeHttpUrl(row.source_url) : undefined,
  };
}

export async function retrieveServices(
  db: DatabaseClient,
  query: string,
): Promise<ServiceSearchRow[]> {
  return await db.rpc<ServiceSearchRow[]>('search_ask_migsel_services', {
    search_query: query,
    result_limit: 5,
  });
}

export async function retrieveMigselKnowledge(
  db: DatabaseClient,
  query: string,
): Promise<{ answer: string; score: number } | null> {
  const rows = await db.rpc<Array<{ answer: string; similarity_score: number }>>(
    'search_chatbot_knowledge',
    { search_query: query },
  );
  const best = rows[0];
  const score = Number(best?.similarity_score ?? 0);
  return best && score >= 0.45 ? { answer: best.answer, score } : null;
}

export async function retrieveClarificationQuestion(
  db: DatabaseClient,
  questionKey: string,
): Promise<{ question: string; actions: AskMigselAction[] } | null> {
  const rows = await db.request<
    Array<{
      question_text: string;
      service_question_options: Array<{ label: string; value: string; sort_order: number }>;
    }>
  >(
    `service_questions?select=question_text,service_question_options(label,value,sort_order)&question_key=eq.${encodeURIComponent(questionKey)}&active=eq.true&limit=1`,
  );
  const item = rows[0];
  if (!item) return null;
  return {
    question: item.question_text,
    actions: item.service_question_options
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((option) => ({
        type: 'ANSWER_CLARIFICATION' as const,
        label: option.label,
        value: option.value,
      })),
  };
}

export function grievanceResponse(
  conversationId: string,
  classification: Classification,
  citizenMessage: string,
): AskMigselResponse {
  if (classification.needsClarification && classification.clarificationQuestion) {
    return {
      conversationId,
      message: classification.clarificationQuestion,
      intent: 'grievance',
      confidence: classification.confidence,
      needsClarification: true,
      clarificationQuestion: classification.clarificationQuestion,
      actions: [],
    };
  }

  return {
    conversationId,
    message:
      'This looks like a civic issue MIGSEL can handle. You can review the details, add the required photo and location, and confirm the report in the existing MIGSEL reporting flow.',
    intent: 'grievance',
    confidence: classification.confidence,
    needsClarification: false,
    actions: [
      {
        type: 'START_MIGSEL_GRIEVANCE',
        label: 'Report through MIGSEL',
        categoryId: classification.possibleGrievanceCategory ?? 'other',
        description: citizenMessage,
      },
    ],
  };
}

export function emergencyResponse(conversationId: string, confidence: number): AskMigselResponse {
  return {
    conversationId,
    message:
      'This may be an emergency. Contact the appropriate local emergency authority immediately or ask someone nearby for urgent help. MIGSEL does not have a verified emergency contact for this situation and will not place it in the ordinary grievance queue.',
    intent: 'emergency',
    confidence,
    needsClarification: false,
    actions: [],
  };
}

export function clarificationResponse(
  conversationId: string,
  classification: Classification,
): AskMigselResponse {
  const question =
    classification.clarificationQuestion ??
    'Could you tell me a little more about what you are trying to do?';
  return {
    conversationId,
    message: question,
    intent: classification.intent,
    confidence: classification.confidence,
    needsClarification: true,
    clarificationQuestion: question,
    actions: [],
  };
}

export function serviceResponse(
  conversationId: string,
  classification: Classification,
  rows: ServiceSearchRow[],
): AskMigselResponse | null {
  const best = rows[0];
  if (!best || Number(best.match_score) < SERVICE_CHOICE_CONFIDENCE) return null;

  if (Number(best.match_score) < SERVICE_MATCH_CONFIDENCE && rows.length > 1) {
    const choices: AskMigselAction[] = rows.slice(0, 3).map((row) => ({
      type: 'ANSWER_CLARIFICATION',
      label: row.name,
      value: row.name,
    }));
    return {
      conversationId,
      message: 'Which of these best matches what you need?',
      intent: classification.intent,
      confidence: Math.min(classification.confidence, 0.6),
      needsClarification: true,
      clarificationQuestion: 'Which of these best matches what you need?',
      actions: choices,
    };
  }

  const service = mapService(best);
  const actions: AskMigselAction[] = [];
  if (service.verified && service.officialUrl) {
    actions.push({
      type: 'OPEN_OFFICIAL_SERVICE',
      label: 'Open Official Service',
      url: service.officialUrl,
    });
  }

  const message = service.verified
    ? `I found a verified service: ${service.name}, provided by ${service.providerName}.`
    : `I found a possible service, ${service.name}, but MIGSEL has not verified its current information yet. It is not being presented as authoritative guidance.`;

  return {
    conversationId,
    message,
    intent: classification.intent,
    confidence: Math.min(1, Math.max(classification.confidence, Number(best.match_score))),
    needsClarification: false,
    service,
    actions,
  };
}

export function followupResponse(
  conversationId: string,
  classification: Classification,
  serviceResult: AskMigselResponse | null,
): AskMigselResponse {
  if (classification.needsClarification)
    return clarificationResponse(conversationId, classification);
  if (serviceResult?.service?.verified) {
    return {
      ...serviceResult,
      intent: 'application_followup',
      message: `MIGSEL cannot see the status of an external application. Use the verified ${serviceResult.service.name} channel shown here to follow up, and share a reference number only on that official channel if requested.`,
    };
  }
  return {
    conversationId,
    message:
      "MIGSEL cannot access another agency's application status, and I could not find a verified follow-up channel for that service. Please use an official receipt or acknowledgement you already received, without sharing personal reference details here.",
    intent: 'application_followup',
    confidence: classification.confidence,
    needsClarification: false,
    actions: [],
  };
}
