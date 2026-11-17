/**
 * Textos y datos de los visuales de proyectos (fragmentos de interfaz).
 * TODOS LOS DATOS SON ILUSTRATIVOS: sedes, montos, fechas y eventos son
 * genéricos y no corresponden a ningún cliente (ni Boson ni CasaLinda).
 */
import type { Lang } from '../lib/cv';

const es = {
  illustrative: 'Datos ilustrativos',
  // Panel de sincronización (multisede)
  sync: {
    title: 'Sincronización de sedes',
    live: 'VPS central en línea',
    caption: 'Estado de sincronización por sede y registro de eventos',
    cols: { site: 'Sede', status: 'Estado', last: 'Última sincronización', lastShort: 'Últ. sinc.', pending: 'Pendientes', pendingShort: 'Pend.' },
    ok: 'OK',
    syncing: 'Sincronizando…',
    now: 'ahora',
    rows: [
      { site: 'Centro', last: 'hace 8 s' },
      { site: 'Norte', last: 'hace 21 s' },
      { site: 'Sur', last: 'ahora', lastBefore: 'hace 3 min', from: 37, live: true },
      { site: 'Este', last: 'hace 1 min' },
    ],
    log: 'Registro de eventos',
    events: [
      ['10:42:07', 'centro', 'stock.sync', '12 productos'],
      ['10:42:15', 'norte', 'precios.sync', 'lista minorista'],
      ['10:42:31', 'sur', 'pos.cierre', 'caja 2'],
    ],
    newEvent: ['10:42:38', 'sur', 'sync.ok', '37 eventos aplicados'],
  },
  // Mini dashboard (dashboards ejecutivos)
  dash: {
    title: 'Ventas · todas las sedes',
    period: 'Últimos 6 meses',
    kpis: [
      { label: 'Ventas del mes', value: 1284560, prefix: 'S/ ', decimals: 0, delta: 8.4, up: true, good: true },
      { label: 'Ticket promedio', value: 86.4, prefix: 'S/ ', decimals: 2, delta: 2.1, up: true, good: true },
      { label: 'Notas de crédito', value: 37, prefix: '', decimals: 0, delta: 12, up: false, good: true },
    ],
    chartLabel: 'Ventas mensuales',
    months: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
    monthsLong: ['junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre'],
    // Altibajos: caída en julio y repunte en octubre. Noviembre = KPI "Ventas del mes"
    sales: [1.02, 0.97, 1.05, 1.11, 1.21, 1.28],
    axis: [0.9, 1.1, 1.3],
    million: 'M',
    bySite: 'Ventas por sede',
    sites: [
      { site: 'Centro', share: 38 },
      { site: 'Norte', share: 27 },
      { site: 'Sur', share: 21 },
      { site: 'Este', share: 14 },
    ],
  },
  // Historial de ejecuciones (automatización)
  runs: {
    title: 'Ejecuciones',
    chip: 'n8n',
    caption: 'Historial de ejecuciones de los flujos de automatización',
    cols: { flow: 'Flujo', start: 'Inicio', duration: 'Duración', records: 'Registros', recordsShort: 'Reg.', status: 'Estado' },
    running: 'En ejecución',
    ok: 'Éxito',
    newRun: { flow: 'Stock Odoo → WooCommerce', start: '10:45', duration: '00:42', records: 1240 },
    rows: [
      { flow: 'Asistencia BioTime → Odoo', start: '10:30', duration: '00:18', records: 312 },
      { flow: 'Pedidos web → Odoo', start: '10:15', duration: '00:27', records: 58 },
      { flow: 'Stock Odoo → WooCommerce', start: '10:00', duration: '00:39', records: 1187 },
    ],
    recordsWord: 'registros',
  },
  // Proceso BPMN AS-IS / TO-BE
  bpmn: {
    title: 'Proceso: pedido a despacho',
    tabs: { asis: 'AS-IS', tobe: 'TO-BE' },
    tabsLabel: 'Versión del proceso',
    lanes: ['Ventas', 'Almacén', 'Finanzas'],
    // lane: carril (0-2); removed: el paso desaparece en TO-BE
    steps: [
      { lane: 0, text: 'Registrar pedido', removed: false },
      { lane: 0, text: 'Copiar pedido a Excel', removed: true },
      { lane: 1, text: 'Confirmar stock por correo', removed: true },
      { lane: 1, text: 'Preparar despacho', removed: false },
      { lane: 2, text: 'Emitir comprobante', removed: false },
      { lane: 2, text: 'Conciliar pago a mano', removed: true },
    ],
    removedLabel: 'pasos',
    removedSr: 'pasos eliminados en TO-BE',
  },
  // Terminal del pipeline (dbt build)
  term: {
    title: 'pipeline-etl-retail — dbt build',
    prompt: '$ dbt build --select +fact_ventas',
    lines: [
      ['01:12:04', 'OK', 'created sql view model staging.stg_olist__orders'],
      ['01:12:06', 'OK', 'created sql table model intermediate.int_pedidos'],
      ['01:12:09', 'OK', 'created sql table model marts.fact_ventas'],
      ['01:12:11', 'PASS', 'unique_fact_ventas'],
      ['01:12:11', 'PASS', 'relationships_fact_ventas__dim_cliente'],
      ['01:12:13', 'PASS', 'reporting.vw_conciliacion_ventas_pagos'],
    ],
    done: 'Completed successfully',
    summary: '138 of 138 PASS',
  },
};

