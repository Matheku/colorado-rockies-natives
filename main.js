/* ============================================================
   TREELINE — motion
   Nothing here is required to read the page. Every element is
   visible by default; JS only adds motion on top.
   ============================================================ */
(function () {
  'use strict';

  // A browser-restored scroll position lands *after* ScrollTrigger has measured
  // and while Lenis still believes it sits at zero. Every trigger then resolves
  // against a phantom layout — starts come out ~14,000px negative and the
  // altimeter opens reading the valley floor. Own the landing position instead.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!window.location.hash) window.scrollTo(0, 0);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);
  function isNarrow() { return window.matchMedia('(max-width: 900px)').matches; }

  var TOP_FT = 14500;      // altimeter scale ceiling
  var BOTTOM_FT = 7500;    // altimeter scale floor
  var SPAN = TOP_FT - BOTTOM_FT;

  var elevEl = document.querySelector('[data-elev]');
  var zoneEl = document.querySelector('[data-zone]');
  var cursorEl = document.querySelector('[data-cursor]');
  var altEl = document.querySelector('.alt');
  var bandEls = document.querySelectorAll('.alt__legend span');
  var root = document.documentElement;
  var SUMMIT_FT = 14440;
  var DEFAULT_ACCENT =
    getComputedStyle(root).getPropertyValue('--accent').trim() || '#8E8ED4';

  /* ---------- altimeter readout (works with or without GSAP) ---------- */

  var shownFt = null;

  function zoneFor(ft) {
    if (ft >= 11500) return 'alpine';
    if (ft >= 9500) return 'subalpine';
    return 'montane';
  }

  function setElevation(ft) {
    ft = Math.max(BOTTOM_FT, Math.min(TOP_FT, ft));
    var rounded = Math.round(ft / 10) * 10;
    if (rounded === shownFt) return;
    shownFt = rounded;

    if (elevEl) elevEl.textContent = rounded.toLocaleString('en-US');
    if (cursorEl) cursorEl.style.top = ((TOP_FT - ft) / SPAN * 100).toFixed(2) + '%';

    var z = zoneFor(ft);
    if (zoneEl) zoneEl.textContent = z.charAt(0).toUpperCase() + z.slice(1);
    for (var i = 0; i < bandEls.length; i++) {
      bandEls[i].classList.toggle('is-on', bandEls[i].getAttribute('data-band') === z);
    }
  }

  setElevation(SUMMIT_FT);

  /* ---------- smooth scroll ---------- */

  var lenis = null;
  if (ok && !reduce && !coarse && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    window.gsap.ticker.lagSmoothing(0);
  }

  // anchor links, with or without Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  if (!ok) { if (altEl) altEl.classList.add('alt--on'); return; }

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  var EASE = 'expo.out';

  /* ---------- 1. page-load sequence ---------- */

  if (!reduce) {
    var intro = gsap.timeline({ defaults: { ease: EASE } });
    intro
      .from('.nav', { yPercent: -100, opacity: 0, duration: 0.7 })
      .from('[data-hero="1"]', { y: 14, opacity: 0, duration: 0.6 }, 0.1)
      .from('[data-hero="2"]', { yPercent: 108, duration: 0.95, stagger: 0.08 }, 0.16)
      .from('[data-hero="3"]', { y: 18, opacity: 0, duration: 0.7 }, 0.45)
      .from('[data-hero="4"]', { opacity: 0, duration: 0.6 }, 0.6)
      .from('.hero__rule', { scaleX: 0, duration: 0.8 }, 0.62)
      .from('.hero__img', { scale: 1.12, duration: 1.6, ease: 'power2.out' }, 0);
  }

  gsap.delayedCall(reduce ? 0 : 0.8, function () {
    if (altEl) altEl.classList.add('alt--on');
  });

  /* ---------- 2. hero departure ---------- */

  if (!reduce) {
    gsap.to('.hero__img', {
      scale: 1.14, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero__inner', {
      yPercent: 22, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true }
    });
  }

  /* ---------- 3. nav state ---------- */

  ST.create({
    trigger: '.hero',
    start: 'bottom 80px',
    onEnter: function () { document.querySelector('.nav').classList.add('nav--pinned'); },
    onLeaveBack: function () { document.querySelector('.nav').classList.remove('nav--pinned'); }
  });

  /* ---------- 4. reveals ---------- */

  gsap.utils.toArray('.reveal').forEach(function (el) {
    gsap.from(el, {
      y: reduce ? 0 : 22,
      opacity: 0,
      duration: reduce ? 0.3 : 0.75,
      ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 84%', once: true }
    });
  });

  gsap.utils.toArray('.zone').forEach(function (el, i) {
    gsap.from(el.querySelector('.zone__bar'), {
      scaleY: 0, transformOrigin: 'top', duration: 0.9, ease: EASE, delay: i * 0.08,
      scrollTrigger: { trigger: el, start: 'top 84%', once: true }
    });
  });

  gsap.from('.colorkey__swatches i', {
    scaleY: 0, opacity: 0, duration: 0.5, ease: EASE, stagger: 0.05,
    scrollTrigger: { trigger: '.colorkey', start: 'top 88%', once: true }
  });

  /* ---------- 5. species: altimeter scrub + parallax + accent ---------- */

  var descent = [];   // ordered high → low, one entry per species

  gsap.utils.toArray('.sp').forEach(function (sp) {
    var from = parseFloat(sp.getAttribute('data-from'));
    var to = parseFloat(sp.getAttribute('data-to'));
    var accent = (sp.getAttribute('style') || '').split('--accent:')[1];
    var img = sp.querySelector('.sp__media img');
    var body = sp.querySelector('.sp__body');

    // Elevation scrubs across the section's approach.
    //
    // The scroll guard is load-bearing. ScrollTrigger updates every trigger on
    // creation and on each refresh, including sections still far below the fold.
    // Without the guard they all write in DOM order, the last one wins, and the
    // altimeter opens at 8,900 ft instead of the summit.
    var elevST = ST.create({
      trigger: sp,
      start: 'top 92%',
      // re-resolved on every refresh, so it survives a resize across the breakpoint
      end: function () { return isNarrow() ? 'top 25%' : 'center 62%'; },
      invalidateOnRefresh: true,
      scrub: true,
      onUpdate: function (self) {
        if (self.scroll() < self.start) return;
        setElevation(from + (to - from) * self.progress);
      }
    });
    descent.push({ st: elevST, from: from, to: to, accent: accent });

    // The whole chrome takes this species' colour while it holds the screen.
    // Same scroll guard as the altimeter: a jump back to the summit updates every
    // trigger in one pass, and without it a section behind the viewport can repaint
    // after the reset below has already run.
    function paint(self) {
      if (!accent || self.scroll() < self.start) return;
      root.style.setProperty('--accent-live', accent.trim());
    }
    ST.create({
      trigger: sp,
      start: 'top 60%',
      end: 'bottom 45%',
      onEnter: paint,
      onEnterBack: paint
    });

    if (!reduce && img) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: sp, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    if (!reduce && body) {
      gsap.from(body.children, {
        y: 20, opacity: 0, duration: 0.7, ease: EASE, stagger: 0.06,
        scrollTrigger: { trigger: body, start: 'top 78%', once: true }
      });
    }
  });

  // Climbing back above the first species returns the chrome to the summit —
  // the per-section triggers stop writing once scroll is behind them.
  ST.create({
    trigger: '.species-set',
    start: 'top 92%',
    onLeaveBack: function () {
      setElevation(SUMMIT_FT);
      root.style.setProperty('--accent-live', DEFAULT_ACCENT);
    }
  });

  // Single authority for where the descent currently stands, derived from real
  // scroll position rather than from whichever trigger fired last. Needed because
  // a reload restores scroll *after* the triggers resolve, and a deep link lands
  // mid-page with no scroll event at all.
  function resyncDescent() {
    var ft = SUMMIT_FT;
    var accent = DEFAULT_ACCENT;
    for (var i = 0; i < descent.length; i++) {
      var d = descent[i];
      if (d.st.scroll() < d.st.start) break;
      ft = d.from + (d.to - d.from) * d.st.progress;
      if (d.accent && d.st.progress > 0.3) accent = d.accent.trim();
    }
    setElevation(ft);
    root.style.setProperty('--accent-live', accent);
  }

  ST.addEventListener('refresh', resyncDescent);
  resyncDescent();

  /* ---------- 6. horizontal range ---------- */

  var strip = document.querySelector('.strip');
  var track = document.querySelector('.strip__track');

  // Distance collapses to zero on narrow screens and under reduced motion, which
  // makes the pin inert without needing to tear it down. Both callbacks are
  // re-evaluated on every refresh, so resizing across the breakpoint is handled.
  // The narrow-screen fallback (native horizontal scroll) lives in CSS.
  function stripDistance() {
    if (reduce || isNarrow()) return 0;
    return Math.max(0, track.scrollWidth - window.innerWidth);
  }

  if (strip && track) {
    gsap.to(track, {
      x: function () { return -stripDistance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: strip,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        end: function () { return '+=' + stripDistance(); }
      }
    });
  }

  /* ---------- housekeeping ---------- */

  // Lenis drives ScrollTrigger while it is running, but a hash landing or a
  // restored scroll position moves the page without it. Keep a native listener
  // so triggers resolve either way.
  window.addEventListener('scroll', function () { ST.update(); }, { passive: true });

  // The browser jumps to a hash before the pin spacer, lazy images and webfont
  // reflow have settled, so a cold deep link lands well short of its section.
  // Re-seat it against the layout as it actually ends up.
  function reanchor() {
    var hash = window.location.hash;
    var target = hash && hash.length > 1 && document.querySelector(hash);
    if (!target) return;
    var y = target.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(y - window.scrollY) < 2) return;
    window.scrollTo(0, y);
    if (lenis) lenis.scrollTo(y, { immediate: true });
    ST.update();
  }

  // Layout keeps settling after load — the pin spacer resizes, lazy images
  // resolve, webfonts reflow — so one re-seat is not enough. Retry on a short
  // bounded schedule and stop as soon as the target is where it should be.
  function settleAnchor() {
    if (!window.location.hash) return;
    [0, 120, 350, 700, 1200].forEach(function (d) {
      gsap.delayedCall(d / 1000, reanchor);
    });
  }

  // late-loading images change layout height; re-measure once settled
  window.addEventListener('load', function () { ST.refresh(); settleAnchor(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ST.refresh(); settleAnchor(); });
  }
})();
