export interface KnowledgeItem {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  created_at: string;
  updated_at?: string;
  score?: number;
}

export interface UnansweredQuestion {
  id: number;
  question: string;
  matched_question: string | null;
  score: number | null;
  created_at: string;
}

export type MigselIntent =
  | 'grievance'
  | 'government_service'
  | 'information'
  | 'application_followup'
  | 'emergency'
  | 'unknown';

export type AskMigselAction =
  | { type: 'OPEN_OFFICIAL_SERVICE'; label: string; url: string }
  | {
      type: 'START_MIGSEL_GRIEVANCE';
      label: string;
      categoryId?: string;
      description?: string;
    }
  | { type: 'ANSWER_CLARIFICATION'; label: string; value: string }
  | { type: 'CONTACT_SUPPORT'; label: string; value?: string };

export interface AskMigselService {
  id: string;
  name: string;
  providerName: string;
  category: string;
  description?: string;
  officialUrl?: string;
  requirements?: string;
  fees?: string;
  processingTime?: string;
  verified: boolean;
  lastVerifiedAt?: string;
  sourceName?: string;
  sourceUrl?: string;
}

export interface AskMigselResponse {
  conversationId: string;
  message: string;
  intent: MigselIntent;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  service?: AskMigselService;
  actions: AskMigselAction[];
}

export interface AskMigselHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskMigselChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AskMigselResponse;
}

export interface AskMigselHandoff {
  source: 'ask-migsel';
  category?: string;
  description: string;
}
