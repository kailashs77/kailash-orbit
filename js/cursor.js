/* A trailing dot that turns into a label over anything with data-cursor. Mouse only. */

export function initCursor() {
  const root = document.documentElement;
  const cursor = document.querySelector('.cursor');
  const label = cursor.querySelector('.cursor-label');
  let x = -100; let y = -100; let tx = -100; let ty = -100;
  let raf = 0;
  let current = null;
  root.classList.add('has-cursor');

  const loop = () => {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.2 ? requestAnimationFrame(loop) : 0;
  };

  const update = (target) => {
    const holder = target instanceof Element ? target.closest('[data-cursor]') : null;
    const text = holder ? holder.dataset.cursor : '';
    if (text !== current) {
      current = text;
      if (text) label.textContent = text;
      cursor.classList.toggle('is-label', Boolean(text));
    }
    cursor.classList.toggle('is-hot', !text && target instanceof Element && Boolean(target.closest('a, button')));
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX;
    ty = e.clientY;
    if (cursor.classList.contains('is-off') || x < -50) { x = tx; y = ty; }
    cursor.classList.remove('is-off');
    update(e.target); // also catches labels that change while hovering (e.g. after the drop)
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  root.addEventListener('mouseleave', () => cursor.classList.add('is-off'));
}

// Buttons drift a few pixels toward the pointer and spring back on leave.
export function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
      const dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
      el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });
}
