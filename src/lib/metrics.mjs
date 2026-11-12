export function metricsConfig(url, key) {
  if (!url && !key) return null;
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(parsed.hostname) || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash || parsed.pathname !== '/' || !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key || '')) {
    throw new Error('Métricas: usa la URL del proyecto y una clave Publishable, nunca una clave secreta.');
  }
  return { url: parsed.origin, key };
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const count = n => Number.isSafeInteger(n) && n >= 0;
const isDay = d => typeof d === 'string' && DAY_RE.test(d) && Number.isFinite(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

/**
 * Valida la respuesta de get_portfolio_metrics. `first_day` y `by_lang` son
 * opcionales: la función SQL anterior no los devuelve y el sitio debe seguir
 * funcionando mientras no se ejecute la actualización.
 */
export function validateMetrics(data) {
  if (!data || !count(data.total) || !count(data.last30) || data.last30 > data.total || !Array.isArray(data.series) || data.series.length !== 30) throw new Error('Métricas inválidas');
  let previous = null;
  for (const row of data.series) {
    if (!row || !isDay(row.day) || !count(row.visits)) throw new Error('Serie inválida');
    const time = Date.parse(`${row.day}T00:00:00Z`);
    if (previous !== null && time - previous !== 86400000) throw new Error('Fechas inválidas');
    previous = time;
  }
  if (data.series.reduce((sum, row) => sum + row.visits, 0) !== data.last30) throw new Error('Totales inconsistentes');
  if ('first_day' in data && data.first_day !== null) {
    if (!isDay(data.first_day) || data.first_day > data.series[29].day) throw new Error('Primer día inválido');
    if (data.total === 0) throw new Error('Primer día sin visitas');
  }
  if ('by_lang' in data) {
    const l = data.by_lang;
    if (!l || !count(l.es) || !count(l.en) || l.es + l.en !== data.total) throw new Error('Reparto por idioma inválido');
  }
  return data;
}

/**
 * Días que muestra el gráfico: desde la primera visita hasta hoy, como máximo
 * los 30 días de la serie. Sin `first_day` (SQL anterior) se usa el primer día
 * con visitas dentro de la serie. Devuelve [] si todavía no hay visitas.
 */
export function chartWindow(data) {
  const series = data.series;
  let start = data.first_day ?? series.find(row => row.visits > 0)?.day ?? null;
  if (start === null) return [];
  if (start < series[0].day) start = series[0].day;
  return series.filter(row => row.day >= start);
}

/** Reparto ES/EN en porcentajes enteros que suman 100, o null si no hay datos. */
export function langShare(byLang) {
  if (!byLang) return null;
  const total = byLang.es + byLang.en;
  if (total === 0) return null;
  const es = Math.round((byLang.es / total) * 100);
  return { es, en: 100 - es };
}

/** "2026-11-12" → "12 nov" (es) / "Nov 12" (en), sin punto final. */
export function formatDay(day, lang, { year = false } = {}) {
  const fmt = new Intl.DateTimeFormat(lang === 'es' ? 'es-PE' : 'en-US', {
    day: 'numeric', month: 'short', timeZone: 'UTC', ...(year ? { year: 'numeric' } : {}),
  });
  return fmt.format(new Date(`${day}T00:00:00Z`)).replace(/\./g, '').replace(/\s+de\s+/g, ' ');
}

/**
 * Qué barras llevan el valor encima: todas las que tienen visitas mientras sean
 * pocas; con muchas, solo el máximo y el último día con visitas (el resto queda
 * en el tooltip y en la tabla). Devuelve un Set de índices.
 */
export function valueLabelIndexes(rows, maxLabels = 12) {
  const nonzero = rows.map((r, i) => (r.visits > 0 ? i : -1)).filter(i => i >= 0);
  if (nonzero.length <= maxLabels) return new Set(nonzero);
  let max = nonzero[0];
  for (const i of nonzero) if (rows[i].visits > rows[max].visits) max = i;
  return new Set([max, nonzero[nonzero.length - 1]]);
}

/** Índices con fecha bajo el eje: primero, último y espaciados para que no se pisen. */
export function dateLabelIndexes(length, maxLabels) {
  if (length <= 0) return new Set();
  if (length <= maxLabels) return new Set(Array.from({ length }, (_, i) => i));
  const step = Math.ceil((length - 1) / Math.max(1, maxLabels - 1));
  const set = new Set([0, length - 1]);
  for (let i = step; i < length - 1; i += step) if (length - 1 - i >= step) set.add(i); // nunca pegada a la última
  return set;
}

export function shouldCount({ origin, siteOrigin, pathname, lang, webdriver, userAgent }) {
  return origin === siteOrigin && ((pathname === '/' && lang === 'es') || (pathname === '/en/' && lang === 'en')) && !webdriver && !/bot|crawler|spider|headless|lighthouse|preview/i.test(userAgent);
}

export async function countSession({ storage, send }) {
  const key = 'portfolio-visit-v1';
  try {
    if (storage.getItem(key)) return false;
    storage.setItem(key, 'pending');
  } catch { return false; } // Sin almacenamiento no se puede evitar repetir el conteo.
  try {
    await send();
    storage.setItem(key, 'counted');
    return true;
  } catch {
    try { storage.removeItem(key); } catch { /* almacenamiento bloqueado */ }
    return false;
  }
}
