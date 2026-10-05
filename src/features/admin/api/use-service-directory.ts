import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ServiceProviderAdmin {
  id: string;
  name: string;
  abbreviation: string | null;
  provider_type: string;
  description: string | null;
  website_url: string | null;
  active: boolean;
  verified: boolean;
  last_verified_at: string | null;
}

export interface ServiceSourceAdmin {
  id: string;
  service_id: string;
  source_name: string;
  source_url: string;
  source_type: string;
  verified: boolean;
  last_verified_at: string | null;
}

export interface ServiceAdmin {
  id: string;
  provider_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  detailed_description: string | null;
  service_category: string;
  official_url: string | null;
  online_available: boolean | null;
  requirements: string | null;
  fees: string | null;
  processing_time: string | null;
  active: boolean;
  verified: boolean;
  last_verified_at: string | null;
  service_providers: { name: string } | null;
  service_keywords: Array<{ id: string; keyword: string; language: string }>;
  service_sources: ServiceSourceAdmin[];
}

export interface ServiceQuestionAdmin {
  id: string;
  service_family: string;
  question_key: string;
  question_text: string;
  question_type: 'single_choice' | 'free_text';
  required: boolean;
  active: boolean;
  sort_order: number;
  service_question_options: Array<{
    id: string;
    label: string;
    value: string;
    target_service_id: string | null;
    sort_order: number;
  }>;
}

export const serviceDirectoryKeys = { all: ['ask-migsel-directory'] as const };

export function useServiceDirectoryAdmin() {
  return useQuery({
    queryKey: serviceDirectoryKeys.all,
    queryFn: async () => {
      const [providersResult, servicesResult, questionsResult] = await Promise.all([
        supabase.from('service_providers').select('*').order('name'),
        supabase
          .from('services')
          .select(
            '*, service_providers(name), service_keywords(id, keyword, language), service_sources(*)',
          )
          .order('name'),
        supabase
          .from('service_questions')
          .select('*, service_question_options(*)')
          .order('sort_order'),
      ]);
      if (providersResult.error) throw providersResult.error;
      if (servicesResult.error) throw servicesResult.error;
      if (questionsResult.error) throw questionsResult.error;
      return {
        providers: (providersResult.data ?? []) as ServiceProviderAdmin[],
        services: (servicesResult.data ?? []) as ServiceAdmin[],
        questions: (questionsResult.data ?? []) as ServiceQuestionAdmin[],
      };
    },
  });
}

function useDirectoryMutation<T>(mutationFn: (input: T) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceDirectoryKeys.all }),
  });
}

export function useSaveServiceProvider() {
  return useDirectoryMutation<Partial<ServiceProviderAdmin> & { name: string }>(async (input) => {
    const payload = {
      name: input.name,
      abbreviation: input.abbreviation || null,
      provider_type: input.provider_type ?? 'other',
      description: input.description || null,
      website_url: input.website_url || null,
      active: input.active ?? true,
      verified: input.verified ?? false,
    };
    const query = input.id
      ? supabase.from('service_providers').update(payload).eq('id', input.id)
      : supabase.from('service_providers').insert(payload);
    const { error } = await query;
    if (error) throw error;
  });
}

export function useSaveService() {
  return useDirectoryMutation<
    Partial<ServiceAdmin> & {
      name: string;
      slug: string;
      provider_id: string;
      service_category: string;
      keywords: string[];
    }
  >(async (input) => {
    const payload = {
      provider_id: input.provider_id,
      name: input.name,
      slug: input.slug,
      short_description: input.short_description || null,
      detailed_description: input.detailed_description || null,
      service_category: input.service_category,
      official_url: input.official_url || null,
      online_available: input.online_available ?? null,
      requirements: input.requirements || null,
      fees: input.fees || null,
      processing_time: input.processing_time || null,
      active: input.active ?? true,
      verified: input.verified ?? false,
    };
    let serviceId = input.id;
    if (serviceId) {
      const { error } = await supabase.from('services').update(payload).eq('id', serviceId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('services').insert(payload).select('id').single();
      if (error) throw error;
      serviceId = data.id;
    }
    const { error: deleteError } = await supabase
      .from('service_keywords')
      .delete()
      .eq('service_id', serviceId);
    if (deleteError) throw deleteError;
    if (input.keywords.length > 0) {
      const { error } = await supabase
        .from('service_keywords')
        .insert(
          input.keywords.map((keyword) => ({ service_id: serviceId, keyword, language: 'en' })),
        );
      if (error) throw error;
    }
  });
}

export function useSaveServiceSource() {
  return useDirectoryMutation<{
    id?: string;
    service_id: string;
    source_name: string;
    source_url: string;
    verified: boolean;
  }>(async (input) => {
    const payload = {
      service_id: input.service_id,
      source_name: input.source_name,
      source_url: input.source_url,
      source_type: 'official_website',
      verified: input.verified,
    };
    const query = input.id
      ? supabase.from('service_sources').update(payload).eq('id', input.id)
      : supabase.from('service_sources').insert(payload);
    const { error } = await query;
    if (error) throw error;
  });
}

export function useDeleteServiceSource() {
  return useDirectoryMutation<string>(async (id) => {
    const { error } = await supabase.from('service_sources').delete().eq('id', id);
    if (error) throw error;
  });
}

export function useSaveServiceQuestion() {
  return useDirectoryMutation<
    Partial<ServiceQuestionAdmin> & {
      question_key: string;
      question_text: string;
      service_family: string;
    }
  >(async (input) => {
    const payload = {
      question_key: input.question_key,
      question_text: input.question_text,
      service_family: input.service_family,
      question_type: input.question_type ?? 'single_choice',
      required: input.required ?? false,
      active: input.active ?? true,
      sort_order: input.sort_order ?? 0,
    };
    const query = input.id
      ? supabase.from('service_questions').update(payload).eq('id', input.id)
      : supabase.from('service_questions').insert(payload);
    const { error } = await query;
    if (error) throw error;
  });
}

export function useSaveQuestionOption() {
  return useDirectoryMutation<{
    question_id: string;
    label: string;
    value: string;
    target_service_id?: string;
  }>(async (input) => {
    const { error } = await supabase.from('service_question_options').insert({
      question_id: input.question_id,
      label: input.label,
      value: input.value,
      target_service_id: input.target_service_id || null,
    });
    if (error) throw error;
  });
}

export function useDeleteQuestionOption() {
  return useDirectoryMutation<string>(async (id) => {
    const { error } = await supabase.from('service_question_options').delete().eq('id', id);
    if (error) throw error;
  });
}
