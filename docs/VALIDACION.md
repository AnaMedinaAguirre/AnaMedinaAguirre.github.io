# Validación de la versión 2

Revisión local: 12 de noviembre de 2026. Rama de trabajo: `v2`.

## Resultado funcional

| Área | Comprobación | Resultado |
| --- | --- | --- |
| Build | Astro con Node 22, cuatro rutas y dos PDF A4 | Correcto |
| HTML | `html-validate:recommended` sobre las cuatro rutas | Correcto |
| Escritorio y móvil | 1440 y 375 px × ES/EN × claro/oscuro | Ocho combinaciones correctas |
| Tema | Cambio y persistencia tras recargar | Correcto |
| Idioma | Cambio, memoria y conservación de sección | Correcto |
| Menú móvil | Apertura, cierre con Escape y selección de enlace | Correcto |
| Tecnologías | Filtro de datos y restablecimiento de todas las áreas | Correcto |
| Enlaces internos | Respuesta HTTP y existencia de anclas | Correcto |
| PDF | Descarga de ambos idiomas y cabecera `%PDF-` | Correcto |
| CV | Columna sin tablas, ancho móvil y barra oculta al imprimir | Correcto |
| GitHub | Selección pública por topic, paginación, errores y campos opcionales | Cuatro pruebas correctas |
| Métricas | Configuración pública, validación, bots y deduplicación | Cinco pruebas correctas |
| Métricas en navegador | Datos, ceros, error, bot y almacenamiento bloqueado en ES/EN, escritorio claro y móvil oscuro | Veinte escenarios correctos |

Los scripts reproducibles están en `scripts/check-bilingual.py`, `scripts/check-metrics.py`, `scripts/github.test.mjs` y `scripts/metrics.test.mjs`. Los comandos completos están en el README. Las pruebas de Supabase en navegador interceptan la API con datos simulados: no insertan visitas reales.

## Lighthouse final

Se realizaron tres mediciones móviles de cada ruta, doce en total. El mínimo observado en cada categoría fue:

| Ruta | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
| --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 |
| `/en/` | 100 | 100 | 100 | 100 |
| `/cv/` | 100 | 100 | 100 | 100 |
| `/en/cv/` | 100 | 100 | 100 | 100 |

Son mediciones del build servido localmente, no una garantía de resultados idénticos en producción. Superan el umbral configurado de 90 en las cuatro categorías.

## Evidencia visual

Las capturas de esta revisión se guardan localmente, fuera de la carpeta que se publica:

- `.lighthouseci/review-final/`: ocho portadas completas y dos CV móviles.
- `.lighthouseci/review-phase5/`: estados simulados del gráfico y sus errores.
- `.lighthouseci/reports/`: informes Lighthouse HTML y JSON.

Las capturas y los informes no se versionan. No se publican proyectos ni métricas ficticias. Sin los valores públicos de Supabase en el entorno local, las portadas muestran el estado explícito de métricas no disponibles. Actions recibe esos valores de GitHub Secrets.

## Evidencia de integración

La ejecución de Actions de la fase 5, commit `69fb453`, fue mostrada por la propietaria con resultado **Success**. El workflow incluye verificación HTTP de lectura y permisos de Supabase sin generar visitas. El SQL de permisos también fue ejecutado en el dashboard: RLS activo, lectura permitida, INSERT/UPDATE/DELETE directos denegados y ejecución del incremento permitida a `anon`.

En la fase 6 se actualiza `actions/upload-artifact` de v4 a v7, cuyo [runtime oficial es Node 24](https://github.com/actions/upload-artifact/blob/v7/action.yml), para corregir el aviso de esa acción. El sitio sigue compilando con Node 22; son entornos distintos. Este cambio debe comprobarse en la próxima ejecución de Actions.

## Alcance y pendientes de publicación

- Las pruebas locales se realizaron con Chromium; no se afirma cobertura de Safari o Firefox.
- Las pruebas funcionales no certifican compatibilidad con todos los sistemas ATS; el CV utiliza HTML de una columna sin tablas y PDF etiquetado.
- LinkedIn y WhatsApp están excluidos del verificador automático por sus bloqueos a bots y requieren comprobación manual.
- Los 14 avisos de dependencias de desarrollo documentados en el README siguen pendientes de una revisión de actualización mayor. No se incluyó esa migración en la versión 2.
- Falta la ejecución del commit de fase 6 en GitHub, la aprobación del PR, el despliegue desde `main`, su revisión en producción y la primera ejecución diaria del cron. No se ha realizado el merge.
