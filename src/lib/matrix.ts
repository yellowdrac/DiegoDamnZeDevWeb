import type { Visual } from "../data/site";
import { liveAccent, shade } from "../config/theme";

/** Each particle is a tiny star with a depth `z` and a per-star size jitter. */
type WarpParticle = { bx: number; by: number; z: number; s: number };

/**
 * Fake-3D star tunnel on a canvas. Each star has a depth `z` and rushes toward
 * the camera (z -> 0), projected from a central vanishing point. Idles calm
 * behind content; `burst()` fires a short z-rush, and `setScroll()` couples the
 * rush to scroll velocity. Honors reduced-motion / low-power devices by
 * rendering a single static depth field instead. Colors follow the app accent.
 */
export function createWarpTunnel(canvas: HTMLCanvasElement, accent = liveAccent()) {
  const ctx = canvas.getContext("2d")!;
  const base = accent; // accent color (e.g. gold) chosen by the user
  const bright = shade(base, 0.55); // near stars glow brighter

  const FOCAL = 0.5; // projection focal length (in half-canvas units)
  const FONT_BASE = 20; // star size at the projection plane
  const IDLE_SPEED = 0.0016; // z decrement / frame while reading
  const BURST_SPEED = 0.012; // z decrement / frame during a chapter burst
  const MAX_BOOST = 0.006; // cap on scroll-velocity contribution
  const IDLE_TRAIL = 0.3; // bg clear alpha (higher = shorter motion trails)
  const BURST_TRAIL = 0.1;

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let particles: WarpParticle[] = [];
  let raf = 0;
  let speed = IDLE_SPEED;
  let trail = IDLE_TRAIL;
  let scrollBoost = 0;
  let burstUntil = 0;
  let reduced = false;
  let lowPower = false;

  function reset(p: WarpParticle, depth = 1) {
    let bx = Math.random() * 2 - 1;
    let by = Math.random() * 2 - 1;
    // keep stars off the exact vanishing point so they actually travel outward
    if (Math.abs(bx) < 0.08 && Math.abs(by) < 0.08) {
      bx += bx >= 0 ? 0.1 : -0.1;
      by += by >= 0 ? 0.1 : -0.1;
    }
    p.bx = bx;
    p.by = by;
    p.z = depth;
    p.s = 0.7 + Math.random() * 0.6; // size jitter so the field twinkles
  }

  function build() {
    lowPower =
      window.innerWidth < 480 ||
      (typeof navigator !== "undefined" && (navigator.hardwareConcurrency || 8) <= 4);
    const count = window.innerWidth < 760 ? 70 : 160;
    particles = Array.from({ length: count }, () => {
      const p: WarpParticle = { bx: 0, by: 0, z: 1, s: 1 };
      reset(p, Math.random()); // stagger initial depth so the field is full
      if (p.z < 0.05) p.z = 0.5;
      return p;
    });
  }

  /** Draw a small 4-point sparkle (star particle) centered at x,y. */
  function drawStar(x: number, y: number, r: number) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rad = i % 2 === 0 ? r : r * 0.4;
      const ang = (Math.PI / 4) * i - Math.PI / 2;
      const px = x + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    cx = w / 2;
    cy = h / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!particles.length) build();
    if (reduced || lowPower) drawParticles(1);
  }

  function drawParticles(clearAlpha: number) {
    ctx.fillStyle = `rgba(7,7,8,${clearAlpha})`;
    ctx.fillRect(0, 0, w, h);
    const m = 100;
    for (const p of particles) {
      const k = FOCAL / p.z;
      const sx = cx + p.bx * k * cx;
      const sy = cy + p.by * k * cy;
      if (sx < -m || sx > w + m || sy < -m || sy > h + m) continue;
      const size = Math.min(58, FONT_BASE * k) * p.s;
      if (size < 4) continue;
      ctx.globalAlpha = Math.min(0.95, Math.max(0.06, 1.05 - p.z));
      ctx.fillStyle = p.z < 0.22 ? bright : base;
      drawStar(sx, sy, size * 0.5);
    }
    ctx.globalAlpha = 1;
  }

  function frame() {
    const now = performance.now();
    let target = IDLE_SPEED + scrollBoost;
    if (now < burstUntil) target = Math.max(target, BURST_SPEED);
    speed += (target - speed) * 0.06;
    trail += ((now < burstUntil ? BURST_TRAIL : IDLE_TRAIL) - trail) * 0.06;
    scrollBoost *= 0.92;

    const m = 120;
    for (const p of particles) {
      p.z -= speed;
      const k = FOCAL / p.z;
      const sx = cx + p.bx * k * cx;
      const sy = cy + p.by * k * cy;
      if (p.z <= 0.04 || sx < -m || sx > w + m || sy < -m || sy > h + m) reset(p, 1);
    }
    drawParticles(trail);
    raf = requestAnimationFrame(frame);
  }

  return {
    resize,
    start(reduceMotion: boolean) {
      reduced = reduceMotion;
      if (!particles.length) build();
      if (reduced || lowPower) {
        drawParticles(1); // single static depth field, no animation loop
        return;
      }
      cancelAnimationFrame(raf);
      frame();
    },
    burst() {
      if (reduced || lowPower) return;
      burstUntil = performance.now() + 600;
    },
    setScroll(delta: number) {
      if (reduced || lowPower) return;
      scrollBoost = Math.min(MAX_BOOST, scrollBoost + Math.abs(delta) * 0.00002);
    },
    stop() {
      cancelAnimationFrame(raf);
    },
    dispose() {
      cancelAnimationFrame(raf);
      particles = [];
    },
  };
}

