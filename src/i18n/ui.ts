/**
 * Textos de interfaz (no son contenido del CV): navegación, botones,
 * títulos de sección y etiquetas de accesibilidad, en español e inglés.
 */
import type { Lang } from '../lib/cv';

const es = {
  skip: 'Ir al contenido principal',
  navLabel: 'Principal',
  brandLabel: 'ir al inicio',
  nav: {
    'sobre-mi': 'Sobre mí',
    proyectos: 'Proyectos',
    experiencia: 'Experiencia',
    tecnologias: 'Tecnologías',
    habilidades: 'Habilidades',
    educacion: 'Educación',
    contacto: 'Contacto',
  },
  themeToLight: 'Cambiar a modo claro',
  themeToDark: 'Cambiar a modo oscuro',
  menuOpen: 'Abrir menú',
  /** Botón de idioma: lleva a la otra versión */
  langSwitch: { short: 'EN', label: 'View this site in English', hreflang: 'en' },
  downloadCv: 'Descargar CV',
  downloadCvPdf: 'Descargar CV (PDF)',
  contact: 'Contactar',
  newTab: '(se abre en una pestaña nueva)',
  about: 'Sobre mí',
  projects: 'Proyectos',
  projectsLede:
    'Trabajo realizado para empresas clientes. Los diagramas son ilustraciones propias: no muestran datos ni pantallas reales.',
  projectsPro: 'Proyectos profesionales',
  projectsPersonal: 'Proyectos personales',
  projectsPersonalEmpty: 'Próximamente: pipeline ETL, automatizaciones con n8n…',
  projectsPersonalEmptyHint: 'Proyectos propios publicados en GitHub.',
  projectDescriptionPending: '[PENDIENTE]',
  projectUpdated: 'Última actualización',
  projectCode: 'Ver código',
  projectDemo: 'Ver demo',
  clientBadge: 'Proyecto para cliente',
  techUsed: 'Tecnologías usadas',
  experience: 'Experiencia',
  present: 'Presente',
  technologies: 'Tecnologías',
  technologiesLede: 'Las herramientas con las que trabajo, agrupadas por área.',
  filterLabel: 'Filtrar tecnologías por área',
  filterAll: 'Todas',
  skills: 'Habilidades',
  skillsLede: 'Lo que hago con esas herramientas.',
  languages: 'Idiomas',
  education: 'Educación',
  courses: 'Formación complementaria',
  inProgress: 'En curso',
  completed: 'Completado',
  email: 'Email',
  copyEmail: 'Copiar email',
  backToTop: 'Volver arriba',
  /** Textos que usa js/main.js (se inyectan como JSON en la página) */
  js: {
    themeToLight: 'Cambiar a modo claro',
    themeToDark: 'Cambiar a modo oscuro',
    menuOpen: 'Abrir menú',
    menuClose: 'Cerrar menú',
    filterAll: 'Mostrando todas las áreas',
    filterOne: 'Mostrando',
    copied: 'Email copiado',
    copiedStatus: 'Email copiado al portapapeles',
  },
  cv: {
    backToSite: 'Volver al portafolio',
    download: 'Descargar PDF',
    phone: 'Teléfono',
    email: 'Email',
    location: 'Ubicación',
    profile: 'Perfil profesional',
    experience: 'Experiencia laboral',
    education: 'Educación',
    courses: 'Formación complementaria',
    skills: 'Habilidades',
    languages: 'Idiomas',
    references: 'Referencias',
  },
};

export type UI = typeof es;

const en: UI = {
  skip: 'Skip to main content',
  navLabel: 'Main',
  brandLabel: 'go to top',
  nav: {
    'sobre-mi': 'About',
    proyectos: 'Projects',
    experiencia: 'Experience',
    tecnologias: 'Technologies',
    habilidades: 'Skills',
    educacion: 'Education',
    contacto: 'Contact',
  },
  themeToLight: 'Switch to light mode',
  themeToDark: 'Switch to dark mode',
  menuOpen: 'Open menu',
  langSwitch: { short: 'ES', label: 'Ver este sitio en español', hreflang: 'es' },
  downloadCv: 'Download CV',
  downloadCvPdf: 'Download CV (PDF)',
  contact: 'Get in touch',
  newTab: '(opens in a new tab)',
  about: 'About me',
  projects: 'Projects',
  projectsLede:
    'Work delivered for client companies. The diagrams are my own illustrations: they show no real data or screens.',
  projectsPro: 'Professional projects',
  projectsPersonal: 'Personal projects',
  projectsPersonalEmpty: 'Coming soon: an ETL pipeline, n8n automations…',
  projectsPersonalEmptyHint: 'My own projects, published on GitHub.',
  projectDescriptionPending: '[PENDING]',
  projectUpdated: 'Last updated',
  projectCode: 'View code',
  projectDemo: 'View demo',
  clientBadge: 'Client project',
  techUsed: 'Technologies used',
  experience: 'Experience',
  present: 'Present',
  technologies: 'Technologies',
  technologiesLede: 'The tools I work with, grouped by area.',
  filterLabel: 'Filter technologies by area',
  filterAll: 'All',
  skills: 'Skills',
  skillsLede: 'What I do with those tools.',
  languages: 'Languages',
  education: 'Education',
  courses: 'Additional training',
  inProgress: 'In progress',
  completed: 'Completed',
  email: 'Email',
  copyEmail: 'Copy email',
  backToTop: 'Back to top',
  js: {
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
    filterAll: 'Showing all areas',
    filterOne: 'Showing',
    copied: 'Email copied',
    copiedStatus: 'Email copied to clipboard',
  },
  cv: {
    backToSite: 'Back to portfolio',
    download: 'Download PDF',
    phone: 'Phone',
    email: 'Email',
    location: 'Location',
    profile: 'Professional summary',
    experience: 'Work experience',
    education: 'Education',
    courses: 'Additional training',
    skills: 'Skills',
    languages: 'Languages',
    references: 'References',
  },
};

export const ui: Record<Lang, UI> = { es, en };

export function useUI(lang: Lang): UI {
  return ui[lang];
}

/** Rutas de cada página por idioma */
export const routes = {
  home: { es: '/', en: '/en/' },
  cv: { es: '/cv/', en: '/en/cv/' },
} as const;

/** Nombre del PDF del CV por idioma. */
export function cvPdfPath(lang: Lang): string {
  return lang === 'en' ? '/assets/CV_Ana_Medina_Aguirre_EN.pdf' : '/assets/CV_Ana_Medina_Aguirre.pdf';
}
