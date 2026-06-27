import { useCallback, useEffect, useState } from "react";
import { applyAccent, saveAccent, storedAccent } from "../config/theme";

/**
 * Accent color state (a hex string), persisted to localStorage. On mount it
 * restores the user's last choice; changing it re-applies the CSS vars and
 * saves it. The canvas (star tunnel + decoder) re-reads the color via the
 * `accent` prop, so the whole site recolors live — no refresh needed.
 */
export function useAccent() {
  const [accent, setAccentState] = useState<string>(storedAccent);

  useEffect(() => {
    applyAccent(accent);
    saveAccent(accent);
  }, [accent]);

  const setAccent = useCallback((hex: string) => setAccentState(hex), []);

  return { accent, setAccent };
}
