import { useState } from "react";
import { filters, projects, type Project } from "../data/site";
import Reveal from "./Reveal";
import ProjectModal from "./ProjectModal";

export default function Work() {
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState<Project | null>(null);
  const shown = active === "All" ? projects : projects.filter((p) => p.stacks.includes(active));

  return (
    <section className="work">
      <Reveal>
        <div className="sechead">
          <h2>Selected Work</h2>
          <p>Three products I designed, built, and shipped. Click any for details.</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`chip ${active === f ? "on" : ""}`}
              onClick={() => setActive(f)}
              aria-pressed={active === f}
            >
              {f}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="cards">
        {shown.map((p) => (
          <Reveal key={p.name}>
            <article
              className="card"
              role="button"
              tabIndex={0}
              aria-label={`View ${p.name} details`}
              onClick={(e) => {
                e.currentTarget.focus();
                setSelected(p);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(p);
                }
              }}
            >
              <div className="thumb">
                {p.short}
                {p.award && <span className="badge2">★ Award-winning</span>}
              </div>
              <div className="cbody">
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <div className="tags">
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
