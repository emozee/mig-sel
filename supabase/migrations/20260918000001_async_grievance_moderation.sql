-- Reports are now saved before AI photo moderation. The classifier runs in the
-- background and adds ai_label only when a photo appears unrelated to a civic issue.
insert into public.chatbot_knowledge (question, answer, keywords)
values
  (
    'What happens after I submit a flagged photo?',
    'Your report is submitted immediately and the AI photo check continues in the background. Every new report remains pending for admin review, and photos that appear unrelated to a civic issue are labeled for the admin.',
    '{}'
  )
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;
