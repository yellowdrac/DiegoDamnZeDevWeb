import { profile } from "../data/site";
import type { AccentName } from "../config/theme";
import AccentPicker from "./AccentPicker";

export default function Nav({
  accent,
  onAccent,
}: {
  accent: AccentName;
  onAccent: (name: AccentName) => void;
}) {
  return (
    <nav>
      <div className="logo">
        DIEGO <b>DAMIAN</b>
      </div>
      <div className="navright">
        <AccentPicker accent={accent} onAccent={onAccent} />
        <a className="cv" href={profile.cv}>
          Download CV
        </a>
      </div>
    </nav>
  );
}
