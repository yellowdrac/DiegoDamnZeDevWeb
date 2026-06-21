import { metrics, profile, stack } from "../data/site";
import Reveal from "./Reveal";
import Work from "./Work";

export default function Content() {
  return (
    <main>
      <div className="wrap">
        <section className="intro">
          <Reveal>
            <div className="stackline">
              {stack.map((s) => (
                <span key={s} className="pill">
                  {s}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <aside className="highlight">
              <div>
                <div className="hl-label">★ Career highlight</div>
                <div className="hl-text">
                  I turned an academic research paper into a working production algorithm that
                  reduced material waste in a factory.
                </div>
                <div className="hl-sub">
                  Real, measured impact on the plant floor — not a side project.
                </div>
              </div>
              <div className="viz">
                <div className="vtitle">Material waste — production line</div>
                <div className="vbar before">
                  <span className="name">Before</span>
                  <span className="track">
                    <span className="fill" />
                  </span>
                </div>
                <div className="vbar after">
                  <span className="name">After</span>
                  <span className="track">
                    <span className="fill" />
                  </span>
                </div>
              </div>
            </aside>
          </Reveal>

          <Reveal>
            <div className="metrics">
              {metrics.map((m) => (
                <div key={m.label} className="metric">
                  <div className="num">{m.num}</div>
                  <div className="lbl">{m.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <Work />

        <Reveal>
          <div className="contact">
            <h2>Let's work together.</h2>
            <p>Open to full-stack roles · Remote-friendly · Based in {profile.location}</p>
            <a className="btn solid" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </div>
        </Reveal>

        <footer>
          <a href={profile.github}>github.com/yellowdrac</a> ·{" "}
          <a href={profile.linkedin}>linkedin.com/in/diegdamnze</a>
        </footer>
      </div>
    </main>
  );
}
