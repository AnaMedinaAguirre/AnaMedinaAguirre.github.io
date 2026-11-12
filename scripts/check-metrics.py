"""Prueba el build de dist con RPC simuladas; nunca contacta Supabase real."""
from datetime import date, timedelta
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory='dist'))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
out = Path('.lighthouseci/review-phase5')
out.mkdir(parents=True, exist_ok=True)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for scenario in ('data', 'zero', 'error', 'bot', 'storage-blocked'):
            for lang, path in (('es', '/'), ('en', '/en/')):
                for width, theme in ((1440, 'light'), (375, 'dark')):
                    context = browser.new_context(viewport={'width': width, 'height': 900}, reduced_motion='reduce', user_agent='Mozilla/5.0 (Metrics UI test)')
                    context.add_init_script(f"localStorage.setItem('theme', '{theme}')")
                    if scenario != 'bot':
                        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false})")
                    if scenario == 'storage-blocked':
                        context.add_init_script("Object.defineProperty(window, 'sessionStorage', {get: () => {throw new Error('blocked')}})")
                    page = context.new_page()
                    increments = []
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    def handle(route):
                        request = route.request
                        if '.supabase.co/' in request.url:
                            assert request.headers.get('apikey') == 'sb_publishable_test'
                            assert 'authorization' not in request.headers
                            assert 'cookie' not in request.headers
                            assert 'referer' not in request.headers
                            if request.url.endswith('/record_portfolio_visit'):
                                increments.append(request.post_data_json)
                                route.fulfill(status=204)
                            elif scenario == 'error':
                                route.fulfill(status=503, content_type='application/json', body='{}')
                            else:
                                series = [{'day': (date(2026, 11, 12) - timedelta(days=29-i)).isoformat(), 'visits': 0 if scenario == 'zero' else i % 5} for i in range(30)]
                                payload = {'total': 0 if scenario == 'zero' else 120, 'last30': sum(row['visits'] for row in series), 'series': series}
                                route.fulfill(status=200, content_type='application/json', body=json.dumps(payload))
                        elif request.is_navigation_request():
                            response = route.fetch()
                            html = response.text().replace('data-metrics', 'data-metrics data-url="https://metrics-test.supabase.co" data-key="sb_publishable_test"', 1)
                            html = html.replace('data-origin="https://anamedinaaguirre.github.io"', f'data-origin="{base}"')
                            route.fulfill(response=response, body=html)
                        else:
                            route.continue_()
                    page.route('**/*', handle)
                    page.goto(base + path, wait_until='networkidle')
                    panel = page.locator('[data-metrics]')
                    panel.scroll_into_view_if_needed()
                    if scenario == 'error':
                        page.wait_for_function("document.querySelector('[data-status]').textContent === document.querySelector('[data-status]').dataset.unavailable")
                        assert panel.locator('[data-total]').inner_text() == '—'
                        assert panel.locator('.metrics-trend').is_hidden()
                    else:
                        page.wait_for_function("document.querySelector('[data-total]').textContent !== '—'")
                        assert panel.locator('[data-total]').inner_text() == ('0' if scenario == 'zero' else '120')
                        assert len(panel.locator('[data-trend]').get_attribute('points').split()) == 30
                    assert len(increments) == (0 if scenario in ('bot', 'storage-blocked') else 1)
                    if increments:
                        assert increments[0] == {'p_page': path, 'p_lang': lang}
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                    panel.screenshot(path=str(out / f'{scenario}-{lang}-{width}.png'))
                    if scenario == 'data':
                        page.reload(wait_until='networkidle')
                        panel.scroll_into_view_if_needed()
                        page.wait_for_function("document.querySelector('[data-total]').textContent !== '—'")
                        page.locator('.lang-toggle').click()
                        page.wait_for_load_state('networkidle')
                        page.locator('[data-metrics]').scroll_into_view_if_needed()
                        page.wait_for_function("document.querySelector('[data-total]').textContent !== '—'")
                        assert len(increments) == 1, 'La recarga o cambio de idioma duplicó la visita'
                    assert not errors, errors
                    context.close()
                    print(f'OK {scenario} {lang} {width}', flush=True)
        browser.close()
finally:
    server.shutdown()
    server.server_close()
