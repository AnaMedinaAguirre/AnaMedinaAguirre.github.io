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

  /* Franja de tecnologías (idea tomada de la "cinta" de paulareixach.github.io):
     avanza sola y sin huecos; se pausa con el cursor encima o con el foco
     (Tab, o un toque en pantallas táctiles: tocar fuera la reanuda); se puede
     arrastrar con el mouse o el dedo, y con el foco las flechas la mueven.
     Con "reducir movimiento" queda quieta, centrada y en varias líneas (sin
     .is-moving). Solo se anima mientras está en pantalla. Las copias del
     bucle llevan aria-hidden: el lector de pantalla lee la lista una vez. */
  var belt = document.querySelector('[data-belt]');
  if (belt) setupBelt(belt);

  function setupBelt(belt) {
    var track = belt.querySelector('.belt-track');
    var first = track.firstElementChild;
    var SPEED = 38;      // px por segundo
    var KEY_STEP = 160;  // px por pulsación de flecha
    var x = 0, last = 0, raf = 0, drag = null;
    var hover = false, focused = false, visible = true, lastPointer = '';

    function fill(w) { // repite la lista hasta cubrir el ancho + una copia extra
      var need = Math.ceil(belt.offsetWidth / w) + 1;
      while (track.children.length < need) {
        var copy = first.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
    }
    function frame(ts) {
      var w = first.offsetWidth;
      var dt = last ? Math.min((ts - last) / 1000, 0.1) : 0;
      last = ts;
      if (w) {
        fill(w);
        if (!drag && !hover && !focused) x += SPEED * dt;
        x = ((x % w) + w) % w;
        track.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (!raf && visible && !document.hidden && !reduceMotion.matches) { last = 0; raf = requestAnimationFrame(frame); }
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    function apply() {
      if (reduceMotion.matches) {
        stop();
        belt.classList.remove('is-moving');
        track.style.transform = '';
        while (track.children.length > 1) track.removeChild(track.lastElementChild);
      } else {
        belt.classList.add('is-moving');
        start();
      }
    }

    belt.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    belt.addEventListener('pointerleave', function () { hover = false; });
    belt.addEventListener('pointerdown', function (e) {
      lastPointer = e.pointerType;
      if (!belt.classList.contains('is-moving') || e.button !== 0) return;
      drag = { start: e.clientX, from: x };
      belt.setPointerCapture(e.pointerId);
      belt.classList.add('is-dragging');
    });
    belt.addEventListener('pointermove', function (e) { if (drag) x = drag.from - (e.clientX - drag.start); });
    function endDrag() { drag = null; belt.classList.remove('is-dragging'); }
    belt.addEventListener('pointerup', endDrag);
    belt.addEventListener('pointercancel', endDrag);
    belt.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // Con el mouse, hacer clic no la deja pausada al salir (para eso está el hover)
    belt.addEventListener('focus', function () {
      focused = belt.matches(':focus-visible') || lastPointer === 'touch' || lastPointer === 'pen';
    });
    belt.addEventListener('blur', function () { focused = false; lastPointer = ''; });
    belt.addEventListener('keydown', function (e) {
      if (!belt.classList.contains('is-moving')) return;
      if (e.key === 'ArrowRight') { x += KEY_STEP; e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { x -= KEY_STEP; e.preventDefault(); }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(belt);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', apply);
    apply();
  }

  /* Cifras de "Sobre mí": cuentan desde 0 al entrar en pantalla (1,1 s,
     con desaceleración). El HTML ya trae el valor final: sin JS o con
     movimiento reducido no cambia nada, y el lector usa un texto aparte. */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion.matches) {
    var runCount = function (el) {
      var to = Number(el.getAttribute('data-count')), t0 = 0;
      var tick = function (ts) {
        if (!t0) t0 = ts;
        var k = Math.min((ts - t0) / 1100, 1);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        runCount(entry.target);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(counters, function (el) {
      // Solo si todavía no está a la vista: así nunca se ve el valor final y luego un 0
      if (el.getBoundingClientRect().top <= window.innerHeight) return;
      el.textContent = '0';
      countIO.observe(el);
    });
  }

  /* Experiencia en pestañas (patrón tabs de WAI-ARIA, activación automática):
     flechas arriba/abajo (o izquierda/derecha), Inicio y Fin; la píldora de
     fondo se desliza a la pestaña elegida. En móvil o sin JS se usa el
     acordeón (<details>), que no necesita código. */
  var xp = document.querySelector('[data-xp]');
  if (xp) {
    var xpTabs = Array.prototype.slice.call(xp.querySelectorAll('[role="tab"]'));
    var xpInd = xp.querySelector('.xp-ind');
    var xpCur = 0;
    var moveInd = function () {
      var b = xpTabs[xpCur];
      if (!b || !b.offsetHeight) return;
      xpInd.style.transform = 'translateY(' + b.offsetTop + 'px)';
      xpInd.style.height = b.offsetHeight + 'px';
    };
    var selectTab = function (i, focus) {
      xpCur = i;
      xpTabs.forEach(function (b, j) {
        b.setAttribute('aria-selected', String(j === i));
        b.tabIndex = j === i ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).hidden = j !== i;
      });
      moveInd();
      if (focus) xpTabs[i].focus();
    };
    xpTabs.forEach(function (b, i) {
      b.addEventListener('click', function () { selectTab(i, false); });
      b.addEventListener('keydown', function (e) {
        var n = xpTabs.length, k = e.key, next = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') next = (i + 1) % n;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') next = (i - 1 + n) % n;
        else if (k === 'Home') next = 0;
        else if (k === 'End') next = n - 1;
        if (next === null) return;
        e.preventDefault();
        selectTab(next, true);
      });
    });
    window.addEventListener('resize', moveInd);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
    moveInd();
  }

  /* Visuales de proyectos (data-visual): el HTML trae el estado final. Si hay
     movimiento, se "arman" con su estado inicial, se reproducen una vez al
     entrar en pantalla y se repiten con el cursor o el foco en su tarjeta. */
  var visuals = document.querySelectorAll('[data-visual]');
  var numFmt = function (lang, decimals) {
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };
  var tween = function (ms, onFrame, onEnd) {
    var t0 = 0;
    var tick = function (ts) {
      if (!t0) t0 = ts;
      var k = Math.min((ts - t0) / ms, 1);
      onFrame(1 - Math.pow(1 - k, 3));
      if (k < 1) window.requestAnimationFrame(tick); else if (onEnd) onEnd();
    };
    window.requestAnimationFrame(tick);
  };
  var visualKinds = {
    sync: {
      arm: function (el) {
        el.classList.remove('is-played');
        el.classList.add('is-armed');
        Array.prototype.forEach.call(el.querySelectorAll('[data-count-from]'), function (n) { n.textContent = n.getAttribute('data-count-from'); });
      },
      play: function (el, done) {
        el.classList.add('is-playing');
        var counters = el.querySelectorAll('[data-count-from]');
        window.setTimeout(function () {
          tween(1300, function (k) {
            Array.prototype.forEach.call(counters, function (n) {
              // Mientras sincroniza nunca baja de 1: llega a 0 justo al pasar a OK
              var left = Number(n.getAttribute('data-count-from')) * (1 - k);
              n.textContent = String(k < 1 ? Math.max(1, Math.ceil(left)) : 0);
            });
          }, function () {
            el.classList.remove('is-armed', 'is-playing');
            el.classList.add('is-played');
            window.setTimeout(done, 450);
          });
        }, 300);
      },
    },
    dash: {
      arm: function (el) {
        el.classList.remove('is-playing');
        el.classList.add('is-armed');
        Array.prototype.forEach.call(el.querySelectorAll('[data-count-to]'), function (n) { n.textContent = '0'; });
      },
      play: function (el, done) {
        var lang = el.getAttribute('data-lang');
        // La línea se dibuja y las barras crecen (CSS); los números cuentan (aquí)
        void el.getBoundingClientRect();
        el.classList.remove('is-armed');
        el.classList.add('is-playing');
        var end = done;
        done = function () { window.setTimeout(function () { el.classList.remove('is-playing'); end(); }, 700); };
        var counters = Array.prototype.slice.call(el.querySelectorAll('[data-count-to]'));
        counters.forEach(function (n, i) {
          var to = Number(n.getAttribute('data-count-to')), f = numFmt(lang, Number(n.getAttribute('data-decimals')) || 0);
          window.setTimeout(function () {
            tween(1100, function (k) { n.textContent = f.format(to * k); }, i === counters.length - 1 ? done : null);
          }, i * 120);
        });
      },
    },
    runs: {
      arm: function (el) {
        el.classList.remove('is-entered', 'is-played', 'is-playing');
        el.classList.add('is-armed');
        Array.prototype.forEach.call(el.querySelectorAll('[data-count-to]'), function (n) { n.textContent = '0'; });
      },
      play: function (el, done) {
        var lang = el.getAttribute('data-lang');
        void el.getBoundingClientRect();
        el.classList.add('is-entered', 'is-playing');
        var counter = el.querySelector('[data-count-to]'), to = Number(counter.getAttribute('data-count-to')), f = numFmt(lang, 0);
        window.setTimeout(function () {
          tween(1600, function (k) { counter.textContent = f.format(to * k); }, function () {
            el.classList.remove('is-armed', 'is-playing');
            el.classList.add('is-played');
            window.setTimeout(done, 450);
          });
        }, 450);
      },
    },
    bpmn: {
      arm: function (el) { el.removeAttribute('data-user'); setBpmnView(el, 'asis'); },
      play: function (el, done) {
        // Si la persona eligió una pestaña mientras tanto, se respeta su elección
        window.setTimeout(function () { if (!el.hasAttribute('data-user')) setBpmnView(el, 'tobe'); window.setTimeout(done, 900); }, 1000);
      },
    },
    term: {
      arm: function (el) {
        el.classList.add('is-armed');
        var p = el.querySelector('.pv-term-prompt');
        if (!p.hasAttribute('data-text')) p.setAttribute('data-text', p.textContent);
        p.textContent = '$';
        Array.prototype.forEach.call(el.querySelectorAll('.pv-term-line'), function (l) { l.classList.remove('is-shown'); });
      },
      play: function (el, done) {
        var p = el.querySelector('.pv-term-prompt'), text = p.getAttribute('data-text'), i = 1;
        var lines = el.querySelectorAll('.pv-term-line');
        var typeTick = function () {
          i += 1; p.textContent = text.slice(0, i);
          if (i < text.length) { window.setTimeout(typeTick, 22); return; }
          Array.prototype.forEach.call(lines, function (l, k) {
            window.setTimeout(function () {
              l.classList.add('is-shown');
              if (k === lines.length - 1) window.setTimeout(function () { el.classList.remove('is-armed'); done(); }, 300);
            }, 200 + k * 210);
          });
        };
        window.setTimeout(typeTick, 250);
      },
    },
  };
  /* Pestañas AS-IS / TO-BE del visual BPMN (funcionan con o sin movimiento) */
  function setBpmnView(el, view) {
    el.setAttribute('data-view', view);
    var panel = el.querySelector('[role="tabpanel"]');
    Array.prototype.forEach.call(el.querySelectorAll('[data-view-tab]'), function (b) {
      var on = b.getAttribute('data-view-tab') === view;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on) panel.setAttribute('aria-labelledby', b.id);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.pv-bpmn'), function (el) {
    var list = el.querySelector('[role="tablist"]');
    var tabs = Array.prototype.slice.call(el.querySelectorAll('[data-view-tab]'));
    list.hidden = false;
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { el.setAttribute('data-user', '1'); setBpmnView(el, b.getAttribute('data-view-tab')); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
        e.preventDefault();
        el.setAttribute('data-user', '1');
        var n = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        setBpmnView(el, tabs[n].getAttribute('data-view-tab'));
        tabs[n].focus();
      });
    });
  });
  if (visuals.length && !reduceMotion.matches && 'IntersectionObserver' in window) {
    var playVisual = function (el) {
      var kind = visualKinds[el.getAttribute('data-visual')];
      if (!kind || el.getAttribute('data-busy') === '1') return;
      el.setAttribute('data-busy', '1');
      kind.arm(el);
      kind.play(el, function () { el.removeAttribute('data-busy'); el.setAttribute('data-played', '1'); });
    };
    var visualIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        visualIO.unobserve(entry.target);
        playVisual(entry.target);
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(visuals, function (el) {
      var kind = visualKinds[el.getAttribute('data-visual')];
      if (!kind) return;
      // Fuera de pantalla: dejarlo armado para que no se vea el final antes de tiempo
      if (el.getBoundingClientRect().top > window.innerHeight) kind.arm(el);
      visualIO.observe(el);
      var host = el.closest('.pj-row, .case-figure') || el;
      var again = function () { if (el.getAttribute('data-played') === '1' && !el.hasAttribute('data-user')) playVisual(el); };
      host.addEventListener('mouseenter', again);
      host.addEventListener('focusin', function (e) { if (!e.target.closest('[data-pv-chart], [role="tablist"]')) again(); });
    });
  }

  /* Gráfico del mini dashboard: guía vertical y valor del mes con el cursor,
     el foco o las flechas del teclado (no depende del movimiento). */
  Array.prototype.forEach.call(document.querySelectorAll('[data-pv-chart]'), function (chart) {
    var values = JSON.parse(chart.getAttribute('data-values'));
    var months = JSON.parse(chart.getAttribute('data-months'));
    var xs = JSON.parse(chart.getAttribute('data-xs'));
    var ys = JSON.parse(chart.getAttribute('data-ys'));
    var guide = chart.querySelector('.pv-guide'), tip = chart.querySelector('.pv-tip');
    var current = xs.length - 1;
    var show = function (i) {
      current = i;
      var w = chart.clientWidth, h = chart.clientHeight;
      var x = xs[i] * w;
      guide.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      tip.querySelector('b').textContent = values[i];
      tip.querySelector('small').textContent = months[i];
      var tw = tip.offsetWidth;
      var left = Math.max(0, Math.min(w - tw, x - tw / 2));
      var top = Math.max(-8, ys[i] * h - tip.offsetHeight - 10);
      tip.style.transform = 'translate(' + left.toFixed(1) + 'px,' + top.toFixed(1) + 'px)';
      chart.classList.add('is-hover');
    };
    var hide = function () { chart.classList.remove('is-hover'); };
    chart.addEventListener('pointermove', function (e) {
      var r = chart.getBoundingClientRect(), ratio = (e.clientX - r.left) / r.width, best = 0;
      xs.forEach(function (x, i) { if (Math.abs(x - ratio) < Math.abs(xs[best] - ratio)) best = i; });
      show(best);
    });
    chart.addEventListener('pointerleave', function () { if (document.activeElement !== chart) hide(); });
    chart.addEventListener('focus', function () { show(current); });
    chart.addEventListener('blur', hide);
    chart.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        show(Math.max(0, Math.min(xs.length - 1, current + (e.key === 'ArrowRight' ? 1 : -1))));
      }
    });
  });

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
