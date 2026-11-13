# Logos de la franja de tecnologías

Todos son isotipos cuadrados del mismo tamaño (el build rechaza logotipos anchos). Los logos se descargaron una vez y se sirven desde el propio sitio
(`public/assets/logos/`, sin CDN). La lista y la validación están en
`data/franja.json` y `src/lib/strip.ts`. El build falla si falta un archivo,
un glifo o la fuente/licencia de algún ítem.

| Tecnología | Archivo | Fuente | Licencia / condiciones |
|---|---|---|---|
| Python | `python.svg` | Devicon 2.18.0, variante `original` | MIT |
| PostgreSQL | `postgresql.svg` | Devicon 2.18.0, `original` | MIT |
| n8n | `n8n.svg` | Devicon 2.18.0, `original` | MIT |
| WooCommerce | `woocommerce.svg` | Devicon 2.18.0, `original` | MIT |
| Git | `git.svg` | Devicon 2.18.0, `original` | MIT |
| GitHub Actions | `githubactions.svg` | Devicon 2.18.0, `original` | MIT |
| Nginx | glifo `nginx` del sprite | Simple Icons 16.37: isotipo cuadrado de NGINX (hexágono con la N), en su color #009639. Devicon solo tiene el logotipo de texto, que es ancho | CC0 |
| Linux | `linux.png` | Devicon 2.18.0, `original`, rasterizado a 56 px (el SVG pesa 194 KB) | MIT |
| dbt | `dbt.png` | Kit de marca oficial de dbt Labs (getdbt.com/brand-guidelines), `dbt-bit-standalone.png` reducido a 56 px de alto | Política de marca de dbt Labs (ver abajo) |
| Odoo | glifo `modules` del sprite | Glifo propio en el color de Odoo. Odoo no publica un isotipo cuadrado: su logo oficial es el logotipo de texto "odoo", que es ancho y repetía el nombre | Propio |
| Supabase (proyectos personales) | `supabase.svg` | Devicon 2.18.0, `original` | MIT |
| Astro (proyectos personales) | glifo `astro` del sprite | Simple Icons 16.37, isotipo en monocromo claro u oscuro según el tema (como los logos monocromos de astro.build/press); el de Devicon es azul marino y no se ve en tema oscuro | CC0 |
| Power BI, Excel, Power Automate, SharePoint | (glifos del sprite) | Glifos genéricos propios, no son los logos de Microsoft | Propios |

Los logos de Devicon están bajo licencia MIT: Copyright (c) 2015 konpa, incluida en
https://github.com/devicons/devicon/blob/v2.18.0/LICENSE. Las marcas siguen
perteneciendo a sus dueños.

## Condiciones de las marcas que no son de Devicon

- **dbt (dbt Labs).** La política de marca (versión del 15 de mayo de 2026) permite a
  cualquiera usar el logo para mostrar las tecnologías de un stack de datos, con estas
  condiciones:
  - el logo no puede ser el único de la gráfica;
  - debe tener el mismo tamaño que los demás;
  - no se puede cambiar su color;
  - debe incluirse un aviso de que no hay afiliación con dbt Labs.

  Además, el logo no se puede alterar salvo para escalarlo. Por eso, al pasar el cursor
  solo crece y no gira. El aviso de marca y de no afiliación está en el pie de página.
- **Odoo (Odoo S.A.).** No se usa su logo. Su único logo oficial es el logotipo de texto
  "odoo", que es ancho, y la página de brand assets no publica un isotipo cuadrado. Sus
  reglas, además, piden usarlo solo en los colores provistos y no recrearlo. Por eso se usa
  un glifo propio, el mismo ícono de módulos que identifica a Odoo en el CV.
- **Microsoft (Power BI, Excel, Power Automate, SharePoint).** No se usan los íconos
  oficiales, porque sus condiciones no cubren este uso:
  - Los íconos de Power Platform (learn.microsoft.com/power-platform/guidance/icons) se
    permiten "en diagramas de arquitectura, materiales de formación o documentación" y
    prohíben rotarlos.
  - Los íconos de Office (Microsoft Fabric Assets License, para Excel y SharePoint) solo
    se licencian para apps que usan una API de Microsoft. Esa licencia prohíbe animarlos
    o alterarlos, y para una fila de logos indica escribir solo el nombre del producto.
  - El repositorio microsoft/PowerBI-Icons (CC BY 4.0) aclara que su licencia no da
    derecho a usar los logos ni las marcas de Microsoft.
