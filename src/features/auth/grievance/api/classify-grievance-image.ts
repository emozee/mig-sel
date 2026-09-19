import { supabase } from '@/lib/supabase';

const QUEUE_TIMEOUT_MS = 10_000;

// Plain fetch instead of supabase.functions.invoke: the functions gateway's
// CORS preflight only allows Content-Type + Authorization, while invoke always
// sends apikey and x-client-info headers — browsers reject the request before
// it ever reaches the function ("Failed to send a request to the Edge
// Function"). Non-browser calls were never affected, which is why every
// curl/Node test passed while real users silently failed open.
const callFunction = async (grievanceId: string, signal: AbortSignal): Promise<Response> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-grievance-image`, {
    method: 'POST',
    signal,
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ grievance_id: grievanceId }),
  });
};

export const queueGrievanceImageClassification = async (grievanceId: string): Promise<void> => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), QUEUE_TIMEOUT_MS);

  try {
    let resp = await callFunction(grievanceId, controller.signal);

    // Stale/expired session token gets rejected by the gateway (verify_jwt).
    // Refresh once and retry before giving up on the background job.
    if ((resp.status === 401 || resp.status === 403) && supabase.auth) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          resp = await callFunction(grievanceId, controller.signal);
        }
      }
    }

    if (!resp.ok && resp.status !== 202) {
      throw new Error(`AI photo check could not be queued (${resp.status})`);
    }
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('Timed out while queueing the AI photo check', { cause: err });
    }
    throw err;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};
