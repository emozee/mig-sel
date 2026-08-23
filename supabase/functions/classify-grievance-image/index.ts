// Edge Function: classify-grievance-image
// Classifies grievance photos using a vision-language model (Qwen3-VL) served by an
// Inference Provider (deepinfra) through the Hugging Face router.
// History: api-inference.huggingface.co was retired and hf-inference dropped CLIP/zero-shot
// hosting entirely, so a VLM chat-completions approach is used instead.
// Features:
//  - Structured reply parsing with confidence score (synonym fallback if model is chatty)
//  - Retry with backoff on transient provider errors (429/5xx/network)
//  - Result cache keyed by image SHA-256 so repeat uploads never pay for AI twice
// Requires HUGGINGFACE_API_KEY secret. Uses auto-injected SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY for the cache table.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
// Pinned to deepinfra because featherless-ai (the other host of this model family)
// rejects image inputs through the HF router.
const MODEL_ID = 'Qwen/Qwen3-VL-30B-A3B-Instruct:deepinfra';
const HF_TOKEN = Deno.env.get('HUGGINGFACE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const GRIEVANCE_CATEGORIES = [
  'pothole',
  'garbage',
  'street_light',
  'drainage',
  'sidewalk_damage',
] as const;

const NON_GRIEVANCE_CATEGORIES = [
  'person_selfie',
  'animal',
  'blurry',
  'screenshot',
  'landscape',
] as const;

const ALL_CATEGORIES = [...GRIEVANCE_CATEGORIES, ...NON_GRIEVANCE_CATEGORIES];

const CLASSIFY_PROMPT =
  'Look at this photo and classify it into exactly ONE category from this list:\n' +
  '- pothole: road damage or potholes\n' +
  '- garbage: trash or waste on the ground\n' +
  '- street_light: broken or damaged street light\n' +
  '- drainage: sewage or drainage problems\n' +
  '- sidewalk_damage: cracked or damaged sidewalk pavement\n' +
  '- person_selfie: people, faces, or selfies\n' +
  '- animal: animals or pets\n' +
  '- blurry: unclear or out of focus photo\n' +
  '- screenshot: phone screen capture or text screenshot\n' +
  '- landscape: nature scenery with no visible civic problem\n' +
  'Reply with ONLY a JSON object in exactly this format and nothing else:\n' +
  '{"category": "<one category from the list>", "confidence": <number between 0 and 1>}';

interface ClassificationResult {
  is_grievance: boolean;
  scores: Record<string, number>;
  top_label: string;
  top_score: number;
  error?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(body: ClassificationResult | Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function bytesToDataUri(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

function extractCategory(reply: string): string | null {
  const text = ` ${reply.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')} `;
  // Grievance categories checked first so ambiguous photos lean toward acceptance.
  const synonyms: Array<[category: string, words: string[]]> = [
    ['pothole', ['pothole', 'road damage', 'damaged road', 'asphalt hole', 'broken road']],
    ['garbage', ['garbage', 'trash', 'litter', 'waste', 'rubbish', 'dumping', 'junk']],
    ['street_light', ['street light', 'streetlight', 'lamp post', 'lamppost', 'light pole']],
    ['drainage', ['drainage', 'sewage', 'sewer', 'manhole', 'waterlogging', 'clogged drain']],
    ['sidewalk_damage', ['sidewalk', 'pavement', 'footpath', 'kerb', 'cracked concrete']],
    [
      'person_selfie',
      [' person', 'people', 'human', 'face', 'portrait', 'selfie', ' man ', ' woman'],
    ],
    ['animal', [' animal', ' dog', ' cat', 'bird', 'pet', 'puppy', 'kitten', 'cow', 'wildlife']],
    ['blurry', ['blurry', 'blur', 'out of focus', 'unclear', 'unfocused']],
    [
      'screenshot',
      ['screenshot', 'screen capture', 'phone screen', 'text message', 'chat interface'],
    ],
    ['landscape', ['landscape', 'scenery', 'nature', 'mountain', 'skyline', 'beach', 'forest']],
  ];
  for (const [category, words] of synonyms) {
    for (const w of words) {
      if (text.includes(w)) return category;
    }
  }
  return null;
}

interface ParsedClassification {
  category: string;
  confidence: number;
}

function parseModelReply(content: string): ParsedClassification | null {
  // Try strict JSON first (model may wrap it in markdown fences).
  const jsonMatch = content.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { category?: string; confidence?: number };
      if (parsed.category && typeof parsed.category === 'string') {
        return {
          category: parsed.category,
          confidence:
            typeof parsed.confidence === 'number'
              ? Math.min(1, Math.max(0, parsed.confidence))
              : 0.8,
        };
      }
    } catch {
      /* fall through to synonym matching */
    }
  }
  // Fallback: keyword/synonym extraction from free text.
  const category = extractCategory(content);
  if (category) return { category, confidence: 0.7 };
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const resp = await fetch(url, init);
      if (!resp.ok && [429, 500, 502, 503, 504].includes(resp.status)) {
        lastError = new Error(`HTTP ${resp.status}`);
        console.warn(`Transient HF error ${resp.status}, attempt ${attempt}/${attempts}`);
        await sleep(1000 * attempt);
        continue;
      }
      return resp;
    } catch (err) {
      lastError = err;
      console.warn(`Network error calling HF, attempt ${attempt}/${attempts}:`, err);
      await sleep(1000 * attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('HF request failed');
}

async function readCache(imageHash: string): Promise<ClassificationResult | null> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !imageHash) return null;
  try {
    const url = `${SUPABASE_URL}/rest/v1/image_classifications?select=is_grievance,top_label,top_score&image_hash=eq.${encodeURIComponent(imageHash)}&limit=1`;
    const resp = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    if (!resp.ok) return null;
    const rows = (await resp.json()) as Array<{
      is_grievance: boolean;
      top_label: string;
      top_score: number;
    }>;
    if (!rows.length) return null;
    const row = rows[0];
    console.log(`Cache hit for hash ${imageHash.slice(0, 12)}… → ${row.top_label}`);
    return {
      is_grievance: row.is_grievance,
      scores: { [row.top_label]: Number(row.top_score) },
      top_label: row.top_label,
      top_score: Number(row.top_score),
    };
  } catch (err) {
    console.warn('Cache read failed:', err);
    return null;
  }
}

