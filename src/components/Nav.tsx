import { profile } from "../data/site";

export default function Nav({
  theme,
  onToggle,
}: {
  theme: "dark" | "light";
  onToggle: () => void;
}) {
  const isLight = theme === "light";
  return (
    <nav>
      <div className="logo">
        DIEGO <b>DAMIAN</b>
      </div>
      <div className="navright">
        <button
          className="toggle"
          onClick={onToggle}
          aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
        >
          <span aria-hidden="true">{isLight ? "🌙" : "☀️"}</span>{" "}
          <span>{isLight ? "Dark" : "Light"}</span>
        </button>
        <a className="cv" href={profile.cv}>
          Download CV
        </a>
      </div>
    </nav>
  );
}
