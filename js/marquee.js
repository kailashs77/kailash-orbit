/* Skill marquee: two rows drifting in opposite directions, speeding up with scroll velocity. */

export function initMarquee({ reduce, lenis }) {
  const stripe = document.querySelector('.stripe');
  if (!stripe || reduce) return;
  const tracks = [...stripe.querySelectorAll('.mq-track')].map((el) => ({ el, dir: Number(el.dataset.dir) || 1, x: 0, w: 0 }));
  const BASE_SPEED = 60; // px per second

  const fill = () => {
    tracks.forEach((t) => {
      t.el.querySelectorAll('.mq-set.is-clone').forEach((n) => n.remove());
      const set = t.el.querySelector('.mq-set');
      t.w = set.getBoundingClientRect().width;
      const copies = Math.ceil((window.innerWidth * 2) / t.w) + 1;
      for (let i = 0; i < copies; i++) {
        const clone = set.cloneNode(true);
        clone.classList.add('is-clone');
        t.el.appendChild(clone);
      }
      t.x = t.dir > 0 ? 0 : -t.w;
    });
  };

  let running = false;
  let last = 0;
  const tick = (now) => {
    if (!running) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    const boost = 1 + Math.min(Math.abs(lenis ? lenis.velocity : 0) * 0.15, 6);
    for (const t of tracks) {
      t.x -= BASE_SPEED * boost * t.dir * dt;
      if (t.x <= -t.w) t.x += t.w;
      else if (t.x > 0) t.x -= t.w;
      t.el.style.transform = `translate3d(${t.x.toFixed(2)}px, 0, 0)`;
    }
    requestAnimationFrame(tick);
  };

  fill();
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(tick); }
    else if (!en.isIntersecting) running = false;
  }).observe(stripe);

  let timer = 0;
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(fill, 200); });
  if (document.fonts) document.fonts.ready.then(fill);
}
