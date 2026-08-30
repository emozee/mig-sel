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
