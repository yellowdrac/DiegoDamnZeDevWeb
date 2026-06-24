import { useEffect, useRef } from "react";
import { chapters } from "../data/site";
import { COLOR_PALETTE, type AccentName } from "../config/theme";
import { createWarpTunnel, createDecoder } from "../lib/matrix";

export default function Hero({ accent }: { accent: AccentName }) {
  const rainRef = useRef<HTMLCanvasElement>(null);
  const decodeRef = useRef<HTMLCanvasElement>(null);

  // Re-create the canvases when the accent changes so stars + decoder recolor live.
  useEffect(() => {
    const tunnelCanvas = rainRef.current;
    const decodeCanvas = decodeRef.current;
    if (!tunnelCanvas || !decodeCanvas) return;

    const accentHex = COLOR_PALETTE[accent];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tunnel = createWarpTunnel(tunnelCanvas, accentHex);
    const decoder = createDecoder(decodeCanvas, accentHex);

    tunnel.resize();
    decoder.resize();
    decoder.setChapter(chapters[0].visual, reduce);
    tunnel.start(reduce);

    let lastY = window.scrollY;

    const onResize = () => {
      tunnel.resize();
      decoder.resize();
    };
    const onScroll = () => {
      const y = window.scrollY;
      tunnel.setScroll(y - lastY); // scroll velocity gives the stars a gentle rush
      lastY = y;
    };
    const onVisibility = () => {
      if (document.hidden) tunnel.stop();
      else tunnel.start(reduce);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    const glitch = reduce ? undefined : window.setInterval(() => decoder.glitch(reduce), 5000);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      if (glitch) clearInterval(glitch);
      tunnel.stop();
      tunnel.dispose();
      decoder.dispose();
    };
  }, [accent]);

  const c = chapters[0];

  return (
    <section className="scrollytell">
      <div className="stage">
        <canvas className="rain" ref={rainRef} aria-hidden="true" />
        <div className="bar-top" />
        <div className="bar-bot" />
        <div className="vignette" />
        <div className="stage-inner">
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

          <div className="decode-wrap">
            <canvas className="decode" ref={decodeRef} aria-hidden="true" />
            <div className="decode-scan" />
            <div className="decode-tag">{c.tag}</div>
          </div>
        </div>

        <div className="scrollcue">Scroll to explore</div>
      </div>
    </section>
  );
}
