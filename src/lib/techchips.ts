/**
 * Chips de tecnología con logo (experiencia y proyectos).
 * Cada nombre se resuelve, en este orden:
 *   1. el logo o glifo de la franja (data/franja.json) cuyo nombre contiene el
 *      chip, eligiendo la coincidencia más larga ("GitHub Actions" antes que
 *      "Git"); así "Odoo 18" usa el logo de Odoo y "Linux Debian" el de Linux;
 *   2. el ícono de esa tecnología en el CV (data/cv.es.json → tecnologias).
 * Si no aparece en ninguno de los dos, el build falla: nunca se muestra una
 * tecnología que no esté en el CV ni un ícono roto.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'astro/zod';
import topicsData from '../../data/topics.json';
import { techStrip, type BeltItem } from './strip';
import { getCV } from './cv';

const CHIP_HEIGHT = 20; // px

export interface TechChip {
  nombre: string;
  logo?: { src: string; srcOscuro?: string; width: number; height: number };
  glifo?: BeltItem['glifo'];
  icono?: string;
  intacto: boolean;
}

const cvItems = getCV('es').tecnologias.flatMap((g) => g.items);
const lower = (s: string) => s.toLowerCase();

export function techChip(nombre: string, where: string): TechChip {
  const strip = techStrip
    .filter((i) => lower(nombre).includes(lower(i.nombre)))
    .sort((a, b) => b.nombre.length - a.nombre.length)[0];
  if (strip) {
    const logo = strip.logo && {
      ...strip.logo,
      height: CHIP_HEIGHT,
      width: Math.round((strip.logo.width * CHIP_HEIGHT) / strip.logo.height),
    };
    return { nombre, logo, glifo: strip.glifo, intacto: strip.intacto };
  }
  const item = cvItems.find((i) => lower(i.nombre) === lower(nombre)) ?? cvItems.find((i) => lower(i.nombre).includes(lower(nombre)));
  if (item) return { nombre, icono: item.icono, intacto: false };
  throw new Error(`${where}: la tecnología "${nombre}" no está en la franja ni en las tecnologías de data/cv.es.json.`);
}

export const techChips = (nombres: string[], where: string) => nombres.map((n) => techChip(n, where));

/* ---------- Topics de GitHub (proyectos personales) ---------- */
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const topicSchema = z.union([
  z.object({ ocultar: z.literal(true) }),
  z.object({
    nombre: z.string().min(1),
    logo: z.string().regex(/^[a-z0-9-]+\.(svg|png)$/).optional(),
    glifo: z.string().min(1).optional(),
    color: color.optional(),
    colorClaro: color.optional(),
    fuente: z.string().min(3).optional(),
    licencia: z.string().min(3).optional(),
  }).refine((t) => !(t.logo || t.glifo) || (t.fuente && t.licencia), { message: 'un logo propio necesita "fuente" y "licencia"' })
    .refine((t) => !t.glifo || (t.color && t.colorClaro), { message: 'un glifo necesita "color" y "colorClaro"' }),
]);
const { $comment: _c, ...rawTopics } = topicsData as Record<string, unknown>;
const topics = z.record(z.string().regex(/^[a-z0-9.+#-]+$/), topicSchema).parse(rawTopics);
const sprite = readFileSync(resolve('src/components/IconSprite.astro'), 'utf-8');

function ownLogo(file: string, where: string): NonNullable<TechChip['logo']> {
  const path = resolve('public/assets/logos', file);
  if (!existsSync(path)) throw new Error(`${where}: el logo "${file}" no existe en public/assets/logos/.`);
  const vb = readFileSync(path, 'utf-8').match(/viewBox="([\d.\s-]+)"/);
  const [, , w, h] = (vb ? vb[1].trim().split(/\s+/) : ['0', '0', '1', '1']).map(Number);
  if (Math.abs(w / h - 1) > 0.2) throw new Error(`${where}: "${file}" no es cuadrado.`);
  return { src: `/assets/logos/${file}`, width: CHIP_HEIGHT, height: CHIP_HEIGHT };
}

/**
 * Lenguaje y topics de un repositorio → chips con logo. Oculta los topics
 * genéricos, quita duplicados y hace fallar el build ante un topic sin mapear.
 */
export function topicChips(tags: string[], repo: string): TechChip[] {
  const where = `data/topics.json (${repo})`;
  const chips: TechChip[] = [];
  for (const tag of tags) {
    const entry = topics[lower(tag)];
    if (!entry) throw new Error(`${where}: el topic o lenguaje "${tag}" no está mapeado; agrégalo (o márcalo con "ocultar").`);
    if ('ocultar' in entry) continue;
    if (chips.some((c) => c.nombre === entry.nombre)) continue;
    if (entry.logo) chips.push({ nombre: entry.nombre, logo: ownLogo(entry.logo, where), intacto: false });
    else if (entry.glifo) {
      if (!sprite.includes(`id="i-${entry.glifo}"`)) throw new Error(`${where}: el glifo "${entry.glifo}" no existe en el sprite.`);
      chips.push({ nombre: entry.nombre, glifo: { id: entry.glifo, color: entry.color!, colorClaro: entry.colorClaro! }, intacto: false });
    } else chips.push(techChip(entry.nombre, where));
  }
  return chips;
}
