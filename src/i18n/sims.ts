/**
 * Datos de los visuales que imitan la herramienta real de cada proyecto
 * (Power BI, n8n…). TODOS LOS DATOS SON ILUSTRATIVOS.
 */
import type { Lang } from '../lib/cv';

const es = {
  illustrative: 'Datos ilustrativos',
  replay: 'Repetir',
  replayLabel: 'Repetir la animación',
  pbi: {
    page: 'Ventas · Resumen',
    slicer: 'Sede',
    period: 'Periodo',
    periodValue: '2026',
    all: 'Todas',
    sites: ['Centro', 'Norte', 'Sur', 'Este'],
    target: 'Sur',
    kpis: ['Ventas del mes', 'Ticket promedio', 'Notas de crédito'],
    lineTitle: 'Ventas por mes',
    barTitle: 'Ventas por sede',
    months: ['Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'],
    caption: 'Reporte de ventas filtrado por la sede Sur',
  },
  n8n: {
    workflow: 'Sync stock Odoo → WooCommerce',
    active: 'Activo',
    execute: 'Ejecutar flujo',
    // x, y: centro del nodo en un lienzo de 1000 × 460 (vista de escritorio)
    nodes: [
      { name: 'Schedule Trigger', sub: 'Cada 15 min', icon: 'clock', x: 90, y: 180, trigger: true },
      { name: 'HTTP Request', sub: 'Odoo · stock', icon: 'api', x: 265, y: 180 },
      { name: 'Code', sub: 'Mapear SKU', icon: 'code', x: 440, y: 180 },
      { name: 'IF', sub: '¿Stock cambió?', icon: 'branch', x: 615, y: 180 },
      { name: 'WooCommerce', sub: 'Actualizar stock', icon: 'cart', x: 840, y: 85 },
      { name: 'No Operation', sub: 'Sin cambios', icon: 'noop', x: 840, y: 275 },
      { name: 'Enviar alerta', sub: 'Email', icon: 'mail', x: 440, y: 370, idle: true },
    ],
    // Conexiones: from → to, contador de items. "error" no se ejecuta (no hubo errores)
    edges: [
      { from: 0, to: 1, items: '1 item' },
      { from: 1, to: 2, items: '1,240 items' },
      { from: 2, to: 3, items: '1,240 items' },
      { from: 3, to: 4, items: '86 items', branch: 'true' },
      { from: 3, to: 5, items: '1,154 items', branch: 'false' },
      { from: 1, to: 6, items: 'error', error: true },
    ],
    toast: 'Flujo ejecutado correctamente',
    caption: 'Flujo de n8n que sincroniza el stock de Odoo con WooCommerce y envía una alerta si hay errores',
    output: {
      title: 'WooCommerce',
      label: 'Salida',
      count: '86 items',
      tabs: ['Table', 'JSON'],
      empty: 'Ejecuta el flujo para ver la salida de este nodo.',
      cols: ['sku', 'producto', 'stock_woo_antes', 'stock_woo'],
      rows: [
        ['SKU-10482', 'Juego de sábanas 2 plazas', 30, 24],
        ['SKU-11037', 'Toalla de baño 70×140', 61, 58],
        ['SKU-11290', 'Cojín decorativo', 15, 13],
        ['SKU-12016', 'Organizador plástico', 36, 40],
        ['SKU-12588', 'Lámpara de mesa', 9, 7],
      ],
    },
  },
};

export type SimText = typeof es;

const en: SimText = {
  illustrative: 'Illustrative data',
  replay: 'Replay',
  replayLabel: 'Replay the animation',
  pbi: {
    page: 'Sales · Overview',
    slicer: 'Site',
    period: 'Period',
    periodValue: '2026',
    all: 'All',
    sites: ['Center', 'North', 'South', 'East'],
    target: 'South',
    kpis: ['Monthly sales', 'Average ticket', 'Credit notes'],
    lineTitle: 'Sales by month',
    barTitle: 'Sales by site',
    months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    caption: 'Sales report filtered by the South site',
  },
  n8n: {
    workflow: 'Sync stock Odoo → WooCommerce',
    active: 'Active',
    execute: 'Execute workflow',
    nodes: [
      { name: 'Schedule Trigger', sub: 'Every 15 min', icon: 'clock', x: 90, y: 180, trigger: true },
      { name: 'HTTP Request', sub: 'Odoo · stock', icon: 'api', x: 265, y: 180 },
      { name: 'Code', sub: 'Map SKUs', icon: 'code', x: 440, y: 180 },
      { name: 'IF', sub: 'Stock changed?', icon: 'branch', x: 615, y: 180 },
      { name: 'WooCommerce', sub: 'Update stock', icon: 'cart', x: 840, y: 85 },
      { name: 'No Operation', sub: 'No changes', icon: 'noop', x: 840, y: 275 },
      { name: 'Send alert', sub: 'Email', icon: 'mail', x: 440, y: 370, idle: true },
    ],
    edges: [
      { from: 0, to: 1, items: '1 item' },
      { from: 1, to: 2, items: '1,240 items' },
      { from: 2, to: 3, items: '1,240 items' },
      { from: 3, to: 4, items: '86 items', branch: 'true' },
      { from: 3, to: 5, items: '1,154 items', branch: 'false' },
      { from: 1, to: 6, items: 'error', error: true },
    ],
    toast: 'Workflow executed successfully',
    caption: 'n8n workflow that syncs stock from Odoo to WooCommerce and sends an alert on errors',
    output: {
      title: 'WooCommerce',
      label: 'Output',
      count: '86 items',
      tabs: ['Table', 'JSON'],
      empty: 'Execute the workflow to see this node’s output.',
      cols: ['sku', 'product', 'stock_woo_before', 'stock_woo'],
      rows: [
        ['SKU-10482', 'Double bed sheet set', 30, 24],
        ['SKU-11037', 'Bath towel 70×140', 61, 58],
        ['SKU-11290', 'Decorative cushion', 15, 13],
        ['SKU-12016', 'Plastic organizer', 36, 40],
        ['SKU-12588', 'Table lamp', 9, 7],
      ],
    },
  },
};

export function simText(lang: Lang): SimText {
  return lang === 'en' ? en : es;
}

/**
 * Datos del reporte (iguales en ES/EN). "all" = Todas las sedes; "site" = Sur.
 * Noviembre coincide con "Ventas del mes"; las sedes suman el total.
 */
export const pbiData = {
  all: {
    kpis: [1284560, 86.4, 37],
    deltas: [{ v: 5.8, up: true, good: true }, { v: 2.1, up: true, good: true }, { v: 12, up: false, good: true }],
    months: [1.02, 0.97, 1.05, 1.11, 1.21, 1.28],
    axis: [0.9, 1.1, 1.3], min: 0.85, max: 1.35,
  },
  site: {
    kpis: [269758, 82.1, 9],
    deltas: [{ v: 3.8, up: true, good: true }, { v: 1.4, up: true, good: true }, { v: 10, up: false, good: true }],
    months: [0.22, 0.21, 0.21, 0.22, 0.26, 0.27],
    axis: [0.2, 0.24, 0.28], min: 0.19, max: 0.29,
  },
  // Ventas por sede (soles): suman 1,284,560
  bySite: [488133, 346831, 269758, 179838],
  targetIndex: 2,
};
