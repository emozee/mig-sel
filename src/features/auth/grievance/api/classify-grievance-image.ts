import { supabase } from '@/lib/supabase';

export interface ClassificationResult {
  is_grievance: boolean;
  scores: Record<string, number>;
  top_label: string;
  top_score: number;
  error?: string;
}

export const classifyGrievanceImage = async (imageUrl: string): Promise<ClassificationResult> => {
  const { data, error } = await supabase.functions.invoke('classify-grievance-image', {
    body: { image_url: imageUrl },
  });

  if (error) {
    return {
      is_grievance: true,
      scores: {},
      top_label: 'unknown',
      top_score: 0,
      error: error.message,
    };
  }

  return data as ClassificationResult;
};
