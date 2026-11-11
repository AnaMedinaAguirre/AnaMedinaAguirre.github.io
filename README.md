# Portafolio — Ana Patricia Medina Aguirre

Sitio estático (HTML, CSS y JavaScript puro, sin dependencias ni build).

```
index.html        contenido, SEO, Open Graph e íconos SVG
css/styles.css    estilos (modo oscuro/claro, responsive)
js/main.js        tema, menú, navegación, filtros, copiar email, volver arriba
assets/           CV, foto, favicon e imagen para redes sociales
```

## Ver en local

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Publicar

**GitHub Pages:** sube la carpeta a un repositorio → Settings → Pages →
"Deploy from a branch" → rama `main`, carpeta `/ (root)`.

**Netlify:** arrastra la carpeta a https://app.netlify.com/drop
(o conecta el repositorio; no necesita comando de build, directorio de publicación: `/`).

## Pendientes antes de publicar

- `[AGREGAR ENLACE]` de GitHub en la sección Contacto (`index.html`).
- `[AGREGAR URL DEL SITIO]` en el `<head>`: completar `canonical`, `og:url`
  y poner la URL absoluta en `og:image` (las redes sociales la necesitan así).
- `assets/yo.jpeg` es la foto original; el sitio usa el recorte
  `foto-ana.webp` / `foto-ana.jpg`. Puedes borrar `yo.jpeg` antes de subirlo.
