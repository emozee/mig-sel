-- Chatbot KB: urgency/status controls are locked until a report is approved.
insert into public.chatbot_knowledge (question, answer, keywords)
values
  (
    'Why can I not change the urgency or status of some reports?',
    'Reports that have not been approved yet are locked — their urgency (high, medium, low) and status show as plain badges instead of dropdowns. Tap Approve on the report first; once approved, the dropdowns unlock and you can set urgency and status. This prevents points being awarded for reports that might later be rejected.',
    '{}'
  )
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;
