import { useEffect, useRef, useState } from "react";
import { chapters } from "../data/site";
import { createMatrixRain, createDecoder } from "../lib/matrix";

export default function Hero() {
  const stRef = useRef<HTMLElement>(null);
  const rainRef = useRef<HTMLCanvasElement>(null);
  const decodeRef = useRef<HTMLCanvasElement>(null);
  const [ch, setCh] = useState(0);
  const chRef = useRef(0);

  useEffect(() => {
    const rainCanvas = rainRef.current;
    const decodeCanvas = decodeRef.current;
    const stage = stRef.current;
    if (!rainCanvas || !decodeCanvas || !stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rain = createMatrixRain(rainCanvas);
    const decoder = createDecoder(decodeCanvas);

    decoder.resize();
    decoder.setChapter(chapters[0].visual, reduce);
    if (!reduce) rain.start();
    else rainCanvas.style.display = "none";

    const onResize = () => {
      rain.resize();
      decoder.resize();
    };
    const onScroll = () => {
      const rect = stage.getBoundingClientRect();
      const total = stage.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const next = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
      if (next !== chRef.current) {
        chRef.current = next;
        setCh(next);
        decoder.setChapter(chapters[next].visual, reduce);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    const glitch = reduce ? undefined : window.setInterval(() => decoder.glitch(reduce), 5000);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (glitch) clearInterval(glitch);
      rain.stop();
      decoder.dispose();
    };
  }, []);

  return (
    <section className="scrollytell" ref={stRef}>
      <div className="stage">
        <canvas className="rain" ref={rainRef} aria-hidden="true" />
        <div className="bar-top" />
        <div className="bar-bot" />
        <div className="vignette" />
        <div className="stage-inner">
          <div className="chapters">
            {chapters.map((c, i) => (
              <div key={i} className={`chapter ${i === ch ? "active" : ""}`}>
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
            ))}
          </div>

          <div className="decode-wrap">
            <canvas className="decode" ref={decodeRef} aria-hidden="true" />
            <div className="decode-scan" />
            <div className="decode-tag">{chapters[ch].tag}</div>
          </div>
        </div>

        <div className="progress" aria-hidden="true">
          {chapters.map((_, i) => (
            <i key={i} className={i === ch ? "on" : ""} />
          ))}
        </div>
        <div className="scrollcue">Scroll to explore</div>
      </div>
    </section>
  );
}
