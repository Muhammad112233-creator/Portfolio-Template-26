/* ============================================================
   ADRIAN VOSS — Portfolio
   main.js — shared engine
   Preloader · Lenis smooth scroll · section theming ·
   menu overlay · page veil · slideshow · scroll reveals
   ============================================================ */

(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Motion-sensitive visitors get still frames, not moving pictures
  if (reduced) {
    document.addEventListener('DOMContentLoaded', () => {
      $$('video[autoplay]').forEach((v) => { v.pause(); v.removeAttribute('autoplay'); });
    });
  }

  gsap.registerPlugin(ScrollTrigger);

  // JS is running: opt into the animated defaults (the bare
  // .no-js markup keeps content visible for non-JS visitors)
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  /* ----------------------------------------------------------
     Smooth scroll (Lenis) tied into GSAP's ticker
  ---------------------------------------------------------- */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  window.__lenis = lenis;

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  lenis.stop(); // released by the preloader

  /* ----------------------------------------------------------
     Preloader — waits for real assets, then hands over
  ---------------------------------------------------------- */
  const preloader = $('#preloader');
  let ready = false;

  function finishLoad() {
    if (ready) return;
    ready = true;

    preloader.style.opacity = '0';
    document.body.classList.add('is-ready');
    document.body.classList.remove('noscroll');

    setTimeout(() => {
      preloader.remove();
      lenis.start();
      ScrollTrigger.refresh();
      document.dispatchEvent(new CustomEvent('av:ready'));
    }, 650);
  }

  window.addEventListener('load', finishLoad);
  setTimeout(finishLoad, 4500);            // failsafe, never trap the user
  document.body.classList.add('noscroll');

  /* ----------------------------------------------------------
     Theme swap — sections declare data-bg="light|dark";
     body class drives cursor art + fixed logo colour
  ---------------------------------------------------------- */
  const themed = $$('[data-bg]');
  themed.forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (!self.isActive) return;
        const dark = sec.dataset.bg === 'dark';
        document.body.classList.toggle('theme-dark', dark);
        document.body.classList.toggle('theme-light', !dark);
      },
    });
  });

  /* ----------------------------------------------------------
     Menu overlay
  ---------------------------------------------------------- */
  const overlay = $('#menu-overlay');
  const toggle = $('#menu-toggle');
  let menuOpen = false;

  const menuTl = gsap.timeline({ paused: true })
    .set(overlay, { visibility: 'visible' })
    .to(overlay, { y: 0, duration: .9, ease: 'expo.inOut' }, 0)
    .fromTo('.menu-item',
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: .8, ease: 'expo.out', stagger: .08 }, .35)
    .fromTo('#menu-overlay .corner',
      { opacity: 0 },
      { opacity: 1, duration: .5, stagger: .06 }, .55);

  // Off-screen must also mean unfocusable
  menuTl.eventCallback('onReverseComplete', () => {
    gsap.set(overlay, { visibility: 'hidden' });
  });

  gsap.set(overlay, { y: '-102%' });

  function setMenu(open) {
    menuOpen = open;
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));

    if (open) {
      lenis.stop();
      overlay.classList.add('is-open');
      menuTl.timeScale(1).play();
    } else {
      menuTl.timeScale(1.4).reverse();
      lenis.start();
    }
  }

  toggle.addEventListener('click', () => setMenu(!menuOpen));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) setMenu(false);
  });

  /* ----------------------------------------------------------
     Page veil — internal navigation with a soft wipe
  ---------------------------------------------------------- */
  const veil = $('#page-veil');

  function veilTo(url) {
    if (veil.dataset.busy) return;
    veil.dataset.busy = '1';
    veil.classList.add('is-active');

    gsap.timeline()
      .set(veil, { transformOrigin: 'bottom', scaleY: 0 })
      .to(veil, { scaleY: 1, duration: .6, ease: 'expo.inOut' })
      .add(() => { window.location.href = url; });
  }

  // Intercept internal links
  $$('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || a.target === '_blank' || a.dataset.noVeil !== undefined) return;

    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (menuOpen) { setMenu(false); setTimeout(() => veilTo(href), 560); }
      else veilTo(href);
    });
  });

  // Arrival wipe plays right after the preloader hands over,
  // so navigation reads as one continuous motion
  function revealIn() {
    if (!document.body.contains(veil)) return;
    gsap.timeline()
      .set(veil, { transformOrigin: 'top', scaleY: 1 })
      .to(veil, { scaleY: 0, duration: .7, ease: 'expo.inOut', delay: .1 })
      .set(veil, { clearProps: 'all' })
      .add(() => delete veil.dataset.busy);
  }

  document.addEventListener('av:ready', revealIn, { once: true });

  // Restore cleanly from the bfcache (back/forward buttons)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(veil, { clearProps: 'all' });
      delete veil.dataset.busy;
      if (menuOpen) setMenu(false);
      lenis.start();
    }
  });

  /* ----------------------------------------------------------
     Slideshow — any [data-slideshow] cross-fades its frames
  ---------------------------------------------------------- */
  $$('[data-slideshow]').forEach((box) => {
    const frames = $$('img', box);
    if (frames.length < 2 || reduced) { frames[0] && frames[0].classList.add('is-live'); return; }

    const interval = parseInt(box.dataset.slideshow, 10) || 4000;
    let i = 0;
    frames[0].classList.add('is-live');

    setInterval(() => {
      frames[i].classList.remove('is-live');
      i = (i + 1) % frames.length;
      frames[i].classList.add('is-live');
    }, interval);
  });

  /* ----------------------------------------------------------
     Line-mask headlines: .mask-line > span rises into place
  ---------------------------------------------------------- */
  function maskedIn(scope, opts = {}) {
    const rows = $$('.mask-line > span', scope);
    if (!rows.length) return gsap.timeline();

    gsap.set(rows, { yPercent: 115 });
    return gsap.timeline(opts)
      .to(rows, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: .09 });
  }

  // Hero intro plays right after the preloader
  document.addEventListener('av:ready', () => {
    const hero = $('.hero');
    if (!hero) return;

    maskedIn(hero);
    gsap.from('.hero-note, .scroll-hint', {
      opacity: 0, y: 14, duration: .9, ease: 'power2.out', delay: .5, stagger: .1,
    });
    // The slideshow handles its own slow zoom via CSS classes;
    // touching transforms here would fight its transitions.
  });

  // Other masked headlines animate when scrolled to
  $$('main [data-mask]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => maskedIn(el),
    });
  });

  /* ----------------------------------------------------------
     Generic reveals
  ---------------------------------------------------------- */
  $$('[data-reveal]').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0,
        duration: 1, ease: 'power3.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
  });

  /* ----------------------------------------------------------
     Parallax backdrops: [data-parallax] drifts against scroll
  ---------------------------------------------------------- */
  $$('[data-parallax]').forEach((bg) => {
    gsap.fromTo(bg, { yPercent: -8 }, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: bg.closest('.slide, .sheet, section') || bg,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  /* ----------------------------------------------------------
     Slow zoom-out on imagery: [data-settle]
  ---------------------------------------------------------- */
  $$('[data-settle]').forEach((img) => {
    gsap.fromTo(img, { scale: 1.14 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: img.closest('figure, .fleet, .frame') || img,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  /* ----------------------------------------------------------
     Skill tree — branches draw themselves while scrolling
  ---------------------------------------------------------- */
  const tree = $('.skilltree svg');
  if (tree) {
    const branches = $$('.branch', tree);
    branches.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });

    gsap.to(branches, {
      strokeDashoffset: 0,
      ease: 'none',
      stagger: .12,
      scrollTrigger: {
        trigger: '.skilltree',
        start: 'top 80%',
        end: 'bottom 45%',
        scrub: true,
      },
    });

    $$('.node, .leaf-label', tree).forEach((n, idx) => {
      gsap.from(n, {
        opacity: 0, scale: .4, transformOrigin: 'center',
        duration: .7, ease: 'back.out(2)',
        scrollTrigger: { trigger: '.skilltree', start: `top ${78 - idx * 6}%`, once: true },
      });
    });
  }

  /* ----------------------------------------------------------
     Client rows cascade in
  ---------------------------------------------------------- */
  const clientCols = $$('.clients');
  if (clientCols.length) {
    $$('.client').forEach((row, i) => {
      gsap.from(row, {
        opacity: 0, y: 26,
        duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 92%', once: true },
      });
    });
  }

  /* ----------------------------------------------------------
     Footer headline: rows rise as the footer enters
  ---------------------------------------------------------- */
  const fTitle = $('.footer-title');
  if (fTitle) {
    ScrollTrigger.create({
      trigger: fTitle,
      start: 'top 85%',
      once: true,
      onEnter: () => maskedIn($('.footer')),
    });
  }
})();
