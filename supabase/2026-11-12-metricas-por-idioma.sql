-- Actualización del 12/11/2026: get_portfolio_metrics devuelve además
--   first_day: primer día con visitas (o null) y
--   by_lang:   totales históricos { es, en }.
-- Ejecutar completo en SQL Editor de Supabase. Es idempotente, no toca la tabla
-- ni los permisos y mantiene la firma: la versión publicada del sitio sigue
-- funcionando antes y después de ejecutarlo.
begin;

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
    'first_day', (select min(day) from public.portfolio_daily_visits where visits > 0),
    'by_lang', jsonb_build_object(
      'es', (select coalesce(sum(visits), 0) from public.portfolio_daily_visits where lang = 'es'),
      'en', (select coalesce(sum(visits), 0) from public.portfolio_daily_visits where lang = 'en')
    )
  );
$$;

-- create or replace conserva los permisos; se reafirman por claridad.
revoke all on function public.get_portfolio_metrics() from public, anon, authenticated;
grant execute on function public.get_portfolio_metrics() to anon;

notify pgrst, 'reload schema';
commit;
