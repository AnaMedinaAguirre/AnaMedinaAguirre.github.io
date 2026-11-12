"""Revisión final ES/EN de dist con un servidor temporal local.

Uso: npm.cmd run build:all, luego python scripts/check-bilingual.py.
Requiere Playwright para Python y Chromium instalados.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory='dist'))
Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}'
OUT = Path('.lighthouseci/review-final')
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in (1440, 375):
        for lang, route in (('es', '/'), ('en', '/en/')):
            for theme in ('dark', 'light'):
                context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce')
                context.add_init_script(f"if (!localStorage.getItem('theme')) localStorage.setItem('theme', '{theme}')")
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto(BASE + route, wait_until='networkidle')
                assert page.locator('html').get_attribute('lang') == lang
                assert page.locator('html').get_attribute('data-theme') == theme
                assert page.locator('link[hreflang="es"]').count() == 1
                assert page.locator('link[hreflang="en"]').count() == 1
                assert page.locator('link[rel="canonical"]').get_attribute('href').endswith(route)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Desbordamiento horizontal'
                assert page.locator('.project:not(.personal-project)').count() == 5
                page.screenshot(path=str(OUT / f'{lang}-{theme}-{width}.png'), full_page=True)
                page.locator('.theme-toggle').click()
                assert page.locator('html').get_attribute('data-theme') != theme
                page.reload(wait_until='networkidle')
                assert page.locator('html').get_attribute('data-theme') != theme
                if width == 375:
                    page.locator('.menu-toggle').click()
                    assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'true'
                    page.keyboard.press('Escape')
                    assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false'
                    page.locator('.menu-toggle').click()
                    page.locator('.nav-links a').first.click()
                    assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false'
                page.locator('.filter[data-filter="datos"]').click()
                assert page.locator('.tech-group:visible').count() == 1
                page.locator('.filter[data-filter="todas"]').click()
                assert page.locator('.tech-group:visible').count() > 1
                # Resolver recursos y enlaces locales, incluidas las anclas.
                for href in page.locator('a[href]').evaluate_all('(els) => els.map(a => a.getAttribute("href"))'):
                    if href.startswith('#'):
                        assert page.locator('[id="' + href[1:] + '"]').count(), href
                    elif href.startswith('/'):
                        assert context.request.get(BASE + urlsplit(href).path).ok, href
                pdf = page.locator('a[download]').first
                with page.expect_download() as download:
                    pdf.click()
                assert download.value.failure() is None
                assert download.value.suggested_filename.endswith('_EN.pdf') == (lang == 'en')
                assert Path(download.value.path()).read_bytes().startswith(b'%PDF-')
                assert page.locator('[data-metrics]').count() == 1
                page.evaluate("location.hash = 'proyectos'")
                page.locator('.lang-toggle').click()
                page.wait_for_load_state('networkidle')
                other = 'en' if lang == 'es' else 'es'
                assert page.locator('html').get_attribute('lang') == other
                assert page.evaluate('location.hash') == '#proyectos'
                assert page.evaluate("localStorage.getItem('lang')") == other
                page.reload(wait_until='networkidle')
                assert page.locator('html').get_attribute('lang') == other
                if other == 'en':
                    page.goto(BASE, wait_until='networkidle')
                    page.wait_for_url('**/en/')
                assert not errors, errors
                print(f'OK {lang} {theme} {width}: layout, tema, idioma, enlaces, descarga y consola')
                context.close()
    for lang, route in (('es', '/cv/'), ('en', '/en/cv/')):
        page = browser.new_page(viewport={'width': 375, 'height': 900})
        page.goto(BASE + route, wait_until='networkidle')
        assert page.locator('html').get_attribute('lang') == lang
        assert page.locator('table').count() == 0
        response = page.request.get(BASE + ('/assets/CV_Ana_Medina_Aguirre.pdf' if lang == 'es' else '/assets/CV_Ana_Medina_Aguirre_EN.pdf'))
        assert response.ok and response.body().startswith(b'%PDF-')
        page.emulate_media(media='print')
        assert page.locator('.cv-toolbar').is_hidden()
        page.emulate_media(media='screen')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path=str(OUT / f'cv-{lang}-375.png'), full_page=True)
        print(f'OK CV {lang}: idioma, columna sin tablas y ancho móvil')
        page.close()
    browser.close()
server.shutdown()
server.server_close()
