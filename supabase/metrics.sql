-- Ejecutar completo en SQL Editor de Supabase. No contiene claves ni datos de prueba.
begin;

create table if not exists public.portfolio_daily_visits (
  day date not null,
  page text not null,
  lang text not null,
  visits bigint not null default 0 check (visits >= 0),
  primary key (day, page, lang),
  constraint portfolio_page_lang check (
    (page = '/' and lang = 'es') or (page = '/en/' and lang = 'en')
  )
);

alter table public.portfolio_daily_visits enable row level security;
revoke all on table public.portfolio_daily_visits from public, anon, authenticated;
grant usage on schema public to anon;
grant select on table public.portfolio_daily_visits to anon;
drop policy if exists portfolio_read_aggregates on public.portfolio_daily_visits;
create policy portfolio_read_aggregates on public.portfolio_daily_visits
  for select to anon using (true);

-- Es la única operación de escritura disponible para visitantes.
-- No acepta una fecha, un contador ni información del visitante.
create or replace function public.record_portfolio_visit(p_page text, p_lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_page is null or p_lang is null or not (
    (p_page = '/' and p_lang = 'es') or (p_page = '/en/' and p_lang = 'en')
  ) then
    raise exception 'Página o idioma no permitido' using errcode = '22023';
  end if;
  insert into public.portfolio_daily_visits as daily (day, page, lang, visits)
  values ((current_timestamp at time zone 'America/Lima')::date, p_page, p_lang, 1)
  on conflict (day, page, lang) do update set visits = daily.visits + 1;
end;
$$;

revoke all on function public.record_portfolio_visit(text, text) from public, anon, authenticated;
grant execute on function public.record_portfolio_visit(text, text) to anon;

-- Una respuesta pequeña, sin el límite de filas de las lecturas REST.
-- SECURITY INVOKER conserva los permisos y RLS de quien consulta.
create or replace function public.get_portfolio_metrics()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with today as (
    select (current_timestamp at time zone 'America/Lima')::date as day
  ), days as (
    select today.day - n as day from today cross join generate_series(0, 29) n
  ), daily as (
    select days.day, coalesce(sum(v.visits), 0)::bigint as visits
    from days left join public.portfolio_daily_visits v on v.day = days.day
    group by days.day
  )
  select jsonb_build_object(
    'total', (select coalesce(sum(visits), 0) from public.portfolio_daily_visits),
    'last30', (select coalesce(sum(visits), 0) from daily),
    'series', (select jsonb_agg(jsonb_build_object('day', day, 'visits', visits) order by day) from daily),
    -- Primer día con visitas (null si todavía no hay ninguna): inicio del eje del gráfico.
    'first_day', (select min(day) from public.portfolio_daily_visits where visits > 0),
    -- Totales históricos por idioma, para el KPI de reparto ES/EN.
    'by_lang', jsonb_build_object(
      'es', (select coalesce(sum(visits), 0) from public.portfolio_daily_visits where lang = 'es'),
      'en', (select coalesce(sum(visits), 0) from public.portfolio_daily_visits where lang = 'en')
    )
  );
$$;

revoke all on function public.get_portfolio_metrics() from public, anon, authenticated;
grant execute on function public.get_portfolio_metrics() to anon;

comment on table public.portfolio_daily_visits is 'Visitas agregadas por día de Lima, página e idioma. Sin identificadores de visitantes.';
notify pgrst, 'reload schema';
commit;
