export function metricsConfig(url, key) {
  if (!url && !key) return null;
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !/^[a-z0-9]+\.supabase\.co$/.test(parsed.hostname) || parsed.username || parsed.password || parsed.port || parsed.search || parsed.hash || parsed.pathname !== '/' || !/^sb_publishable_[a-zA-Z0-9_-]+$/.test(key || '')) {
    throw new Error('Métricas: usa la URL del proyecto y una clave Publishable, nunca una clave secreta.');
  }
  return { url: parsed.origin, key };
}

export function validateMetrics(data) {
  const count = n => Number.isSafeInteger(n) && n >= 0;
  if (!data || !count(data.total) || !count(data.last30) || data.last30 > data.total || !Array.isArray(data.series) || data.series.length !== 30) throw new Error('Métricas inválidas');
  let previous = null;
  for (const row of data.series) {
    if (!row || !/^\d{4}-\d{2}-\d{2}$/.test(row.day) || !count(row.visits)) throw new Error('Serie inválida');
    const time = Date.parse(`${row.day}T00:00:00Z`);
    if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== row.day || (previous !== null && time - previous !== 86400000)) throw new Error('Fechas inválidas');
    previous = time;
  }
  if (data.series.reduce((sum, row) => sum + row.visits, 0) !== data.last30) throw new Error('Totales inconsistentes');
  return data;
}

export function trendPoints(series) {
  const max = Math.max(1, ...series.map(row => row.visits));
  return series.map((row, i) => `${(8 + i * 284 / (series.length - 1)).toFixed(2)},${(72 - row.visits * 64 / max).toFixed(2)}`).join(' ');
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
