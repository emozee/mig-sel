// Edge Function: classify-grievance-image
// Uses Hugging Face Inference API with CLIP zero-shot to classify grievance photos.
// Requires HUGGINGFACE_API_KEY secret (free, sign up at huggingface.co).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const HF_API_URL = 'https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32';
const HF_TOKEN = Deno.env.get('HUGGINGFACE_API_KEY');

const LABELS = [
  'a clear photo of a road pothole or road damage',
  'a clear photo of garbage or waste on the ground',
  'a clear photo of a broken street light',
  'a clear photo of a drainage or sewage problem',
  'a clear photo of a damaged sidewalk or road crack',
  'a photo of a person or a selfie',
  'a photo of an animal or pet',
  'a blurry or unclear photo',
  'a screenshot of text or a phone screen',
  'a landscape or nature photo without any visible issue',
];

const GRIEVANCE_LABELS = new Set([
  'a clear photo of a road pothole or road damage',
  'a clear photo of garbage or waste on the ground',
  'a clear photo of a broken street light',
  'a clear photo of a drainage or sewage problem',
  'a clear photo of a damaged sidewalk or road crack',
]);

interface ClassificationResult {
  is_grievance: boolean;
  scores: Record<string, number>;
  top_label: string;
  top_score: number;
  error?: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!HF_TOKEN) {
    return new Response(
      JSON.stringify({
        is_grievance: true,
        scores: {},
        top_label: 'unknown',
        top_score: 0,
        error: 'Hugging Face API key not configured. Image moderation is disabled.',
      } satisfies ClassificationResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { image_url } = await req.json();

    if (!image_url || typeof image_url !== 'string') {
      return new Response(JSON.stringify({ error: 'image_url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the image from Supabase storage
    const imageResp = await fetch(image_url);
    if (!imageResp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageBytes = new Uint8Array(await imageResp.arrayBuffer());

    // Send to Hugging Face CLIP zero-shot classification as base64 JSON
    const hfResp = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: bytesToBase64(imageBytes),
        parameters: { candidate_labels: LABELS },
      }),
    });

    if (!hfResp.ok) {
      const hfError = await hfResp.text();
      console.error('Hugging Face API error:', hfResp.status, hfError);

      if (hfResp.status === 503) {
        return new Response(
          JSON.stringify({
            is_grievance: true,
            scores: {},
            top_label: 'loading',
            top_score: 0,
            error: 'Model is loading. Please try again.',
          } satisfies ClassificationResult),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          is_grievance: true,
          scores: {},
          top_label: 'error',
          top_score: 0,
          error: `Hugging Face API error: ${hfResp.status}`,
        } satisfies ClassificationResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const result: unknown = await hfResp.json();

    if (!Array.isArray(result) || result.length === 0) {
      return new Response(
        JSON.stringify({
          is_grievance: true,
          scores: {},
          top_label: 'unknown',
          top_score: 0,
          error: 'Unexpected response format from Hugging Face API',
        } satisfies ClassificationResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // CLIP returns [{ sequence: string, score: number }]
    const scores = result as Array<{ sequence: string; score: number }>;
    scores.sort((a, b) => b.score - a.score);

    const top = scores[0];
    const isGrievance = GRIEVANCE_LABELS.has(top.sequence) && top.score > 0.3;

    const scoreMap: Record<string, number> = {};
    for (const s of scores) {
      scoreMap[s.sequence] = s.score;
    }

    return new Response(
      JSON.stringify({
        is_grievance: isGrievance,
        scores: scoreMap,
        top_label: top.sequence,
        top_score: top.score,
      } satisfies ClassificationResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Classification error:', error);
    return new Response(
      JSON.stringify({
        is_grievance: true,
        scores: {},
        top_label: 'error',
        top_score: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      } satisfies ClassificationResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
