import { useMemo, useState } from "react";
import { FILTER_ALL, FILTER_KEYS, projectsBase, type Project } from "../data/site";
import { useLang } from "../i18n/lang";
import Reveal from "./Reveal";
import ProjectModal from "./ProjectModal";

export default function Work() {
  const { t } = useLang();
  const [active, setActive] = useState(FILTER_ALL);
  const [selected, setSelected] = useState<Project | null>(null);

  // Merge stable project data with the active language's translated text.
  const projects = useMemo<Project[]>(
    () => projectsBase.map((p) => ({ ...p, ...t.projects[p.id] })),
    [t]
  );

  const filters = [FILTER_ALL, ...FILTER_KEYS];
  const shown =
    active === FILTER_ALL ? projects : projects.filter((p) => p.stacks.includes(active));

  return (
    <section className="work">
      <Reveal>
        <div className="sechead">
          <h2>{t.work.head}</h2>
          <p>{t.work.sub}</p>
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
              {f === FILTER_ALL ? t.work.all : f}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="cards">
        {shown.map((p) => (
          <Reveal key={p.id}>
            <article
              className="card"
              role="button"
              tabIndex={0}
              aria-label={p.name}
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
                {p.award && <span className="badge2">{t.work.award}</span>}
              </div>
              <div className="cbody">
                <h3>{p.name}</h3>
                <p>{p.desc}</p>
                <div className="tags">
                  {p.tags.map((tg) => (
                    <span key={tg} className="tag">
                      {tg}
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
