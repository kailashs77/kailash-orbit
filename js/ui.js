/* Small interface pieces: text fitting, header, menu, anchors, clock, copy, live rating. */

// Scale an element's --fit-size so its widest .fit child spans the available width.
export function fitText(el, { maxSize } = {}) {
  if (!el) return;
  const parts = [...el.querySelectorAll('.fit')];
  el.style.setProperty('--fit-size', '100px');
  const widest = Math.max(...parts.map((p) => p.getBoundingClientRect().width));
  if (!widest) return;
  let size = (100 * el.clientWidth) / widest;
  if (maxSize) size = Math.min(size, maxSize());
  el.style.setProperty('--fit-size', `${(size * 0.995).toFixed(2)}px`);
}

// Header: colour follows the section underneath, a soft backdrop fades in once scrolled,
// it tucks away while scrolling down, and a single line slides to the active or hovered link.
export function initHeader(lenis) {
  const head = document.getElementById('head');
  const nav = head.querySelector('.head-nav');
  const links = [...nav.querySelectorAll('a')];
  let base = 'light';
  let override = null;
  let active = null;
  let hovered = null;
  const apply = () => { head.dataset.theme = override || base; };

  const moveLine = () => {
    const a = hovered || active;
    if (!a) { nav.classList.remove('has-line'); return; }
    const label = a.querySelector('.roll') || a;
    const nr = nav.getBoundingClientRect();
    const lr = label.getBoundingClientRect();
    nav.style.setProperty('--nx', `${(lr.left - nr.left).toFixed(1)}px`);
    nav.style.setProperty('--nw', lr.width.toFixed(1));
    nav.classList.add('has-line');
  };
  links.forEach((a) => {
    a.addEventListener('pointerenter', () => { hovered = a; moveLine(); });
    a.addEventListener('pointerleave', () => { hovered = null; moveLine(); });
  });

  const themeObs = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { base = en.target.dataset.theme; apply(); }
  }, { rootMargin: '0px 0px -94% 0px' });
  document.querySelectorAll('main [data-theme]').forEach((s) => themeObs.observe(s));

  const activeObs = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      active = links.find((a) => a.getAttribute('href') === `#${en.target.id}`) || null;
      links.forEach((a) => a.classList.toggle('is-active', a === active));
      moveLine();
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section').forEach((s) => activeObs.observe(s));
  addEventListener('resize', moveLine);

  // The soft backdrop only appears once the hero (and its planet transition) has scrolled away.
  const about = document.getElementById('about');
  let lastY = window.scrollY;
  const onScroll = (y) => {
    head.classList.toggle('is-scrolled', about.getBoundingClientRect().top < head.offsetHeight);
    if (y > lastY + 4 && y > window.innerHeight * 1.6) head.classList.add('is-hidden');
    else if (y < lastY - 4) head.classList.remove('is-hidden');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  return { override(value) { if (value !== override) { override = value; apply(); } } };
}

export function initMenu(lenis) {
  const root = document.documentElement;
  const btn = document.querySelector('.menu-btn');
  const label = btn.querySelector('.btn-label');
  const nav = document.getElementById('nav');
  const set = (open) => {
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) (open ? lenis.stop() : lenis.start());
  };
  btn.addEventListener('click', () => set(!root.classList.contains('menu-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { set(false); btn.focus(); }
  });
  matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) set(false); });
}

// easeInOutQuint: a slow lift-off, a quick flight, and a long, soft landing
const glide = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

// In-page links scroll smoothly (instantly with reduced motion), taking longer for longer trips,
// and move focus to the destination for keyboard and screen-reader users.
export function initAnchors(lenis, reduce) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? null : document.querySelector(id);
    if (id !== '#top' && !target) return;
    e.preventDefault();
    const offset = target ? -document.getElementById('head').offsetHeight : 0;
    const y = target ? target.getBoundingClientRect().top + window.scrollY + offset : 0;
    if (lenis) {
      const duration = Math.min(2.4, Math.max(1, Math.abs(y - window.scrollY) / 2400));
      lenis.scrollTo(y, { duration, easing: glide });
    } else {
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
    const focusEl = target || document.getElementById('main');
    focusEl.setAttribute('tabindex', '-1');
    focusEl.focus({ preventScroll: true });
  });
}

export function initClock() {
  const el = document.getElementById('clock');
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const colon = document.createElement('span');
  colon.className = 'colon';
  colon.textContent = ':';
  const tick = () => {
    const parts = fmt.formatToParts(new Date());
    const part = (type) => (parts.find((p) => p.type === type) || { value: '--' }).value;
    el.replaceChildren(part('hour'), colon, part('minute'));
  };
  tick();
  setInterval(tick, 15000);
}

export function initCopy() {
  document.querySelectorAll('.copy').forEach((btn) => {
    const label = btn.querySelector('.copy-label');
    btn.addEventListener('click', () => {
      const done = (ok) => {
        label.textContent = ok ? 'Copied ✓' : btn.dataset.copy;
        btn.classList.toggle('is-done', ok);
        setTimeout(() => { label.textContent = 'Copy email'; btn.classList.remove('is-done'); }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(btn.dataset.copy).then(() => done(true), () => done(false));
      else done(false);
    });
  });
}

// Live Codeforces rating: shows up if the API answers, stays silent if it doesn't.
export function initRating() {
  const el = document.getElementById('cf-rating');
  if (!el) return;
  const colour = (r) => (r < 1200 ? '#8E9199' : r < 1400 ? '#4E9A2E' : r < 1600 ? '#1F8F8A' : r < 1900 ? '#3D6FB6' : r < 2100 ? '#9A4DB0' : r < 2400 ? '#D98A00' : '#D9534F');
  fetch('https://codeforces.com/api/user.info?handles=Kailash77')
    .then((r) => r.json())
    .then((data) => {
      const u = data && data.status === 'OK' && data.result && data.result[0];
      if (!u) return;
      el.textContent = '';
      if (u.rating) {
        el.style.setProperty('--rank', colour(u.rating));
        const sw = document.createElement('span');
        sw.className = 'swatch';
        const b = document.createElement('b');
        b.textContent = u.rating;
        el.append(sw, 'Codeforces rating ', b, `${u.rank ? ` · ${u.rank}` : ''} — live`);
      } else {
        el.textContent = 'Codeforces: unrated so far — first contest is the hardest part.';
      }
    })
    .catch(() => {});
}
