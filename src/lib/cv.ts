/**
 * Carga y valida la fuente única de contenido (data/cv.<lang>.json).
 * Si el JSON no cumple el esquema, el build falla con un mensaje claro
 * en lugar de publicar una sección rota.
 */
import { z } from 'astro/zod';
import cvEs from '../../data/cv.es.json';
import cvEn from '../../data/cv.en.json';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Usa el formato AAAA-MM');
const nonEmpty = z.string().trim().min(1);

export const cvSchema = z.object({
  lang: z.enum(['es', 'en']),
  meta: z.object({
    title: nonEmpty,
    description: nonEmpty,
    ogDescription: nonEmpty,
    ogImageAlt: nonEmpty,
    cvTitle: nonEmpty,
    cvDescription: nonEmpty,
  }),
  persona: z.object({
    nombre: nonEmpty,
    nombreCorto: nonEmpty,
    titulo: nonEmpty,
    stack: z.array(nonEmpty).min(1),
    /** Frases que rotan en la línea de terminal del hero; la primera es la que queda fija */
    frasesHero: z.array(nonEmpty).min(1),
    ubicacion: nonEmpty,
    foto: z.object({ alt: nonEmpty }),
  }),
  contacto: z.object({
    email: z.email(),
    telefono: z.string().regex(/^\+\d{8,15}$/),
    telefonoVisible: nonEmpty,
    whatsapp: z.url(),
    linkedin: z.object({ url: z.url(), usuario: nonEmpty }),
    github: z.object({ url: z.url(), usuario: nonEmpty }),
    cierre: nonEmpty,
  }),
  perfil: z.array(nonEmpty).min(1),
  ficha: z.array(z.object({ etiqueta: nonEmpty, valor: nonEmpty })).min(1),
  proyectosProfesionales: z.array(
    z.object({
      id: nonEmpty,
      diagrama: z.enum(['asistente', 'dashboards', 'inventario', 'multisede', 'integraciones', 'bpmn']),
      destacado: z.boolean().optional(),
      cliente: nonEmpty,
      titulo: nonEmpty,
      descripcion: nonEmpty,
      /** Página de caso de estudio */
      tipo: nonEmpty,
      problema: nonEmpty,
      solucion: nonEmpty,
      /** Cargo (1 = el primero de "experiencia") del que salen año, rol y estado */
      experiencia: z.number().int().min(1),
      /** "Mi trabajo": números de los logros de ese cargo (1 = el primero) */
      logros: z.array(z.number().int().min(1)).min(1),
      tecnologias: z.array(nonEmpty).min(1),
    }),
  ),
  experiencia: z.array(
    z.object({
      cargo: nonEmpty,
      empresa: nonEmpty,
      inicio: yearMonth,
      fin: yearMonth.nullable(),
      ubicacion: nonEmpty,
      logros: z.array(nonEmpty).min(1),
      /** Tecnologías del cargo (nombres de producto, iguales en ES/EN); se validan en src/lib/techchips.ts */
      tecnologias: z.array(nonEmpty).min(1),
      /** Nombre corto del cargo para las pestañas de Experiencia */
      cargoCorto: nonEmpty,
    }),
  ),
  tecnologias: z.array(
    z.object({
      id: z.string().regex(/^[a-z]+$/),
      nombre: nonEmpty,
      items: z.array(z.object({ nombre: nonEmpty, icono: nonEmpty })).min(1),
    }),
  ),
  competencias: z.array(z.object({ icono: nonEmpty, titulo: nonEmpty, descripcion: nonEmpty })),
  educacion: z.array(
    z.object({
      titulo: nonEmpty,
      institucion: nonEmpty,
      inicio: yearMonth,
      fin: yearMonth,
      nota: z.string().optional(),
      ubicacion: nonEmpty,
      detalles: z.array(nonEmpty),
      meritos: z.array(z.object({ titulo: nonEmpty, detalle: nonEmpty })),
    }),
  ),
  formacion: z.array(
    z.object({
      nombre: nonEmpty,
      emisor: nonEmpty,
      estado: z.enum(['en_curso', 'completado']),
      icono: nonEmpty,
    }),
  ),
  idiomas: z.array(z.object({ idioma: nonEmpty, nivel: nonEmpty })).min(1),
  /**
   * Contenido del CV (página /cv/ y PDF de una página). Es un texto aprobado
   * aparte del portafolio; sus fechas deben coincidir con "experiencia".
   */
  cvDoc: z.object({
    titular: nonEmpty,
    portafolio: z.url(),
    perfil: nonEmpty,
    experiencia: z.array(
      z.object({
        cargo: nonEmpty,
        ubicacion: nonEmpty.optional(),
        /** Uno o más empleadores con el mismo cargo (p. ej. Desarrolladora Web) */
        empleadores: z.array(z.object({ empresa: nonEmpty, inicio: yearMonth, fin: yearMonth.nullable() })).min(1),
        logros: z.array(nonEmpty).min(1),
      }),
    ).min(1),
    proyectos: z.array(
      z.object({ titulo: nonEmpty, estado: nonEmpty.optional(), url: z.url(), logros: z.array(nonEmpty).min(1) }),
    ),
    educacion: z.array(
      z.object({
        titulo: nonEmpty,
        institucion: nonEmpty,
        inicio: yearMonth,
        fin: yearMonth,
        nota: nonEmpty.optional(),
        logros: z.array(nonEmpty),
      }),
    ).min(1),
    formacion: z.object({ etiqueta: nonEmpty, items: z.array(nonEmpty).min(1) }).optional(),
    habilidades: z.array(z.object({ grupo: nonEmpty, items: nonEmpty })).min(1),
  }),
});

