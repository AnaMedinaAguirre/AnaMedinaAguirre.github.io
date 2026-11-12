/** Solo se importa desde el servidor de Astro: el token nunca llega al navegador. */
const requests = new Map();

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
        description: typeof repo.description === 'string' ? repo.description.trim() : '',
        technologies: [...new Set([repo.language, ...repo.topics.filter(t => t !== 'portfolio')].filter(t => typeof t === 'string' && t.trim()))],
        updatedAt: repo.updated_at,
        codeUrl: `https://github.com/${owner}/${repo.name}`,
        demoUrl: safeHomepage(repo.homepage),
      });
    }
    if (repos.length < 100) return projects.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.name.localeCompare(b.name));
  }
  throw new Error('GitHub excedió el límite de paginación; no se publicará una lista incompleta.');
}

/** Comparte una consulta entre ES/EN durante el mismo build. Los errores hacen fallar el build. */
export function getPersonalProjects(owner) {
  if (!requests.has(owner)) requests.set(owner, loadPersonalProjects(owner));
  return requests.get(owner);
}
