-- Treat the user-facing "MIGSEL Coin" wording as an alias for points and rewards.
update public.chatbot_knowledge
set keywords = coalesce(keywords, '{}'::text[]) || array[
  'migsel coin',
  'migsel coins',
  'use migsel coin',
  'spend migsel coin'
]
where question = 'What can I do with my points?'
  and not (coalesce(keywords, '{}'::text[]) @> array['migsel coin']);
