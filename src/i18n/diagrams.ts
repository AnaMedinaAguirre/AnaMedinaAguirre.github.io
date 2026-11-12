/**
 * Textos de los diagramas SVG. Los nombres de herramientas (Odoo, PostgreSQL,
 * JSON-RPC, n8n…) no se traducen y quedan escritos en cada diagrama.
 */
import type { Lang } from '../lib/cv';

const es = {
  // Pipeline del hero
  heroTitle: 'Pipeline de datos: fuentes, integración, almacenamiento, visualización y decisiones',
  heroDesc:
    'Odoo, WooCommerce y BioTime son las fuentes; sus datos se integran con flujos ETL en n8n y Python, se almacenan en PostgreSQL y se visualizan en Power BI para tomar decisiones.',
  sources: 'Fuentes',
  integration: 'Integración',
  storage: 'Almacenamiento',
  visualization: 'Visualización',
  decisions: 'Decisiones',
  // Multisede
  multiTitle: 'Arquitectura multisede offline-first',
  multiDesc:
    'Un VPS central con Odoo 18, Nginx y el módulo de sincronización se conecta por API JSON-RPC, dentro de una red privada Tailscale, con varias sedes. Cada sede tiene su propia base PostgreSQL local, almacén y punto de venta. Una nueva sede se suma con el mismo estándar.',
  privateNet: 'Red privada Tailscale',
  centralVps: 'VPS central',
  syncModule: 'Módulo de sincronización',
  site1: 'Sede 1',
  site2: 'Sede 2',
  site3: 'Sede 3',
  warehousePos: 'Almacén y POS',
  newSite: 'Nueva sede',
  addedWith1: 'Se agrega con el',
  addedWith2: 'mismo estándar',
  addedWith: 'Se agrega con el mismo estándar',
  siteStack: 'PostgreSQL, almacén y POS',
  // Dashboards
  dashTitle: 'Ilustración de un reporte con filtro por sede, indicadores y gráficos',
  // SUNAT
  sunatTitle: 'Comprobante emitido en Odoo, enviado a través del OSE a SUNAT, y stock sincronizado entre sedes',
  receipt: 'Comprobante',
  siteA: 'Sede A',
  siteB: 'Sede B',
  stockPrices: 'Stock y precios',
  // Integraciones
  integTitle: 'n8n al centro conectando Odoo 17, WooCommerce y BioTime, con monitoreo y alertas',
  logsAlerts: 'Logs y alertas',
  // BPMN
  bpmnTitle: 'Diagrama BPMN con carriles para Ventas, Almacén, Finanzas y RRHH',
  laneSales: 'Ventas',
  laneWarehouse: 'Almacén',
  laneFinance: 'Finanzas',
  laneHr: 'RRHH',
};

const en: typeof es = {
  heroTitle: 'Data pipeline: sources, integration, storage, visualization and decisions',
  heroDesc:
    'Odoo, WooCommerce and BioTime are the sources; their data is integrated through ETL workflows in n8n and Python, stored in PostgreSQL and visualized in Power BI to support decisions.',
  sources: 'Sources',
  integration: 'Integration',
  storage: 'Storage',
  visualization: 'Visualization',
  decisions: 'Decisions',
  multiTitle: 'Offline-first multi-site architecture',
  multiDesc:
    'A central VPS running Odoo 18, Nginx and the sync module connects to several sites over the JSON-RPC API, inside a Tailscale private network. Each site has its own local PostgreSQL database, warehouse and point of sale. A new site is added following the same standard.',
  privateNet: 'Tailscale private network',
  centralVps: 'Central VPS',
  syncModule: 'Sync module',
  site1: 'Site 1',
  site2: 'Site 2',
  site3: 'Site 3',
  warehousePos: 'Warehouse & POS',
  newSite: 'New site',
  addedWith1: 'Added with the',
  addedWith2: 'same standard',
  addedWith: 'Added with the same standard',
  siteStack: 'PostgreSQL, warehouse & POS',
  dashTitle: 'Illustration of a report with a site filter, indicators and charts',
  sunatTitle: 'Receipt issued in Odoo, sent through the OSE to SUNAT, and stock synchronized across sites',
  receipt: 'Receipt',
  siteA: 'Site A',
  siteB: 'Site B',
  stockPrices: 'Stock & prices',
  integTitle: 'n8n at the center connecting Odoo 17, WooCommerce and BioTime, with monitoring and alerts',
  logsAlerts: 'Logs & alerts',
  bpmnTitle: 'BPMN diagram with lanes for Sales, Warehouse, Finance and HR',
  laneSales: 'Sales',
  laneWarehouse: 'Warehouse',
  laneFinance: 'Finance',
  laneHr: 'HR',
};

export type DiagramText = typeof es;
export const diagramText = (lang: Lang): DiagramText => (lang === 'en' ? en : es);
