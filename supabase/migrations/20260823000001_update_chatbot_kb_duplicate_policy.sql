-- Update chatbot knowledge: duplicate-photo policy changed on 2026-08-23.
-- The "nearby reports found" advisory was removed; only identical photos
-- (same SHA-256 hash within 10m) trigger a warning now. AI checks every photo
-- and flags non-grievance images (selfies, animals, etc.) before submission.

insert into public.chatbot_knowledge (question, answer, keywords)
values
  (
    'What happens if I upload the same photo twice?',
    'MIGSEL checks every submitted photo against previous reports near you. If the exact same photo is uploaded again within 10 metres of its original location, you will see a "Same photo already submitted" warning. You can still submit — an admin will review it.',
    '{}'
  ),
  (
    'Does MIGSEL check my photo before submitting?',
    'Yes. Every photo is automatically analysed by AI before your report is created. If the photo does not look like a civic issue (for example a selfie, an animal, or a blurry image), you will see a "Photo may not show an issue" warning first. You can still submit — all reports are reviewed by admins.',
    '{}'
  ),
  (
    'Why do I see a warning about nearby reports?',
    'If someone already submitted the exact same photo within 10 metres of you, MIGSEL shows a duplicate-photo warning so the same problem is not reported twice with identical evidence. Different photos at the same spot are always accepted without warnings.',
    '{}'
  )
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;
