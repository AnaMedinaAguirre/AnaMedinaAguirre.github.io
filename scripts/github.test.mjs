import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPersonalProjects, safeHomepage } from '../src/lib/github.mjs';

const repo = (overrides = {}) => ({ id: 1, name: 'etl-demo', private: false, topics: ['portfolio', 'etl'], language: 'Python', description: 'Pipeline', updated_at: '2026-11-01T12:00:00Z', homepage: 'https://example.com', ...overrides });
const response = data => ({ ok: true, json: async () => data });

test('selecciona solo repositorios públicos etiquetados y pagina sin perder proyectos', async () => {
  const urls = [];
  const result = await loadPersonalProjects('AnaMedinaAguirre', { token: 'test-token', fetchImpl: async (url, options) => {
    urls.push(url);
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return response(urls.length === 1
      ? [repo(), ...Array.from({ length: 99 }, () => repo({ topics: [] }))]
      : [repo({ id: 2, name: 'newer', updated_at: '2026-11-10T00:00:00Z' }), repo({ private: true }), repo({ topics: ['other'] })]);
  } });
  assert.equal(urls.length, 2);
  assert.match(urls[1], /page=2$/);
  assert.deepEqual(result.map(p => p.name), ['newer', 'etl-demo']);
  assert.deepEqual(result[0].technologies, ['Python', 'etl']);
  assert.equal(result[0].codeUrl, 'https://github.com/AnaMedinaAguirre/newer');
  assert.ok(!JSON.stringify(result).includes('test-token'));
});

test('lista vacía válida y consulta sin token en local', async () => {
  assert.deepEqual(await loadPersonalProjects('AnaMedinaAguirre', { token: '', fetchImpl: async (_, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return response([]);
  } }), []);
});

test('errores de API y datos inválidos impiden publicar una lista falsa', async () => {
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(loadPersonalProjects('AnaMedinaAguirre', { fetchImpl: async () => ({ ok: false, status }) }), new RegExp(`HTTP ${status}`));
  }
  await assert.rejects(loadPersonalProjects('AnaMedinaAguirre', { fetchImpl: async () => response({}) }), /inesperada/);
  await assert.rejects(loadPersonalProjects('AnaMedinaAguirre', { fetchImpl: async () => response([repo({ updated_at: 'invalid' })]) }), /inválidos/);
  await assert.rejects(loadPersonalProjects('../other'), /inválido/);
  await assert.rejects(loadPersonalProjects('AnaMedinaAguirre', { fetchImpl: async () => { throw new Error('network failure'); } }), /network failure/);
});

test('campos opcionales ausentes y demo insegura', async () => {
  const [project] = await loadPersonalProjects('AnaMedinaAguirre', { fetchImpl: async () => response([repo({ description: null, language: null, topics: ['portfolio'], homepage: 'javascript:alert(1)' })]) });
  assert.equal(project.description, '');
  assert.deepEqual(project.technologies, []);
  assert.equal(project.demoUrl, null);
  for (const value of ['', 'bad-url', 'javascript:alert(1)', 'https://user:pass@example.com']) assert.equal(safeHomepage(value), null);
  assert.equal(safeHomepage('https://example.com'), 'https://example.com/');
});

test('reconoce el repositorio del propio sitio y traduce su descripción', async () => {
  const { localizeProject } = await import('../src/lib/github.mjs');
  const [site, other] = await loadPersonalProjects('AnaMedinaAguirre', { token: '', fetchImpl: async () => response([
    repo({ id: 10, name: 'AnaMedinaAguirre.github.io', description: 'Original', homepage: 'https://anamedinaaguirre.github.io' }),
    repo({ id: 11, name: 'etl-demo', updated_at: '2026-10-01T00:00:00Z' }),
  ]) });
  assert.equal(site.isSite, true);
  const { uniqueTags } = await import('../src/lib/github.mjs');
  assert.deepEqual(uniqueTags(['Astro', 'astro', 'supabase', '', null, 'Supabase']), ['Astro', 'supabase']);
  assert.equal(other.isSite, false);
  const overrides = { 'anamedinaaguirre.github.io': { en: { description: 'Translated' } } };
  assert.equal(localizeProject(site, 'en', overrides).description, 'Translated');
  assert.equal(localizeProject(site, 'es', overrides).description, 'Original', 'sin traducción se conserva el original');
  assert.equal(localizeProject(other, 'en', overrides).description, 'Pipeline');
  assert.throws(() => localizeProject(site, 'en', { 'AnaMedinaAguirre.github.io': { en: { description: '  ' } } }));
});

test('estado del proyecto, linaje y dashboard desde los overrides', async () => {
  const { localizeProject } = await import('../src/lib/github.mjs');
  const docs = 'https://anamedinaaguirre.github.io/pipeline-etl-retail/';
  const base = { name: 'pipeline-etl-retail', description: 'x', demoUrl: docs };
  // En desarrollo: sin demo ni dashboard aunque exista la URL; el linaje sí
  const dev = localizeProject(base, 'es', { 'pipeline-etl-retail': { estado: 'en_desarrollo', linaje: docs, dashboard: 'https://app.powerbi.com/x' } });
  assert.equal(dev.status, 'en_desarrollo');
  assert.equal(dev.demoUrl, null);
  assert.equal(dev.dashboardUrl, null);
  assert.equal(dev.lineageUrl, docs);
  // Finalizado: aparece el dashboard; el sitio del repo no se repite como demo si es el linaje
  const done = localizeProject(base, 'en', { 'pipeline-etl-retail': { estado: 'finalizado', linaje: docs, dashboard: 'https://app.powerbi.com/x' } });
  assert.equal(done.dashboardUrl, 'https://app.powerbi.com/x');
  assert.equal(done.demoUrl, null);
  // Sin overrides: se conserva la demo de GitHub y no hay estado
  const plain = localizeProject(base, 'es', {});
  assert.equal(plain.status, null);
  assert.equal(plain.demoUrl, docs);
  // Valores inválidos hacen fallar el build
  assert.throws(() => localizeProject(base, 'es', { 'pipeline-etl-retail': { estado: 'casi' } }));
  assert.throws(() => localizeProject(base, 'es', { 'pipeline-etl-retail': { linaje: 'javascript:alert(1)' } }));
  assert.throws(() => localizeProject(base, 'es', { 'pipeline-etl-retail': { estado: 'finalizado', dashboard: 'http://inseguro.example' } }));
});
