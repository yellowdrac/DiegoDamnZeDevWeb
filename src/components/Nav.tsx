import { profile } from "../data/site";
import { useLang } from "../i18n/lang";
import AccentPicker from "./AccentPicker";
import LangToggle from "./LangToggle";

export default function Nav({
  accent,
  onAccent,
}: {
  accent: string;
  onAccent: (hex: string) => void;
}) {
  const { t } = useLang();
  return (
    <nav>
      <div className="nav-inner">
        <div className="logo">
          DIEGO <b>DAMIAN</b>
        </div>
        <div className="navright">
          <LangToggle />
          <AccentPicker accent={accent} onAccent={onAccent} />
          <a className="cv" href={profile.cv}>
            {t.nav.cv}
          </a>
        </div>
      </div>
    </nav>
  );
}
