import { useEffect, useRef, useState } from "react";
import { DEFAULT_SWATCHES, PRESETS } from "../config/theme";

const toInputHex = (hex: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000");

/**
 * Accent color picker for the nav. Four default swatches inline (yellow, green,
 * purple, sky-blue) plus a rainbow "more" button that reveals an extended
 * palette and a fully custom color input. Opens on hover or click; any color
 * works — the choice is a free hex value, not a fixed list.
 */
export default function AccentPicker({
  accent,
  onAccent,
}: {
  accent: string;
  onAccent: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Stay open until the user picks a color or clicks away / presses Escape —
  // it does NOT close on mouse-leave, so you can move into the popover.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (hex: string) => hex.toLowerCase() === accent.toLowerCase();

  return (
    <div className="palette" ref={wrapRef} onMouseEnter={() => setOpen(true)}>
      <div className="palette-row" role="radiogroup" aria-label="Color de acento">
        {DEFAULT_SWATCHES.map((s) => (
          <button
            key={s.hex}
            type="button"
            role="radio"
            aria-checked={isActive(s.hex)}
            aria-label={s.name}
            title={s.name}
            className={`swatch${isActive(s.hex) ? " on" : ""}`}
            style={{ background: s.hex }}
            onClick={() => onAccent(s.hex)}
          />
        ))}

        <button
          type="button"
          className={`swatch-more${open ? " open" : ""}`}
          aria-label="Más colores"
          aria-expanded={open}
          title="Más colores"
          onClick={() => setOpen(true)}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      {open && (
        <div className="palette-pop" role="dialog" aria-label="Paleta de colores">
          <div className="palette-grid">
            {PRESETS.map((s) => (
              <button
                key={s.hex}
                type="button"
                aria-label={s.name}
                title={s.name}
                className={`swatch${isActive(s.hex) ? " on" : ""}`}
                style={{ background: s.hex }}
                onClick={() => onAccent(s.hex)}
              />
            ))}
          </div>

          <label className="palette-custom">
            <span className="palette-custom-label">Personalizado</span>
            <input
              type="color"
              value={toInputHex(accent)}
              onChange={(e) => onAccent(e.target.value)}
              aria-label="Color personalizado"
            />
          </label>
        </div>
      )}
    </div>
  );
}
