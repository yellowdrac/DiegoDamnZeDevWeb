/**
 * App accent color.
 *
 * The whole site (nav, buttons, the star tunnel, the decoder panel, the
 * progress rail) is driven by ONE accent color, stored as a free-form hex value
 * (so any color works — not a fixed list). The user picks it from the swatches
 * in the nav: four defaults inline, plus a "more" button that reveals an
 * extended palette and a fully custom color input. The choice is persisted in
 * localStorage and restored on the next visit.
 *
 * Lighter / darker shades are derived from the base color automatically.
 */

export interface Swatch {
  name: string;
  hex: string;
}

/** Default accent for first-time visitors (yellow / amarillo). */
export const DEFAULT_ACCENT = "#e6b450";

/** localStorage key holding the user's chosen accent hex. */
export const STORAGE_KEY = "accent";

/** The four swatches shown inline by default: yellow, green, purple, sky-blue. */
export const DEFAULT_SWATCHES: Swatch[] = [
  { name: "Amarillo", hex: "#e6b450" },
  { name: "Verde", hex: "#34d399" },
  { name: "Morado", hex: "#a78bfa" },
  { name: "Celeste", hex: "#38bdf8" },
];

/** Extended palette revealed by the "more colors" button. */
export const PRESETS: Swatch[] = [
  { name: "Amarillo", hex: "#e6b450" },
  { name: "Ámbar", hex: "#f59e0b" },
  { name: "Naranja", hex: "#fb923c" },
  { name: "Rojo", hex: "#ef4444" },
  { name: "Rosa", hex: "#fb7185" },
  { name: "Fucsia", hex: "#e879f9" },
  { name: "Morado", hex: "#a78bfa" },
  { name: "Índigo", hex: "#818cf8" },
  { name: "Azul", hex: "#60a5fa" },
  { name: "Celeste", hex: "#38bdf8" },
  { name: "Cian", hex: "#22d3ee" },
  { name: "Turquesa", hex: "#2dd4bf" },
  { name: "Esmeralda", hex: "#34d399" },
  { name: "Verde", hex: "#4ade80" },
  { name: "Lima", hex: "#a3e635" },
  { name: "Blanco", hex: "#f4f1ea" },
];

/** True for #rgb or #rrggbb. */
export function isHex(v: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

/** Lighten (amt > 0, toward white) or darken (amt < 0, toward black) a hex color. */
export function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amt));
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/** Read the stored accent hex, falling back to the default if missing/invalid. */
export function storedAccent(): string {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && isHex(v)) return v;
  } catch {
    /* localStorage unavailable (private mode, etc.) — use the default */
  }
  return DEFAULT_ACCENT;
}

/** Persist the user's accent choice. */
export function saveAccent(hex: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, hex);
  } catch {
    /* ignore write failures */
  }
}

/**
 * Read the live accent from the document (set by `applyAccent`), falling back
 * to the stored value. Canvas code uses this when no explicit color is passed.
 */
export function liveAccent(): string {
  if (typeof window === "undefined") return storedAccent();
  const v = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
  return v || storedAccent();
}

/**
 * Push the accent (and a derived light shade) onto the document as CSS vars.
 * Defaults to the stored accent so first paint matches the user's last choice.
 */
export function applyAccent(hex: string = storedAccent()): void {
  const root = document.documentElement;
  root.style.setProperty("--gold", hex);
  root.style.setProperty("--gold2", shade(hex, 0.45));
}
