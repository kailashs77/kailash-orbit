/* A trailing dot that becomes a label over anything with data-cursor. Mouse only.
   It recolours itself for the section underneath (amber on dark, ink on amber and bone). */

export function initCursor() {
  const root = document.documentElement;
  const cursor = document.querySelector('.cursor');
  const label = cursor.querySelector('.cursor-label');
  let x = -100; let y = -100; let tx = -100; let ty = -100;
  let raf = 0;
  let current = null;
  let world = 'light';
  root.classList.add('has-cursor');

  const loop = () => {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.2 ? requestAnimationFrame(loop) : 0;
  };

  const update = (target) => {
    const el = target instanceof Element ? target : null;
    const holder = el ? el.closest('[data-cursor]') : null;
    const text = holder ? holder.dataset.cursor : '';
    if (text !== current) {
      current = text;
      if (text) label.textContent = text;
      cursor.classList.toggle('is-label', Boolean(text));
    }
    cursor.classList.toggle('is-hot', !text && Boolean(el && el.closest('a, button')));
    const zone = el ? el.closest('[data-theme]') : null;
    const next = zone ? zone.dataset.theme : 'light';
    if (next !== world) { world = next; cursor.dataset.world = next; }
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

  // Content scrolls under a still pointer, so re-check what it's over once per frame while scrolling.
  let checking = false;
  addEventListener('scroll', () => {
    if (checking || tx < 0) return;
    checking = true;
    requestAnimationFrame(() => { checking = false; update(document.elementFromPoint(tx, ty)); });
  }, { passive: true });

  addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') cursor.classList.add('is-down'); });
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  root.addEventListener('mouseleave', () => cursor.classList.add('is-off'));
}
