-- ============================================================
-- Veda Adaptive Assessment Engine — AI Fallback & Cache Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── 1. Cache Table: questions ────────────────────────────────
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  subject text not null,
  topic text not null,
  difficulty text not null,
  class_level text not null,
  question text not null,
  options jsonb not null, -- array of options ["opt A", "opt B", ...]
  correct_answer text not null,
  explanation text,
  source text not null, -- 'gemini' | 'groq' | 'seed'
  created_at timestamptz default now()
);

-- ─── 2. Logs Table: question_generation_logs ──────────────────
create table if not exists public.question_generation_logs (
  id uuid primary key default uuid_generate_v4(),
  provider_used text not null,
  success boolean not null,
  failure_reason text,
  generation_time integer not null, -- time in ms
  created_at timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_q_cache_query on public.questions(subject, class_level, difficulty);
create index if not exists idx_qgl_time on public.question_generation_logs(created_at desc);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.questions enable row level security;
alter table public.question_generation_logs enable row level security;

-- Policies (clean drop + create to prevent conflicts)
drop policy if exists "Allow public select on questions" on public.questions;
create policy "Allow public select on questions" on public.questions for select using (true);

drop policy if exists "Allow public insert on questions" on public.questions;
create policy "Allow public insert on questions" on public.questions for insert with check (true);

drop policy if exists "Allow public select on logs" on public.question_generation_logs;
create policy "Allow public select on logs" on public.question_generation_logs for select using (true);

drop policy if exists "Allow public insert on logs" on public.question_generation_logs;
create policy "Allow public insert on logs" on public.question_generation_logs for insert with check (true);
