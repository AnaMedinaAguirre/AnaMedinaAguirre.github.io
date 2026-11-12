import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metricsConfig, validateMetrics, trendPoints, shouldCount, countSession } from '../src/lib/metrics.mjs';

const data = () => ({ total: 30, last30: 30, series: Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10), visits: 1 })) });
test('solo admite configuración pública y el dominio de Supabase', () => {
  assert.equal(metricsConfig('', ''), null);
  assert.equal(metricsConfig('https://test.supabase.co', 'sb_publishable_test').url, 'https://test.supabase.co');
  for (const [url, key] of [['https://test.supabase.co', 'sb_secret_test'], ['https://test.supabase.co', 'service_role'], ['http://test.supabase.co', 'sb_publishable_test'], ['https://test.supabase.co.evil.com', 'sb_publishable_test'], ['', 'sb_publishable_test']]) assert.throws(() => metricsConfig(url, key));
});
test('valida cifras y 30 días consecutivos; el gráfico maneja ceros', () => {
  assert.deepEqual(validateMetrics(data()), data());
  const zero = data(); zero.total = zero.last30 = 0; zero.series.forEach(row => row.visits = 0);
  assert.equal(trendPoints(validateMetrics(zero).series).split(' ').length, 30);
  assert.ok(!trendPoints(zero.series).includes('NaN'));
  for (const change of [d => d.total = -1, d => d.last30 = 31, d => d.series.pop(), d => d.series[1].day = d.series[0].day, d => d.series[0].visits = '<script>', d => d.series[0].visits = 2]) {
    const invalid = data(); change(invalid); assert.throws(() => validateMetrics(invalid));
  }
});
test('excluye bots, automatización, entorno local y rutas no permitidas', () => {
  const human = { origin: 'https://site.test', siteOrigin: 'https://site.test', pathname: '/', lang: 'es', webdriver: false, userAgent: 'Mozilla/5.0' };
  assert.equal(shouldCount(human), true);
  for (const change of [{ webdriver: true }, { userAgent: 'Googlebot' }, { origin: 'http://localhost:4321' }, { pathname: '/cv/' }, { lang: 'en' }]) assert.equal(shouldCount({ ...human, ...change }), false);
});
test('una visita por sesión incluso entre idiomas y peticiones simultáneas', async () => {
  const map = new Map();
  const storage = { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
  let calls = 0;
  const send = async () => { calls++; };
  await Promise.all([countSession({ storage, send }), countSession({ storage, send })]);
  await countSession({ storage, send });
  assert.equal(calls, 1);
});
test('un fallo permite reintento posterior y storage bloqueado no duplica', async () => {
  const map = new Map();
  const storage = { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
  assert.equal(await countSession({ storage, send: async () => { throw Error('offline'); } }), false);
  assert.equal(await countSession({ storage, send: async () => {} }), true);
  assert.equal(await countSession({ storage: { getItem: () => { throw Error('blocked'); } }, send: () => assert.fail('No debe enviar') }), false);
});
