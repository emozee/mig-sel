import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { KnowledgeItem } from '../types';

export const knowledgeKeys = {
  all: ['knowledge'] as const,
  list: () => [...knowledgeKeys.all, 'list'] as const,
  search: (query: string) => [...knowledgeKeys.all, 'search', query] as const,
};

function mapKnowledge(raw: Record<string, unknown>): KnowledgeItem {
  return {
    id: raw.id as number,
    question: raw.question as string,
    answer: raw.answer as string,
    keywords: (raw.keywords as string[]) ?? [],
    created_at: raw.created_at as string,
    updated_at: (raw.updated_at as string) ?? undefined,
  };
}

export const useKnowledge = () => {
  return useQuery({
    queryKey: knowledgeKeys.list(),
    queryFn: async (): Promise<KnowledgeItem[]> => {
      const { data, error } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .order('question', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapKnowledge);
    },
  });
};

export const useSearchKnowledge = (query: string) => {
  return useQuery({
    queryKey: knowledgeKeys.search(query),
    queryFn: async (): Promise<KnowledgeItem | null> => {
      if (!query.trim()) return null;

      const lowerQuery = query.toLowerCase().trim();

      const { data, error } = await supabase.from('chatbot_knowledge').select('*');

      if (error) throw error;

      const items = (data ?? []).map(mapKnowledge);

      const scored = items.map((item) => {
        let score = 0;
        if (item.question.toLowerCase().includes(lowerQuery)) score += 3;
        if (item.answer.toLowerCase().includes(lowerQuery)) score += 1;
        for (const kw of item.keywords) {
          if (lowerQuery.includes(kw.toLowerCase())) score += 2;
        }
        return { item, score };
      });

      scored.sort((a, b) => b.score - a.score);

      return scored.length > 0 && scored[0].score > 0 ? scored[0].item : null;
    },
    enabled: query.trim().length > 0,
  });
};

type CreateInput = {
  question: string;
  answer: string;
  keywords: string[];
};

export const useCreateKnowledge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const { error } = await supabase.from('chatbot_knowledge').insert({
        question: input.question,
        answer: input.answer,
        keywords: input.keywords,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
  });
};

type UpdateInput = CreateInput & { id: number };

export const useUpdateKnowledge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateInput) => {
      const { error } = await supabase
        .from('chatbot_knowledge')
        .update({
          question: input.question,
          answer: input.answer,
          keywords: input.keywords,
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
  });
};

export const useDeleteKnowledge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('chatbot_knowledge').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
  });
};
