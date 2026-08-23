import { supabase } from '@/lib/supabase';

export interface ClassificationResult {
  is_grievance: boolean;
  scores: Record<string, number>;
  top_label: string;
  top_score: number;
  error?: string;
}

const failOpen = (message: string): ClassificationResult => ({
  is_grievance: true,
  scores: {},
  top_label: 'unknown',
  top_score: 0,
  error: message,
});

// Plain fetch instead of supabase.functions.invoke: the functions gateway's
// CORS preflight only allows Content-Type + Authorization, while invoke always
// sends apikey and x-client-info headers — browsers reject the request before
// it ever reaches the function ("Failed to send a request to the Edge
// Function"). Non-browser calls were never affected, which is why every
// curl/Node test passed while real users silently failed open.
const callFunction = async (imageUrl: string, hash?: string | null): Promise<Response> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-grievance-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ image_url: imageUrl, hash: hash ?? undefined }),
  });
};

export const classifyGrievanceImage = async (
  imageUrl: string,
  hash?: string | null,
): Promise<ClassificationResult> => {
  let resp: Response;

  try {
    resp = await callFunction(imageUrl, hash);
  } catch (err) {
    return failOpen(err instanceof Error ? err.message : 'Network error calling AI check');
  }

  // Stale/expired session token gets rejected by the gateway (verify_jwt).
  // Refresh once and retry before failing open.
  if ((resp.status === 401 || resp.status === 403) && supabase.auth) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError) {
        try {
          resp = await callFunction(imageUrl, hash);
        } catch (err) {
          return failOpen(err instanceof Error ? err.message : 'Network error calling AI check');
        }
      }
    }
  }

  if (!resp.ok) {
    return failOpen(`AI service returned ${resp.status}`);
  }

  try {
    return (await resp.json()) as ClassificationResult;
  } catch {
    return failOpen('AI service returned an invalid response');
  }
};
