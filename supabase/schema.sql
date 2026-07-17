-- Pressroom: Supabase schema for story data + file storage.
-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor).
-- Safe to re-run: every statement is idempotent.

-- Each story is stored as a single JSONB document, scoped by Row Level
-- Security to the signed-in user. This mirrors the exact shape the app
-- already works with in memory (sources, interviews, documents, timeline,
-- quotes, board, draft) — no relational schema is needed for the nested
-- content since nothing queries across those fields.

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stories_user_id_idx on public.stories (user_id);

alter table public.stories enable row level security;

drop policy if exists "Users manage their own stories" on public.stories;
create policy "Users manage their own stories"
  on public.stories
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Private bucket for interview recordings and evidence documents. Objects
-- are stored under a "<user_id>/<file_id>" path; the policy below restricts
-- each user to their own folder.

insert into storage.buckets (id, name, public)
values ('story-files', 'story-files', false)
on conflict (id) do nothing;

drop policy if exists "Users manage their own files" on storage.objects;
create policy "Users manage their own files"
  on storage.objects
  for all
  using (bucket_id = 'story-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'story-files' and (storage.foldername(name))[1] = auth.uid()::text);
