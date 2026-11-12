/**
 * Carga y valida la fuente única de contenido (data/cv.<lang>.json).
 * Si el JSON no cumple el esquema, el build falla con un mensaje claro
 * en lugar de publicar una sección rota.
 */
import { z } from 'astro/zod';
import cvEs from '../../data/cv.es.json';

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
    ubicacion: nonEmpty,
    disponibilidad: nonEmpty,
    foto: z.object({ alt: nonEmpty }),
  }),
  contacto: z.object({
    email: z.string().email(),
    telefono: z.string().regex(/^\+\d{8,15}$/),
    telefonoVisible: nonEmpty,
    whatsapp: z.string().url(),
    linkedin: z.object({ url: z.string().url(), usuario: nonEmpty }),
    github: z.object({ url: z.string().url(), usuario: nonEmpty }),
    cierre: nonEmpty,
  }),
  perfil: z.array(nonEmpty).min(1),
  ficha: z.array(z.object({ etiqueta: nonEmpty, valor: nonEmpty })).min(1),
  proyectosProfesionales: z.array(
    z.object({
      id: nonEmpty,
      diagrama: z.enum(['multisede', 'dashboards', 'sunat', 'integraciones', 'bpmn']),
      destacado: z.boolean().optional(),
      cliente: nonEmpty,
      titulo: nonEmpty,
      descripcion: nonEmpty,
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
  referencias: nonEmpty,
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
  return result.data;
}

const sources: Partial<Record<Lang, CV>> = {
  es: parse(cvEs, 'data/cv.es.json'),
};

export function getCV(lang: Lang = 'es'): CV {
  const cv = sources[lang];
  if (!cv) throw new Error(`No hay datos para el idioma "${lang}"`);
  return cv;
}

const MONTHS: Record<Lang, string[]> = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** "2026-08" → "Agosto 2026" */
export function formatMonth(ym: string, lang: Lang): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[lang][m - 1]} ${y}`;
}
