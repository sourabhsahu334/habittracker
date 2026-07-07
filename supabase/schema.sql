-- StudyLog — Supabase schema for optional cloud sync (Feature 15).
--
-- Run this in the Supabase SQL editor. Every table is scoped to the signed-in
-- user via Row Level Security, so a user can only read/write their own rows.
-- The client pushes local records (including soft-delete tombstones) and pulls
-- the user's rows; conflicts resolve last-write-wins on `updatedAt`.
--
-- Note: columns use the same camelCase keys the app stores locally so records
-- round-trip without transformation. Quoted identifiers preserve the case.

-- ---------------------------------------------------------------------------
-- profiles: one row per user (id == auth user id)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_id uuid not null,
  name text,
  "examCategory" text,
  "examDate" text,
  "dailyGoalHours" numeric,
  "reminderTime" text,
  "reminderEnabled" boolean,
  "onboardedAt" bigint,
  "updatedAt" bigint
);

-- ---------------------------------------------------------------------------
-- entries: one row per subject logged on a day
-- ---------------------------------------------------------------------------
create table if not exists public.entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  "dateKey" text not null,
  subject text not null,
  hours numeric default 0,
  questions integer default 0,
  correct integer,
  chapter text,
  deleted boolean default false,
  "createdAt" bigint,
  "updatedAt" bigint
);
create index if not exists entries_user_idx on public.entries (user_id);

-- ---------------------------------------------------------------------------
-- habits: user-defined daily habits (Feature 21)
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null default 'bool',
  deleted boolean default false,
  "updatedAt" bigint
);
create index if not exists habits_user_idx on public.habits (user_id);

-- ---------------------------------------------------------------------------
-- habit_logs: per-day habit values
-- ---------------------------------------------------------------------------
create table if not exists public.habit_logs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  "habitId" text not null,
  "dateKey" text not null,
  value numeric,
  "updatedAt" bigint
);
create index if not exists habit_logs_user_idx on public.habit_logs (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'entries', 'habits', 'habit_logs'] loop
    execute format(
      'drop policy if exists "own rows" on public.%I;', t);
    execute format(
      'create policy "own rows" on public.%I
         for all using (auth.uid() = user_id)
         with check (auth.uid() = user_id);', t);
  end loop;
end $$;
