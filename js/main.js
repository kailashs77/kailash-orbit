import { initOrbit } from './orbit.js';
import { initCursor } from './cursor.js';
import { initScenes } from './scenes.js';
import { initGravity } from './gravity.js';
import { initMarquee } from './marquee.js';
import { initRolls, initButtons, initMagnetic, initRows, initTilt } from './interactions.js';
import { fitText, initHeader, initMenu, initAnchors, initClock, initCopy, initRating } from './ui.js';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const { gsap, ScrollTrigger, Lenis } = window;
const canAnimate = !reduce && Boolean(gsap && ScrollTrigger);
// The head script drops .motion if we arrive late; then the hero is already visible, so skip its intro.
const lateStart = !root.classList.contains('motion');

if (!canAnimate) root.classList.remove('motion');

// Smooth scrolling drives ScrollTrigger from GSAP's ticker so both stay in sync.
let lenis = null;
if (canAnimate) {
  gsap.registerPlugin(ScrollTrigger);
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}

const fitAll = () => {
  fitText(document.querySelector('.hero-name'), { maxSize: () => window.innerHeight * 0.29 });
  fitText(document.querySelector('.grav-word'));
};
fitAll();

initRolls();
const header = initHeader(lenis);
initMenu(lenis);
initAnchors(lenis, reduce);
initClock();
initCopy();
initRating();
const orbit = initOrbit({ reduce, fine });
initMarquee({ reduce, lenis });
initGravity({ reduce, fine });
if (fine && !reduce) {
  initCursor();
  initButtons();
  initMagnetic();
  initRows();
  initTilt();
}

let scenes = null;
if (canAnimate) {
  try {
    scenes = initScenes({ header, orbit, intro: !lateStart });
  } catch (err) {
    root.classList.remove('motion');
    console.error(err);
  }
}
root.classList.add('motion-ready');

const remeasure = () => {
  fitAll();
  orbit.measure();
  if (canAnimate) ScrollTrigger.refresh();
};

// Start the entrance once the fonts and portrait are ready (so nothing reflows mid-animation),
// but never wait longer than 0.9s for them.
const portrait = document.querySelector('#planet img');
const assetsReady = Promise.all([
  document.fonts ? document.fonts.ready : null,
  portrait && portrait.decode ? portrait.decode().catch(() => {}) : null,
]);
Promise.race([assetsReady, new Promise((resolve) => setTimeout(resolve, 900))]).then(() => {
  remeasure();
  if (scenes) scenes.play();
});
if (document.fonts) document.fonts.ready.then(remeasure);

let lastWidth = innerWidth;
let resizeTimer = 0;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Mobile browsers fire resize when the address bar slides; only width changes need a refit.
    if (innerWidth === lastWidth) return orbit.measure();
    lastWidth = innerWidth;
    remeasure();
  }, 150);
});
