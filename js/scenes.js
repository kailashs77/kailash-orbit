/* Page entry and scroll choreography (GSAP + ScrollTrigger). Only runs when motion is allowed. */
import { EASE, splitChars, prepScramble, scramble } from './motion.js';

const q = (sel, ctx = document) => ctx.querySelector(sel);
const qa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function initScenes({ header, orbit, intro: withIntro = true }) {
  const { gsap, ScrollTrigger } = window;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const entry = withIntro ? intro() : { chars: [], play() {} };
  bigBang(entry.chars);
  reveals();
  lines();
  lifts();
  statement();
  if (fine) rowPreview();
  resq();
  ipms();
  return { play: entry.play };

  // Page entry, built paused and played once fonts and the portrait are ready:
  // the planet opens like an iris, rings draw, orbits spin out, the name rises letter by letter.
  function intro() {
    const name = q('.hero-name .fit');
    splitChars(name, 'ch');
    const chars = qa('.ch', name);
    const spin = { spread: 0.55, boost: 5 };
    orbit.tune(spin);
    const masks = qa('.hero-copy > *, .hero-foot > *, .fig');

    const tl = gsap.timeline({ paused: true, defaults: { ease: EASE } })
      .set(['.hero-name', '.planet', '.rings'], { opacity: 1 })
      .fromTo('.planet', { clipPath: 'circle(0% at 50% 50%)', scale: 1.08 }, { clipPath: 'circle(75% at 50% 50%)', scale: 1, duration: 2, clearProps: 'clipPath' }, 0.1)
      .fromTo('.rings ellipse, .rings path', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power3.inOut' }, 0.35)
      .to(spin, { spread: 1, boost: 1, duration: 2.6, onUpdate: () => orbit.tune(spin) }, 0.35)
      .fromTo('.bodies', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.7)
      .fromTo(chars, { yPercent: 118, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.05, transformOrigin: '0% 100%' }, 0.2)
      .fromTo(masks, { opacity: 1, clipPath: 'inset(0% 0% 100% 0%)', y: 14 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.1, stagger: 0.07, clearProps: 'clipPath' }, 0.75)
      .fromTo('.head', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.5)
      .fromTo(['.mark', '.head-nav a', '.head-cta', '.menu-btn'], { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 1, stagger: 0.05, clearProps: 'transform' }, 0.55);
    return { chars, play: () => tl.play() };
  }

  // Leaving the hero: the planet turns amber and swells until it becomes the next section,
  // with a thin shock ring running just ahead of it and the name exhaling outward.
  function bigBang(chars) {
    const hero = q('.hero');
    const pin = q('.hero-pin');
    const bang = q('.bigbang');
    const ring = q('.bigbang-ring');
    const planet = q('#planet');
    const core = q('.planet-core');
    const orbitLayer = qa('.rings, .bodies, .fig');
    const texts = qa('.hero-copy, .hero-name, .hero-foot');
    let cx = 0; let cy = 0; let R = 0; let maxR = 0; let headR = 0;

    const measure = () => {
      const hr = pin.getBoundingClientRect();
      const pr = planet.getBoundingClientRect();
      R = planet.offsetWidth / 2;
      cx = pr.left + pr.width / 2 - hr.left;
      cy = pr.top + pr.height / 2 - hr.top;
      maxR = Math.hypot(Math.max(cx, hr.width - cx), Math.max(cy, hr.height - cy)) + 4;
      headR = Math.hypot(hr.width * 0.36, cy); // radius at which the circle has swallowed the nav
    };
    const draw = (p) => {
      gsap.set(orbitLayer, { opacity: 1 - clamp01(p / 0.22) });
      core.style.opacity = clamp01((p - 0.04) / 0.2).toFixed(3);
      const t = clamp01((p - 0.22) / 0.78);
      const r = p < 0.22 ? 0 : R + (maxR - R) * t * t * t;
      bang.style.clipPath = `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
      if (r > 0 && t < 1) {
        const rr = r + 22 + 46 * t;
        ring.style.width = `${(rr * 2).toFixed(1)}px`;
        ring.style.height = `${(rr * 2).toFixed(1)}px`;
        ring.style.transform = `translate(${(cx - rr).toFixed(1)}px, ${(cy - rr).toFixed(1)}px)`;
        ring.style.opacity = ((1 - t) * 0.75).toFixed(3);
      } else {
        ring.style.opacity = '0';
      }
      const tf = clamp01((p - 0.3) / 0.5);
      gsap.set(texts, { opacity: 1 - tf, y: tf * 40 });
      if (chars.length) {
        const s = clamp01(p / 0.5);
        const mid = (chars.length - 1) / 2;
        chars.forEach((c, i) => gsap.set(c, { x: (i - mid) * s * 14 }));
      }
      const covered = r >= headR;
      header.override(covered ? 'amber' : null);
      hero.dataset.theme = covered ? 'amber' : 'light';
      orbit.pause(p > 0.3);
    };

    measure();
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: '+=100%',
      pin: true,
      anticipatePin: 1,
      onRefresh: (self) => { measure(); draw(self.progress); },
      onUpdate: (self) => draw(self.progress),
    });
  }

  function reveals() {
    // headlines rise line by line out of their masks, settling from a slight tilt
    qa('.reveal-lines').forEach((el) => {
      gsap.fromTo(qa('.line > span', el), { yPercent: 118, rotate: 3 }, {
        yPercent: 0, rotate: 0, duration: 1.3, ease: EASE, stagger: 0.09, transformOrigin: '0% 100%',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });
    // text blocks fade up
    qa('[data-reveal]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 36 }, {
        opacity: 1, y: 0, duration: 1.2, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
    // media opens out of a smaller rounded window while its contents settle
    qa('[data-reveal-media]').forEach((el) => {
      const radius = getComputedStyle(el).borderTopLeftRadius;
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
        .fromTo(el, { clipPath: `inset(12% 8% 12% 8% round ${radius})` }, { clipPath: `inset(0% 0% 0% 0% round ${radius})`, duration: 1.4, ease: EASE, clearProps: 'clipPath' })
        .fromTo(q('svg', el), { scale: 1.12 }, { scale: 1, duration: 1.8, ease: EASE }, 0);
    });
    // section labels decode like telemetry as they arrive
    qa('[data-scramble]').forEach((el) => {
      const target = prepScramble(el);
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => scramble(target.el, target.text, 800) });
    });
  }

  // Divider lines draw themselves from the left (dotted leaders in the learning list inherit the same progress).
  function lines() {
    qa('.rows, .plinks, .learn').forEach((list) => {
      const targets = [list, ...list.children];
      gsap.set(targets, { '--draw': 0 });
      ScrollTrigger.create({
        trigger: list, start: 'top 88%', once: true,
        onEnter: () => gsap.to(targets, { '--draw': 1, duration: 1.4, ease: EASE, stagger: 0.08 }),
      });
    });
  }

  // The bone and final dark sections rise like cards: narrower, rounder, then flush as they arrive.
  function lifts() {
    const lift = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lift')) || 44;
    qa('.more, .contact').forEach((section) => {
      gsap.fromTo(section,
        { '--inset': () => `${Math.round(window.innerWidth * 0.04)}px`, '--radius': () => `${lift() * 2}px` },
        { '--inset': '0px', '--radius': () => `${lift()}px`, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 25%', scrub: true, invalidateOnRefresh: true } });
    });
  }

  // The about statement lights up word by word as it is read.
  function statement() {
    const el = q('#statement');
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.16 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
    });
  }

  // A small preview card trails the cursor over the "in my orbit" rows, leaning into the direction of travel.
  function rowPreview() {
    const card = q('.preview');
    const glyphs = qa('.pv', card);
    const xTo = gsap.quickTo(card, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(card, 'y', { duration: 0.6, ease: 'power3' });
    const rTo = gsap.quickTo(card, 'rotation', { duration: 0.8, ease: 'power3' });
    let shown = false;
    let lastX = 0;
    let settle = 0;
    qa('.row-link').forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        glyphs.forEach((g, i) => g.classList.toggle('is-on', i === Number(row.dataset.preview)));
        if (!shown) gsap.set(card, { x: e.clientX + 170, y: e.clientY, rotation: 0 });
        shown = true;
        lastX = e.clientX;
        card.classList.add('is-on');
      });
      row.addEventListener('pointermove', (e) => {
        xTo(e.clientX + 170);
        yTo(e.clientY);
        rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
        clearTimeout(settle);
        settle = setTimeout(() => rTo(0), 90);
      });
      row.addEventListener('pointerleave', () => { card.classList.remove('is-on'); shown = false; });
    });
  }

  // RESQ: the corridor draws, then the ambulance runs it trailing light; each signal flips green
  // just ahead of it with a pulse, and the hospital answers when it arrives.
  function resq() {
    const visual = q('#resq-visual');
    const route = q('#resq-route');
    const trail = q('#resq-trail');
    const amb = q('#amb');
    const sigs = qa('.sig', visual);
    const rings = qa('.sig-ring', visual);
    const arrive = q('.arrive-ring', visual);
    const labels = qa('.ro-sig', visual);
    const stateEl = q('#ro-state');
    const len = route.getTotalLength();
    const at = sigs.map((s) => nearestFraction(route, len, Number(s.getAttribute('cx')), Number(s.getAttribute('cy'))));
    const proxy = { p: 0 };
    let lastState = '';

    const pulse = (el) => {
      el.classList.remove('is-on');
      void el.getBoundingClientRect(); // restart the CSS animation
      el.classList.add('is-on');
    };
    const place = () => {
      const p = proxy.p;
      const pt = route.getPointAtLength(p * len);
      amb.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      amb.classList.toggle('is-on', p > 0.001);
      const tail = Math.min(p, 0.1);
      trail.style.strokeDasharray = `${tail.toFixed(4)} 1`;
      trail.style.strokeDashoffset = `${(-(p - tail)).toFixed(4)}`;
      sigs.forEach((s, i) => {
        const green = p >= at[i] - 0.07;
        if (green === s.classList.contains('is-green')) return;
        s.classList.toggle('is-green', green);
        labels[i].classList.toggle('is-green', green);
        labels[i].textContent = green ? 'green' : 'red';
        if (green) pulse(rings[i]); else rings[i].classList.remove('is-on');
      });
      const state = p <= 0.001 ? 'Dispatch · standby' : p >= 0.999 ? 'Arrived · hospital' : 'En route · RESQ corridor';
      if (state !== lastState) {
        lastState = state;
        scramble(stateEl, state, 520);
        if (p >= 0.999) pulse(arrive); else arrive.classList.remove('is-on');
      }
    };
    const build = (vars) => gsap.timeline(vars)
      .fromTo(route, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut' })
      .fromTo(proxy, { p: 0 }, { p: 1, duration: 0.7, ease: 'power1.inOut', onUpdate: place }, 0.28);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 1101px)', () => {
      build({ scrollTrigger: { trigger: '#resq', start: 'center center', end: '+=120%', pin: true, scrub: 0.6, anticipatePin: 1 } });
      place();
    });
    mm.add('(max-width: 1100px)', () => {
      const tl = build({ paused: true });
      place();
      ScrollTrigger.create({ trigger: visual, start: 'top 70%', once: true, onEnter: () => tl.timeScale(1 / 3.4).play() });
    });
  }

  // IPMS: scattered tables assemble into a schema, their rows fill in, then the relations draw.
  function ipms() {
    const visual = q('#ipms-visual');
    const tables = qa('.tbl', visual);
    const bars = qa('.tbl-row, .tbl-key', visual);
    const rels = qa('.rels path', visual);
    const tl = gsap.timeline({ scrollTrigger: { trigger: visual, start: 'top 88%', end: 'center 55%', scrub: 0.8 } });
    tables.forEach((t) => {
      const [x, y] = t.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
      tl.fromTo(t,
        { x: x + Number(t.dataset.dx), y: y + Number(t.dataset.dy), rotation: Number(t.dataset.r), opacity: 0 },
        { x, y, rotation: 0, opacity: 1, duration: 0.6, ease: 'power2.out', transformOrigin: '50% 50%' }, 0);
    });
    tl.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: 0.35, stagger: 0.015, ease: 'power2.out', transformOrigin: '0% 50%' }, 0.42)
      .fromTo(rels, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.1 }, 0.55);
  }
}

function splitWords(el) {
  const words = [];
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const w = document.createElement('span');
        w.className = 'w';
        w.textContent = part;
        frag.appendChild(w);
        words.push(w);
      });
      el.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      words.push(...splitWords(node));
    }
  });
  return words;
}

function nearestFraction(path, len, x, y) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= 400; i++) {
    const pt = path.getPointAtLength((i / 400) * len);
    const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
    if (d < bestD) { bestD = d; best = i / 400; }
  }
  return best;
}
