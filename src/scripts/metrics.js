import {
  validateMetrics, shouldCount, countSession,
  chartWindow, langShare, formatDay, valueLabelIndexes, dateLabelIndexes,
} from '../lib/metrics.mjs';

const panel = document.querySelector('[data-metrics]');
const MIN_SLOTS = 7;      // con pocos días, las barras no se estiran: el eje sigue a todo el ancho
const DATE_LABEL_PX = 56; // espacio mínimo por fecha bajo el eje

if (panel?.dataset.url && panel.dataset.key) {
  const { url, key, origin, lang } = panel.dataset;
  const m = JSON.parse(panel.querySelector('[data-metrics-i18n]').textContent);
  const $ = sel => panel.querySelector(sel);
  const numberFmt = new Intl.NumberFormat(lang === 'es' ? 'es-PE' : 'en-US');
  const visitsText = n => `${numberFmt.format(n)} ${n === 1 ? m.visitOne : m.visitMany}`;

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

  /* ---------- Estados ---------- */
  function setState(state) {
    panel.dataset.state = state;
    $('[data-body]').hidden = state === 'error';
    $('[data-body]').setAttribute('aria-busy', String(state === 'loading'));
    $('[data-error]').hidden = state !== 'error';
    $('[data-status]').textContent = state === 'loading' ? m.loading : state === 'error' ? m.error : '';
  }

  /* ---------- KPIs ---------- */
  function renderKpis(data) {
    $('[data-total]').textContent = numberFmt.format(data.total);
    $('[data-last30]').textContent = numberFmt.format(data.last30);
    const dd = $('[data-lang-share]');
    dd.replaceChildren();
    const share = langShare(data.by_lang);
    if (!data.by_lang) {
      const pending = document.createElement('span');
      pending.className = 'kpi-pending';
      pending.textContent = m.langPending;
      dd.append('—', pending);
      return;
    }
    if (!share) { dd.textContent = '—'; return; }
    const split = document.createElement('span');
    split.className = 'lang-split';
    for (const [code, label, value] of [['es', m.langEs, share.es], ['en', m.langEn, share.en]]) {
      const item = document.createElement('span');
      item.className = `lang-item lang-item--${code}`;
      const sw = document.createElement('span');
      sw.className = 'lang-swatch';
      sw.setAttribute('aria-hidden', 'true');
      const strong = document.createElement('strong');
      strong.textContent = `${value}%`;
      item.append(sw, strong, ` ${label}`);
      split.append(item);
    }
    const bar = document.createElement('span');
    bar.className = 'lang-bar';
    bar.setAttribute('aria-hidden', 'true');
    for (const [code, value] of [['es', share.es], ['en', share.en]]) {
      if (value === 0) continue; // una parte en cero no se dibuja
      const seg = document.createElement('span');
      seg.className = `lang-seg lang-seg--${code}`;
      seg.style.flexGrow = String(value);
      bar.append(seg);
    }
    dd.append(split, bar);
  }

  /* ---------- Gráfico de barras ---------- */
  let rows = [];
  let active = -1;

  function renderChart(data) {
    rows = chartWindow(data);
    const plot = $('[data-chart]');
    const axis = $('[data-axis]');
    const empty = $('[data-no-data]');
    const since = $('[data-since]');
    plot.replaceChildren();
    axis.replaceChildren();

    const sinceDay = data.first_day ?? (rows.length && (rows[0].day > data.series[0].day || data.series[0].visits === 0) ? rows[0].day : null);
    since.hidden = !sinceDay;
    if (sinceDay) since.textContent = m.since.replace('{date}', formatDay(sinceDay, lang, { year: true }));

    if (!rows.length) {
      empty.hidden = false;
      plot.hidden = axis.hidden = true;
      $('[data-table]').hidden = true;
      return;
    }
    empty.hidden = true;
    plot.hidden = axis.hidden = false;

    const slots = Math.max(rows.length, MIN_SLOTS);
    const max = Math.max(1, ...rows.map(r => r.visits));
    const labels = valueLabelIndexes(rows);
    plot.style.setProperty('--slots', slots);
    axis.style.setProperty('--slots', slots);
    plot.setAttribute('role', 'group');
    plot.setAttribute('tabindex', '0');
    plot.setAttribute('aria-label', `${m.chartLabel}. ${rows.length} ${lang === 'es' ? 'días' : 'days'}.`);

    const cols = document.createElement('div');
    cols.className = 'mchart-cols';
    rows.forEach((row, i) => {
      const col = document.createElement('div');
      col.className = 'mchart-col';
      col.dataset.index = String(i);
      if (row.visits > 0) {
        if (labels.has(i)) {
          const v = document.createElement('span');
          v.className = 'mchart-value';
          v.textContent = numberFmt.format(row.visits);
          col.append(v);
        }
        const bar = document.createElement('span');
        bar.className = 'mchart-bar';
        bar.style.height = `${(row.visits / max) * 100}%`;
        col.append(bar);
      }
      cols.append(col);
    });
    plot.append(cols);
    renderAxis();
    renderTable();
  }

  function renderAxis() {
    const axis = $('[data-axis]');
    axis.replaceChildren();
    if (!rows.length) return;
    const slots = Math.max(rows.length, MIN_SLOTS);
    const width = axis.getBoundingClientRect().width || 300;
    const fit = Math.max(2, Math.floor((width * rows.length / slots) / DATE_LABEL_PX));
    const show = dateLabelIndexes(rows.length, fit);
    rows.forEach((row, i) => {
      const cell = document.createElement('span');
      cell.className = 'mchart-tick';
      if (show.has(i)) {
        const label = document.createElement('span');
        label.textContent = formatDay(row.day, lang);
        cell.append(label);
      }
      axis.append(cell);
    });
  }

  function renderTable() {
    const body = $('[data-table-body]');
    body.replaceChildren();
    for (const row of rows) {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = formatDay(row.day, lang, { year: true });
      const td = document.createElement('td');
      td.textContent = numberFmt.format(row.visits);
      tr.append(th, td);
      body.append(tr);
    }
    $('[data-table]').hidden = false;
  }

  /* ---------- Tooltip (puntero y teclado) ---------- */
  const tip = $('[data-tip]');
  function showTip(i, { announce = false } = {}) {
    const cols = panel.querySelectorAll('.mchart-cols:not(.skel-bars) .mchart-col');
    if (!cols[i]) return;
    cols.forEach(c => c.classList.toggle('is-active', Number(c.dataset.index) === i));
    active = i;
    const row = rows[i];
    $('[data-tip-value]').textContent = visitsText(row.visits);
    $('[data-tip-day]').textContent = formatDay(row.day, lang, { year: true });
    tip.hidden = false;
    const area = $('.mchart-area').getBoundingClientRect();
    const col = cols[i].getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const center = col.left - area.left + col.width / 2;
    tip.style.left = `${Math.min(Math.max(center, half), area.width - half)}px`;
    // Sobre la punta de la barra (o del valor), no en lo alto del gráfico.
    const mark = cols[i].querySelector('.mchart-value') || cols[i].querySelector('.mchart-bar');
    const anchor = mark ? mark.getBoundingClientRect().top : col.bottom;
    tip.style.top = `${Math.max(0, anchor - area.top - 8)}px`;
    if (announce) $('[data-live]').textContent = `${formatDay(row.day, lang, { year: true })}: ${visitsText(row.visits)}`;
  }
  function hideTip() {
    tip.hidden = true;
    active = -1;
    panel.querySelectorAll('.mchart-col.is-active').forEach(c => c.classList.remove('is-active'));
  }

  const plot = $('[data-chart]');
  plot.addEventListener('pointermove', e => {
    const col = e.target.closest('.mchart-col[data-index]');
    if (col) showTip(Number(col.dataset.index));
  });
  plot.addEventListener('pointerleave', hideTip);
  plot.addEventListener('focus', () => { if (rows.length) showTip(active >= 0 ? active : rows.length - 1, { announce: true }); });
  plot.addEventListener('blur', hideTip);
  plot.addEventListener('keydown', e => {
    if (!rows.length) return;
    const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (e.key === 'Escape') { hideTip(); return; }
    if (!(e.key in moves)) return;
    e.preventDefault();
    const base = active >= 0 ? active : rows.length - 1;
    const next = Math.min(rows.length - 1, Math.max(0, base + moves[e.key]));
    showTip(next, { announce: true });
  });

  if ('ResizeObserver' in window) {
    let last = 0;
    new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width);
      if (w !== last) { last = w; renderAxis(); hideTip(); }
    }).observe($('[data-axis]'));
  }

  /* ---------- Carga ---------- */
  async function load() {
    setState('loading');
    try {
      await recorded;
      const data = validateMetrics(await rpc('get_portfolio_metrics'));
      renderKpis(data);
      setState('ready');
      renderChart(data);
    } catch {
      setState('error');
    }
  }
  panel.querySelector('[data-retry]')?.addEventListener('click', () => { void load(); });

  // Cargar al acercarse a la sección, sin bloquear el contenido principal.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void load(); }
    }, { rootMargin: '300px' });
    observer.observe(panel);
  } else {
    void load();
  }
} else if (panel) {
  // Sin configuración pública (por ejemplo, build local sin .env): estado explícito, sin reintento.
  const m = JSON.parse(panel.querySelector('[data-metrics-i18n]').textContent);
  panel.dataset.state = 'unavailable';
  panel.querySelector('[data-body]').hidden = true;
  panel.querySelector('[data-error-title]').textContent = m.unavailable;
  panel.querySelector('[data-error-hint]').hidden = true;
  panel.querySelector('[data-retry]').hidden = true;
  panel.querySelector('[data-error]').hidden = false;
}
