/* "Let's talk." — click and the letters drop under real physics (Matter.js, loaded on demand).
   Before the drop they lean away from a nearby cursor, hinting that they can move.
   With a mouse they can be dragged and thrown; "Put it back" reassembles the word. */

const MATTER_SRC = 'vendor/matter.min.js'; // resolved against the page URL; see vendor/README.md
const STEP = 1000 / 60;
const IDLE_LABEL = 'Click to drop ↓';

export function initGravity({ reduce, fine }) {
  const stage = document.getElementById('grav-stage');
  const btn = document.getElementById('drop-btn');
  if (!stage || !btn) return;
  const btnLabel = btn.querySelector('.btn-label') || btn;
  if (reduce) {
    btn.hidden = true;
    stage.removeAttribute('data-cursor');
    return;
  }

  const letters = [...stage.querySelectorAll('.gl')];
  let mode = 'idle'; // idle → loading → live → restoring → idle
  let engine = null;
  let bodies = [];
  let mouse = null;
  let raf = 0;
  let acc = 0;
  let lastT = 0;
  let inView = true;

  const setLabel = (text) => { btnLabel.textContent = text; };
  const load = () => (window.Matter ? Promise.resolve() : new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = MATTER_SRC;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  }));

  // ---- lean: letters near the pointer lift and tilt away from it, springing back when it leaves
  const lean = letters.map(() => ({ y: 0, r: 0 }));
  let px = 0;
  let py = 0;
  let near = false;
  let leanRaf = 0;
  const leanFrame = () => {
    leanRaf = 0;
    if (mode !== 'idle') return;
    const reach = stage.offsetHeight * 0.55;
    let moving = false;
    letters.forEach((el, i) => {
      const cx = el.offsetLeft + el.offsetWidth / 2; // layout position, unaffected by transforms
      const cy = el.offsetTop + el.offsetHeight / 2;
      const dx = px - cx;
      const f = near ? Math.max(0, 1 - Math.hypot(dx, py - cy) / reach) : 0;
      const ty = -f * f * 18;
      const tr = f * f * (dx > 0 ? -4 : 4);
      const o = lean[i];
      o.y += (ty - o.y) * 0.16;
      o.r += (tr - o.r) * 0.16;
      el.style.transform = Math.abs(o.y) < 0.01 && Math.abs(o.r) < 0.01 ? '' : `translate3d(0, ${o.y.toFixed(2)}px, 0) rotate(${o.r.toFixed(2)}deg)`;
      if (Math.abs(ty - o.y) > 0.05 || Math.abs(tr - o.r) > 0.02) moving = true;
    });
    if (moving || near) leanRaf = requestAnimationFrame(leanFrame);
  };
  const resetLean = () => {
    cancelAnimationFrame(leanRaf);
    leanRaf = 0;
    lean.forEach((o) => { o.y = 0; o.r = 0; });
    letters.forEach((el) => { el.style.transform = ''; });
  };
  if (fine) {
    stage.addEventListener('pointermove', (e) => {
      if (mode !== 'idle' || e.pointerType !== 'mouse') return;
      const r = stage.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
      near = true;
      if (!leanRaf) leanRaf = requestAnimationFrame(leanFrame);
    });
    stage.addEventListener('pointerleave', () => { near = false; });
  }

  // ---- drop
  async function drop() {
    if (mode !== 'idle') return;
    mode = 'loading';
    resetLean();
    setLabel('Loading…');
    try { await load(); } catch {
      mode = 'idle';
      setLabel(IDLE_LABEL);
      return;
    }
    const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = window.Matter;
    const sr = stage.getBoundingClientRect();
    const W = sr.width;
    const H = sr.height;
    const T = 400;

    engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.15;
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, { isStatic: true }), // floor = the stage's bottom rule
      Bodies.rectangle(-T / 2, -H / 2, T, H * 4, { isStatic: true }),
      Bodies.rectangle(W + T / 2, -H / 2, T, H * 4, { isStatic: true }),
    ]);

    bodies = letters.map((el) => {
      const r = el.getBoundingClientRect();
      const ch = el.textContent;
      const x0 = r.left - sr.left + r.width / 2;
      let y0 = r.top - sr.top + r.height / 2;
      // glyphs fill ~94% of their box width and ~87% of the 0.8em line box height
      let w = Math.max(r.width * 0.94, 8);
      let h = r.height * 0.87;
      if (ch === "'") { h = r.height * 0.26; y0 -= r.height * 0.26; }
      if (ch === '.') { w = r.width * 0.6; h = r.height * 0.2; y0 += r.height * 0.32; }
      const b = Bodies.rectangle(x0, y0, w, h, {
        restitution: 0.28, friction: 0.5, frictionAir: 0.01, density: 0.002,
        chamfer: { radius: Math.min(w, h) * 0.12 },
      });
      b.el = el;
      b.x0 = x0;
      b.y0 = y0;
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: -Math.random() * 3 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.06);
      return b;
    });
    Composite.add(engine.world, bodies);

    if (fine) {
      mouse = Mouse.create(stage);
      const el = mouse.element;
      // Matter blocks wheel scrolling and touch scrolling on its element; keep the page scrollable.
      el.removeEventListener('mousewheel', mouse.mousewheel);
      el.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      el.removeEventListener('touchmove', mouse.mousemove);
      el.removeEventListener('touchstart', mouse.mousedown);
      el.removeEventListener('touchend', mouse.mouseup);
      Composite.add(engine.world, MouseConstraint.create(engine, {
        mouse, constraint: { stiffness: 0.18, damping: 0.1, render: { visible: false } },
      }));
    }

    mode = 'live';
    stage.classList.add('is-dropped');
    stage.dataset.cursor = 'Drag the letters';
    setLabel('Put it back ↺');
    wake();
  }

  function step(now) {
    raf = 0;
    if (mode !== 'live') return;
    const { Engine } = window.Matter;
    acc += lastT ? Math.min(now - lastT, 50) : STEP;
    lastT = now;
    while (acc >= STEP) { Engine.update(engine, STEP); acc -= STEP; }
    let awake = false;
    for (const b of bodies) {
      b.el.style.transform = `translate3d(${(b.position.x - b.x0).toFixed(2)}px, ${(b.position.y - b.y0).toFixed(2)}px, 0) rotate(${b.angle.toFixed(4)}rad)`;
      if (!b.isSleeping) awake = true;
    }
    // Sleep when everything has settled; any press on the stage wakes it again.
    if (inView && (awake || (mouse && mouse.button === 0))) raf = requestAnimationFrame(step);
  }
  function wake() {
    if (raf || mode !== 'live') return;
    lastT = 0;
    acc = 0;
    raf = requestAnimationFrame(step);
  }

  function restore() {
    if (mode !== 'live') return;
    mode = 'restoring';
    cancelAnimationFrame(raf);
    raf = 0;
    // Normalise each rotation first so letters don't spin back through several turns.
    bodies.forEach((b) => {
      const a = Math.atan2(Math.sin(b.angle), Math.cos(b.angle));
      b.el.style.transform = `translate3d(${(b.position.x - b.x0).toFixed(2)}px, ${(b.position.y - b.y0).toFixed(2)}px, 0) rotate(${a.toFixed(4)}rad)`;
    });
    void stage.offsetWidth;
    letters.forEach((el, i) => {
      el.style.transition = `transform 1s cubic-bezier(.16, 1, .3, 1) ${(i * 0.035).toFixed(3)}s`;
      el.style.transform = '';
    });
    teardown();
    setTimeout(() => {
      letters.forEach((el) => { el.style.transition = ''; });
      mode = 'idle';
      stage.classList.remove('is-dropped');
      stage.dataset.cursor = IDLE_LABEL;
      setLabel(IDLE_LABEL);
    }, 1400);
  }

  function teardown() {
    if (mouse) {
      const el = mouse.element;
      el.removeEventListener('mousemove', mouse.mousemove);
      el.removeEventListener('mousedown', mouse.mousedown);
      el.removeEventListener('mouseup', mouse.mouseup);
      mouse = null;
    }
    if (engine) {
      window.Matter.Composite.clear(engine.world, false);
      window.Matter.Engine.clear(engine);
      engine = null;
    }
    bodies = [];
  }

  btn.addEventListener('click', () => (mode === 'live' ? restore() : drop()));
  stage.addEventListener('click', () => { if (mode === 'idle') drop(); });
  stage.addEventListener('pointerdown', wake);
  stage.addEventListener('pointermove', () => { if (mouse && mouse.button === 0) wake(); });
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) wake(); }).observe(stage);

  let lastWidth = window.innerWidth;
  addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    restore();
  });
}
