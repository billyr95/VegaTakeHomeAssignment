
import Lenis from 'lenis';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const wide = matchMedia('(min-width: 768px)');

const parallax = [...document.querySelectorAll<HTMLElement>('[data-speed]')];
const pin = document.querySelector<HTMLElement>('[data-hscroll]');
const track = pin?.querySelector<HTMLElement>('[data-track]');
const islands = pin ? [...pin.querySelectorAll<HTMLElement>('.island')] : [];
const hclouds = pin ? [...pin.querySelectorAll<HTMLElement>('[data-hspeed]')] : [];
const dots = pin ? [...pin.querySelectorAll<HTMLElement>('[data-dot]')] : [];
const counter = pin?.querySelector<HTMLElement>('[data-count]');
const hop = pin?.querySelector<HTMLElement>('[data-hop]');
const street = document.querySelector<HTMLElement>('[data-street]');
const layers = street ? [...street.querySelectorAll<HTMLElement>('[data-depth]')] : [];
const skyNoon = document.querySelector<HTMLElement>('[data-sky="noon"]');
const skyDusk = document.querySelector<HTMLElement>('[data-sky="dusk"]');
const duskLayers = [...document.querySelectorAll<HTMLElement>('[data-dusk]')];

const DWELL = 0.65;

let pinTop = 0, pinRun = 1, startX = 0, travel = 0, streetBottom = 0;
let cloudParents: { el: HTMLElement; mid: number }[] = [];
let horizontal = false;
let islandAnchors: number[] = [];

let isl: { c: number; l: number; r: number; g: number; sz: number }[] = [];

const docTop = (el: Element) => el.getBoundingClientRect().top + scrollY;

const centerOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.left + r.width / 2 - track!.getBoundingClientRect().left;
};

function layout() {
  horizontal = !!(pin && track && islands.length && wide.matches && !reduce.matches);
  if (pin && track) {
    track.style.transform = '';
    if (horizontal) {

      startX = centerOf(islands[0]) - innerWidth / 2;
      travel = Math.max(0, centerOf(islands[islands.length - 1]) - centerOf(islands[0]));

      pin.style.height = `${innerHeight + travel}px`;
    } else {
      pin.style.height = '';
    }

    const tr = track.getBoundingClientRect();
    isl = islands.map((li) => {
      const art = li.querySelector<HTMLElement>('.art-wrap') ?? li, r = art.getBoundingClientRect();
      const scale = r.width / Number(li.dataset.w || r.width);
      return { c: r.left - tr.left + r.width / 2, l: r.left - tr.left + r.width * 0.14, r: r.left - tr.left + r.width * 0.86,
        g: r.top - tr.top + r.height * Number(li.dataset.ground || 0.55), sz: 60 * scale };
    });
    pinTop = docTop(pin);
    pinRun = Math.max(1, pin.offsetHeight - innerHeight);
  }
  cloudParents = parallax.map((el) => {
    const p = el.parentElement!;
    return { el, mid: docTop(p) + p.offsetHeight / 2 };
  });
  if (street) streetBottom = docTop(street) + street.offsetHeight;
  islandAnchors = islands.map((el) => docTop(el) + el.offsetHeight / 2 - innerHeight / 2);
}

type Pose = { x: number; y: number; sz: number; air: boolean };
let samLast = NaN, samDir = 1, samState = '', samStop = 0;
function setSam(state: string) { if (hop && state !== samState) { hop.className = `sam-hop ${state}`; samState = state; } }

function drawSam({ x, y, sz, air }: Pose, runs: boolean) {
  if (!hop) return;
  const dx = x - samLast, moving = !Number.isNaN(samLast) && Math.abs(dx) > 0.2;
  if (moving && Math.abs(dx) < innerWidth / 2) samDir = dx > 0 ? 1 : -1;
  samLast = x;
  hop.style.setProperty('--sz', `${sz.toFixed(1)}px`);
  hop.style.transform = `translate3d(${(x - sz / 2).toFixed(1)}px, ${(y - sz).toFixed(1)}px, 0) scaleX(${samDir})`;
  if (air) { setSam('jump'); return; }
  if (moving && runs) {
    setSam('run');

    clearTimeout(samStop);
    samStop = window.setTimeout(() => { if (samState === 'run') setSam('idle'); }, 160);
  } else if (samState !== 'run') setSam('idle');
}

let stacked = false;


