/**
 * App accent / color palette.
 *
 * The whole site (nav, buttons, the star tunnel, the decoder panel, the
 * progress rail) is driven by ONE accent color. The user picks it from the
 * swatches in the nav; the choice is persisted in localStorage and restored on
 * the next visit. `ACCENT` below is only the default for first-time visitors.
 *
 * Lighter / darker shades are derived from the base color automatically, so a
 * single pick keeps the whole palette consistent.
 */

export const COLOR_PALETTE = {
  gold: "#e6b450",
  amber: "#f5a623",
  cyan: "#22d3ee",
  sky: "#38bdf8",
  violet: "#a78bfa",
  emerald: "#34d399",
  rose: "#fb7185",
  crimson: "#ef4444",
} as const;

export type AccentName = keyof typeof COLOR_PALETTE;

/** Default accent for first-time visitors (before they pick one). */
export const ACCENT: AccentName = "gold";

/** localStorage key holding the user's chosen accent. */
export const STORAGE_KEY = "accent";

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

/** Read the stored accent, falling back to the default if missing/invalid. */
export function storedAccent(): AccentName {
  if (typeof window === "undefined") return ACCENT;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && v in COLOR_PALETTE) return v as AccentName;
  } catch {
    /* localStorage unavailable (private mode, etc.) — use the default */
  }
  return ACCENT;
}

/** Persist the user's accent choice. */
export function saveAccent(name: AccentName): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    /* ignore write failures */
  }
}

/**
 * Read the live accent from the document (set by `applyAccent`), falling back
 * to the stored value. Canvas code uses this when no explicit color is passed.
 */
export function liveAccent(): string {
  if (typeof window === "undefined") return COLOR_PALETTE[ACCENT];
  const v = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
  return v || COLOR_PALETTE[storedAccent()];
}

/**
 * Push the accent (and a derived light shade) onto the document as CSS vars.
 * Defaults to the stored accent so first paint matches the user's last choice.
 */
export function applyAccent(name: AccentName = storedAccent()): void {
  const base = COLOR_PALETTE[name];
  const root = document.documentElement;
  root.style.setProperty("--gold", base);
  root.style.setProperty("--gold2", shade(base, 0.45));
}
