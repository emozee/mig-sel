-- Store the AI photo classification on the grievance so admins can see why a
-- report was flagged when the user chose "Submit anyway".
alter table public.grievances
  add column if not exists ai_label text;

-- Chatbot KB: reflect that admins can see AI flags and permanently remove junk reports.
insert into public.chatbot_knowledge (question, answer, keywords)
values
  (
    'What happens after I submit a flagged photo?',
    'If the AI warns that your photo may not show a civic issue and you choose "Submit anyway", the report is still sent for admin review. Admins can see the AI label on the report and will permanently remove it if it is not a genuine issue.',
    '{}'
  )
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;
