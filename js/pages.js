/* ============================================================
   pages.js — animations for the inner pages (works/games/sound)
   Loaded after main.js; everything here degrades gracefully.
   ============================================================ */

(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ----------------------------------------------------------
     Grand intro headline + page meta
  ---------------------------------------------------------- */
  document.addEventListener('av:ready', () => {
    const title = $('.page-title');
    if (title) {
      const rows = title.querySelectorAll('.mask-line > span');
      gsap.set(rows, { yPercent: 115 });
      gsap.to(rows, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: .09 });
    }

    const bg = $('.grandintro .bg-fill img, .grandintro .bg-fill video');
    if (bg) gsap.from(bg, { scale: 1.12, duration: 2.4, ease: 'power2.out' });

    const meta = $('.page-meta');
    if (meta) {
      gsap.fromTo(meta, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: meta, start: 'top 88%', once: true },
      });
    }
  });

  /* ----------------------------------------------------------
     Discipline strip — words roll up, dots pop
  ---------------------------------------------------------- */
  const strip = $('.discipline-strip');
  if (strip) {
    const words = strip.querySelectorAll('.word > span');
    gsap.set(words, { yPercent: 110 });

    ScrollTrigger.create({
      trigger: strip,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(words, { yPercent: 0, duration: .9, ease: 'expo.out', stagger: .07 });
        gsap.from(strip.querySelectorAll('.dot'), {
          scale: 0, duration: .5, ease: 'back.out(3)', stagger: .07, delay: .3,
        });
      },
    });
  }

  /* ----------------------------------------------------------
     Art grid — diagonal paper wipe reveals each piece
  ---------------------------------------------------------- */
  $$('.piece').forEach((piece) => {
    const veil = piece.querySelector('.veil');
    const img = piece.querySelector('img');

    if (veil) {
      gsap.to(veil, {
        xPercent: 100,
        yPercent: -100,
        duration: 1.1,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: piece, start: 'top 82%', once: true },
      });
    }

    if (img) {
      // GSAP owns the transform: scroll settle + hover zoom,
      // so no CSS transition is allowed on this element.
      gsap.fromTo(img, { scale: 1.18 }, {
        scale: 1.1,
        ease: 'none',
        scrollTrigger: { trigger: piece, start: 'top bottom', end: 'bottom top', scrub: true },
      });

      piece.addEventListener('mouseenter', () =>
        gsap.to(img, { scale: 1.04, duration: .7, ease: 'power2.out' }));
      piece.addEventListener('mouseleave', () =>
        gsap.to(img, { scale: 1.1, duration: .9, ease: 'power2.out' }));
    }
  });

  /* ----------------------------------------------------------
     Showcase rows — info slides in, image settles
  ---------------------------------------------------------- */
  $$('.row-item').forEach((row) => {
    const info = row.querySelectorAll('.kicker, h3, p, .link');
    const img = row.querySelector('.media img');

    gsap.from(info, {
      opacity: 0, y: 30, duration: .9, ease: 'power3.out', stagger: .08,
      scrollTrigger: { trigger: row, start: 'top 78%', once: true },
    });

    if (img) {
      gsap.fromTo(img, { scale: 1.2 }, {
        scale: 1.12,
        ease: 'none',
        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });

  /* ----------------------------------------------------------
     Track list — single "player": tap to arm the equalizer
     (No audio ships with the template; drop your own files in
     /audio and bind them here. The animation is the demo.)
  ---------------------------------------------------------- */
  const tracks = $$('.track');
  tracks.forEach((t) => {
    const play = () => {
      const wasPlaying = t.classList.contains('is-playing');
      tracks.forEach((o) => o.classList.remove('is-playing'));
      if (!wasPlaying) t.classList.add('is-playing');
    };
    t.addEventListener('click', play);
    t.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  });
})();
