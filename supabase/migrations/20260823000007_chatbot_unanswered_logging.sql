-- Chatbot learning loop: log every question the bot could not answer well
-- so the team can review real user language and grow the knowledge base.

create table if not exists public.chatbot_unanswered (
  id bigint generated always as identity primary key,
  question text not null,
  matched_question text,
  score numeric,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists chatbot_unanswered_created_at_idx
  on public.chatbot_unanswered (created_at desc);

alter table public.chatbot_unanswered enable row level security;

-- Citizens (and anonymous visitors) may log questions; the log is append-only.
create policy "Anyone can log unanswered chatbot questions"
  on public.chatbot_unanswered for insert
  to anon, authenticated
  with check (true);

-- Role parity: admin + super_admin can review and clear entries.
create policy "Admins can view unanswered chatbot questions"
  on public.chatbot_unanswered for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

create policy "Admins can delete unanswered chatbot questions"
  on public.chatbot_unanswered for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );

-- Chatbot KB: document the learning loop.
insert into public.chatbot_knowledge (question, answer, keywords)
values
  (
    'What happens when the chatbot does not know an answer?',
    'When the assistant cannot find a good match, it tells you politely and your question is saved for the team to review. Questions that come up often get added to the assistant''s knowledge, so it keeps getting better.',
    '{}'
  )
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;
