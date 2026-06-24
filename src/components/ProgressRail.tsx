import { useEffect, useRef, useState } from "react";

type Section = { selector: string; label: string };

/** Page sections the rail tracks, top to bottom. */
const SECTIONS: Section[] = [
  { selector: ".scrollytell", label: "Intro" },
  { selector: "section.work", label: "Work" },
  { selector: ".contact", label: "Contact" },
];

/**
 * Fixed reading-progress rail on the right edge. Native scroll stays intact —
 * this is an indicator, not a scroll hijack. The fill tracks page scroll;
 * section ticks light as you pass them and double as keyboard-reachable
 * jump buttons (44px hit area).
 */
export default function ProgressRail() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);
  const [ticks, setTicks] = useState<number[]>(() => SECTIONS.map(() => 0));
  const [hidden, setHidden] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const scrollableNow = () =>
      document.documentElement.scrollHeight - window.innerHeight;

    // Document-absolute top of an element (offsetTop is relative to the
    // offsetParent, which differs per section, so it can't be used here).
    const docTop = (el: HTMLElement) =>
      el.getBoundingClientRect().top + window.scrollY;

    const measure = () => {
      const scrollable = scrollableNow();
      if (scrollable < 80) {
        setHidden(true);
        return;
      }
      setHidden(false);
      setTicks(
        SECTIONS.map((s) => {
          const el = document.querySelector<HTMLElement>(s.selector);
          return el ? Math.min(1, Math.max(0, docTop(el) / scrollable)) : 0;
        })
      );
    };

    const update = () => {
      rafRef.current = 0;
      const scrollable = scrollableNow();
      const y = window.scrollY;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, y / scrollable)) : 0);
      // A section is active once its top crosses 55% down the viewport.
      const line = y + window.innerHeight * 0.55;
      let idx = 0;
      SECTIONS.forEach((s, i) => {
        const el = document.querySelector<HTMLElement>(s.selector);
        if (el && docTop(el) <= line) idx = i;
      });
      // A short trailing section's top can sit below the deepest scroll
      // position, so snap to the last section once we're near the bottom.
      if (scrollable - y < 120) idx = SECTIONS.length - 1;
      setActive(idx);
    };

    const onScroll = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    // re-measure once fonts/layout settle so tick offsets are accurate
    const settle = window.setTimeout(measure, 600);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(settle);
    };
  }, []);

  const jump = (selector: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  if (hidden) return null;

  return (
    <div className="prail">
      <div className="prail-track" aria-hidden="true" />
      <div className="prail-fill" style={{ height: `${progress * 100}%` }} aria-hidden="true" />
      <div className="prail-cap" style={{ top: `${progress * 100}%` }} aria-hidden="true" />
      {SECTIONS.map((s, i) => (
        <button
          key={s.selector}
          type="button"
          className={`prail-tick${i <= active ? " passed" : ""}${i === active ? " active" : ""}`}
          style={{ top: `${(ticks[i] ?? 0) * 100}%` }}
          onClick={() => jump(s.selector)}
          aria-label={`Jump to ${s.label}`}
          aria-current={i === active ? "true" : undefined}
        />
      ))}
    </div>
  );
}
