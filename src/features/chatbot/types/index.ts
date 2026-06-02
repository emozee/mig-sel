export interface KnowledgeItem {
  id: number;
  question: string;
  answer: string;
  keywords: string[];
  created_at: string;
  updated_at?: string;
}
