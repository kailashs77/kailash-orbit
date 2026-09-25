/* Scroll choreography (GSAP + ScrollTrigger). Only loaded when motion is allowed. */

const q = (sel, ctx = document) => ctx.querySelector(sel);
const qa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function initScenes({ header, orbit, intro: playIntro = true }) {
  const { gsap, ScrollTrigger } = window;

  if (playIntro) intro();
  bigBang();
  reveals();
  statement();
  rowPreview();
  resq();
  ipms();

  // Page entry: the planet settles, rings draw themselves, the name rises letter by letter.
  function intro() {
    const name = q('.hero-name .fit');
    name.innerHTML = [...name.textContent].map((ch) => `<span class="ch">${ch}</span>`).join('');
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .set('.hero-name', { opacity: 1 })
      .fromTo('.hero-name .ch', { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.055 }, 0.15)
      .fromTo('.planet', { opacity: 0, scale: 0.76 }, { opacity: 1, scale: 1, duration: 1.6 }, 0.1)
      .fromTo('.rings', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.45)
      .fromTo('.rings ellipse, .rings path', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2, ease: 'power3.inOut' }, 0.45)
      .fromTo('.bodies', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1)
      .fromTo(['.hero-copy > *', '.hero-foot > *', '.fig'], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.8)
      .fromTo('.head', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 1, clearProps: 'transform' }, 0.6);
  }

  // Scrolling out of the hero: the planet turns amber and swells until it becomes the next section.
  function bigBang() {
    const hero = q('.hero');
    const pin = q('.hero-pin');
    const bang = q('.bigbang');
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
      const fade = clamp01(p / 0.22);
      gsap.set(orbitLayer, { opacity: 1 - fade });
      core.style.opacity = clamp01((p - 0.04) / 0.2).toFixed(3);
      const t = clamp01((p - 0.22) / 0.78);
      const r = p < 0.22 ? 0 : R + (maxR - R) * t * t * t;
      bang.style.clipPath = `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
      const tf = clamp01((p - 0.3) / 0.5);
      gsap.set(texts, { opacity: 1 - tf, y: tf * 40 });
      header.override(r >= headR ? 'amber' : null);
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
    qa('.reveal-lines').forEach((el) => {
      gsap.fromTo(qa('.line > span', el), { yPercent: 110 }, {
        yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });
    qa('[data-reveal]').forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
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

  // A small preview card trails the cursor over the "in my orbit" rows.
  function rowPreview() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const card = q('.preview');
    const glyphs = qa('.pv', card);
    const xTo = gsap.quickTo(card, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(card, 'y', { duration: 0.6, ease: 'power3' });
    let shown = false;
    qa('.row-link').forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        glyphs.forEach((g, i) => g.classList.toggle('is-on', i === Number(row.dataset.preview)));
        if (!shown) gsap.set(card, { x: e.clientX + 170, y: e.clientY });
        shown = true;
        card.classList.add('is-on');
      });
      row.addEventListener('pointermove', (e) => { xTo(e.clientX + 170); yTo(e.clientY); });
      row.addEventListener('pointerleave', () => { card.classList.remove('is-on'); shown = false; });
    });
  }

  // RESQ: the corridor draws, then the ambulance runs it and signals turn green just ahead of it.
  function resq() {
    const visual = q('#resq-visual');
    const route = q('#resq-route');
    const amb = q('#amb');
    const sigs = qa('.sig', visual);
    const labels = qa('.ro-sig', visual);
    const state = q('#ro-state');
    const len = route.getTotalLength();
    const at = sigs.map((s) => nearestFraction(route, len, Number(s.getAttribute('cx')), Number(s.getAttribute('cy'))));
    const proxy = { p: 0 };

    const place = () => {
      const pt = route.getPointAtLength(proxy.p * len);
      amb.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      amb.classList.toggle('is-on', proxy.p > 0.001);
      sigs.forEach((s, i) => {
        const green = proxy.p >= at[i] - 0.07;
        s.classList.toggle('is-green', green);
        labels[i].classList.toggle('is-green', green);
        labels[i].textContent = green ? 'green' : 'red';
      });
      state.textContent = proxy.p <= 0.001 ? 'Dispatch · standby' : proxy.p >= 0.999 ? 'Arrived · hospital' : 'En route · RESQ corridor';
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

  // IPMS: scattered tables assemble into a schema, then the relations draw between them.
  function ipms() {
    const visual = q('#ipms-visual');
    const tables = qa('.tbl', visual);
    const rels = qa('.rels path', visual);
    const tl = gsap.timeline({ scrollTrigger: { trigger: visual, start: 'top 88%', end: 'center 55%', scrub: 0.8 } });
    tables.forEach((t) => {
      const [x, y] = t.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
      tl.fromTo(t,
        { x: x + Number(t.dataset.dx), y: y + Number(t.dataset.dy), rotation: Number(t.dataset.r), opacity: 0 },
        { x, y, rotation: 0, opacity: 1, duration: 0.6, ease: 'power2.out', transformOrigin: '50% 50%' }, 0);
    });
    tl.fromTo(rels, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.4, stagger: 0.1 }, 0.5);
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
