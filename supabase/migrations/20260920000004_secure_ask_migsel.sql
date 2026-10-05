-- Ask MIGSEL RLS. Directory writes follow MIGSEL's existing admin/super_admin roles.

create or replace function public.is_ask_migsel_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')
  );
$$;

revoke all on function public.is_ask_migsel_admin() from public, anon;
grant execute on function public.is_ask_migsel_admin() to authenticated;

alter table public.service_providers enable row level security;
alter table public.services enable row level security;
alter table public.service_sources enable row level security;
alter table public.service_keywords enable row level security;
alter table public.service_questions enable row level security;
alter table public.service_question_options enable row level security;
alter table public.grievance_routing_rules enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.service_feedback enable row level security;
alter table public.ask_migsel_events enable row level security;
alter table public.ask_migsel_rate_limits enable row level security;

create policy "Admins manage service providers" on public.service_providers
for all to authenticated using ((select public.is_ask_migsel_admin()))
with check ((select public.is_ask_migsel_admin()));
create policy "Admins manage services" on public.services
for all to authenticated using ((select public.is_ask_migsel_admin()))
with check ((select public.is_ask_migsel_admin()));
create policy "Admins manage service sources" on public.service_sources
for all to authenticated using ((select public.is_ask_migsel_admin()))
with check ((select public.is_ask_migsel_admin()));
create policy "Admins manage service keywords" on public.service_keywords
for all to authenticated using ((select public.is_ask_migsel_admin()))
with check ((select public.is_ask_migsel_admin()));
create policy "Admins manage service questions" on public.service_questions
for all to authenticated using ((select public.is_ask_migsel_admin()))
with check ((select public.is_ask_migsel_admin()));
create policy "Admins manage service question options" on public.service_question_options
for all to authenticated using ((select public.is_ask_migsel_admin()))
with check ((select public.is_ask_migsel_admin()));
create policy "Admins manage grievance routing" on public.grievance_routing_rules
for all to authenticated using ((select public.is_ask_migsel_admin()))
with check ((select public.is_ask_migsel_admin()));

create policy "Users read own AI conversations" on public.ai_conversations
for select to authenticated using (user_id = (select auth.uid()));
create policy "Users read own AI messages" on public.ai_messages
for select to authenticated using (exists (
  select 1 from public.ai_conversations c
  where c.id = ai_messages.conversation_id and c.user_id = (select auth.uid())
));
create policy "Users read own service feedback" on public.service_feedback
for select to authenticated using (user_id = (select auth.uid()));

-- The Edge Function uses service_role for all writes. Explicit grants avoid the
-- repository's broad historical default privileges becoming authoritative.
revoke all on public.service_providers, public.services, public.service_sources,
  public.service_keywords, public.service_questions, public.service_question_options,
  public.grievance_routing_rules, public.ai_conversations, public.ai_messages,
  public.service_feedback, public.ask_migsel_events, public.ask_migsel_rate_limits
from anon, authenticated;

grant select, insert, update, delete on public.service_providers, public.services,
  public.service_sources, public.service_keywords, public.service_questions,
  public.service_question_options, public.grievance_routing_rules to authenticated;
grant select on public.ai_conversations, public.ai_messages, public.service_feedback to authenticated;

revoke all on sequence public.ask_migsel_events_id_seq from anon, authenticated;

notify pgrst, 'reload schema';
