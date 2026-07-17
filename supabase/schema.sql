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

-- Account settings: name + theme preference, one row per user. The row's id
-- IS the user's auth id (not a separate generated key), so a client upsert
-- with id = auth.uid() both creates and updates it.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  accent text not null default 'maroon',
  updated_at timestamptz not null default now()
);

-- Accent is either a built-in preset key (maroon/indigo/forest/plum/amber/teal)
-- or a custom "#rrggbb" hex string picked from the color wheel, so it's a
-- plain text column rather than a checked enum. Covers upgrading a profiles
-- table created before this column existed.
alter table public.profiles add column if not exists accent text not null default 'maroon';

alter table public.profiles enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
