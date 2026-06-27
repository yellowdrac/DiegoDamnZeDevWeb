import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { content, type Content, type Lang } from "./content";

const KEY = "lang";

function storedLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = localStorage.getItem(KEY);
    if (v === "en" || v === "es") return v;
  } catch {
    /* localStorage unavailable */
  }
  return "en";
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translated content for the active language. */
  t: Content;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(storedLang);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  return <Ctx.Provider value={{ lang, setLang, t: content[lang] }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLang must be used within <LangProvider>");
  return c;
}
