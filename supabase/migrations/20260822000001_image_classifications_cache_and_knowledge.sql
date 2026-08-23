-- Image classification result cache + refreshed chatbot knowledge about AI moderation.
--
-- The classifier edge function stores results keyed by the SHA-256 hash of the uploaded
-- photo, so repeat uploads of the same image are answered from cache instead of calling
-- the AI provider again (saves latency and Hugging Face credits).

create table if not exists public.image_classifications (
  image_hash text primary key,
  is_grievance boolean not null,
  top_label text not null,
  top_score numeric not null check (top_score >= 0 and top_score <= 1),
  classified_at timestamptz not null default now()
);

alter table public.image_classifications enable row level security;

-- No policies: the table is only accessed by the classify-grievance-image edge
-- function using the service role key (which bypasses RLS). Clients have no need
-- to read or write classifications directly.

-- Refresh chatbot knowledge: previous answers described the retired CLIP pipeline
-- and incorrectly claimed the AI check never blocks submissions.
insert into public.chatbot_knowledge (question, answer)
values
  (
    'how does AI image moderation work',
    E'When you upload a photo for a grievance report, an AI vision model checks whether it shows a real civic issue (pothole, garbage, broken street light, drainage or sidewalk damage). If the photo is clearly something else - like a selfie, a pet, a blurry shot or a screenshot - the app will show a warning and ask you to upload a proper photo of the issue instead. Genuine reports always go through, and every accepted report is still reviewed by an admin before it appears on the map.'
  ),
  (
    'will my report be rejected if the AI flags it',
    'Only if the photo is clearly not showing a civic issue (for example a selfie, a pet, a blurry picture or a screenshot) will the app ask you to retake the photo. Real reports of actual problems are never rejected by the AI - and even then, every submission is reviewed by a human admin before approval.'
  ),
  (
    'what AI model is used for image moderation',
    'The app uses Qwen3-VL, an open-source vision-language model, served through the Hugging Face Inference Providers platform. It looks at your photo and returns one category (such as pothole, garbage or person taking a selfie) together with a confidence score. Classification runs server-side in our Edge Function.'
  ),
  (
    'is image classification free',
    'Yes for normal usage. Classification runs on Hugging Face''s pay-as-you-go credits, which include a small free monthly allowance, and identical photos are cached so they are only classified once. You would only ever pay fractions of a cent per unique photo, far beyond typical usage.'
  ),
  (
    'what happens to my photo during AI analysis',
    'Your photo is fetched from Supabase Storage by our Edge Function, sent to the AI model provider for classification, and only the result (category and confidence) comes back. The image itself is not stored by the AI service. Results are cached by photo fingerprint, so re-uploading the exact same photo is answered instantly without calling the AI again.'
  ),
  (
    'why was my photo rejected',
    'The AI only rejects photos that are clearly not reports of civic issues - such as selfies, photos of pets, blurry images, phone screenshots or plain scenery. Please retake a clear, well-lit photo showing the actual problem (pothole, garbage, broken light etc.) and submit again. If you believe your genuine report was rejected by mistake, contact support or try submitting again - an admin reviews everything anyway.'
  )
on conflict (question) do update set answer = excluded.answer;
