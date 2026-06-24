/**
 * App accent / color palette.
 *
 * The whole site (nav, buttons, the star tunnel, the decoder panel, the
 * progress rail) is driven by ONE accent color. To recolor everything, change
 * `ACCENT` below to any key from `COLOR_PALETTE` and refresh the page.
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

/** 👇 Pick your accent here. Takes effect on page refresh. */
export const ACCENT: AccentName = "gold";

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

/** Resolve the chosen accent to its hex value. */
export function accentColor(): string {
  return COLOR_PALETTE[ACCENT];
}

/**
 * Read the live accent from the document (set by `applyAccent`), falling back
 * to the chosen palette value. Canvas code uses this so it stays in sync.
 */
export function liveAccent(): string {
  if (typeof window === "undefined") return accentColor();
  const v = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
  return v || accentColor();
}

/**
 * Push the accent (and a derived light shade) onto the document as CSS vars.
 * Call once before the app renders so every `--gold` token picks it up.
 */
export function applyAccent(): void {
  const base = accentColor();
  const root = document.documentElement;
  root.style.setProperty("--gold", base);
  root.style.setProperty("--gold2", shade(base, 0.45));
}
