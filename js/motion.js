/* Shared motion tokens and text helpers. The CSS custom properties in :root mirror these. */

export const EASE = 'expo.out'; // ≈ cubic-bezier(.16, 1, .3, 1) — the site's one "settle" curve
export const EASE_IN_OUT = 'power3.inOut';

// Split an element's text into one span per character, each carrying --i for staggered CSS.
export function splitChars(el, className) {
  const text = el.textContent;
  el.textContent = '';
  [...text].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = className;
    s.textContent = c;
    s.style.setProperty('--i', i);
    el.appendChild(s);
  });
  return text;
}

// Keep a static copy for screen readers and return the decorative span that gets animated.
export function prepScramble(el) {
  const text = el.textContent;
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  const visible = document.createElement('span');
  visible.setAttribute('aria-hidden', 'true');
  visible.textContent = text;
  el.replaceChildren(sr, visible);
  return { el: visible, text };
}

const GLYPHS = '01<>/\\{}[]=+*#%_';

// Decode text like a telemetry readout: random glyphs settle into the real characters, left to right.
export function scramble(el, text, duration = 700) {
  const chars = [...text];
  const settle = chars.map((_, i) => 0.18 + (i / Math.max(1, chars.length)) * 0.55 + Math.random() * 0.25);
  const start = performance.now();
  cancelAnimationFrame(el.scrambleFrame);
  const frame = (now) => {
    const t = (now - start) / duration;
    if (t >= 1) { el.textContent = text; return; }
    el.textContent = chars.map((c, i) => (c === ' ' || t >= settle[i] ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
    el.scrambleFrame = requestAnimationFrame(frame);
  };
  el.scrambleFrame = requestAnimationFrame(frame);
}
