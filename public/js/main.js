/* Portafolio — Ana Patricia Medina Aguirre
   JavaScript sin dependencias: tema, menú, scroll-spy, conector del proceso,
   apariciones al hacer scroll, filtros, copiar email y "volver arriba". */
(function () {
  'use strict';

  var root = document.documentElement;

  /* Textos de interfaz del idioma de la página (inyectados por el build) */
  var T = {
    themeToLight: 'Cambiar a modo claro', themeToDark: 'Cambiar a modo oscuro',
    menuOpen: 'Abrir menú', menuClose: 'Cerrar menú',
    filterAll: 'Mostrando todas las áreas', filterOne: 'Mostrando',
    copied: 'Email copiado', copiedStatus: 'Email copiado al portapapeles'
  };
  try {
    var uiEl = document.getElementById('ui-strings');
    if (uiEl) { var parsed = JSON.parse(uiEl.textContent); for (var k in parsed) T[k] = parsed[k]; }
  } catch (e) { /* se usan los textos por defecto */ }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var prefersLight = window.matchMedia('(prefers-color-scheme: light)');

  function storageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storageSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* sin almacenamiento */ } }

  /* ---------- Tema claro / oscuro ---------- */
  var themeBtn = document.querySelector('.theme-toggle');

  function applyTheme(theme, animate) {
    if (animate && !reduceMotion.matches) {
      root.classList.add('theme-anim');
      window.setTimeout(function () { root.classList.remove('theme-anim'); }, 400);
    }
    root.setAttribute('data-theme', theme);
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', theme === 'dark' ? T.themeToLight : T.themeToDark);
    }
  }

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      storageSet('theme', next);
    });
  }

  // Si la persona no eligió un tema, seguir los cambios del sistema
  var onSchemeChange = function (e) {
    var saved = storageGet('theme');
    if (saved !== 'light' && saved !== 'dark') applyTheme(e.matches ? 'light' : 'dark', true);
  };
  if (prefersLight.addEventListener) prefersLight.addEventListener('change', onSchemeChange);
  else if (prefersLight.addListener) prefersLight.addListener(onSchemeChange);

  /* ---------- Menú móvil ---------- */
  var menuBtn = document.querySelector('.menu-toggle');
  var panel = document.getElementById('nav-panel');

  function setMenu(open, returnFocus) {
    if (!menuBtn || !panel) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? T.menuClose : T.menuOpen);
    panel.classList.toggle('is-open', open);
    if (open) {
      var first = panel.querySelector('a');
      if (first) first.focus();
    } else if (returnFocus) {
      menuBtn.focus();
    }
  }

  if (menuBtn && panel) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true', false);
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a') && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', function (e) {
      if (menuBtn.getAttribute('aria-expanded') === 'true' && !e.target.closest('.nav')) setMenu(false, false);
    });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false, false);
    });
  }

  /* ---------- Scroll: header, conector, nodos, volver arriba ---------- */
  var header = document.querySelector('.site-header');
  var flow = document.querySelector('.flow');
  var hero = document.querySelector('.hero');
  var endHead = document.querySelector('.step--end .step-head');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var backTop = document.querySelector('.back-to-top');
  var railTop = 0;
  var railBottom = 0;
  var heroEnd = 0;   // "volver arriba" aparece al pasar el hero

  function measureRail() {
    if (!flow || !hero || !endHead) return;
    var heroPad = parseFloat(getComputedStyle(hero).paddingTop) || 0;
    var heroTop = hero.offsetTop;
    heroEnd = flow.getBoundingClientRect().top + (window.scrollY || 0) + heroTop + hero.offsetHeight;
    railTop = heroTop + heroPad + 28;             // debajo del evento de inicio
    var endTop = endHead.offsetTop;                // offsetParent = .flow
    var endNode = endTop + parseFloat(getComputedStyle(endHead.querySelector('h2')).fontSize) * 0.45;
    railBottom = endNode;                          // hasta el evento final
    flow.style.setProperty('--rail-top', railTop + 'px');
    flow.style.setProperty('--rail-height', Math.max(0, railBottom - railTop) + 'px');
  }

  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;

    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (backTop) backTop.hidden = y < (heroEnd || vh) - 80;

    if (flow) {
      var mark = y + vh * 0.55;
      var flowTop = flow.getBoundingClientRect().top + y;
      var p = (mark - (flowTop + railTop)) / Math.max(1, railBottom - railTop);
      flow.style.setProperty('--flow', Math.min(1, Math.max(0, p)).toFixed(4));

      steps.forEach(function (s) {
        var head = s.querySelector('.step-head');
        if (!head) return;
        var top = head.getBoundingClientRect().top + y;
        s.classList.toggle('is-passed', top < mark);
      });
    }
  }
  function requestScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', function () { measureRail(); requestScroll(); });
  window.addEventListener('load', function () { measureRail(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measureRail(); onScroll(); });
  measureRail();
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      var h1 = document.getElementById('hero-title');
      if (h1) h1.focus({ preventScroll: true });
    });
  }

  /* ---------- Scroll-spy de la navegación ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var linkFor = {};
  navLinks.forEach(function (a) { linkFor[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = linkFor[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    steps.forEach(function (s) { if (s.id) spy.observe(s); });
  }

  /* ---------- Apariciones al hacer scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-visible'); });
  }

  /* Pausar la animación del hero cuando no está a la vista */
  var canvas = document.querySelector('.hero-canvas');
  if (canvas && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      canvas.classList.toggle('is-paused', !entries[0].isIntersecting);
    }).observe(canvas);
  }

  /* ---------- Filtros de tecnologías ---------- */
  var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.tech-group'));
  var filterStatus = document.getElementById('filter-status');

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var shown = 0;
      groups.forEach(function (g) {
        var show = key === 'todas' || g.getAttribute('data-group') === key;
        g.hidden = !show;
        if (show) { shown++; g.classList.add('is-visible'); }
      });
      if (filterStatus) {
        filterStatus.textContent = key === 'todas'
          ? T.filterAll
          : T.filterOne + ' ' + btn.textContent.trim();
      }
    });
  });

  /* ---------- Copiar email ---------- */
  var copyStatus = document.getElementById('copy-status');
  Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (btn) {
    var label = btn.querySelector('span');
    var original = label ? label.textContent : '';
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.classList.add('is-done');
        if (label) label.textContent = T.copied;
        if (copyStatus) copyStatus.textContent = T.copiedStatus;
        window.setTimeout(function () {
          btn.classList.remove('is-done');
          if (label) label.textContent = original;
          if (copyStatus) copyStatus.textContent = '';
        }, 2200);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* sin acción */ }
        document.body.removeChild(ta);
        btn.focus();
      }
    });
  });

  /* Idioma: recordar la elección y conservar la sección actual al cambiar */
  Array.prototype.forEach.call(document.querySelectorAll('.lang-toggle'), function (a) {
    a.addEventListener('click', function () {
      storageSet('lang', a.getAttribute('data-lang'));
      if (location.hash) a.setAttribute('href', a.getAttribute('href').split('#')[0] + location.hash);
    });
  });

  /* Línea de terminal del hero: escribe y borra frases cortas con ritmo
     humano. Da 2 vueltas y se detiene en la primera frase con el cursor quieto
     (WCAG 2.2.2). Se pausa con el mouse encima o con el foco. Con movimiento
     reducido (o sin JS) queda fija la primera frase. El lector de pantalla lee
     todas las frases una vez desde un span sr-only; esto es solo visual. */
  var typer = document.querySelector('[data-typer]');
  var typed = typer && typer.querySelector('[data-typer-text]');
  var phrases = [];
  try { phrases = JSON.parse(typer.getAttribute('data-phrases')); } catch (e) { phrases = []; }
  if (typer && typed && phrases.length > 1 && !reduceMotion.matches) {
    var TYPE_MS = 70, JITTER_MS = 20, HOLD_MS = 1800, ERASE_MS = 35, GAP_MS = 300, ROUNDS = 2;
    var hovered = false, focused = false, pending = null;
    var later = function (fn, ms) {
      window.setTimeout(function () {
        if (hovered || focused) { pending = fn; return; }   // en pausa: se retoma al salir
        fn();
      }, ms);
    };
    var setPaused = function () {
      var paused = hovered || focused;
      typer.classList.toggle('is-paused', paused);
      if (!paused && pending) { var fn = pending; pending = null; fn(); }
    };
    typer.addEventListener('mouseenter', function () { hovered = true; setPaused(); });
    typer.addEventListener('mouseleave', function () { hovered = false; setPaused(); });
    typer.addEventListener('focus', function () { focused = true; setPaused(); });
    typer.addEventListener('blur', function () { focused = false; setPaused(); });

    var type = function (text, done) {
      var n = typed.textContent.length;
      if (n >= text.length) { done(); return; }
      typed.textContent = text.slice(0, n + 1);
      later(function () { type(text, done); }, TYPE_MS + Math.round((Math.random() * 2 - 1) * JITTER_MS));
    };
    var erase = function (done) {
      var n = typed.textContent.length;
      if (n === 0) { done(); return; }
      typed.textContent = typed.textContent.slice(0, n - 1);
      later(function () { erase(done); }, ERASE_MS);
    };
    var finish = function () {
      typer.classList.remove('is-animating');
      typer.classList.add('is-done');
    };
    var step = function (round, i) {
      if (round === ROUNDS) { type(phrases[0], finish); return; }   // cierre: queda la primera
      type(phrases[i], function () {
        later(function () {
          erase(function () {
            var next = i + 1 < phrases.length ? [round, i + 1] : [round + 1, 0];
            later(function () { step(next[0], next[1]); }, GAP_MS);
          });
        }, HOLD_MS);
      });
    };
    typed.textContent = '';
    typer.classList.add('is-animating');
    later(function () { step(0, 0); }, 500);
  }

  /* Tarjetas: la línea inferior se dibuja al entrar en pantalla */
  var fxCards = document.querySelectorAll('.fx-card');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var lineIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        lineIO.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    Array.prototype.forEach.call(fxCards, function (el) { lineIO.observe(el); });
  } else {
    Array.prototype.forEach.call(fxCards, function (el) { el.classList.add('is-in'); });
  }

  /* Efectos con el cursor: solo con mouse y sin "reducir movimiento".
     - luz de fondo que sigue al cursor con un leve retraso
     - brillo dentro de la tarjeta y en su borde, bajo el cursor
     - efecto imán en los botones principales
     Un solo requestAnimationFrame que se detiene cuando el cursor está quieto;
     solo se escriben transform y translate. */
  var fineMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fineMouse && !reduceMotion.matches) {
    Array.prototype.forEach.call(fxCards, function (card) {
      card.insertAdjacentHTML('beforeend',
        '<span class="fx-glow" aria-hidden="true"><i></i></span><span class="fx-ring" aria-hidden="true"><i></i></span>');
    });
    var spot = document.createElement('div');
    spot.className = 'fx-spot';
    spot.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(spot, document.body.firstChild);

    var MAGNET = '.btn-primary, .cv-btn';
    var pos = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, fxRAF = 0, fxCard = null, magEl = null;
    var placeGlow = function (card) {
      var layers = card.querySelectorAll('.fx-glow, .fx-ring');
      for (var n = 0; n < layers.length; n++) {
        var r = layers[n].getBoundingClientRect();
        layers[n].firstChild.style.transform = 'translate3d(' + (pos.x - r.left) + 'px,' + (pos.y - r.top) + 'px,0)';
      }
    };
    var fxFrame = function () {
      cur.x += (pos.x - cur.x) * 0.12;
      cur.y += (pos.y - cur.y) * 0.12;
      spot.style.transform = 'translate3d(' + cur.x.toFixed(1) + 'px,' + cur.y.toFixed(1) + 'px,0)';
      if (fxCard) placeGlow(fxCard);
      if (magEl) {
        var m = magEl.getBoundingClientRect();
        var dx = Math.max(-0.5, Math.min(0.5, (pos.x - m.left) / m.width - 0.5));
        var dy = Math.max(-0.5, Math.min(0.5, (pos.y - m.top) / m.height - 0.5));
        magEl.style.translate = (dx * 10).toFixed(1) + 'px ' + (dy * 8).toFixed(1) + 'px';   // máx. 5 px y 4 px
      }
      var still = Math.abs(pos.x - cur.x) < 0.3 && Math.abs(pos.y - cur.y) < 0.3;
      fxRAF = still ? 0 : window.requestAnimationFrame(fxFrame);
    };
    var kick = function () { if (!fxRAF) fxRAF = window.requestAnimationFrame(fxFrame); };
    var releaseMagnet = function () { if (magEl) { magEl.style.translate = ''; magEl = null; } };

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      pos.x = e.clientX; pos.y = e.clientY;
      if (!spot.classList.contains('is-on')) { cur.x = pos.x; cur.y = pos.y; spot.classList.add('is-on'); }
      var t = e.target && e.target.closest ? e.target : null;
      fxCard = t && t.closest('.fx-card');
      var m = t && t.closest(MAGNET);
      if (m !== magEl) { releaseMagnet(); magEl = m; }
      kick();
    }, { passive: true });
    // Al hacer scroll la tarjeta se mueve bajo el cursor quieto: reubicar el brillo
    window.addEventListener('scroll', function () { if (fxCard) window.requestAnimationFrame(function () { if (fxCard) placeGlow(fxCard); }); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () {
      spot.classList.remove('is-on');
      fxCard = null;
      releaseMagnet();
    });
  }

  /* Skip link: mover el foco al contenido principal */
  var skip = document.querySelector('.skip-link');
  var main = document.getElementById('contenido');
  if (skip && main) {
    skip.addEventListener('click', function () {
      window.setTimeout(function () { main.focus({ preventScroll: true }); }, 0);
    });
  }
})();
