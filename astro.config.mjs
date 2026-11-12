// @ts-check
import { defineConfig } from 'astro/config';

// Sitio estático para GitHub Pages (repositorio de usuario: se sirve en la raíz).
export default defineConfig({
  site: 'https://anamedinaaguirre.github.io',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
