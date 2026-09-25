# kailash. — orbit edition

A second, experimental version of my portfolio. The hero is an orbital system: my portrait is the planet, and what I'm doing right now circles it. Scrolling turns the planet into the next section; RESQ plays out as a small route-and-signals scene; the contact heading can be dropped and dragged around with real physics.

It is a plain static site (HTML, CSS, JavaScript modules) with no build step.

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk won't work, because browsers block JavaScript modules on `file://`.

## Structure

- `index.html`: all content
- `css/style.css`: styles; three colour worlds (void, amber, bone)
- `js/main.js`: entry point; wires everything together
- `js/orbit.js`: the hero orbits (plain JavaScript, no libraries)
- `js/scenes.js`: scroll choreography (GSAP + ScrollTrigger)
- `js/gravity.js`: the "Let's talk." physics, with Matter.js loaded only on click
- `js/interactions.js`: the pointer "interaction grammar" (letter rolls, button fills, row wipes, media tilt)
- `js/motion.js`: shared easing tokens and text helpers; the CSS custom properties mirror them
- `js/marquee.js`, `js/cursor.js`, `js/ui.js`: smaller pieces
- `vendor/`: GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 and Matter.js 0.19.0 (sources and checksums in `vendor/README.md`)
- `fonts/`: self-hosted Archivo and JetBrains Mono, with their licences (see `fonts/README.md`)

Everything the page needs is served from this repo; the only outside request is the optional live Codeforces rating. If a library fails to load, the page still shows everything, just without that motion.

## Motion and accessibility

- `prefers-reduced-motion` turns off smooth scrolling, pinning, the physics and all decorative motion. Every scene shows its finished state instead.
- The custom cursor and hover previews only appear on devices with a fine pointer.

## Deploying

Any static host works. On GitHub Pages, serve from the repository root; all paths are relative.
