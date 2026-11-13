/**
 * Franja de tecnologías (data/franja.json), validada en el build:
 * - cada nombre tiene que estar en las tecnologías del CV (no se muestra nada
 *   que no figure en el CV);
 * - cada logo tiene que existir en public/assets/logos/ y cada glifo en el
 *   sprite (nunca una imagen rota);
 * - cada ítem declara su fuente y su licencia (detalle en docs/LOGOS.md).
 * También calcula el ancho de cada logo a partir de su tamaño real, para que
 * el navegador reserve el espacio exacto (sin saltos de diseño).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'astro/zod';
import franja from '../../data/franja.json';
import { getCV } from './cv';

const ALTO_LOGO = 28; // px, alto por defecto de los logos

const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const item = z
  .object({
    nombre: z.string().min(1),
    logo: z.string().regex(/^[a-z0-9-]+\.(svg|png)$/).optional(),
    /** Variante oficial para el tema oscuro (mismas proporciones que "logo") */
    logoOscuro: z.string().regex(/^[a-z0-9-]+\.(svg|png)$/).optional(),
    glifo: z.string().min(1).optional(),
    color: color.optional(),
    colorClaro: color.optional(),
    alto: z.number().int().min(12).max(40).optional(),
    intacto: z.boolean().optional(),
    contorno: z.boolean().optional(),
    fuente: z.string().min(3),
    licencia: z.string().min(3),
  })
  .refine((i) => Boolean(i.logo) !== Boolean(i.glifo), { message: 'cada ítem lleva "logo" o "glifo" (solo uno)' })
  .refine((i) => !i.glifo || (i.color && i.colorClaro), { message: 'un glifo necesita "color" y "colorClaro"' })
  .refine((i) => !i.logoOscuro || i.logo, { message: '"logoOscuro" necesita "logo"' });

const { items } = z.object({ items: z.array(item).min(4) }).parse(franja);
const techNames = getCV('es').tecnologias.flatMap((g) => g.items.map((i) => i.nombre));
const sprite = readFileSync(resolve('src/components/IconSprite.astro'), 'utf-8');

/** Proporción ancho/alto del archivo: viewBox del SVG o cabecera IHDR del PNG. */
function proporcion(archivo: string): number {
  const ruta = resolve('public/assets/logos', archivo);
  if (archivo.endsWith('.png')) {
    const buf = readFileSync(ruta);
    return buf.readUInt32BE(16) / buf.readUInt32BE(20);
  }
  const vb = readFileSync(ruta, 'utf-8').match(/viewBox="([\d.\s-]+)"/);
  if (!vb) throw new Error(`public/assets/logos/${archivo}: el SVG no tiene viewBox.`);
  const [, , w, h] = vb[1].trim().split(/\s+/).map(Number);
  return w / h;
}

export interface BeltItem {
  nombre: string;
  logo?: { src: string; srcOscuro?: string; width: number; height: number };
  glifo?: { id: string; color: string; colorClaro: string };
  intacto: boolean;
  contorno: boolean;
}

export const techStrip: BeltItem[] = items.map((i) => {
  if (!techNames.some((name) => name.includes(i.nombre))) {
    throw new Error(`data/franja.json: "${i.nombre}" no está en las tecnologías de data/cv.es.json.`);
  }
  let logo: BeltItem['logo'];
  if (i.logo) {
    if (!existsSync(resolve('public/assets/logos', i.logo))) {
      throw new Error(`data/franja.json: el logo "${i.logo}" no existe en public/assets/logos/.`);
    }
    const height = i.alto ?? ALTO_LOGO;
    logo = { src: `/assets/logos/${i.logo}`, height, width: Math.round(height * proporcion(i.logo)) };
    if (i.logoOscuro) {
      if (!existsSync(resolve('public/assets/logos', i.logoOscuro))) {
        throw new Error(`data/franja.json: el logo "${i.logoOscuro}" no existe en public/assets/logos/.`);
      }
      if (Math.abs(proporcion(i.logoOscuro) - proporcion(i.logo)) > 0.01) {
        throw new Error(`data/franja.json: "${i.logoOscuro}" no tiene las mismas proporciones que "${i.logo}".`);
      }
      logo.srcOscuro = `/assets/logos/${i.logoOscuro}`;
    }
  }
  if (i.glifo && !sprite.includes(`id="i-${i.glifo}"`)) {
    throw new Error(`data/franja.json: el glifo "${i.glifo}" no existe en src/components/IconSprite.astro.`);
  }
  return {
    nombre: i.nombre,
    logo,
    glifo: i.glifo ? { id: i.glifo, color: i.color!, colorClaro: i.colorClaro! } : undefined,
    intacto: Boolean(i.intacto),
    contorno: Boolean(i.contorno),
  };
});

/** La política de marca de dbt Labs pide un aviso de marca y de no afiliación al pie de la página. */
export const usaLogoDbt = items.some((i) => i.logo === 'dbt.png');
