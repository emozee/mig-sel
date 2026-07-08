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
    staleTime: 300_000,
    queryFn: async (): Promise<KnowledgeItem[]> => {
      const { data, error } = await supabase
        .from('chatbot_knowledge')
        .select('id, question, answer, keywords, created_at, updated_at')
        .order('question', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(mapKnowledge);
    },
  });
};

export const useSearchKnowledge = (query: string) => {
  return useQuery({
    queryKey: knowledgeKeys.search(query),
    staleTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<KnowledgeItem | null> => {
      if (!query.trim()) return null;

      const { data, error } = await supabase.rpc('search_chatbot_knowledge', {
        search_query: query.trim(),
      });

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const best = data[0];
      return {
        id: best.id as number,
        question: best.question as string,
        answer: best.answer as string,
        keywords: (best.keywords as string[]) ?? [],
        created_at: '',
        updated_at: undefined,
        score: (best.similarity_score as number) ?? 0,
      };
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
