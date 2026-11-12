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
