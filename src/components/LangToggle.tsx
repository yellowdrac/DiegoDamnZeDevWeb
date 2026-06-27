import { useLang } from "../i18n/lang";
import type { Lang } from "../i18n/content";

/** Simplified US flag (stripes + canton) — recognizable at nav size. */
function UsFlag() {
  const stripe = 16 / 13;
  return (
    <svg className="flag" viewBox="0 0 24 16" aria-hidden="true">
      {Array.from({ length: 13 }).map((_, i) => (
        <rect
          key={i}
          x="0"
          y={i * stripe}
          width="24"
          height={stripe}
          fill={i % 2 === 0 ? "#b22234" : "#ffffff"}
        />
      ))}
      <rect x="0" y="0" width="10" height={stripe * 7} fill="#3c3b6e" />
    </svg>
  );
}

/** Spain flag (red / yellow / red bands). */
function EsFlag() {
  return (
    <svg className="flag" viewBox="0 0 24 16" aria-hidden="true">
      <rect x="0" y="0" width="24" height="16" fill="#c60b1e" />
      <rect x="0" y="4" width="24" height="8" fill="#ffc400" />
    </svg>
  );
}

const OPTIONS: { code: Lang; label: string; Flag: () => JSX.Element }[] = [
  { code: "en", label: "EN", Flag: UsFlag },
  { code: "es", label: "ES", Flag: EsFlag },
];

/** Language switch with flags: US for English, Spain for Spanish. */
export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="langtoggle" role="group" aria-label="Language / Idioma">
      {OPTIONS.map(({ code, label, Flag }) => (
        <button
          key={code}
          type="button"
          className={lang === code ? "on" : ""}
          aria-pressed={lang === code}
          aria-label={code === "en" ? "English" : "Español"}
          onClick={() => setLang(code)}
        >
          <Flag />
          <span className="lang-code">{label}</span>
        </button>
      ))}
    </div>
  );
}
