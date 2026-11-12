/**
 * Textos de interfaz (no son contenido del CV): navegación, botones,
 * títulos de sección y etiquetas de accesibilidad.
 * La versión en inglés se agrega en la Fase 2.
 */
import type { Lang } from '../lib/cv';

export const ui = {
  es: {
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
  },
} as const;

export type UI = (typeof ui)['es'];

export function useUI(lang: Lang): UI {
  return (ui as Record<string, UI>)[lang] ?? ui.es;
}

/** Nombre del PDF del CV por idioma. */
export function cvPdfPath(lang: Lang): string {
  return lang === 'en' ? '/assets/CV_Ana_Medina_Aguirre_EN.pdf' : '/assets/CV_Ana_Medina_Aguirre.pdf';
}
