-- Ask MIGSEL service directory, conversation storage, retrieval, and rate limiting.

create table public.service_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbreviation text,
  provider_type text not null default 'other'
    check (provider_type in ('government_agency', 'local_authority', 'utility', 'public_service_provider', 'other')),
  description text,
  website_url text check (website_url is null or website_url ~* '^https?://'),
  contact_email text,
  contact_phone text,
  active boolean not null default true,
  verified boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_providers (id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  detailed_description text,
  service_category text not null,
  official_url text check (official_url is null or official_url ~* '^https?://'),
  online_available boolean,
  requirements text,
  fees text,
  processing_time text,
  active boolean not null default true,
  verified boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, name)
);

create table public.service_sources (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  source_name text not null,
  source_url text not null check (source_url ~* '^https?://'),
  source_type text not null default 'official_website',
  verified boolean not null default false,
  verified_by uuid references auth.users (id) on delete set null,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, source_url)
);

create table public.service_keywords (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  keyword text not null check (char_length(keyword) between 2 and 160),
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create unique index service_keywords_unique_idx
  on public.service_keywords (service_id, lower(keyword), language);

create table public.service_questions (
  id uuid primary key default gen_random_uuid(),
  service_family text not null,
  question_key text not null unique,
  question_text text not null,
  question_type text not null default 'single_choice'
    check (question_type in ('single_choice', 'free_text')),
  required boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.service_questions (id) on delete cascade,
  label text not null,
  value text not null,
  next_question_key text,
  target_service_id uuid references public.services (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, value)
);

-- MIGSEL stores grievance categories as text, so routing extends that model rather
-- than introducing a second category table.
create table public.grievance_routing_rules (
  id uuid primary key default gen_random_uuid(),
  grievance_category text not null
    check (grievance_category in ('road', 'garbage', 'lighting', 'drainage', 'other')),
  provider_id uuid not null references public.service_providers (id) on delete restrict,
  dzongkhag text,
  gewog text,
  thromde text,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id uuid not null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'resolved', 'closed')),
  final_intent text check (final_intent is null or final_intent in (
    'grievance', 'government_service', 'information', 'application_followup', 'emergency', 'unknown'
  )),
  resolved boolean not null default false,
  resolved_service_id uuid references public.services (id) on delete set null,
  resolved_grievance_id uuid references public.grievances (id) on delete set null,
  confidence numeric check (confidence is null or confidence between 0 and 1)
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null check (char_length(content) between 1 and 4000),
  intent text check (intent is null or intent in (
    'grievance', 'government_service', 'information', 'application_followup', 'emergency', 'unknown'
  )),
  confidence numeric check (confidence is null or confidence between 0 and 1),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.service_feedback (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  helpful boolean,
  feedback_text text check (feedback_text is null or char_length(feedback_text) <= 1000),
  created_at timestamptz not null default now()
);

create table public.ask_migsel_events (
  id bigint generated always as identity primary key,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null check (event_name in (
    'ask_migsel_opened', 'ask_migsel_question_submitted', 'intent_detected',
    'clarification_requested', 'service_found', 'service_not_found',
    'official_service_clicked', 'migsel_grievance_started_from_ai',
    'conversation_resolved', 'answer_feedback_positive', 'answer_feedback_negative'
  )),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.ask_migsel_rate_limits (
  identity_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now()
);

create index service_providers_active_verified_idx on public.service_providers (active, verified);
create index services_provider_id_idx on public.services (provider_id);
create index services_active_verified_idx on public.services (active, verified);
create index services_category_idx on public.services (service_category) where active;
create index services_name_trgm_idx on public.services using gin (lower(name) extensions.gin_trgm_ops);
create index service_keywords_service_id_idx on public.service_keywords (service_id);
create index service_keywords_keyword_trgm_idx
  on public.service_keywords using gin (lower(keyword) extensions.gin_trgm_ops);
create index service_sources_service_id_idx on public.service_sources (service_id);
create index service_question_options_question_id_idx on public.service_question_options (question_id);
create index service_question_options_target_service_id_idx on public.service_question_options (target_service_id);
create index grievance_routing_rules_lookup_idx
  on public.grievance_routing_rules (grievance_category, priority desc) where active;
create index ai_conversations_user_updated_idx on public.ai_conversations (user_id, updated_at desc);
create index ai_conversations_session_idx on public.ai_conversations (session_id);
create index ai_conversations_started_idx on public.ai_conversations (started_at desc);
create index ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);
create index service_feedback_conversation_idx on public.service_feedback (conversation_id);
create index service_feedback_created_idx on public.service_feedback (created_at desc);
create index ask_migsel_events_conversation_idx on public.ask_migsel_events (conversation_id, created_at);
create index ask_migsel_events_created_idx on public.ask_migsel_events (created_at desc);

create or replace function public.set_ask_migsel_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_ask_migsel_verification_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.verified then
    if tg_op = 'INSERT' then
      new.last_verified_at = now();
    elsif not old.verified or new is distinct from old then
      new.last_verified_at = now();
    end if;
  else
    new.last_verified_at = null;
  end if;
  return new;
end;
$$;

create or replace function public.require_verified_service_source()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.verified and not exists (
    select 1 from public.service_sources ss
    where ss.service_id = new.id and ss.verified
  ) then
    raise exception 'A service needs a verified official source before it can be verified'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.set_service_source_verifier()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.verified then
    new.verified_by = (select auth.uid());
  else
    new.verified_by = null;
  end if;
  return new;
end;
$$;

