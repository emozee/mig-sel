begin;

select plan(12);

select ok((select relrowsecurity from pg_class where oid = 'public.services'::regclass), 'services has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.service_providers'::regclass), 'providers has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.ai_conversations'::regclass), 'conversations have RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.ai_messages'::regclass), 'messages have RLS');
select ok(not has_function_privilege('authenticated', 'public.search_ask_migsel_services(text,integer)', 'EXECUTE'), 'citizens cannot execute trusted retrieval directly');
select ok(not has_function_privilege('authenticated', 'public.check_ask_migsel_rate_limit(text,integer,integer)', 'EXECUTE'), 'citizens cannot alter rate-limit counters');
select ok(not has_table_privilege('authenticated', 'public.ai_conversations', 'INSERT'), 'citizens cannot write conversations directly');
select ok(not has_table_privilege('authenticated', 'public.ai_messages', 'INSERT'), 'citizens cannot write messages directly');
select is(
  (select name from public.search_ask_migsel_services('lost driving licence', 5) limit 1),
  'Replace Driving Licence',
  'exact keyword resolves the replacement service'
);
select is(
  (select name from public.search_ask_migsel_services('missing licence', 5) limit 1),
  'Replace Driving Licence',
  'service synonym resolves the replacement service'
);
select is(
  (select name from public.search_ask_migsel_services('lost driving lisence', 5) limit 1),
  'Replace Driving Licence',
  'trigram search tolerates a common misspelling'
);
select is(
  (select count(*) from public.search_ask_migsel_services('quantum observatory permit', 5)),
  0::bigint,
  'unrelated service is not guessed'
);

select * from finish();
rollback;
