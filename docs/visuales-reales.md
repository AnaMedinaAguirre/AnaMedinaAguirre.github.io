# Visuales con aspecto real (en pausa)

Rama `feat/visuales-reales`. Trabajo guardado para retomarlo después; **no se mergea**
mientras el portafolio mantenga el estilo de diagramas de producción.

## Sistema

- Cada visual imita la interfaz de su herramienta real (sin logos) y usa datos
  ilustrativos, siempre con la etiqueta "Datos ilustrativos".
- Un cursor simulado hace causa y efecto (el cursor hace clic y la interfaz responde).
- Motion (`motion/mini`, 12.8 KB) solo en las páginas que lo usan; se reproduce una vez
  al entrar en pantalla, con botón "↻ Repetir" y sin bucles.
- Transiciones de interfaz de 300 ms ease-out; cursor y clic con resorte
  `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Con `prefers-reduced-motion` o sin JS: estado final, sin cursor.
- Sigue el tema del sitio (claro y oscuro) y cambia al instante sin reiniciar la animación.
  Contraste AA comprobado en ambos temas.
- Un solo visual grande por proyecto, a todo el ancho del marco.

## Hechos y aprobados

- `src/components/visuals/PbiReport.astro`: reporte estilo Power BI (filtro por sede Sur).
  Pendiente de decidir: el tablero real de Boson es un módulo OWL de Odoo 18, no Power BI,
  así que este visual tendría que pasar a imitar ese tablero.
- `src/components/visuals/N8nCanvas.astro`: editor estilo n8n (Schedule → HTTP Request →
  Code → IF → WooCommerce / No Op, rama de error a "Enviar alerta", panel de salida con
  stock_woo_antes → stock_woo).
- Lógica en `src/scripts/sim.js`; textos y datos en `src/i18n/sims.ts`.

## Planes pendientes

### Asistente de IA para Odoo

- Pantalla de Odoo 18 (barra superior, vista de Ventas atenuada) con una ventana de chat
  abajo a la derecha, al estilo del chat de Odoo; arriba, el resumen de las 7:00 a. m.
- El cursor toca el micrófono: onda de voz y transcripción ("¿Cuánto vendimos ayer en las
  12 sedes y cuál tuvo mejor margen?"). Toca Enviar.
- Línea de sistema: "Consulta registrada: ventas_por_sede · periodo: ayer · permisos:
  Gerencia" (la IA elige la consulta, no escribe SQL).
- Respuesta con una cifra grande, la sede con mejor margen y un mini gráfico de barras.
- Móvil: el chat a todo el ancho, sin la vista de fondo.

### Conteo de inventario móvil

- Opción A (recomendada): celular con la app estilo Odoo y, al lado, la pantalla del
  supervisor en Odoo (continuación del mismo flujo).
  - Celular: cámara con línea de escaneo; "Stock esperado: oculto" (conteo ciego);
    la lista de contados crece; "Enviar a aprobación".
  - Supervisor: Contado, Esperado al inicio, Vendido durante el conteo y Ajuste por
    diferencia (p. ej. 23 − (26 − 2) = −1); alertas de diferencia grande y stock
    negativo; "Aprobar" → "Ajuste aplicado".
  - Móvil: solo el celular; la aprobación aparece como aviso al final.
- Opción B: solo el celular, centrado.

### Otros

- Multisede: consola de monitoreo del VPS ("Sincronizar ahora" en una sede → pendientes a 0,
  evento en el registro).
- BPMN: lienzo estilo bpmn.io / Bizagi (clic en TO-BE → los pasos eliminados se desvanecen
  y el flujo se reacomoda).
- Pipeline: terminal negra con colores ANSI y panel de linaje estilo dbt docs
  (comando escrito → "138 of 138 PASS").
- Limpieza: CSS y JS muertos de los visuales `pv-*` anteriores.
