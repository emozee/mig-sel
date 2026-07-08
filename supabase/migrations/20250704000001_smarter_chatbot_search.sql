-- Enable pg_trgm for fuzzy text matching (handles typos, paraphrasing, word-order variations)
drop extension if exists pg_trgm;
create extension pg_trgm
with schema extensions;

-- Drop old function before recreating (signature changed — returns similarity_score now)
drop function if exists public.search_chatbot_knowledge;

-- Upgrade search function with trigram similarity scoring + word-level fallback
create or replace function public.search_chatbot_knowledge(search_query text)
returns table(id bigint, question text, answer text, keywords text[], similarity_score float4)
language sql
stable
set search_path = 'extensions, public'
as $$
  select id, question, answer, keywords,
    greatest(
      extensions.similarity(coalesce(question, ''), search_query),
      extensions.similarity(coalesce(answer, ''), search_query),
      coalesce((select max(extensions.similarity(kw, search_query)) from unnest(keywords) kw), 0)
    ) as similarity_score
  from public.chatbot_knowledge
  where
    -- Trigram fuzzy match (check similarity > 0.2 to catch loose paraphrasing)
    extensions.similarity(coalesce(question, ''), search_query) > 0.2
    or extensions.similarity(coalesce(answer, ''), search_query) > 0.2
    or exists (
      select 1 from unnest(keywords) kw
      where extensions.similarity(kw, search_query) > 0.2
    )
    -- Exact substring match — fallback for short queries trgm handles poorly
    or question ilike '%' || search_query || '%'
    or answer ilike '%' || search_query || '%'
    or exists (select 1 from unnest(keywords) kw where kw ilike '%' || search_query || '%')
    -- Word-level fallback — matches when a significant word in the query matches
    or exists (
      select 1 from regexp_split_to_table(search_query, '\s+') word
      where length(word) > 2
      and (
        question ilike '%' || word || '%'
        or answer ilike '%' || word || '%'
        or exists (select 1 from unnest(keywords) kw where kw ilike '%' || word || '%')
      )
    )
  order by similarity_score desc,
    case when question ilike '%' || search_query || '%' then 0 else 1 end,
    id
  limit 5;
$$;

grant execute on function public.search_chatbot_knowledge to anon, authenticated;
