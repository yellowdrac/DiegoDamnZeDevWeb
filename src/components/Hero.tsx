import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../i18n/lang";
import { createPortal } from "../lib/portal";
import LogoMorph from "./LogoMorph";

export default function Hero({ accent }: { accent: string }) {
  const fxRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<ReturnType<typeof createPortal> | null>(null);
  const accentRef = useRef(accent);
  accentRef.current = accent;
  const { t } = useLang();

  // Focus mode: slide the title out and let the logo + portal take center stage.
  const [focused, setFocused] = useState(false);

  // Lock: freeze the mouse-driven rotation (particles + logo). Mirrored into a ref
  // so the once-registered mousemove handler always sees the current value.
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  // Burst the portal each time the logo morphs to the next tech.
  const onMorph = useCallback(() => portalRef.current?.burst(), []);

  // Create the WebGL portal once. Color updates go through setColor so we never
  // tear down / recreate the WebGL context on an accent change.
  useEffect(() => {
    const canvas = fxRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let portal: ReturnType<typeof createPortal>;
    try {
      portal = createPortal(canvas, accentRef.current, wrapRef.current);
    } catch {
      return; // WebGL unavailable — leave the portal blank rather than crash
    }
    portalRef.current = portal;
    portal.resize();
    portal.start(reduce);

    // Pointer → portal (parallax + cursor repulsion). ndc relative to the canvas;
    // rect is cached and refreshed on scroll/resize to stay cheap on mousemove.
    let rect = canvas.getBoundingClientRect();
    const updateRect = () => {
      rect = canvas.getBoundingClientRect();
    };
    const onMove = (e: MouseEvent) => {
      if (lockedRef.current) return; // rotation locked
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      portal.setPointer(nx, ny);
      // tilt the logo toward the cursor (~2× stronger), matching the portal's
      // vertical sense. Clamp so leaving the canvas can't over-rotate it.
      if (!reduce && wrapRef.current) {
        const cx = Math.max(-1, Math.min(1, nx));
        const cy = Math.max(-1, Math.min(1, ny));
        wrapRef.current.style.setProperty("--logo-ry", `${(-cx * 60).toFixed(2)}deg`);
        wrapRef.current.style.setProperty("--logo-rx", `${(-cy * 42).toFixed(2)}deg`);
      }
    };

    const onResize = () => {
      portal.resize();
      updateRect();
    };
    const onScroll = () => updateRect();
    const onVisibility = () => {
      if (document.hidden) portal.stop();
      else if (!reduce) portal.start(false);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      portalRef.current = null;
      portal.dispose();
    };
  }, []);

  useEffect(() => {
    portalRef.current?.setColor(accent);
  }, [accent]);

  // While the logo slides/grows, re-frame the portal each frame for the duration
  // of the CSS transition. The animated path also tracks via the portal's own
  // loop; this also covers reduced-motion, where that loop isn't running.
  useEffect(() => {
    const portal = portalRef.current;
    if (!portal) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      portal.realign();
      if (performance.now() - t0 < 750) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [focused]);

  // Locking snaps the portal + logo back to a neutral, un-tilted pose.
  useEffect(() => {
    if (!locked) return;
    portalRef.current?.setPointer(0, 0);
    const wrap = wrapRef.current;
    if (wrap) {
      wrap.style.setProperty("--logo-rx", "0deg");
      wrap.style.setProperty("--logo-ry", "0deg");
    }
  }, [locked]);

  const c = t.hero;

  return (
    <section className="scrollytell">
      <div className="stage">
        <canvas className="portalfx" ref={fxRef} aria-hidden="true" />
        <div className="bar-top" />
        <div className="vignette" />
        <div className={`stage-inner${focused ? " focused" : ""}`}>
          <div className="chapters">
            <div className="chapter active">
              <div className="ch-eyebrow">{c.eyebrow}</div>
              <h2>
                {c.title.map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < c.title.length - 1 && <br />}
                  </span>
                ))}
              </h2>
              <p>{c.text}</p>
            </div>
          </div>

          <div className="decode-wrap" ref={wrapRef}>
            <LogoMorph accent={accent} onMorph={onMorph} />
          </div>
        </div>

        <div className="hero-controls">
          <button
            type="button"
            className="focus-toggle"
            onClick={() => setFocused((f) => !f)}
            aria-pressed={focused}
          >
            <span className="ft-arrow" aria-hidden="true">{focused ? "→" : "←"}</span>
            {focused ? t.ui.showText : t.ui.focus}
          </button>
          <button
            type="button"
            className={`lock-toggle${locked ? " on" : ""}`}
            onClick={() => setLocked((v) => !v)}
            aria-pressed={locked}
            aria-label={locked ? t.ui.unlockRotation : t.ui.lockRotation}
            title={locked ? t.ui.unlockRotation : t.ui.lockRotation}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              {locked ? (
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              ) : (
                <path d="M8 11V7a4 4 0 0 1 7.6-1.6" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