const samSize = () => Math.min(...isl.map((i) => i.sz));
function pose(q: number): Pose {
  if (stacked) {
    const k = Math.min(isl.length - 2, Math.max(0, Math.floor(q))), u = Math.min(1, Math.max(0, q - k));
    const a = isl[k], b = isl[k + 1], W = track ? track.clientWidth : innerWidth;
    if (u <= 0.35) return { x: a.c, y: a.g, sz: samSize(), air: false };
    if (u < 0.55) {
      const v = (u - 0.35) / 0.2;
      return { x: a.c + v * (W + samSize() - a.c), y: a.g - Math.sin(Math.PI * v) * 70 + v * 40, sz: samSize(), air: true };
    }
    if (u < 0.8) {
      const v = (u - 0.55) / 0.25;
      return { x: -samSize() + v * (b.c + samSize()), y: b.g - 90 * (1 - v) - Math.sin(Math.PI * v) * 50, sz: samSize(), air: true };
    }
    return { x: b.c, y: b.g, sz: samSize(), air: false };
  }
  let k = 0;
  while (k < isl.length - 2 && q > isl[k + 1].c) k++;
  const a = isl[k], b = isl[k + 1], sz = samSize();
  if (q <= a.r) return { x: q, y: a.g, sz, air: false };
  if (q >= b.l) return { x: q, y: b.g, sz, air: false };
  const u = (q - a.r) / (b.l - a.r), height = 40 + (b.l - a.r) * 0.18;
  return { x: q, y: a.g + (b.g - a.g) * u - Math.sin(Math.PI * u) * height, sz, air: true };
}

function samUpdate(target: number, isStacked: boolean) {
  if (!hop || isl.length < 2) return;
  stacked = isStacked;
  drawSam(pose(target), !stacked);
}

function timeOfDay(y: number) {
  if (horizontal) return dwell(Math.min(1, Math.max(0, (y - pinTop) / pinRun)));

  const a = islandAnchors, n = a.length - 1;
  if (n < 1 || y <= a[0]) return 0;
  if (y >= a[n]) return 1;
  let i = 0;
  while (i < n - 1 && y > a[i + 1]) i++;
  return (i + (y - a[i]) / Math.max(1, a[i + 1] - a[i])) / n;
}

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
let lastNoon = -1, lastDusk = -1;

function paintSky(t: number) {
  const noon = smooth(t / 0.5), dusk = smooth((t - 0.5) / 0.5);

  const changed = (v: number, last: number) => v !== last && (Math.abs(v - last) > 0.002 || v === 0 || v === 1);
  if (changed(noon, lastNoon)) { lastNoon = noon; if (skyNoon) skyNoon.style.opacity = noon.toFixed(3); }
  if (changed(dusk, lastDusk)) {
    lastDusk = dusk;
    if (skyDusk) skyDusk.style.opacity = dusk.toFixed(3);
    for (const el of duskLayers) el.style.opacity = dusk.toFixed(3);
    street?.style.setProperty('--dusk', dusk.toFixed(3));
  }
}

function dwell(p: number) {
  const n = islands.length - 1;
  if (n < 1) return p;
  const s = p * n, i = Math.min(n - 1, Math.floor(s)), t = s - i;
  const eased = t * t * (3 - 2 * t);
  return (i + t + (eased - t) * DWELL) / n;
}

function render(y: number) {
  const vh = innerHeight;
  paintSky(timeOfDay(y));

  if (!reduce.matches) {
    for (const { el, mid } of cloudParents) {

      const d = Math.max(-vh, Math.min(vh, mid - y - vh / 2));
      const offset = Math.max(-240, Math.min(240, d * Number(el.dataset.speed)));
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  }

  if (horizontal && track) {
    const p = Math.min(1, Math.max(0, (y - pinTop) / pinRun));
    const moved = dwell(p) * travel;
    track.style.transform = `translate3d(${(-(startX + moved)).toFixed(1)}px, 0, 0)`;
    for (const c of hclouds) c.style.transform = `translate3d(${(moved * (1 - Number(c.dataset.hspeed))).toFixed(1)}px, 0, 0)`;
    if (isl[0]) samUpdate(isl[0].c + moved, false);
    const i = Math.min(dots.length - 1, Math.round(p * (dots.length - 1)));
    dots.forEach((d, j) => d.toggleAttribute('data-on', j === i));
    if (counter) counter.textContent = `${i + 1} / ${dots.length}`;

  } else if (hop && !reduce.matches && isl.length > 1) {
    samUpdate(timeOfDay(y) * (isl.length - 1), true);
  }

  if (street) {
    if (reduce.matches) layers.forEach((l) => (l.style.transform = ''));
    else {

      const remaining = Math.min(Math.max(0, streetBottom - y - vh), vh * 0.55);
      for (const l of layers) l.style.transform = `translate3d(0, ${(remaining * Number(l.dataset.depth)).toFixed(1)}px, 0)`;
    }
  }
}

let lenis: Lenis | null = null;

function setupLenis() {
  if (reduce.matches && lenis) { lenis.destroy(); lenis = null; }
  if (!reduce.matches && !lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (time: number) => { if (!lenis) return; lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

addEventListener('modal:open', () => lenis?.stop());
addEventListener('modal:close', () => lenis?.start());

let queued = false;
function kick() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; render(scrollY); });
}

function relayout() {
  layout();
  lenis?.resize();
  render(scrollY);
}

addEventListener('scroll', kick, { passive: true });
addEventListener('resize', relayout);
addEventListener('load', relayout);
reduce.addEventListener('change', () => { setupLenis(); relayout(); });
wide.addEventListener('change', relayout);
document.fonts?.ready.then(relayout);
setupLenis();
relayout();