export type VisualText = typeof es;

const en: VisualText = {
  illustrative: 'Illustrative data',
  sync: {
    title: 'Site synchronization',
    live: 'Central VPS online',
    caption: 'Sync status per site and event log',
    cols: { site: 'Site', status: 'Status', last: 'Last sync', lastShort: 'Last sync', pending: 'Pending', pendingShort: 'Pend.' },
    ok: 'OK',
    syncing: 'Syncing…',
    now: 'now',
    rows: [
      { site: 'Center', last: '8 s ago' },
      { site: 'North', last: '21 s ago' },
      { site: 'South', last: 'now', lastBefore: '3 min ago', from: 37, live: true },
      { site: 'East', last: '1 min ago' },
    ],
    log: 'Event log',
    events: [
      ['10:42:07', 'center', 'stock.sync', '12 products'],
      ['10:42:15', 'north', 'prices.sync', 'retail list'],
      ['10:42:31', 'south', 'pos.close', 'register 2'],
    ],
    newEvent: ['10:42:38', 'south', 'sync.ok', '37 events applied'],
  },
  dash: {
    title: 'Sales · all sites',
    period: 'Last 6 months',
    kpis: [
      { label: 'Monthly sales', value: 1284560, prefix: 'S/ ', decimals: 0, delta: 8.4, up: true, good: true },
      { label: 'Average ticket', value: 86.4, prefix: 'S/ ', decimals: 2, delta: 2.1, up: true, good: true },
      { label: 'Credit notes', value: 37, prefix: '', decimals: 0, delta: 12, up: false, good: true },
    ],
    chartLabel: 'Monthly sales',
    months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    monthsLong: ['June', 'July', 'August', 'September', 'October', 'November'],
    // Altibajos: caída en julio y repunte en octubre. Noviembre = KPI "Ventas del mes"
    sales: [1.02, 0.97, 1.05, 1.11, 1.21, 1.28],
    axis: [0.9, 1.1, 1.3],
    million: 'M',
    bySite: 'Sales by site',
    sites: [
      { site: 'Center', share: 38 },
      { site: 'North', share: 27 },
      { site: 'South', share: 21 },
      { site: 'East', share: 14 },
    ],
  },
  runs: {
    title: 'Executions',
    chip: 'n8n',
    caption: 'Execution history of the automation workflows',
    cols: { flow: 'Workflow', start: 'Started', duration: 'Duration', records: 'Records', recordsShort: 'Rec.', status: 'Status' },
    running: 'Running',
    ok: 'Success',
    newRun: { flow: 'Stock Odoo → WooCommerce', start: '10:45', duration: '00:42', records: 1240 },
    rows: [
      { flow: 'Attendance BioTime → Odoo', start: '10:30', duration: '00:18', records: 312 },
      { flow: 'Web orders → Odoo', start: '10:15', duration: '00:27', records: 58 },
      { flow: 'Stock Odoo → WooCommerce', start: '10:00', duration: '00:39', records: 1187 },
    ],
    recordsWord: 'records',
  },
  bpmn: {
    title: 'Process: order to dispatch',
    tabs: { asis: 'AS-IS', tobe: 'TO-BE' },
    tabsLabel: 'Process version',
    lanes: ['Sales', 'Warehouse', 'Finance'],
    steps: [
      { lane: 0, text: 'Register order', removed: false },
      { lane: 0, text: 'Copy order to Excel', removed: true },
      { lane: 1, text: 'Confirm stock by email', removed: true },
      { lane: 1, text: 'Prepare dispatch', removed: false },
      { lane: 2, text: 'Issue receipt', removed: false },
      { lane: 2, text: 'Reconcile payment by hand', removed: true },
    ],
    removedLabel: 'steps',
    removedSr: 'steps removed in TO-BE',
  },
  term: {
    title: 'pipeline-etl-retail — dbt build',
    prompt: '$ dbt build --select +fact_ventas',
    lines: [
      ['01:12:04', 'OK', 'created sql view model staging.stg_olist__orders'],
      ['01:12:06', 'OK', 'created sql table model intermediate.int_pedidos'],
      ['01:12:09', 'OK', 'created sql table model marts.fact_ventas'],
      ['01:12:11', 'PASS', 'unique_fact_ventas'],
      ['01:12:11', 'PASS', 'relationships_fact_ventas__dim_cliente'],
      ['01:12:13', 'PASS', 'reporting.vw_conciliacion_ventas_pagos'],
    ],
    done: 'Completed successfully',
    summary: '138 of 138 PASS',
  },
};

export function visualText(lang: Lang): VisualText {
  return lang === 'en' ? en : es;
}

/** Formato de números según el idioma (es-PE / en-US). */
export function fmt(lang: Lang, n: number, decimals = 0): string {
  return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}
