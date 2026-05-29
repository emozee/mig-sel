-- Server-side search function for chatbot knowledge base
-- Replaces client-side full table download + JS scoring
create or replace function public.search_chatbot_knowledge(search_query text)
returns table(id bigint, question text, answer text, keywords text[])
language sql
stable
set search_path = ''
as $$
  select id, question, answer, keywords
  from public.chatbot_knowledge
  where
    question ilike '%' || search_query || '%'
    or answer ilike '%' || search_query || '%'
    or exists (
      select 1 from unnest(keywords) kw
      where kw ilike '%' || search_query || '%'
    )
  order by
    case when question ilike '%' || search_query || '%' then 0 else 1 end,
    case when exists (
      select 1 from unnest(keywords) kw
      where kw ilike '%' || search_query || '%'
    ) then 0 else 1 end,
    id
  limit 5;
$$;

grant execute on function public.search_chatbot_knowledge to anon, authenticated;

-- Set storage bucket file size limits and MIME restrictions
-- Avatars bucket: 5MB max, JPEG/PNG/WebP only
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

-- Grievances bucket: 10MB max, JPEG/PNG/WebP/GIF only
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'grievances';
