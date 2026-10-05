export const MAX_MESSAGE_LENGTH = 500;
export const MAX_HISTORY_MESSAGES = 8;
export const MAX_HISTORY_CHARACTERS = 3_000;
export const HIGH_CONFIDENCE = 0.8;
export const MEDIUM_CONFIDENCE = 0.55;
export const SERVICE_MATCH_CONFIDENCE = 0.55;
export const SERVICE_CHOICE_CONFIDENCE = 0.35;
export const REQUESTS_PER_MINUTE = 20;
export const MODEL_TIMEOUT_MS = 12_000;

export const VALID_INTENTS = [
  'grievance',
  'government_service',
  'information',
  'application_followup',
  'emergency',
  'unknown',
] as const;

export const VALID_GRIEVANCE_CATEGORIES = [
  'road',
  'garbage',
  'lighting',
  'drainage',
  'other',
] as const;
