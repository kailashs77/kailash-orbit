/* The hero's orbital system: the portrait is the planet, and what I'm doing right now circles it.
   Bodies pass behind the planet on the far half of each orbit and in front on the near half. */

// On narrow (portrait) screens the orbits stand up taller to use the extra height.
const ORBITS = [
  { k: 1.42, narrow: 1.22, ratio: 0.34, narrowRatio: 0.7, speed: 0.3 },
  { k: 1.98, narrow: 1.42, ratio: 0.3, narrowRatio: 0.6, speed: 0.21 },
  { k: 2.6, narrow: 1.62, ratio: 0.26, narrowRatio: 0.52, speed: 0.15 },
];
const SVG_NS = 'http://www.w3.org/2000/svg';
const TILT = -14;
const NARROW_TILT = -20;

export function initOrbit({ reduce, fine }) {
  const stage = document.getElementById('stage');
  const planet = document.getElementById('planet');
  const img = planet.querySelector('img');
  const back = stage.querySelector('.rings--back');
  const front = stage.querySelector('.rings--front');
  const make = (svg, tag) => {
    const el = svg.appendChild(document.createElementNS(SVG_NS, tag));
    el.setAttribute('pathLength', '1'); // lets the intro draw the rings in
    return el;
  };
  const backEls = ORBITS.map(() => make(back, 'ellipse'));
  const frontEls = ORBITS.map(() => make(front, 'path'));
  const bodies = [...stage.querySelectorAll('.body')].map((el) => ({
    el,
    orb: el.querySelector('.orb'),
    orbit: Number(el.dataset.orbit),
    theta: Number(el.dataset.phase),
    side: '',
    back: null,
  }));

  let cx = 0; let cy = 0; let radii = [];
  let baseTilt = TILT;
  let tilt = TILT; let tiltTarget = TILT;
  let squash = 1; let squashTarget = 1;
  let speed = 1; let speedTarget = 1;
  let spread = 1; let boost = 1; // driven by the intro: orbits spin out from the planet
  let ix = 0; let iy = 0; let ixTarget = 0; let iyTarget = 0;
  let running = false; let visible = true; let paused = false; let last = 0;

  function measure() {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    cx = W / 2;
    cy = H / 2;
    const R = planet.offsetWidth / 2;
    const narrow = W < 640;
    const want = ORBITS.map((o) => R * (narrow ? o.narrow : o.k));
    // Keep the outer orbit on screen; squeeze the middle one between the other two.
    const maxA = W / 2 - (narrow ? 10 : 36);
    if (want[2] > maxA) {
      want[0] = Math.min(want[0], R * 1.2);
      want[2] = Math.max(maxA, want[0] + 30);
      want[1] = (want[0] + want[2]) / 2;
    }
    radii = want.map((a, i) => ({ a, b: a * (narrow ? ORBITS[i].narrowRatio : ORBITS[i].ratio) }));
    baseTilt = narrow ? NARROW_TILT : TILT;
    if (!fine) tiltTarget = baseTilt;
    back.setAttribute('viewBox', `0 0 ${W} ${H}`);
    front.setAttribute('viewBox', `0 0 ${W} ${H}`);
    render(0);
  }

  function render(dt) {
    tilt += (tiltTarget - tilt) * 0.06;
    squash += (squashTarget - squash) * 0.06;
    speed += (speedTarget - speed) * 0.08;
    const rad = (tilt * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);

    radii.forEach((r, i) => {
      const a = r.a * spread;
      const b = r.b * squash * spread;
      const e = backEls[i];
      e.setAttribute('cx', cx);
      e.setAttribute('cy', cy);
      e.setAttribute('rx', a);
      e.setAttribute('ry', b);
      e.setAttribute('transform', `rotate(${tilt.toFixed(3)} ${cx} ${cy})`);
      // the near half of the ring, drawn above the planet
      frontEls[i].setAttribute('d', `M${cx + a * c} ${cy + a * s} A${a} ${b} ${tilt.toFixed(3)} 0 1 ${cx - a * c} ${cy - a * s}`);
    });

    for (const o of bodies) {
      const r = radii[o.orbit];
      if (!r) continue;
      o.theta += ORBITS[o.orbit].speed * dt * speed * boost;
      const a = r.a * spread;
      const lx = a * Math.cos(o.theta);
      const ly = r.b * squash * spread * Math.sin(o.theta);
      const x = cx + lx * c - ly * s;
      const y = cy + lx * s + ly * c;
      const depth = Math.sin(o.theta); // -1 far side … 1 near side
      o.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      o.orb.style.transform = `scale(${(0.78 + 0.11 * (depth + 1)).toFixed(3)})`;
      const isBack = depth < 0;
      if (isBack !== o.back) {
        o.back = isBack;
        o.el.style.zIndex = isBack ? 1 : 4;
        o.el.classList.toggle('is-back', isBack);
      }
      // labels sit on the outer side of each body, with a dead zone so they don't flicker
      const rel = x - cx;
      const side = rel > a * 0.2 ? 'l' : rel < -a * 0.2 ? 'r' : o.side || (rel > 0 ? 'l' : 'r');
      if (side !== o.side) { o.side = side; o.el.dataset.side = side; }
    }

    ix += (ixTarget - ix) * 0.06;
    iy += (iyTarget - iy) * 0.06;
    img.style.setProperty('--ix', `${ix.toFixed(2)}px`);
    img.style.setProperty('--iy', `${iy.toFixed(2)}px`);
  }

  function frame(t) {
    if (!running) return;
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    render(dt);
    requestAnimationFrame(frame);
  }
  const start = () => {
    if (running || reduce || paused || !visible || document.hidden) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  };
  const stop = () => { running = false; };

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  if (fine && !reduce) {
    addEventListener('pointermove', (e) => {
      if (!running) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tiltTarget = baseTilt + nx * 8;
      squashTarget = 1 + ny * 0.5;
      ixTarget = -nx * 16;
      iyTarget = -ny * 16;
    }, { passive: true });
  }

  // Hovering or focusing a body lights its orbit and slows the system so it can be read and clicked.
  const light = (index) => {
    [back, front].forEach((svg) => svg.classList.toggle('has-lit', index !== null));
    backEls.forEach((e, k) => e.classList.toggle('is-lit', k === index));
    frontEls.forEach((e, k) => e.classList.toggle('is-lit', k === index));
  };
  for (const o of bodies) {
    o.el.addEventListener('pointerenter', () => { speedTarget = 0.05; light(o.orbit); });
    o.el.addEventListener('pointerleave', () => { speedTarget = 1; light(null); });
    o.el.addEventListener('focus', () => { speedTarget = 0; speed = 0; light(o.orbit); });
    o.el.addEventListener('blur', () => { speedTarget = 1; light(null); });
  }

  measure();
  start();

  return {
    measure,
    pause(value) {
      if (value === paused) return;
      paused = value;
      paused ? stop() : start();
    },
    tune(values) {
      if ('spread' in values) spread = values.spread;
      if ('boost' in values) boost = values.boost;
      if (!running) render(0);
    },
  };
}
