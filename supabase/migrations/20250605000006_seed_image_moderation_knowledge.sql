-- Seed chatbot knowledge about AI image moderation
insert into public.chatbot_knowledge (question, answer)
values
  (
    'how does AI image moderation work',
    'When you upload a photo for a grievance report, it is analyzed using AI (CLIP zero-shot classification) to check if the image shows a valid civic issue like a pothole, garbage pile, broken street light, or drainage problem. If the AI detects the photo may not show an issue (e.g., a selfie, an animal, or a blurry photo), you will see a warning but can still submit. An admin will review all submissions.'
  ),
  (
    'will my report be rejected if the AI flags it',
    'No. The AI image check is advisory only — it does not block your submission. You can always choose to submit anyway, and an admin will review your report. The AI helps reduce spam but the final decision is made by human admins.'
  ),
  (
    'what AI model is used for image moderation',
    'The app uses OpenAI CLIP (Contrastive Language-Image Pre-Training) via Hugging Face''s free Inference API. It compares your photo against categories like "a pothole on a road" or "a person taking a selfie" and reports which category the photo most closely matches. This runs entirely server-side and no image data is stored by the AI service.'
  ),
  (
    'is image classification free',
    'Yes. The app uses Hugging Face''s free Inference API tier with the open-source CLIP model. No payment is required. The model runs on Hugging Face''s servers and the result is returned instantly.'
  ),
  (
    'what happens to my photo during AI analysis',
    'Your photo is fetched from Supabase Storage by our Edge Function, sent to Hugging Face''s Inference API for classification, and the result (label + confidence score) is returned. The image itself is not stored by Hugging Face. If the API is unavailable or misconfigured, the submission proceeds without classification.'
  )
on conflict (question) do nothing;
