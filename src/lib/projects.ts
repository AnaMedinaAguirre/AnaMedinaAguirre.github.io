/**
 * Proyectos profesionales (CV) y personales (GitHub) en un solo formato,
 * para la portada y las páginas de caso de estudio.
 */
import type { CV, Lang } from './cv';
import type { UI } from '../i18n/ui';
import { projectPath } from '../i18n/ui';
import { yearRange } from './about.mjs';
import { getPersonalProjects, localizeProject } from './github.mjs';
import { techChips, topicChips, chipFor, type TechChip } from './techchips';
import repoOverrides from '../../data/repos.overrides.json';

export type Status = 'en_desarrollo' | 'en_curso' | 'finalizado';
export type Diagram = 'asistente' | 'dashboards' | 'inventario' | 'multisede' | 'integraciones' | 'bpmn';

export interface FlowNode { texto: string; chip?: TechChip; icono?: string; pendiente: boolean }

export interface Project {
  kind: 'pro' | 'personal';
  slug: string;
  href: string;
  title: string;
  label: string;          // "Caso profesional" / "Proyecto personal"
  tipo: string | null;
  client: string | null;  // solo profesionales
  descripcion: string;
  problema: string | null;
  solucion: string | null;
  trabajo: string[];
  chips: TechChip[];
  year: string;
  role: string;
  status: Status | null;
  diagrama?: Diagram;
  flujo: FlowNode[];
  flujoNota: string | null;
  links: { code?: string; lineage?: string; dashboard?: string; demo?: string; metrics?: string };
  updatedAt?: string;
}

const cache = new Map<Lang, Promise<Project[]>>();

export function getProjects(cv: CV, t: UI): Promise<Project[]> {
  if (!cache.has(cv.lang)) cache.set(cv.lang, build(cv, t));
  return cache.get(cv.lang)!;
}

async function build(cv: CV, t: UI): Promise<Project[]> {
  const lang = cv.lang;
  const pro: Project[] = cv.proyectosProfesionales.map((p) => {
    const job = cv.experiencia[p.experiencia - 1];
    return {
      kind: 'pro',
      slug: p.id,
      href: projectPath(lang, p.id),
      title: p.titulo,
      label: t.caseStudy.proLabel,
      tipo: p.tipo,
      client: p.cliente,
      descripcion: p.descripcion,
      problema: p.problema,
      solucion: p.solucion,
      trabajo: p.logros.map((n) => job.logros[n - 1]),
      chips: techChips(p.tecnologias, `data/cv.${lang}.json (proyecto ${p.id})`),
      year: yearRange(job.inicio, job.fin, t.present),
      role: job.cargo,
      status: job.fin === null ? 'en_curso' : 'finalizado',
      diagrama: p.diagrama,
      flujo: [],
      flujoNota: null,
      links: {},
    };
  });

  const repos = (await getPersonalProjects(cv.contacto.github.usuario)).map((r) => localizeProject(r, lang, repoOverrides));
  const personal: Project[] = repos.map((r) => {
    const where = `data/repos.overrides.json (${r.name}, ${lang})`;
    return {
      kind: 'personal',
      slug: r.slug,
      href: projectPath(lang, r.slug),
      title: r.name,
      label: t.caseStudy.personalLabel,
      tipo: r.tipo,
      client: null,
      descripcion: r.description || t.projectDescriptionPending,
      problema: r.problema,
      solucion: r.solucion,
      trabajo: r.trabajo,
      chips: topicChips(r.technologies, r.name),
      year: String(r.year),
      role: t.caseStudy.personalLabel,
      status: r.status,
      flujo: r.flujo.map((n: { texto: string; tech?: string; icono?: string; pendiente?: boolean }) => ({
        texto: n.texto,
        chip: n.tech ? chipFor(n.tech, where) : undefined,
        icono: n.icono,
        pendiente: Boolean(n.pendiente),
      })),
      flujoNota: r.flujoNota,
      links: {
        code: r.codeUrl,
        lineage: r.lineageUrl ?? undefined,
        dashboard: r.dashboardUrl ?? undefined,
        demo: r.isSite ? undefined : r.demoUrl ?? undefined,
        metrics: r.isSite ? `${lang === 'en' ? '/en/' : '/'}#metricas` : undefined,
      },
      updatedAt: r.updatedAt,
    };
  });

  const slugs = new Set<string>();
  for (const p of [...pro, ...personal]) {
    if (slugs.has(p.slug)) throw new Error(`Dos proyectos usan el mismo slug "${p.slug}".`);
    slugs.add(p.slug);
  }
  return [...pro, ...personal];
}
