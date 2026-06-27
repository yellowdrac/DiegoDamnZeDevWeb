import { profile, stack } from "../data/site";
import { useLang } from "../i18n/lang";
import Reveal from "./Reveal";
import Work from "./Work";

export default function Content() {
  const { t } = useLang();
  const contactSub = t.contact.sub.replace("{location}", profile.location);

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
                <div className="hl-label">{t.intro.highlightLabel}</div>
                <div className="hl-text">{t.intro.hlText}</div>
                <div className="hl-sub">{t.intro.hlSub}</div>
              </div>
              <div className="viz">
                <div className="vtitle">{t.intro.vizTitle}</div>
                <div className="vbar before">
                  <span className="name">{t.intro.before}</span>
                  <span className="track">
                    <span className="fill" />
                  </span>
                </div>
                <div className="vbar after">
                  <span className="name">{t.intro.after}</span>
                  <span className="track">
                    <span className="fill" />
                  </span>
                </div>
              </div>
            </aside>
          </Reveal>

          <Reveal>
            <div className="metrics">
              {t.metrics.map((m) => (
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
            <h2>{t.contact.title}</h2>
            <p>{contactSub}</p>
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
