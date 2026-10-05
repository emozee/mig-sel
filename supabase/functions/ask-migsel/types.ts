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

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Classification {
  intent: MigselIntent;
  confidence: number;
  normalizedQuery: string;
  possibleServiceCategory: string | null;
  possibleGrievanceCategory: string | null;
  needsClarification: boolean;
  clarificationQuestion: string | null;
  serviceSearchQuery?: string;
  questionKey?: string;
}

export interface ServiceSearchRow {
  id: string;
  name: string;
  provider_name: string;
  service_category: string;
  description: string | null;
  official_url: string | null;
  requirements: string | null;
  fees: string | null;
  processing_time: string | null;
  verified: boolean;
  last_verified_at: string | null;
  source_name: string | null;
  source_url: string | null;
  match_score: number;
}
