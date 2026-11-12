-- Solo verifica configuración y permisos; no inserta visitas.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class where oid = 'public.portfolio_daily_visits'::regclass;

select
  has_table_privilege('anon', 'public.portfolio_daily_visits', 'SELECT') as can_read,
  has_table_privilege('anon', 'public.portfolio_daily_visits', 'INSERT') as can_insert_directly,
  has_table_privilege('anon', 'public.portfolio_daily_visits', 'UPDATE') as can_update_directly,
  has_table_privilege('anon', 'public.portfolio_daily_visits', 'DELETE') as can_delete_directly,
  has_function_privilege('anon', 'public.record_portfolio_visit(text,text)', 'EXECUTE') as can_increment,
  has_function_privilege('anon', 'public.get_portfolio_metrics()', 'EXECUTE') as can_read_metrics;

begin;
set local role anon;
select public.get_portfolio_metrics();
rollback;