async function writeCache(
  imageHash: string,
  isGrievance: boolean,
  topLabel: string,
  topScore: number,
): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !imageHash) return;
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/image_classifications`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        image_hash: imageHash,
        is_grievance: isGrievance,
        top_label: topLabel,
        top_score: topScore,
      }),
    });
    if (!resp.ok) {
      console.warn('Cache write failed:', resp.status, await resp.text());
    }
  } catch (err) {
    console.warn('Cache write failed:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!HF_TOKEN) {
    return jsonResponse({
      is_grievance: true,
      scores: {},
      top_label: 'unknown',
      top_score: 0,
      error: 'Hugging Face API key not configured. Image moderation is disabled.',
    });
  }

  try {
    const { image_url: imageUrl, hash } = (await req.json()) as {
      image_url?: string;
      hash?: string;
    };

    if (!imageUrl || typeof imageUrl !== 'string') {
      return jsonResponse({ error: 'image_url is required' }, 400);
    }

    // 1. Cache lookup — identical images are never classified twice.
    if (typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash)) {
      const cached = await readCache(hash);
      if (cached) return jsonResponse(cached);
    }

    // 2. Fetch the image bytes.
    const imageResp = await fetch(imageUrl);
    if (!imageResp.ok) {
      return jsonResponse({ error: 'Failed to fetch image' }, 400);
    }
    const imageBytes = new Uint8Array(await imageResp.arrayBuffer());

    // 3. Ask the VLM to classify (with transient-error retry).
    const hfResp = await fetchWithRetry(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: bytesToDataUri(imageBytes) } },
              { type: 'text', text: CLASSIFY_PROMPT },
            ],
          },
        ],
        max_tokens: 60,
        temperature: 0,
      }),
    });

    if (!hfResp.ok) {
      const hfError = await hfResp.text();
      console.error('Hugging Face API error after retries:', hfResp.status, hfError);
      return jsonResponse({
        is_grievance: true,
        scores: {},
        top_label: hfResp.status === 503 ? 'loading' : 'error',
        top_score: 0,
        error:
          hfResp.status === 503
            ? 'Model is loading. Please try again.'
            : `Hugging Face API error: ${hfResp.status} ${hfError.slice(0, 500)}`,
      });
    }

    const result: unknown = await hfResp.json();
    const content = (result as { choices?: Array<{ message?: { content?: string } }> })
      ?.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({
        is_grievance: true,
        scores: {},
        top_label: 'unknown',
        top_score: 0,
        error: 'Unexpected response format from Hugging Face API',
      });
    }

    const parsed = parseModelReply(content);
    if (!parsed) {
      return jsonResponse({
        is_grievance: true,
        scores: {},
        top_label: 'unknown',
        top_score: 0,
        error: `Unrecognized classification reply: ${content.slice(0, 120)}`,
      });
    }

    const knownCategory = (ALL_CATEGORIES as readonly string[]).includes(parsed.category);
    const category = knownCategory ? parsed.category : extractCategory(parsed.category);
    if (!category) {
      return jsonResponse({
        is_grievance: true,
        scores: {},
        top_label: 'unknown',
        top_score: 0,
        error: `Unrecognized category: ${parsed.category.slice(0, 80)}`,
      });
    }

    const isGrievance = (GRIEVANCE_CATEGORIES as readonly string[]).includes(category);
    const finalResult: ClassificationResult = {
      is_grievance: isGrievance,
      scores: { [category]: parsed.confidence },
      top_label: category,
      top_score: parsed.confidence,
    };

    // 4. Persist to cache for future uploads of the same photo.
    if (typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash)) {
      await writeCache(hash, isGrievance, category, parsed.confidence);
    }

    console.log(
      `Classified ${hash ? hash.slice(0, 12) + '…' : '(no hash)'} → ${category} (${parsed.confidence})`,
    );
    return jsonResponse(finalResult);
  } catch (error) {
    console.error('Classification error:', error);
    return jsonResponse({
      is_grievance: true,
      scores: {},
      top_label: 'error',
      top_score: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
