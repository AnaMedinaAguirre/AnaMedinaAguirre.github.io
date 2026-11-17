/** Solo se importa desde el servidor de Astro: el token nunca llega al navegador. */
const requests = new Map();

/** Etiquetas sin vacíos ni duplicados; "Astro" y "astro" cuentan como una (gana la primera). */
export function uniqueTags(values) {
  const seen = new Set();
  return values.filter(v => typeof v === 'string' && v.trim()).filter(v => {
    const k = v.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function safeHomepage(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export async function loadPersonalProjects(owner, { fetchImpl = fetch, token = process.env.GITHUB_TOKEN } = {}) {
  if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(owner)) throw new Error('Usuario de GitHub inválido');
  const projects = [];
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let page = 1; page <= 100; page++) {
    const url = `https://api.github.com/users/${owner}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`;
    const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`GitHub respondió HTTP ${response.status}; no se publicará una lista incompleta de proyectos.`);
    const repos = await response.json();
    if (!Array.isArray(repos)) throw new Error('Respuesta inesperada de GitHub');
    for (const repo of repos) {
      if (repo.private !== false || !Array.isArray(repo.topics) || !repo.topics.includes('portfolio')) continue;
      if (!Number.isInteger(repo.id) || typeof repo.name !== 'string' || !/^[\w.-]+$/.test(repo.name) || typeof repo.updated_at !== 'string' || !Number.isFinite(Date.parse(repo.updated_at))) {
        throw new Error('Metadatos de proyecto inválidos en GitHub');
      }
      projects.push({
        id: repo.id,
        name: repo.name,
        // El repositorio de este mismo sitio (usuario.github.io) se presenta distinto.
        isSite: repo.name.toLowerCase() === `${owner.toLowerCase()}.github.io`,
        description: typeof repo.description === 'string' ? repo.description.trim() : '',
        technologies: uniqueTags([repo.language, ...repo.topics.filter(t => t !== 'portfolio')]),
        updatedAt: repo.updated_at,
        createdAt: typeof repo.created_at === 'string' && Number.isFinite(Date.parse(repo.created_at)) ? repo.created_at : repo.updated_at,
        codeUrl: `https://github.com/${owner}/${repo.name}`,
        demoUrl: safeHomepage(repo.homepage),
      });
    }
    if (repos.length < 100) return projects.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.name.localeCompare(b.name));
  }
  throw new Error('GitHub excedió el límite de paginación; no se publicará una lista incompleta.');
}

const STATUSES = ['en_desarrollo', 'en_curso', 'finalizado'];

/** Slug de la página de caso: el del override o el nombre del repo en minúsculas. */
export function projectSlug(name, slug) {
  const s = slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) throw new Error(`data/repos.overrides.json (${name}): slug inválido "${s}"`);
  return s;
}

const isText = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Aplica data/repos.overrides.json a un proyecto. Formato por repositorio:
 *   "es" / "en": { "description": "…" }  traducción (la de GitHub está en un idioma)
 *   "estado": "en_desarrollo" | "finalizado"
 *   "linaje": URL de la documentación de dbt (enlace secundario)
 *   "dashboard": URL del dashboard publicado
 *   "slug": nombre de la página de caso (por defecto, el del repo)
 *   "es" / "en": además, "tipo", "problema", "solucion", "trabajo" (lista),
 *                "flujo" (nodos del diagrama: { texto, tech? | icono?, pendiente? })
 *                y "flujoNota" (pie del diagrama), para la página de caso
 * Reglas: en desarrollo no se muestra demo ni dashboard (aún no están listos);
 * el dashboard aparece solo con "finalizado" y una URL. Si el sitio del repo
 * (homepage de GitHub) es el linaje, no se presenta como demo.
 * Valores inválidos hacen fallar el build.
 */
export function localizeProject(project, lang, overrides = {}) {
  const entry = Object.entries(overrides).find(([name]) => name.toLowerCase() === project.name.toLowerCase())?.[1] ?? {};
  const where = `data/repos.overrides.json (${project.name})`;
  const description = entry[lang]?.description;
  if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
    throw new Error(`${where}: descripción inválida (${lang})`);
  }
  const status = entry.estado ?? null;
  if (status !== null && !STATUSES.includes(status)) {
    throw new Error(`${where}: "estado" debe ser ${STATUSES.join(' o ')}`);
  }
  const url = (key) => {
    if (entry[key] === undefined || entry[key] === null) return null;
    const safe = safeHomepage(entry[key]);
    if (!safe || !safe.startsWith('https:')) throw new Error(`${where}: "${key}" debe ser una URL https`);
    return safe;
  };
  const lineageUrl = url('linaje');
  const dashboardUrl = status === 'finalizado' ? url('dashboard') : (url('dashboard'), null);
  const text = entry[lang] ?? {};
  for (const key of ['tipo', 'problema', 'solucion', 'flujoNota']) {
    if (text[key] !== undefined && !isText(text[key])) throw new Error(`${where}: "${key}" inválido (${lang})`);
  }
  if (text.trabajo !== undefined && !(Array.isArray(text.trabajo) && text.trabajo.length && text.trabajo.every(isText))) {
    throw new Error(`${where}: "trabajo" debe ser una lista de textos (${lang})`);
  }
  const flujo = text.flujo ?? [];
  if (!Array.isArray(flujo) || flujo.some((n) => !n || !isText(n.texto) || (n.tech !== undefined && !isText(n.tech)) || (n.icono !== undefined && !isText(n.icono)))) {
    throw new Error(`${where}: "flujo" inválido (${lang})`);
  }
  let demoUrl = project.demoUrl;
  if (status === 'en_desarrollo' || (demoUrl && demoUrl === lineageUrl)) demoUrl = null;
  return {
    ...project,
    description: description ? description.trim() : project.description,
    status,
    lineageUrl,
    dashboardUrl,
    demoUrl,
    slug: projectSlug(project.name, entry.slug),
    year: new Date(project.createdAt ?? project.updatedAt).getUTCFullYear(),
    tipo: text.tipo ?? null,
    problema: text.problema ?? null,
    solucion: text.solucion ?? null,
    trabajo: text.trabajo ?? [],
    flujo,
    flujoNota: text.flujoNota ?? null,
  };
}

/** Comparte una consulta entre ES/EN durante el mismo build. Los errores hacen fallar el build. */
export function getPersonalProjects(owner) {
  if (!requests.has(owner)) requests.set(owner, loadPersonalProjects(owner));
  return requests.get(owner);
}
