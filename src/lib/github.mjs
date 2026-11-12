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
        codeUrl: `https://github.com/${owner}/${repo.name}`,
        demoUrl: safeHomepage(repo.homepage),
      });
    }
    if (repos.length < 100) return projects.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.name.localeCompare(b.name));
  }
  throw new Error('GitHub excedió el límite de paginación; no se publicará una lista incompleta.');
}

/**
 * Aplica las traducciones de data/repos.overrides.json: la descripción de GitHub
 * está en un solo idioma. Formato: { "<nombre del repo>": { "es": { "description": "…" }, "en": { … } } }.
 * Sin traducción se conserva la descripción original.
 */
export function localizeProject(project, lang, overrides = {}) {
  const entry = Object.entries(overrides).find(([name]) => name.toLowerCase() === project.name.toLowerCase())?.[1];
  const description = entry?.[lang]?.description;
  if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
    throw new Error(`data/repos.overrides.json: descripción inválida para ${project.name} (${lang})`);
  }
  return description ? { ...project, description: description.trim() } : project;
}

/** Comparte una consulta entre ES/EN durante el mismo build. Los errores hacen fallar el build. */
export function getPersonalProjects(owner) {
  if (!requests.has(owner)) requests.set(owner, loadPersonalProjects(owner));
  return requests.get(owner);
}
