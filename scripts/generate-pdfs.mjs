/**
 * Genera los PDF del CV imprimiendo las páginas /cv/ (y /en/cv/ si existe)
 * del sitio ya construido en dist/. Así la web y el PDF salen del mismo JSON
 * y nunca se desincronizan.
 *
 * Uso: npm run build && npm run pdf
 */
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const DIST = join(process.cwd(), 'dist');
const PORT = Number(process.env.PDF_PORT || 4329);

const TARGETS = [
  { route: '/cv/', out: 'assets/CV_Ana_Medina_Aguirre.pdf', lang: 'es' },
  { route: '/en/cv/', out: 'assets/CV_Ana_Medina_Aguirre_EN.pdf', lang: 'en' },
];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

/** Servidor estático mínimo sobre dist/ (sin dependencias). */
function serve() {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      path = normalize(path).replace(/^([/\\])+/, '');
      let file = join(DIST, path);
      if (!file.startsWith(DIST)) throw new Error('fuera de dist');
      if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('404');
    }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('No existe dist/. Ejecuta primero: npm run build');
  process.exit(1);
}

const server = await serve();
const browser = await chromium.launch();
let generated = 0;
try {
  const page = await browser.newPage();
  for (const t of TARGETS) {
    if (!existsSync(join(DIST, t.route, 'index.html'))) {
      console.log(`- ${t.route} no existe todavía; se omite ${t.out}`);
      continue;
    }
    await page.goto(`http://127.0.0.1:${PORT}${t.route}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    const out = join(DIST, t.out);
    await mkdir(join(out, '..'), { recursive: true });
    await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
    console.log(`✓ ${t.route} → dist/${t.out}`);
    generated++;
  }
} finally {
  await browser.close();
  server.close();
}
if (generated === 0) {
  console.error('No se generó ningún PDF.');
  process.exit(1);
}
