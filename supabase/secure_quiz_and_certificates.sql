-- Secure quiz scoring and automatic certificate number for full marks.
-- Existing tables/data are preserved; no DROP or DELETE statements.
create or replace function public.submit_jainvaani_quiz(p_quiz_id uuid,p_answers jsonb)
returns table(score integer,total_points integer,certificate_number text,quiz_title text)
language plpgsql security definer set search_path=public as $$
declare
  v_user uuid:=auth.uid(); v_attempt uuid; v_score integer:=0; v_total integer:=0;
  q record; v_selected uuid; v_correct uuid; v_cert text:=null; v_title text;
begin
  if v_user is null then raise exception 'Login required.'; end if;
  select title into v_title from public.quizzes where id=p_quiz_id and is_published=true;
  if not found then raise exception 'Quiz is not published.'; end if;
  if jsonb_typeof(p_answers)<>'array' then raise exception 'Invalid answers.'; end if;
  for q in select id,greatest(coalesce(points,1),1) points from public.quiz_questions where quiz_id=p_quiz_id order by position loop
    v_total:=v_total+q.points;
    select (a->>'selected_option_id')::uuid into v_selected from jsonb_array_elements(p_answers) a where a->>'question_id'=q.id::text limit 1;
    select correct_option_id into v_correct from public.quiz_answer_keys where question_id=q.id;
    if v_selected is not null and v_selected=v_correct then v_score:=v_score+q.points; end if;
  end loop;
  if v_total=0 then raise exception 'Quiz has no questions.'; end if;
  insert into public.quiz_attempts(id,quiz_id,user_id,score,total_points,completed_at)
  values(gen_random_uuid(),p_quiz_id,v_user,v_score,v_total,now()) returning id into v_attempt;
  insert into public.attempt_answers(id,attempt_id,question_id,selected_option_id)
  select gen_random_uuid(),v_attempt,(a->>'question_id')::uuid,(a->>'selected_option_id')::uuid
  from jsonb_array_elements(p_answers) a
  where exists(select 1 from public.quiz_questions x where x.id=(a->>'question_id')::uuid and x.quiz_id=p_quiz_id);
  if v_score=v_total then
    v_cert:='JV-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    insert into public.certificates(id,user_id,quiz_id,attempt_id,certificate_number,file_url,issued_at,is_revoked)
    values(gen_random_uuid(),v_user,p_quiz_id,v_attempt,v_cert,null,now(),false);
  end if;
  return query select v_score,v_total,v_cert,v_title;
end $$;
revoke all on function public.submit_jainvaani_quiz(uuid,jsonb) from public;
grant execute on function public.submit_jainvaani_quiz(uuid,jsonb) to authenticated;
revoke insert on public.quiz_attempts from authenticated;
revoke insert on public.attempt_answers from authenticated;
