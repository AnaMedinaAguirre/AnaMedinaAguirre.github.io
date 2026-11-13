# Validación de la versión 2

Última actualización: 12 de noviembre de 2026.

## Estado de la publicación

| Hito | Estado |
| --- | --- |
| PR #1 (`v2` → `main`) | Fusionado con merge commit. La rama `v2` se eliminó. |
| Despliegue | Publicado en GitHub Pages desde `main` con GitHub Actions (`actions/deploy-pages`). |
| Regla "Proteger main" | Activa: exige PR y el control **Build y controles de calidad**. |
| Producción | `/`, `/en/`, `/cv/`, `/en/cv/` y los dos PDF responden correctamente. |
| Métricas | Supabase configurado en GitHub Secrets; la lectura y el registro de visitas funcionan en producción. |
| Cron diario | Configurado a las 11:17 UTC (06:17 de Lima) desde `main`. |

### Limpieza del historial (12/11/2026)

Un PDF antiguo del CV incluía el teléfono de una referencia. Se reescribió el historial con `git filter-repo` para reemplazar ese archivo por la versión sin el dato en todos los commits; el contenido de cada fase quedó idéntico y el árbol final de `main` no cambió. Se publicó con un force push controlado (`--force-with-lease`) desactivando y reactivando la regla de `main`.

Verificación sobre un clon nuevo del remoto: 0 resultados al buscar el número en los archivos de todos los commits, en los mensajes y en el texto extraído de cada PDF. Queda la referencia de solo lectura `refs/pull/1/head`, que GitHub no permite borrar al propietario: se solicitó a GitHub Support su eliminación y la purga de vistas en caché.

## Resultado funcional de la versión 2

| Área | Comprobación | Resultado |
| --- | --- | --- |
| Build | Astro con Node 22, cuatro rutas y dos PDF A4 | Correcto |
| HTML | `html-validate:recommended` sobre las cuatro rutas | Correcto |
| Escritorio y móvil | 1440 y 375 px × ES/EN × claro/oscuro | Correcto (revisado también en producción) |
| Accesibilidad | axe-core (WCAG A/AA y buenas prácticas) en las 16 combinaciones | Sin violaciones |
| Tema | Cambio y persistencia tras recargar | Correcto |
| Idioma | Cambio, memoria y conservación de sección | Correcto |
| Menú móvil | Apertura, cierre con Escape y selección de enlace | Correcto |
| Tecnologías | Filtros y restablecimiento de todas las áreas | Correcto |
| Enlaces | Respuesta HTTP y existencia de anclas (lychee) | Correcto |
| PDF | Descarga de ambos idiomas, dos páginas, sin datos de terceros | Correcto |
| GitHub | Selección por topic, paginación, errores y campos opcionales | Correcto |

## Rama `mejoras` (posterior a la publicación)

| Cambio | Comprobación | Resultado |
| --- | --- | --- |
| Nota de métricas completa (ES/EN) | Texto visible en ambos idiomas | Correcto |
| Gráfico de barras por día | Inicio en la primera visita, fechas sin solaparse, valores selectivos, tooltip con puntero y teclado, tabla equivalente | Correcto |
| KPIs | Totales, últimos 30 días y reparto ES/EN | Correcto |
| Estados | Esqueleto al cargar, sin visitas, error con reintento, sin configuración | Correcto |
| Colores del gráfico | Validador de paleta (banda de luminosidad, croma, daltonismo, contraste) en claro y oscuro | Todas las comprobaciones pasan |
| Alineación | La tarjeta mide lo mismo que las tarjetas de proyectos; la línea de flujo termina en el círculo ámbar de Contacto | Correcto en 1440 y 375 px |
| Pie en móvil | "Volver arriba" no tapa "Lima, Perú" | Correcto |
| Pruebas | `npm run test:metrics` (9 pruebas) y `scripts/check-metrics.py` (20 escenarios) | Correcto |
| Workflow | `cancel-in-progress: false`; `configure-pages@v6`, `deploy-pages@v5`, `upload-pages-artifact@v5` (Node 24) | Pendiente de la ejecución en el PR |

La función SQL ampliada (`supabase/2026-11-12-metricas-por-idioma.sql`) debe ejecutarse una vez en Supabase para que el KPI de idioma y la fecha inicial vengan de la base. El sitio es compatible con la función anterior mientras tanto.

## Lighthouse

Tres mediciones móviles de cada ruta en la versión 2. El mínimo observado en cada categoría fue 100 en rendimiento, accesibilidad, buenas prácticas y SEO para `/`, `/en/`, `/cv/` y `/en/cv/`. Son mediciones del build servido localmente; el umbral bloqueante del workflow es 90.

## Evidencia visual

Las capturas de cada revisión se guardan localmente, fuera de la carpeta publicada:

- `.lighthouseci/review-final/`: portadas completas y CV móviles.
- `.lighthouseci/review-phase5/`: estados simulados de la sección de métricas.
- `.lighthouseci/reports/`: informes Lighthouse HTML y JSON.

Las capturas y los informes no se versionan. Las pruebas de métricas en navegador interceptan la API con datos simulados: no insertan visitas reales.

## Alcance y pendientes

- Las pruebas locales se realizaron con Chromium; no se afirma cobertura de Safari o Firefox.
- Las pruebas funcionales no certifican compatibilidad con todos los sistemas ATS; el CV utiliza HTML de una columna sin tablas y PDF etiquetado.
- LinkedIn y WhatsApp están excluidos del verificador automático por sus bloqueos a bots y requieren comprobación manual.
- Dependencias de desarrollo: actualizadas a Astro 7 el 12/11/2026, con un override de `basic-ftp` 6.2.6 para la cadena de Lighthouse CI. `npm audit`: 0 vulnerabilidades (antes 14: 1 bajo, 12 altos, 1 crítico).

## Actualización a Astro 7 (rama `actualizacion-astro`)

| Comprobación | Resultado |
| --- | --- |
| Regresión visual | 16 de 16 capturas idénticas píxel a píxel frente a Astro 5 (4 rutas × 1440/375 × claro/oscuro), con un control previo de estabilidad de las capturas |
| HTML generado | Mismos archivos; contenido idéntico salvo `&#38;` → `&amp;` en dos metadatos en inglés (equivalentes) |
| PDF | Mismo número de páginas y mismo texto en ES y EN |
| Validación de datos (Zod 4) | Sigue rechazando email, URL y fechas inválidas con el mismo mensaje |
| Pruebas | test:metrics 9/9, test:github 5/5, check-metrics.py 20/20, check-bilingual.py correcto, html-validate sin errores, verificación real de Supabase correcta |
| Lighthouse | Umbral superado en las 12 mediciones; mínimo 97 (rendimiento de `/` en una pasada) y 100 en el resto |
| npm audit | 0 vulnerabilidades |
- Pendiente de GitHub Support: eliminar `refs/pull/1/head` y purgar las vistas en caché.
