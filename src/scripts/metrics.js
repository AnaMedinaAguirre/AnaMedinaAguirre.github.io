import { validateMetrics, trendPoints, shouldCount, countSession } from '../lib/metrics.mjs';

const panel = document.querySelector('[data-metrics]');
if (panel?.dataset.url && panel.dataset.key) {
  const { url, key, origin, lang } = panel.dataset;
  async function rpc(name, body = {}) {
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Métricas no disponibles');
    return name === 'get_portfolio_metrics' ? response.json() : undefined;
  }
  async function record() {
    if (shouldCount({ origin: location.origin, siteOrigin: origin, pathname: location.pathname, lang, webdriver: navigator.webdriver, userAgent: navigator.userAgent })) {
        let storage;
        try { storage = sessionStorage; } catch { /* sin conteo si está bloqueado */ }
        if (storage) await countSession({ storage, send: () => rpc('record_portfolio_visit', { p_page: location.pathname, p_lang: lang }) });
    }
  }
  const recorded = record();
  async function load() {
    const status = panel.querySelector('[data-status]');
    try {
      await recorded;
      const data = validateMetrics(await rpc('get_portfolio_metrics'));
      const format = new Intl.NumberFormat(lang);
      panel.querySelector('[data-total]').textContent = format.format(data.total);
      panel.querySelector('[data-last30]').textContent = format.format(data.last30);
      panel.querySelector('[data-trend]').setAttribute('points', trendPoints(data.series));
      panel.querySelector('.metrics-trend').hidden = false;
      status.textContent = '';
    } catch {
      status.textContent = status.dataset.unavailable;
    }
  }
  // Cargar al acercarse a la sección, sin bloquear el contenido principal.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void load(); }
    }, { rootMargin: '300px' });
    observer.observe(panel);
  } else {
    void load();
  }
}
