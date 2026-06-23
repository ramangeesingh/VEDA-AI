-- ============================================================
-- Veda Adaptive Assessment Engine & Analytics Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── 1. student_stats ─────────────────────────────────────────
create table if not exists public.student_stats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  display_name text,
  avatar_url text,
  grade text,
  level integer default 1,
  xp integer default 0,
  streak integer default 0,
  total_assessments integer default 0,
  total_questions_answered integer default 0,
  total_correct integer default 0,
  last_active date,
  updated_at timestamptz default now()
);

-- Copy data from public.student_profiles if it exists and has rows
do $$
begin
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'student_profiles') then
    insert into public.student_stats (user_id, display_name, avatar_url, grade, level, xp, streak, total_assessments, total_questions_answered, total_correct, last_active)
    select user_id, display_name, avatar_url, grade, level, xp, streak, total_assessments, total_questions_answered, total_correct, last_active::date
    from public.student_profiles
    on conflict (user_id) do nothing;
  end if;
end $$;

-- ─── 2. learning_profiles ────────────────────────────────────
create table if not exists public.learning_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  retention integer default 0,
  application integer default 0,
  grasping integer default 0,
  speed integer default 0,
  accuracy integer default 0,
  updated_at timestamptz default now()
);

-- Copy data from public.student_profiles if it exists
do $$
begin
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'student_profiles') then
    insert into public.learning_profiles (user_id, retention, application, grasping, speed, accuracy)
    select user_id, coalesce(retention, 0), coalesce(application, 0), coalesce(grasping, 0), coalesce(speed, 0), 0
    from public.student_profiles
    on conflict (user_id) do nothing;
  end if;
end $$;

-- ─── 3. assessments ──────────────────────────────────────────
create table if not exists public.assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  grade text not null,
  subject text not null,
  status text not null,
  total_questions integer default 0,
  correct_answers integer default 0,
  overall_score integer default 0,
  time_taken_ms integer default 0,
  avg_response_time_ms integer default 0,
  final_difficulty text,
  difficulty_progression text[],
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Ensure columns exist in case table was pre-existing
alter table public.assessments add column if not exists time_taken_ms integer default 0;
alter table public.assessments add column if not exists avg_response_time_ms integer default 0;

-- ─── 4. assessment_responses ──────────────────────────────────
create table if not exists public.assessment_responses (
  id uuid primary key default uuid_generate_v4(),
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  assessment_question_id uuid references public.assessment_questions(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_index integer not null,
  question_text text not null,
  topic text not null,
  subject text not null,
  difficulty_at_time text not null,
  user_answer text not null,
  correct_answer text not null,
  is_correct boolean not null,
  response_time_ms integer not null,
  hint_used boolean default false,
  answered_at timestamptz default now()
);

-- ─── 5. topic_mastery ─────────────────────────────────────────
create table if not exists public.topic_mastery (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject text not null,
  topic text not null, -- empty string represents subject-level score
  mastery_pct integer default 0,
  attempts integer default 0,
  last_tested timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, subject, topic)
);

-- Copy data from mastery_scores if it exists
do $$
begin
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'mastery_scores') then
    insert into public.topic_mastery (user_id, subject, topic, mastery_pct, attempts, last_tested)
    select user_id, subject, topic, mastery_pct, attempts, last_tested
    from public.mastery_scores
    on conflict (user_id, subject, topic) do nothing;
  end if;
end $$;

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_tm_user on public.topic_mastery(user_id);
create index if not exists idx_lp_user on public.learning_profiles(user_id);
create index if not exists idx_ss_user on public.student_stats(user_id);
create index if not exists idx_as_user on public.assessments(user_id);
create index if not exists idx_ar_assessment_link on public.assessment_responses(assessment_id);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.student_stats enable row level security;
alter table public.learning_profiles enable row level security;
alter table public.topic_mastery enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_responses enable row level security;

-- Policies (clean handles checking if policy already exists)
drop policy if exists "Users see own student stats" on public.student_stats;
create policy "Users see own student stats" on public.student_stats for all using (auth.uid() = user_id);

drop policy if exists "Users see own learning profiles" on public.learning_profiles;
create policy "Users see own learning profiles" on public.learning_profiles for all using (auth.uid() = user_id);

drop policy if exists "Users see own topic mastery" on public.topic_mastery;
create policy "Users see own topic mastery" on public.topic_mastery for all using (auth.uid() = user_id);

drop policy if exists "Users see own assessments" on public.assessments;
create policy "Users see own assessments" on public.assessments for all using (auth.uid() = user_id);

drop policy if exists "Users see own responses" on public.assessment_responses;
create policy "Users see own responses" on public.assessment_responses for all using (auth.uid() = user_id);