create or replace function public.protect_verified_service_source()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  removes_verified_source boolean;
begin
  if tg_op = 'DELETE' then
    removes_verified_source := old.verified;
  else
    removes_verified_source := old.verified and (
      not new.verified or new.service_id is distinct from old.service_id
    );
  end if;

  if removes_verified_source
     and exists (select 1 from public.services s where s.id = old.service_id and s.verified)
     and not exists (
       select 1 from public.service_sources ss
       where ss.service_id = old.service_id and ss.verified and ss.id <> old.id
     ) then
    raise exception 'Unverify the service before removing its last verified source'
      using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger service_providers_updated_at before update on public.service_providers
for each row execute function public.set_ask_migsel_updated_at();
create trigger services_updated_at before update on public.services
for each row execute function public.set_ask_migsel_updated_at();
create trigger service_sources_updated_at before update on public.service_sources
for each row execute function public.set_ask_migsel_updated_at();
create trigger service_questions_updated_at before update on public.service_questions
for each row execute function public.set_ask_migsel_updated_at();
create trigger grievance_routing_rules_updated_at before update on public.grievance_routing_rules
for each row execute function public.set_ask_migsel_updated_at();
create trigger ai_conversations_updated_at before update on public.ai_conversations
for each row execute function public.set_ask_migsel_updated_at();

create trigger service_providers_verification before insert or update on public.service_providers
for each row execute function public.set_ask_migsel_verification_timestamp();
create trigger services_verification before insert or update on public.services
for each row execute function public.set_ask_migsel_verification_timestamp();
create trigger service_sources_verification before insert or update on public.service_sources
for each row execute function public.set_ask_migsel_verification_timestamp();
create trigger services_require_verified_source before insert or update on public.services
for each row execute function public.require_verified_service_source();
create trigger service_sources_set_verifier before insert or update on public.service_sources
for each row execute function public.set_service_source_verifier();
create trigger service_sources_protect_verified_service before delete or update on public.service_sources
for each row execute function public.protect_verified_service_source();

-- Only the Edge Function may execute this RPC. Unverified facts are deliberately
-- redacted even when an unverified service name is returned as a possible lead.
create or replace function public.search_ask_migsel_services(
  search_query text,
  result_limit integer default 5
)
returns table (
  id uuid,
  name text,
  provider_name text,
  service_category text,
  description text,
  official_url text,
  requirements text,
  fees text,
  processing_time text,
  verified boolean,
  last_verified_at timestamptz,
  source_name text,
  source_url text,
  match_score double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      s.id,
      s.name,
      p.name as provider_name,
      s.service_category,
      case when s.verified and p.verified then s.short_description end as description,
      case when s.verified and p.verified then s.official_url end as official_url,
      case when s.verified and p.verified then s.requirements end as requirements,
      case when s.verified and p.verified then s.fees end as fees,
      case when s.verified and p.verified then s.processing_time end as processing_time,
      (s.verified and p.verified) as verified,
      case when s.verified and p.verified then least(s.last_verified_at, p.last_verified_at) end
        as last_verified_at,
      case when s.verified and p.verified then src.source_name end as source_name,
      case when s.verified and p.verified then src.source_url end as source_url,
      greatest(
        case when lower(s.name) = lower(trim(search_query)) then 1.0 else 0.0 end,
        case when exists (
          select 1 from public.service_keywords exact_keyword
          where exact_keyword.service_id = s.id
            and lower(exact_keyword.keyword) = lower(trim(search_query))
        ) then 1.0 else 0.0 end,
        extensions.similarity(lower(s.name), lower(trim(search_query))),
        extensions.similarity(lower(s.service_category), lower(trim(search_query))),
        coalesce((
          select max(extensions.similarity(lower(sk.keyword), lower(trim(search_query))))
          from public.service_keywords sk where sk.service_id = s.id
        ), 0),
        case when lower(s.name) like '%' || lower(trim(search_query)) || '%' then 0.9 else 0.0 end,
        coalesce((
          select max(case when lower(trim(search_query)) like '%' || lower(sk.keyword) || '%' then 0.95 else 0 end)
          from public.service_keywords sk where sk.service_id = s.id
        ), 0)
      )::double precision as match_score
    from public.services s
    join public.service_providers p on p.id = s.provider_id and p.active
    left join lateral (
      select ss.source_name, ss.source_url
      from public.service_sources ss
      where ss.service_id = s.id and ss.verified
      order by ss.last_verified_at desc nulls last, ss.created_at desc
      limit 1
    ) src on true
    where s.active and char_length(trim(search_query)) between 2 and 500
  )
  select * from ranked
  where match_score >= 0.25
  order by match_score desc, verified desc, name
  limit least(greatest(result_limit, 1), 10);
$$;

create or replace function public.check_ask_migsel_rate_limit(
  request_identity text,
  maximum_requests integer default 20,
  window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  if request_identity is null or char_length(request_identity) > 200
     or maximum_requests not between 1 and 100
     or window_seconds not between 10 and 3600 then
    return false;
  end if;

  insert into public.ask_migsel_rate_limits (identity_key, window_started_at, request_count)
  values (request_identity, now(), 1)
  on conflict (identity_key) do update
  set request_count = case
        when public.ask_migsel_rate_limits.window_started_at
             <= now() - make_interval(secs => window_seconds) then 1
        else public.ask_migsel_rate_limits.request_count + 1
      end,
      window_started_at = case
        when public.ask_migsel_rate_limits.window_started_at
             <= now() - make_interval(secs => window_seconds) then now()
        else public.ask_migsel_rate_limits.window_started_at
      end,
      updated_at = now()
  returning request_count into current_count;

  return current_count <= maximum_requests;
end;
$$;

revoke all on function public.search_ask_migsel_services(text, integer) from public, anon, authenticated;
revoke all on function public.check_ask_migsel_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.search_ask_migsel_services(text, integer) to service_role;
grant execute on function public.check_ask_migsel_rate_limit(text, integer, integer) to service_role;

notify pgrst, 'reload schema';
