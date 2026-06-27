import { useEffect, useRef, useState } from "react";
import { ICONS } from "../data/logos";
import { shade } from "../config/theme";

type Pt = [number, number];

const N = 240; // points sampled per logo (for the morph frames)
const HOLD = 1400; // ms a logo rests before morphing
const MORPH = 1150; // ms morph duration
const VIEW = 24; // logo viewBox is 0..24

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Sample every logo outline into N evenly-spaced points along its path. */
function sampleLogos(ds: string[]): Pt[][] {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;left:-9999px;width:0;height:0;overflow:hidden";
  const path = document.createElementNS(NS, "path");
  svg.appendChild(path);
  document.body.appendChild(svg);
  try {
    return ds.map((d) => {
      path.setAttribute("d", d);
      const total = path.getTotalLength();
      const pts: Pt[] = [];
      for (let i = 0; i < N; i++) {
        const p = path.getPointAtLength((i / N) * total);
        pts.push([p.x, p.y]);
      }
      return pts;
    });
  } finally {
    document.body.removeChild(svg);
  }
}

/**
 * Reorder `b` (cyclic rotation + winding direction) to the variant that
 * minimizes how far each point travels from `a`, so the morph slides cleanly
 * instead of scrambling.
 */
function align(a: Pt[], b: Pt[]): Pt[] {
  const n = a.length;
  let bestRev = false;
  let bestOff = 0;
  let bestCost = Infinity;
  for (const rev of [false, true]) {
    const base = rev ? [...b].reverse() : b;
    for (let off = 0; off < n; off++) {
      let cost = 0;
      for (let i = 0; i < n; i += 2) {
        const bi = (i + off) % n;
        const dx = a[i][0] - base[bi][0];
        const dy = a[i][1] - base[bi][1];
        cost += dx * dx + dy * dy;
        if (cost >= bestCost) break;
      }
      if (cost < bestCost) {
        bestCost = cost;
        bestRev = rev;
        bestOff = off;
      }
    }
  }
  const base = bestRev ? [...b].reverse() : b;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) out.push(base[(i + bestOff) % n]);
  return out;
}

/** Per-frame subpath boundaries from geometry: a big jump = a new subpath. */
function computeBreaks(pts: Pt[]): boolean[] {
  const n = pts.length;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n];
    sum += Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]);
  }
  const thr = Math.max(1.2, (sum / n) * 4);
  const breaks = new Array<boolean>(n);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n];
    breaks[i] = Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]) > thr;
  }
  return breaks;
}

/**
 * Hero panel: the .NET, Node.js, Python and React logos.
 *
 * At rest each logo is drawn from its exact SVG path (Path2D) so it's pixel
 * perfect — curves and cutouts and all. The morph between two logos tweens
 * sampled points (aligned so they take the shortest path). Color follows the
 * accent. Honors reduced-motion.
 */
export default function LogoMorph({
  accent,
  onMorph,
}: {
  accent: string;
  onMorph?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(ICONS[0].name);
  const onMorphRef = useRef(onMorph);
  onMorphRef.current = onMorph;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let shapes: Pt[][];
    let paths: Path2D[];
    try {
      shapes = sampleLogos(ICONS.map((i) => i.d));
      paths = ICONS.map((i) => new Path2D(i.d));
    } catch {
      return; // unsupported — leave the panel empty rather than crash
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bright = shade(accent, 0.55);

    let w = 0;
    let h = 0;
    let redraw: () => void = () => {};

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const geom = () => {
      const s = (Math.min(w, h) * 0.66) / VIEW; // fit with generous padding
      return { s, ox: (w - VIEW * s) / 2, oy: (h - VIEW * s) / 2 };
    };

    const paint = (shape: Path2D) => {
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bright);
      grad.addColorStop(1, accent);
      ctx.fillStyle = grad;
      ctx.strokeStyle = bright;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = 1.4;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 16;
      ctx.fill(shape, "evenodd");
      ctx.shadowBlur = 0;
      ctx.stroke(shape);
    };

    // Exact logo at rest (pixel perfect — Path2D rendered straight from the SVG).
    const drawLogo = (i: number) => {
      const { s, ox, oy } = geom();
      const sp = new Path2D();
      sp.addPath(paths[i], new DOMMatrix([s, 0, 0, s, ox, oy]));
      paint(sp);
    };

    // Interpolated polygon during the morph.
    const drawPoints = (pts: Pt[]) => {
      const { s, ox, oy } = geom();
      const breaks = computeBreaks(pts);
      let start = 0;
      for (let i = 0; i < pts.length; i++) {
        if (breaks[i]) {
          start = i;
          break;
        }
      }
      const path = new Path2D();
      for (let j = 0; j < pts.length; j++) {
        const idx = (start + j) % pts.length;
        const x = pts[idx][0] * s + ox;
        const y = pts[idx][1] * s + oy;
        if (j === 0 || breaks[idx]) {
          if (j > 0) path.closePath();
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      path.closePath();
      paint(path);
    };

    const lerp = (a: Pt[], b: Pt[], e: number): Pt[] =>
      a.map((p, i) => [p[0] + (b[i][0] - p[0]) * e, p[1] + (b[i][1] - p[1]) * e]);

    let from = 0;
    let raf = 0;
    let timer = 0;

    resize();
    redraw = () => drawLogo(from);
    redraw();

    if (reduce) {
      timer = window.setInterval(() => {
        from = (from + 1) % shapes.length;
        setName(ICONS[from].name);
        onMorphRef.current?.();
        redraw = () => drawLogo(from);
        redraw();
      }, HOLD + MORPH);
    } else {
      const morphTo = (to: number) => {
        setName(ICONS[to].name); // name leads the morph toward the next logo
        onMorphRef.current?.(); // kick the portal burst on each change
        const target = align(shapes[from], shapes[to]);
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / MORPH);
          const pts = lerp(shapes[from], target, easeInOut(p));
          redraw = () => drawPoints(pts);
          redraw();
          if (p < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            from = to;
            redraw = () => drawLogo(from);
            redraw(); // snap to the exact, pixel-perfect logo
            timer = window.setTimeout(() => morphTo((from + 1) % shapes.length), HOLD);
          }
        };
        raf = requestAnimationFrame(tick);
      };
      timer = window.setTimeout(() => morphTo((from + 1) % shapes.length), HOLD);
    }

    const onResize = () => {
      resize();
      redraw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearInterval(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [accent]);

  return (
    <>
      <canvas className="decode" ref={canvasRef} aria-hidden="true" />
      <div className="decode-tag">{name}</div>
    </>
  );
}
