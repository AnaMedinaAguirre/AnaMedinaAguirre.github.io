/**
 * Visuales que imitan la herramienta de cada proyecto (data-sim): un cursor
 * simulado hace clic y la interfaz responde, como en un video de producto.
 * - El HTML trae el estado FINAL: sin JS o con movimiento reducido se ve así,
 *   sin cursor ni botón de repetir.
 * - Con movimiento: se "arma" con el estado inicial, se reproduce UNA vez al
 *   entrar en pantalla y se repite con el botón "↻ Repetir". Nada en bucle.
 * - Cursor y clic: curva de resorte. Interfaz: 300 ms ease-out.
 * Este módulo solo se carga en las páginas que tienen alguno de estos visuales.
 */
import { animate as waapi } from 'motion/mini';

const SPRING = [0.34, 1.56, 0.64, 1];
const EASE_OUT = [0, 0, 0.2, 1];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const numFmt = (lang, decimals = 0) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const lerp = (a, b, k) => a + (b - a) * k;

/** Anima con motion/mini (WAAPI) y deja fijo el valor final en el estilo. */
async function to(el, frames, options) {
  const controls = waapi(el, frames, options);
  await controls.finished;
  for (const [prop, values] of Object.entries(frames)) el.style[prop] = Array.isArray(values) ? values[values.length - 1] : values;
}
/** Interpolación numérica 0 → 1 con salida suave (para números y gráficos). */
function tween(duration, onUpdate) {
  return new Promise((resolve) => {
    let t0 = 0;
    const tick = (ts) => {
      if (!t0) t0 = ts;
      const k = Math.min((ts - t0) / duration, 1);
      onUpdate(1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- Cursor ---------- */
const pos = new WeakMap();
const place = (x, y, scale = 1) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale})`;
function cursorStart(root, cursor) {
  const r = root.getBoundingClientRect();
  const p = { x: r.width * 0.86, y: r.height * 0.9 };
  pos.set(cursor, p);
  cursor.style.transform = place(p.x, p.y);
  return to(cursor, { opacity: ['0', '1'] }, { duration: 0.3, ease: EASE_OUT });
}
function cursorTo(root, cursor, target) {
  const r = root.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const from = pos.get(cursor);
  const p = { x: t.left - r.left + t.width * 0.55, y: t.top - r.top + t.height * 0.62 };
  pos.set(cursor, p);
  return to(cursor, { transform: [place(from.x, from.y), place(p.x, p.y)] }, { duration: 0.8, ease: SPRING });
}
async function click(cursor, target) {
  const p = pos.get(cursor);
  const ring = cursor.querySelector('.sim-click');
  to(cursor, { transform: [place(p.x, p.y), place(p.x, p.y, 0.82), place(p.x, p.y)] }, { duration: 0.32, ease: SPRING });
  if (target) {
    target.classList.add('is-pressed');
    setTimeout(() => target.classList.remove('is-pressed'), 180);
  }
  await to(ring, { transform: ['scale(0.3)', 'scale(1.7)'], opacity: ['0.85', '0'] }, { duration: 0.42, ease: EASE_OUT });
}
const cursorOut = (cursor) => to(cursor, { opacity: ['1', '0'] }, { duration: 0.4, ease: EASE_OUT });

/* ---------- Reporte estilo Power BI ---------- */
const pbi = {
  setup(root) {
    const cfg = JSON.parse(root.getAttribute('data-config'));
    const $ = (s) => root.querySelector(s);
    const $$ = (s) => Array.from(root.querySelectorAll(s));
    const money0 = numFmt(cfg.lang, 0), money2 = numFmt(cfg.lang, 2), axisFmt = numFmt(cfg.lang, 2);
    const pct = (d) => {
      const s = numFmt(cfg.lang, Number.isInteger(d.v) ? 0 : 1).format(d.v);
      return `${d.up ? '▲' : '▼'} ${cfg.lang === 'en' ? `${s}%` : `${s} %`}`;
    };
    const kpiText = [(v) => `S/ ${money0.format(v)}`, (v) => `S/ ${money2.format(v)}`, (v) => money0.format(v)];
    const yOf = (v, s) => cfg.BOTTOM - ((v - s.min) / (s.max - s.min)) * (cfg.BOTTOM - cfg.TOP);
    const W = cfg.W;
    const xs = cfg.xs.map((x) => x * W);

    // Dibuja el reporte en un punto intermedio k entre "todas" (0) y "Sur" (1)
    const render = (k) => {
      const a = cfg.all, b = cfg.site;
      $$('[data-kpi]').forEach((el, i) => { el.textContent = kpiText[i](lerp(a.kpis[i], b.kpis[i], k)); });
      const ys = a.months.map((v, i) => lerp(yOf(v, a), yOf(b.months[i], b), k));
      $('.pbi-path').setAttribute('d', ys.map((y, i) => `${i ? 'L' : 'M'}${xs[i].toFixed(1)} ${y.toFixed(1)}`).join(' '));
      $$('[data-dot]').forEach((el, i) => el.setAttribute('cy', ys[i].toFixed(1)));
      // Las líneas guía están a la misma altura en ambos estados: solo cambia el texto
      $$('[data-axis]').forEach((el, i) => { el.textContent = `${axisFmt.format(k < 0.5 ? a.axis[i] : b.axis[i])} M`; });
      $$('[data-delta]').forEach((el, i) => { el.textContent = pct(k < 0.5 ? a.deltas[i] : b.deltas[i]); });
    };
    const select = (onTarget) => {
      $$('[data-tile]').forEach((el) => {
        const isAll = el.getAttribute('data-tile') === 'all';
        el.classList.toggle('is-on', onTarget ? el.classList.contains('pbi-tile--target') : isAll);
      });
      $$('[data-bar]').forEach((el) => el.classList.toggle('is-dim', onTarget && !el.classList.contains('pbi-bar--target')));
    };
    // Marcar la sede objetivo (la que el HTML trae seleccionada)
    $$('[data-tile]').forEach((el) => { if (el.classList.contains('is-on')) el.classList.add('pbi-tile--target'); });
    $$('[data-bar]').forEach((el) => { if (!el.classList.contains('is-dim')) el.classList.add('pbi-bar--target'); });
    return {
      arm() { select(false); render(0); },
      async play(cursor) {
        const target = $('.pbi-tile--target');
        await cursorStart(root, cursor);
        await cursorTo(root, cursor, target);
        await click(cursor, target);
        select(true);
        await tween(600, render);
        await wait(400);
        await cursorOut(cursor);
      },
    };
  },
};

/* ---------- Editor estilo n8n ---------- */
const n8n = {
  setup(root) {
    // Cada nodo y contador existe en las dos vistas (lienzo y columna): se tratan juntos
    const all = (sel) => Array.from(root.querySelectorAll(sel));
    const node = (i) => all(`[data-node="${i}"]`);
    const items = (i) => all(`[data-items="${i}"]`);
    const edge = (i) => all(`[data-edge="${i}"]`);
    const visible = (els) => els.find((el) => el.getClientRects().length) || els[0];
    const exec = visible(all('.n8n-exec'));
    const RUN = [[0], [1], [2], [3], [4, 5]];      // orden de ejecución (4 y 5: ramas true/false)
    const EDGES_AFTER = [[0], [1], [2], [3, 4], []];  // conexiones que se encienden tras cada paso
    const set = (els, cls, on) => els.forEach((el) => el.classList.toggle(cls, on));
    return {
      arm() {
        root.classList.remove('is-done', 'is-open');
        for (let i = 0; i < 6; i++) { set(node(i), 'is-ok', false); set(node(i), 'is-running', false); set(node(i), 'is-selected', false); }
        for (let i = 0; i < 5; i++) { set(items(i), 'is-shown', false); set(edge(i), 'is-shown', false); }
      },
      async play(cursor) {
        await cursorStart(root, cursor);
        await cursorTo(root, cursor, exec);
        await click(cursor, exec);
        for (let k = 0; k < RUN.length; k++) {
          RUN[k].forEach((i) => set(node(i), 'is-running', true));
          await wait(380);
          RUN[k].forEach((i) => { set(node(i), 'is-running', false); set(node(i), 'is-ok', true); });
          for (const e of EDGES_AFTER[k]) { set(edge(e), 'is-shown', true); set(items(e), 'is-shown', true); }
          await wait(140);
        }
        root.classList.add('is-done');
        // Abrir el nodo WooCommerce: su salida aparece en el panel inferior
        const woo = visible(node(4));
        await cursorTo(root, cursor, woo.querySelector('.n8n-box'));
        await click(cursor, woo.querySelector('.n8n-box'));
        set(node(4), 'is-selected', true);
        root.classList.add('is-open');
        await wait(500);
        await cursorOut(cursor);
      },
    };
  },
};

const kinds = { pbi, n8n };

function init() {
  const roots = document.querySelectorAll('[data-sim]');
  if (!roots.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      entry.target.simPlay();
    });
  }, { threshold: 0.4 });
  roots.forEach((root) => {
    const kind = kinds[root.getAttribute('data-sim')];
    if (!kind) return;
    const sim = kind.setup(root);
    const cursor = root.querySelector('.sim-cursor');
    const replay = root.querySelector('[data-sim-replay]');
    let playing = false;
    root.simPlay = async () => {
      if (playing) return;
      playing = true;
      replay.disabled = true;
      sim.arm();
      try { await sim.play(cursor); } finally {
        playing = false;
        replay.disabled = false;
      }
    };
    replay.hidden = false;
    replay.addEventListener('click', () => root.simPlay());
    // Fuera de pantalla: queda armado para que no se vea el final antes de tiempo
    if (root.getBoundingClientRect().top > window.innerHeight) sim.arm();
    io.observe(root);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
