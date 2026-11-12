import english from "@/content/i18n/en.json";
import type { Stage } from "./types";

export type Locale = "ko" | "en";
export const LOCALE_KEY = "seonghyeon-language";
export function isLocale(value: unknown): value is Locale { return value === "ko" || value === "en"; }
export function resolveLocale(explicit: unknown, saved?: unknown, languages: readonly string[] = []): Locale {
  if (isLocale(explicit)) return explicit;
  if (isLocale(saved)) return saved;
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return "en";
}
export function localeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://local.invalid");
  url.searchParams.set("lang", locale);
  return `${url.pathname}${url.search}${url.hash}`;
}
export function translate(locale: Locale, key: string, values: Record<string, string | number> = {}): string {
  const template = locale === "en" ? (english as Record<string, string>)[key] ?? key : key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}
const labels: Record<Locale, Record<Stage, string>> = {
  ko: { outside: "씨앗", entered: "새싹", disciple: "나무", senior: "고목" },
  en: { outside: "Seed", entered: "Sprout", disciple: "Tree", senior: "Ancient Tree" },
};
export function stageLabel(stage: Stage, locale: Locale): string { return labels[locale][stage]; }
