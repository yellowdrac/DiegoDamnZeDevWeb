import { COLOR_PALETTE, type AccentName } from "../config/theme";

/** Row of color swatches in the nav. Picking one recolors the site and saves it. */
export default function AccentPicker({
  accent,
  onAccent,
}: {
  accent: AccentName;
  onAccent: (name: AccentName) => void;
}) {
  const names = Object.keys(COLOR_PALETTE) as AccentName[];
  return (
    <div className="palette" role="radiogroup" aria-label="Accent color">
      {names.map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={name === accent}
          aria-label={`Accent ${name}`}
          title={name}
          className={`swatch${name === accent ? " on" : ""}`}
          style={{ background: COLOR_PALETTE[name] }}
          onClick={() => onAccent(name)}
        />
      ))}
    </div>
  );
}
