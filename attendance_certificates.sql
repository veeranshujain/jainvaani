
-- JainVaani consolidated attendance, cancellation, certificate settings, and secure quiz submission.
-- Non-destructive migration: creates new tables/functions and removes only unsafe direct INSERT
-- policies on quiz_attempts/attempt_answers. Existing app data/tables are preserved.

create extension if not exists pgcrypto;

-- One row per actual morning/evening session on a date.
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null,
  session_key text not null check (session_key in ('morning','evening')),
  status text not null default 'held' check (status in ('held','cancelled')),
  cancellation_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (session_date, session_key)
);

-- One attendance record per member per actual session.
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('present','absent')),
  marked_by uuid references auth.users(id),
  marked_at timestamptz not null default now(),
  unique (attendance_session_id, user_id)
);

-- Admin-configurable certificate thresholds.
create table if not exists public.certificate_settings (
  certificate_type text primary key check (certificate_type in ('weekly_quiz','monthly_morning','monthly_evening')),
  minimum_percentage numeric(5,2) not null default 75 check (minimum_percentage between 0 and 100),
  minimum_quizzes integer not null default 1 check (minimum_quizzes >= 0),
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.certificate_settings(certificate_type, minimum_percentage, minimum_quizzes)
values
 ('weekly_quiz', 70, 1),
 ('monthly_morning', 75, 0),
 ('monthly_evening', 75, 0)
on conflict (certificate_type) do nothing;

-- New certificate ledger avoids changing the existing certificates table/unique constraints.
create table if not exists public.jainvaani_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  certificate_type text not null check (certificate_type in ('weekly_quiz','monthly_morning','monthly_evening')),
  period_start date not null,
  period_end date not null,
  certificate_number text not null unique,
  issued_at timestamptz not null default now(),
  unique (user_id, certificate_type, period_start, period_end)
);

alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.certificate_settings enable row level security;
alter table public.jainvaani_certificates enable row level security;

drop policy if exists "Admins manage attendance sessions" on public.attendance_sessions;
create policy "Admins manage attendance sessions" on public.attendance_sessions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Members read attendance sessions" on public.attendance_sessions;
create policy "Members read attendance sessions" on public.attendance_sessions
for select to authenticated using (status = 'held' or status = 'cancelled' or public.is_admin());

drop policy if exists "Admins manage attendance records" on public.attendance_records;
create policy "Admins manage attendance records" on public.attendance_records
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Members read own attendance" on public.attendance_records;
create policy "Members read own attendance" on public.attendance_records
for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage certificate settings" on public.certificate_settings;
create policy "Admins manage certificate settings" on public.certificate_settings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Members read certificate settings" on public.certificate_settings;
create policy "Members read certificate settings" on public.certificate_settings
for select to authenticated using (true);

drop policy if exists "Admins manage JainVaani certificates" on public.jainvaani_certificates;
create policy "Admins manage JainVaani certificates" on public.jainvaani_certificates
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Members read own JainVaani certificates" on public.jainvaani_certificates;
create policy "Members read own JainVaani certificates" on public.jainvaani_certificates
for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Remove direct member inserts that allow client-forged quiz scores/answers.
drop policy if exists "Members submit own attempts" on public.quiz_attempts;
drop policy if exists "Members submit own answers" on public.attempt_answers;

-- Quiz is submitted atomically and scored against answer keys on the database server.
create or replace function public.submit_jainvaani_quiz(
  p_quiz_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_score integer := 0;
  v_total integer := 0;
  v_question_count integer := 0;
  v_answer_count integer := 0;
  v_item jsonb;
  v_question_id uuid;
  v_option_id uuid;
  v_points integer;
  v_correct_option_id uuid;
begin
  if v_user_id is null then
    raise exception 'Login required';
  end if;
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Answers must be a JSON array';
  end if;
  if not exists (select 1 from public.quizzes q where q.id = p_quiz_id and q.is_published = true) then
    raise exception 'Quiz is not available';
  end if;

  select count(*), coalesce(sum(points),0)
    into v_question_count, v_total
  from public.quiz_questions
  where quiz_id = p_quiz_id;

  select count(*) into v_answer_count from jsonb_array_elements(p_answers);
  if v_question_count = 0 or v_answer_count <> v_question_count then
    raise exception 'Answer every question exactly once';
  end if;

  -- Reject repeated question IDs.
  if (select count(distinct (x->>'question_id')) from jsonb_array_elements(p_answers) x) <> v_answer_count then
    raise exception 'Duplicate question answer';
  end if;

  insert into public.quiz_attempts(quiz_id, user_id, score, total_points, completed_at)
  values (p_quiz_id, v_user_id, 0, v_total, now())
  returning id into v_attempt_id;

  for v_item in select value from jsonb_array_elements(p_answers)
  loop
    begin
      v_question_id := (v_item->>'question_id')::uuid;
      v_option_id := (v_item->>'selected_option_id')::uuid;
    exception when others then
      raise exception 'Invalid answer format';
    end;

    select qq.points, ak.correct_option_id
      into v_points, v_correct_option_id
    from public.quiz_questions qq
    left join public.quiz_answer_keys ak on ak.question_id = qq.id
    where qq.id = v_question_id and qq.quiz_id = p_quiz_id;

    if not found then
      raise exception 'Question does not belong to this quiz';
    end if;
    if not exists (
      select 1 from public.quiz_options qo
      where qo.id = v_option_id and qo.question_id = v_question_id
    ) then
      raise exception 'Selected option does not belong to question';
    end if;

    insert into public.attempt_answers(attempt_id, question_id, selected_option_id)
    values (v_attempt_id, v_question_id, v_option_id);

    if v_option_id = v_correct_option_id then
      v_score := v_score + v_points;
    end if;
  end loop;

  update public.quiz_attempts set score = v_score, total_points = v_total
  where id = v_attempt_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'score', v_score,
    'total_points', v_total,
    'percentage', case when v_total > 0 then round((v_score::numeric / v_total) * 100, 2) else 0 end
  );
end;
$$;

revoke all on function public.submit_jainvaani_quiz(uuid, jsonb) from public;
grant execute on function public.submit_jainvaani_quiz(uuid, jsonb) to authenticated;
