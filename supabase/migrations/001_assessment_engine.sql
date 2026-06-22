-- ============================================================
-- Veda Adaptive Assessment Engine — Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── assessment_questions ───────────────────────────────────
-- Stores every AI-generated question per assessment session
create table if not exists public.assessment_questions (
  id                uuid primary key default uuid_generate_v4(),
  assessment_id     uuid references public.assessments(id) on delete cascade not null,
  user_id           uuid references auth.users(id) on delete cascade not null,
  question_index    integer not null,
  question_text     text not null,
  options           jsonb not null,         -- array of option strings ["optA","optB","optC","optD"]
  correct_answer    text not null,          -- full text of correct option
  explanation       text,                   -- AI explanation of correct answer
  topic             text not null,
  subject           text not null,          -- 'Math'|'Science'|'English'|'Mixed'
  difficulty        text not null,          -- 'Easy'|'Medium'|'Hard'
  created_at        timestamptz default now()
);

-- ─── assessment_responses ───────────────────────────────────
-- Stores every student answer with timing and correctness
create table if not exists public.assessment_responses (
  id                      uuid primary key default uuid_generate_v4(),
  assessment_id           uuid references public.assessments(id) on delete cascade not null,
  assessment_question_id  uuid references public.assessment_questions(id) on delete set null,
  user_id                 uuid references auth.users(id) on delete cascade not null,
  question_index          integer not null,
  question_text           text not null,
  topic                   text not null,
  subject                 text not null,
  difficulty_at_time      text not null,    -- difficulty level when this question was shown
  user_answer             text not null,
  correct_answer          text not null,
  is_correct              boolean not null,
  response_time_ms        integer not null,
  hint_used               boolean default false,
  answered_at             timestamptz default now()
);

-- ─── Enrich student_profiles with extra stats ───────────────
alter table public.student_profiles
  add column if not exists level integer default 1,
  add column if not exists total_assessments integer default 0,
  add column if not exists total_questions_answered integer default 0,
  add column if not exists total_correct integer default 0;

-- ─── Indexes ────────────────────────────────────────────────
create index if not exists idx_aq_assessment  on public.assessment_questions(assessment_id);
create index if not exists idx_aq_user        on public.assessment_questions(user_id);
create index if not exists idx_ar_assessment  on public.assessment_responses(assessment_id);
create index if not exists idx_ar_user        on public.assessment_responses(user_id);

-- ─── Row Level Security ─────────────────────────────────────
alter table public.assessment_questions  enable row level security;
alter table public.assessment_responses  enable row level security;

create policy "Users see own assessment questions" on public.assessment_questions
  for all using (auth.uid() = user_id);

create policy "Users see own assessment responses" on public.assessment_responses
  for all using (auth.uid() = user_id);

-- ─── Level calculation function ──────────────────────────────
-- XP thresholds: level 1 = 0 XP, level 2 = 200 XP, each +150 XP per level
create or replace function public.xp_to_level(xp_val integer)
returns integer language sql immutable as $$
  select greatest(1, floor((xp_val::float / 150) + 1)::integer)
$$;
