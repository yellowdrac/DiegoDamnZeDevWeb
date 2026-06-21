import type { Visual } from "../data/site";

const GOLD = "#e6b450";

/** Gold "matrix rain" on a canvas. */
export function createMatrixRain(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const glyphs = "アイウエオカキ0123456789ABCDEF{}<>/=+*$#".split("");
  const fontSize = 16;
  let cols = 0;
  let drops: number[] = [];
  let raf = 0;

  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    cols = Math.floor(canvas.width / fontSize);
    drops = Array(cols)
      .fill(0)
      .map(() => Math.random() * -50);
  }

  function frame() {
    ctx.fillStyle = "rgba(7,7,8,0.18)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = GOLD;
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
      ctx.globalAlpha = Math.random() * 0.5 + 0.25;
      ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.5;
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      resize();
      cancelAnimationFrame(raf);
      frame();
    },
    stop() {
      cancelAnimationFrame(raf);
    },
    resize,
  };
}

/** Pixel-decode panel: a gold visual that resolves from blocky pixels and can re-glitch. */
export function createDecoder(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const target = document.createElement("canvas");
  const tmp = document.createElement("canvas");
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
    g.addColorStop(0, "#fff0c2");
    g.addColorStop(0.5, "#e6b450");
    g.addColorStop(1, "#8a6410");
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
