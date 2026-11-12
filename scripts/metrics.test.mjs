import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  metricsConfig, validateMetrics, shouldCount, countSession,
  chartWindow, langShare, formatDay, valueLabelIndexes, dateLabelIndexes,
} from '../src/lib/metrics.mjs';

const data = () => ({ total: 30, last30: 30, series: Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10), visits: 1 })) });

test('solo admite configuración pública y el dominio de Supabase', () => {
  assert.equal(metricsConfig('', ''), null);
  assert.equal(metricsConfig('https://test.supabase.co', 'sb_publishable_test').url, 'https://test.supabase.co');
  for (const [url, key] of [['https://test.supabase.co', 'sb_secret_test'], ['https://test.supabase.co', 'service_role'], ['http://test.supabase.co', 'sb_publishable_test'], ['https://test.supabase.co.evil.com', 'sb_publishable_test'], ['', 'sb_publishable_test']]) assert.throws(() => metricsConfig(url, key));
});

test('valida cifras y 30 días consecutivos (formato anterior, sin campos nuevos)', () => {
  assert.deepEqual(validateMetrics(data()), data());
  const zero = data(); zero.total = zero.last30 = 0; zero.series.forEach(row => row.visits = 0);
  assert.doesNotThrow(() => validateMetrics(zero));
  for (const change of [d => d.total = -1, d => d.last30 = 31, d => d.series.pop(), d => d.series[1].day = d.series[0].day, d => d.series[0].visits = '<script>', d => d.series[0].visits = 2, d => d.series[3].day = '2026-02-30']) {
    const invalid = data(); change(invalid); assert.throws(() => validateMetrics(invalid));
  }
});

test('valida first_day y by_lang cuando vienen en la respuesta', () => {
  const ok = { ...data(), first_day: '2026-09-15', by_lang: { es: 20, en: 10 } };
  assert.doesNotThrow(() => validateMetrics(ok));
  assert.doesNotThrow(() => validateMetrics({ ...data(), total: 0, last30: 0, series: data().series.map(r => ({ ...r, visits: 0 })), first_day: null, by_lang: { es: 0, en: 0 } }));
  for (const change of [
    d => d.first_day = '2026-13-01',           // fecha imposible
    d => d.first_day = '2026-12-01',           // posterior a hoy
    d => d.by_lang = { es: 1, en: 1 },          // no suma el total
    d => d.by_lang = { es: -1, en: 31 },
    d => d.by_lang = null,
  ]) {
    const invalid = structuredClone(ok); change(invalid); assert.throws(() => validateMetrics(invalid));
  }
});

test('el gráfico empieza en la primera visita y como máximo cubre 30 días', () => {
  const d = data(); d.series.forEach((r, i) => r.visits = i >= 20 ? 1 : 0); d.total = d.last30 = 10;
  assert.equal(chartWindow({ ...d, first_day: d.series[20].day }).length, 10);
  assert.equal(chartWindow(d).length, 10, 'sin first_day usa la primera visita de la serie');
  assert.equal(chartWindow({ ...d, first_day: '2025-01-01' }).length, 30, 'visitas antiguas: ventana completa');
  const empty = data(); empty.series.forEach(r => r.visits = 0);
  assert.deepEqual(chartWindow({ ...empty, first_day: null }), []);
});

test('reparto ES/EN suma 100 y fechas legibles', () => {
  assert.deepEqual(langShare({ es: 2, en: 1 }), { es: 67, en: 33 });
  assert.deepEqual(langShare({ es: 4, en: 0 }), { es: 100, en: 0 });
  assert.equal(langShare({ es: 0, en: 0 }), null);
  assert.equal(langShare(undefined), null);
  assert.equal(formatDay('2026-11-12', 'es'), '12 nov');
  assert.equal(formatDay('2026-11-12', 'en'), 'Nov 12');
  assert.match(formatDay('2026-11-12', 'es', { year: true }), /^12 nov 2026$/);
});

test('etiquetas: valores selectivos y fechas sin pisarse', () => {
  const few = [{ visits: 0 }, { visits: 3 }, { visits: 1 }];
  assert.deepEqual([...valueLabelIndexes(few)], [1, 2]);
  const many = Array.from({ length: 30 }, (_, i) => ({ visits: (i % 7) + 1 }));
  many[10].visits = 99;
  assert.deepEqual([...valueLabelIndexes(many)].sort((a, b) => a - b), [10, 29]);
  for (const [len, fit] of [[30, 17], [30, 5], [1, 3], [12, 12], [7, 2]]) {
    const idx = [...dateLabelIndexes(len, fit)].sort((a, b) => a - b);
    assert.ok(idx.includes(0) && idx.includes(len - 1), `extremos ${len}/${fit}`);
    assert.ok(idx.length <= Math.max(fit, 2) + 1, `cantidad ${len}/${fit}`);
    const gaps = idx.slice(1).map((v, i) => v - idx[i]);
    if (len > fit) assert.ok(Math.min(...gaps) >= Math.ceil((len - 1) / Math.max(1, fit - 1)), `separación ${len}/${fit}`);
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