/** Pixel-decode panel: a gold visual that resolves from blocky pixels and can re-glitch. */
export function createDecoder(canvas: HTMLCanvasElement, accent = liveAccent()) {
  const ctx = canvas.getContext("2d")!;
  const target = document.createElement("canvas");
  const tmp = document.createElement("canvas");
  const base = accent; // accent color chosen by the user
  const bright = shade(base, 0.55);
  const deep = shade(base, -0.45);
  let current: Visual = "code";
  let raf = 0;

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const r = dpr();
    canvas.width = canvas.clientWidth * r;
    canvas.height = canvas.clientHeight * r;
    target.width = canvas.width;
    target.height = canvas.height;
    buildTarget(current);
    drawPixelated(1);
  }

  function buildTarget(v: Visual) {
    const t = target.getContext("2d")!;
    const W = target.width;
    const H = target.height;
    t.clearRect(0, 0, W, H);
    const g = t.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, bright);
    g.addColorStop(0.5, base);
    g.addColorStop(1, deep);
    t.fillStyle = g;
    t.textAlign = "center";
    t.textBaseline = "middle";
    const cx = W / 2;
    const cy = H / 2;
    if (v === "code") {
      t.font = `900 ${H * 0.34}px Inter, sans-serif`;
      t.fillText("</>", cx, cy);
    } else if (v === "bars") {
      const n = 4;
      const bw = W * 0.11;
      const gap = W * 0.07;
      const base = cy + H * 0.24;
      const hs = [0.46, 0.32, 0.22, 0.13];
      const sx = cx - (n * (bw + gap) - gap) / 2 + bw / 2;
      hs.forEach((h, i) => {
        const x = sx + i * (bw + gap);
        const hh = H * h;
        t.fillRect(x - bw / 2, base - hh, bw, hh);
      });
    } else {
      t.font = `900 ${H * 0.5}px Inter, sans-serif`;
      t.fillText("★", cx, cy);
    }
  }

  function drawPixelated(block: number) {
    const sw = Math.max(1, Math.floor(canvas.clientWidth / block));
    const sh = Math.max(1, Math.floor(canvas.clientHeight / block));
    tmp.width = sw;
    tmp.height = sh;
    const tx = tmp.getContext("2d")!;
    tx.imageSmoothingEnabled = false;
    tx.clearRect(0, 0, sw, sh);
    tx.drawImage(target, 0, 0, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, canvas.width, canvas.height);
  }

  function animate(reduce: boolean) {
    if (reduce) {
      drawPixelated(1);
      return;
    }
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const dur = 1100;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const block = Math.max(1, 22 - e * 21);
      drawPixelated(block);
      if (p < 1) raf = requestAnimationFrame(step);
      else drawPixelated(1);
    };
    raf = requestAnimationFrame(step);
  }

  return {
    resize,
    setChapter(v: Visual, reduce: boolean) {
      current = v;
      buildTarget(v);
      animate(reduce);
    },
    glitch(reduce: boolean) {
      buildTarget(current);
      animate(reduce);
    },
    dispose() {
      cancelAnimationFrame(raf);
    },
  };
}
