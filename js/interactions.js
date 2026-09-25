/* Pointer micro-interactions — the "interaction grammar" described at the top of style.css. */
import { splitChars } from './motion.js';

// Nav and footer links: split into letters so they can roll (CSS does the motion).
export function initRolls() {
  document.querySelectorAll('[data-roll]').forEach((el) => {
    const text = splitChars(el, 'roll-ch');
    const link = el.closest('a, button');
    if (link) link.setAttribute('aria-label', text);
  });
}

// Buttons: the fill grows from the point where the pointer entered and retreats toward where it left.
export function initButtons() {
  document.querySelectorAll('.btn:not(.btn--off)').forEach((btn) => {
    const place = (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', `${(e.clientX - r.left).toFixed(1)}px`);
      btn.style.setProperty('--y', `${(e.clientY - r.top).toFixed(1)}px`);
      btn.style.setProperty('--d', `${(Math.hypot(r.width, r.height) * 2.2).toFixed(0)}px`);
    };
    btn.addEventListener('pointerenter', place);
    btn.addEventListener('pointerleave', place);
  });
}

// Magnetic pull: the element drifts toward the pointer and its label drifts a little further.
export function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach((el) => {
    const label = el.querySelector('.btn-label');
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.translate = `${(dx * 0.2).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`;
      if (label) label.style.translate = `${(dx * 0.08).toFixed(1)}px ${(dy * 0.12).toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.translate = '';
      if (label) label.style.translate = '';
    });
  });
}

// Rows: the highlight wipes in from the edge the pointer came through, and out through the edge it leaves by.
export function initRows() {
  document.querySelectorAll('.row-link').forEach((row) => {
    const edge = (e) => {
      const r = row.getBoundingClientRect();
      return e.clientY - r.top < r.height / 2 ? 'top' : 'bottom';
    };
    row.addEventListener('pointerenter', (e) => row.style.setProperty('--from', edge(e)));
    row.addEventListener('pointerleave', (e) => row.style.setProperty('--from', edge(e)));
  });
}

// Media: a small 3D tilt toward the pointer, with inner layers drifting at different depths.
export function initTilt() {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${(nx * 7).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-ny * 6).toFixed(2)}deg`);
      el.style.setProperty('--lx', (-nx * 2).toFixed(3));
      el.style.setProperty('--ly', (-ny * 2).toFixed(3));
    });
    el.addEventListener('pointerleave', () => {
      ['--rx', '--ry', '--lx', '--ly'].forEach((p) => el.style.removeProperty(p));
    });
  });
}
