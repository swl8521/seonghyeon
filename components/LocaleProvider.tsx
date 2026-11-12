"use client";
import { Icon } from "./Icon";

import { createContext, Suspense, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { activeLocale, isLocale, LOCALE_KEY, translate, localeHref, type Locale } from "@/lib/locale";
import { pageTitle } from "@/lib/page-title";

function LocaleRouteObserver({ sync }: { sync: () => void }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(sync, [pathname, query, sync]);
  return null;
}

const LocaleContext = createContext<{ locale: Locale; ready: boolean; setLocale: (locale: Locale) => void }>({ locale: "ko", ready: false, setLocale: () => {} });
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLanguage] = useState<Locale>("ko");
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const sync = useCallback(() => {
    setLanguage(activeLocale());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.title = pageTitle(pathname, locale);
  }, [locale, pathname, ready]);
  function setLocale(next: Locale) {
    if (!isLocale(next)) return;
    setLanguage(next);
    try { localStorage.setItem(LOCALE_KEY, next); } catch {}
    const url = localeHref(`${window.location.pathname}${window.location.search}${window.location.hash}`, next);
    window.history.replaceState(null, "", url);
  }
  return <LocaleContext.Provider value={{ locale, ready, setLocale }}><Suspense fallback={null}><LocaleRouteObserver sync={sync} /></Suspense>{children}</LocaleContext.Provider>;
}
export function useLocale() {
  const context = useContext(LocaleContext);
  const t = useCallback((key: string, values?: Record<string, string | number>) => translate(context.locale, key, values), [context.locale]);
  const href = useCallback((path: string) => localeHref(path, context.locale), [context.locale]);
  return { ...context, t, href };
}
export function LanguagePicker() {
  const { locale, setLocale } = useLocale();
  return <div className="flex justify-end px-6 pt-3"><label className="flex items-center gap-2 text-xs text-muted"><Icon name="globe" width={16} height={16} /><select aria-label="Language / 언어" value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="max-w-full rounded-lg border border-border bg-card px-2 py-1.5 text-foreground"><option value="ko">한국어</option><option value="en">English</option></select></label></div>;
}
