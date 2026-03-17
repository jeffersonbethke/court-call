-- ============================================================
-- COURT CALL — Supabase Database Setup
-- ============================================================
-- Run this ENTIRE script in the Supabase SQL Editor (one time).
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. Profiles table
-- Stores display name for each authenticated user
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  created_at timestamptz default now() not null
);

-- 2. Scores table
-- Each row = one game result for one player
create table if not exists public.scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  points integer not null check (points >= 0 and points <= 99),
  result text not null check (result in ('win', 'loss')),
  played_date date default current_date not null,
  created_at timestamptz default now() not null
);

-- 3. Indexes for fast leaderboard queries
create index if not exists idx_scores_user_id on public.scores(user_id);
create index if not exists idx_scores_played_date on public.scores(played_date);
create index if not exists idx_scores_user_date on public.scores(user_id, played_date);

-- 4. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.scores enable row level security;

-- 5. RLS Policies for profiles
-- Everyone can read all profiles (needed for leaderboard)
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 6. RLS Policies for scores
-- Everyone can read all scores (needed for leaderboard)
create policy "Scores are viewable by everyone"
  on public.scores for select
  using (true);

-- Users can insert their own scores
create policy "Users can insert own scores"
  on public.scores for insert
  with check (auth.uid() = user_id);

-- Users can delete their own scores
create policy "Users can delete own scores"
  on public.scores for delete
  using (auth.uid() = user_id);

-- 7. Auto-create profile trigger (optional, we handle in app)
-- This function creates a profile stub when a new user signs up.
-- The user then sets their display name on the onboarding screen.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, '')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================