export type CV = z.infer<typeof cvSchema>;
export type Lang = CV['lang'];

function parse(raw: unknown, file: string): CV {
  const result = cvSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`${file} no cumple el esquema:\n${issues}`);
  }
  // Las referencias de cada proyecto a su cargo y a sus logros tienen que existir
  for (const p of result.data.proyectosProfesionales) {
    const job = result.data.experiencia[p.experiencia - 1];
    if (!job) throw new Error(`${file}: el proyecto "${p.id}" apunta al cargo ${p.experiencia}, que no existe.`);
    const bad = p.logros.filter((n) => n > job.logros.length);
    if (bad.length) throw new Error(`${file}: el proyecto "${p.id}" usa logros inexistentes del cargo ${p.experiencia}: ${bad.join(', ')}.`);
  }
  // El CV y la sección Experiencia no pueden contradecirse en las fechas
  const periods = new Set(result.data.experiencia.map((j) => `${j.inicio}|${j.fin}`));
  for (const e of result.data.cvDoc.experiencia.flatMap((j) => j.empleadores)) {
    if (!periods.has(`${e.inicio}|${e.fin}`)) {
      throw new Error(`${file}: en cvDoc, ${e.empresa} (${e.inicio} – ${e.fin ?? 'actual'}) no coincide con ningún cargo de "experiencia".`);
    }
  }
  return result.data;
}

const sources: Record<Lang, CV> = {
  es: parse(cvEs, 'data/cv.es.json'),
  en: parse(cvEn, 'data/cv.en.json'),
};

/**
 * Los dos idiomas deben describir lo mismo: mismos proyectos, cargos, fechas,
 * grupos y cantidad de logros. Si alguien agrega algo solo en un idioma,
 * el build falla en lugar de publicar versiones distintas.
 */
function checkParity(a: CV, b: CV) {
  const shape = (cv: CV) =>
    JSON.stringify({
      proyectos: cv.proyectosProfesionales.map((p) => [p.id, p.diagrama, p.tecnologias, p.experiencia, p.logros]),
      experiencia: cv.experiencia.map((j) => [j.inicio, j.fin, j.logros.length, j.tecnologias]),
      tecnologias: cv.tecnologias.map((g) => [g.id, g.items.map((i) => i.icono)]),
      competencias: cv.competencias.map((c) => c.icono),
      educacion: cv.educacion.map((e) => [e.inicio, e.fin, e.detalles.length, e.meritos.length]),
      formacion: cv.formacion.map((f) => [f.estado, f.icono]),
      idiomas: cv.idiomas.length,
      ficha: cv.ficha.length,
      perfil: cv.perfil.length,
      frasesHero: cv.persona.frasesHero.length,
      contacto: cv.contacto.email + cv.contacto.telefono + cv.contacto.linkedin.url + cv.contacto.github.url,
      cvDoc: {
        portafolio: cv.cvDoc.portafolio,
        experiencia: cv.cvDoc.experiencia.map((j) => [j.empleadores, j.logros.length, !!j.ubicacion]),
        proyectos: cv.cvDoc.proyectos.map((p) => [p.url, p.logros.length, !!p.estado]),
        educacion: cv.cvDoc.educacion.map((e) => [e.inicio, e.fin, e.logros.length, !!e.nota]),
        formacion: cv.cvDoc.formacion?.items,
        habilidades: cv.cvDoc.habilidades.length,
      },
    });
  if (shape(a) !== shape(b)) {
    throw new Error('data/cv.es.json y data/cv.en.json no tienen la misma estructura (proyectos, fechas, grupos o cantidad de elementos).');
  }
}
checkParity(sources.es, sources.en);

export function getCV(lang: Lang = 'es'): CV {
  const cv = sources[lang];
  if (!cv) throw new Error(`No hay datos para el idioma "${lang}"`);
  return cv;
}

const MONTHS: Record<Lang, string[]> = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const MONTHS_SHORT: Record<Lang, string[]> = {
  es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/**
 * Periodo del CV: "Ago 2026 – Actualidad", "Nov 2025 – Jul 2026" o, si es
 * el mismo año, "Feb – Nov 2025".
 */
export function cvRange(inicio: string, fin: string | null, lang: Lang, present: string): string {
  const fmt = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return { m: MONTHS_SHORT[lang][m - 1], y };
  };
  const a = fmt(inicio);
  if (!fin) return `${a.m} ${a.y} – ${present}`;
  const b = fmt(fin);
  return a.y === b.y ? `${a.m} – ${b.m} ${b.y}` : `${a.m} ${a.y} – ${b.m} ${b.y}`;
}

/** "2026-08" → "Agosto 2026" */
export function formatMonth(ym: string, lang: Lang): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[lang][m - 1]} ${y}`;
}
