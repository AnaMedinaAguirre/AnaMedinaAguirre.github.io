/* Portafolio — Ana Patricia Medina Aguirre
   JavaScript sin dependencias: tema, menú, scroll-spy, conector del proceso,
   apariciones al hacer scroll, filtros, copiar email y "volver arriba". */
(function () {
  'use strict';

  var root = document.documentElement;
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
      themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
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
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
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
          ? 'Mostrando todas las áreas'
          : 'Mostrando ' + btn.textContent.trim();
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
        if (label) label.textContent = 'Email copiado';
        if (copyStatus) copyStatus.textContent = 'Email copiado al portapapeles';
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

  /* Skip link: mover el foco al contenido principal */
  var skip = document.querySelector('.skip-link');
  var main = document.getElementById('contenido');
  if (skip && main) {
    skip.addEventListener('click', function () {
      window.setTimeout(function () { main.focus({ preventScroll: true }); }, 0);
    });
  }
})();
