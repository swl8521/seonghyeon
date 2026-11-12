"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isLocale, LOCALE_KEY, resolveLocale, translate, localeHref, type Locale } from "@/lib/locale";

const LocaleContext = createContext<{ locale: Locale; ready: boolean; setLocale: (locale: Locale) => void }>({ locale: "ko", ready: false, setLocale: () => {} });
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLanguage] = useState<Locale>("ko");
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    function sync() {
      let saved: string | null = null;
      try { saved = localStorage.getItem(LOCALE_KEY); } catch {}
      setLanguage(resolveLocale(new URLSearchParams(window.location.search).get("lang"), saved, navigator.languages));
      setReady(true);
    }
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [pathname]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, "성현 문하");
  }, [locale]);
  function setLocale(next: Locale) {
    if (!isLocale(next)) return;
    setLanguage(next);
    try { localStorage.setItem(LOCALE_KEY, next); } catch {}
    const url = localeHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, next);
    window.history.replaceState(null, "", url);
  }
  return <LocaleContext.Provider value={{ locale, ready, setLocale }}>{children}</LocaleContext.Provider>;
}
export function useLocale() {
  const context = useContext(LocaleContext);
  const t = useCallback((key: string, values?: Record<string, string | number>) => translate(context.locale, key, values), [context.locale]);
  const href = useCallback((path: string) => localeHref(path, context.locale), [context.locale]);
  return { ...context, t, href };
}
export function LanguagePicker() {
  const { locale, setLocale } = useLocale();
  return <div className="flex justify-end px-6 pt-3"><label className="flex items-center gap-2 text-xs text-muted"><span aria-hidden>🌐</span><select aria-label="Language / 언어" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="max-w-full rounded-lg border border-border bg-card px-2 py-1.5 text-foreground"><option value="ko">한국어</option><option value="en">English</option></select></label></div>;
}
