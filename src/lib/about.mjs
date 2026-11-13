/**
 * Cifras y mini línea de tiempo de "Sobre mí", calculadas desde el CV.
 * Funciones puras (sin Astro) para poder probarlas con node --test.
 */

/** Años completos entre un mes "AAAA-MM" y una fecha (por defecto, la del build). */
export function fullYearsSince(ym, now = new Date()) {
  const [y, m] = ym.split('-').map(Number);
  const months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m);
  return Math.max(0, Math.floor(months / 12));
}

/** Primer mes de experiencia profesional (el inicio más antiguo). */
export function careerStart(experiencia) {
  return experiencia.map((j) => j.inicio).sort()[0];
}

/** Etiqueta de años: "2024 – 2025", "2025" o "2026 – Presente". */
export function yearRange(inicio, fin, present) {
  const a = inicio.slice(0, 4);
  if (!fin) return `${a} – ${present}`;
  const b = fin.slice(0, 4);
  return a === b ? a : `${a} – ${b}`;
}

/** Texto del mérito sin el prefijo "Orden de mérito: " (si lo tiene). */
export function meritValue(titulo) {
  const i = titulo.lastIndexOf(': ');
  return i === -1 ? titulo : titulo.slice(i + 2);
}

/**
 * Línea de tiempo: cargos y estudios, del más reciente al más antiguo.
 * El cargo sin fecha de fin es el actual.
 */
export function journey(cv, present) {
  const jobs = cv.experiencia.map((j) => ({
    inicio: j.inicio,
    years: yearRange(j.inicio, j.fin, present),
    title: j.cargo,
    org: j.empresa,
    now: j.fin === null,
  }));
  const studies = cv.educacion.map((e) => ({
    inicio: e.inicio,
    years: yearRange(e.inicio, e.fin, present),
    title: e.titulo,
    org: e.nota ? `${e.institucion} · ${e.nota}` : e.institucion,
    now: false,
  }));
  return [...jobs, ...studies].sort((x, y) => (x.inicio < y.inicio ? 1 : -1));
}
