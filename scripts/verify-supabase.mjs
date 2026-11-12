/** Verificación real sin generar visitas: lectura y operaciones que no afectan filas. */
import { metricsConfig, validateMetrics } from '../src/lib/metrics.mjs';
const config = metricsConfig(process.env.PUBLIC_SUPABASE_URL, process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY);
if (!config) {
  if (process.env.REQUIRE_METRICS === 'true') throw new Error('Faltan los valores públicos de Supabase para publicar main.');
  console.log('Sin configuración de Supabase: se omite la verificación real (por ejemplo, PR desde fork).');
} else {
  const request = (path, method, body) => fetch(`${config.url}/rest/v1/${path}`, {
    method,
    headers: { apikey: config.key, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
  const metrics = await request('rpc/get_portfolio_metrics', 'POST', {});
  if (!metrics.ok) throw new Error(`Lectura RPC falló: HTTP ${metrics.status}`);
  validateMetrics(await metrics.json());
  const table = await request('portfolio_daily_visits?select=day,page,lang,visits&limit=1', 'GET');
  if (!table.ok) throw new Error(`Lectura de agregados falló: HTTP ${table.status}`);
  for (const [method, path, body] of [
    ['POST', 'portfolio_daily_visits', []],
    ['PATCH', 'portfolio_daily_visits?page=eq.__permission_probe__', { visits: 0 }],
    ['DELETE', 'portfolio_daily_visits?page=eq.__permission_probe__', undefined],
  ]) {
    const res = await request(path, method, body);
    const error = await res.json().catch(() => ({}));
    if (res.ok || error.code !== '42501') throw new Error(`Permiso incorrecto o respuesta inesperada para ${method}: HTTP ${res.status}`);
  }
  const invalid = await request('rpc/record_portfolio_visit', 'POST', { p_page: '/invalid/', p_lang: 'es' });
  if (invalid.ok || (await invalid.json()).code !== '22023') throw new Error('La RPC no rechaza rutas inválidas como se esperaba.');
  console.log('Supabase: lectura correcta; escritura directa bloqueada; ruta inválida rechazada. No se generaron visitas.');
}
