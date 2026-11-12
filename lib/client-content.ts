"use client";

import type { Locale } from "./locale";
import type { Sage, SageId, SageLine, Verse } from "./types";

export interface LocalizedValue<T> {
  ko: T;
  en: T;
}

export interface ContentPayload {
  sages: LocalizedValue<Sage>[];
  verses: LocalizedValue<Verse>[];
  lines: LocalizedValue<SageLine>[];
}

const sages = new Map<SageId, LocalizedValue<Sage>>();
const verses = new Map<string, LocalizedValue<Verse>>();
const lines = new Map<string, LocalizedValue<SageLine>>();

export function installContent(payload: ContentPayload): void {
  for (const value of payload.sages) sages.set(value.ko.id, value);
  for (const value of payload.verses) verses.set(value.ko.id, value);
  for (const value of payload.lines) lines.set(value.ko.id, value);
}

export function clientSage(id: SageId, locale: Locale = "ko"): Sage | undefined {
  return sages.get(id)?.[locale];
}

export function clientVerse(id: string, locale: Locale = "ko"): Verse | undefined {
  return verses.get(id)?.[locale];
}

export function clientLine(id: string, locale: Locale = "ko"): SageLine | undefined {
  return lines.get(id)?.[locale];
}

export function clientVerses(sage?: SageId, locale: Locale = "ko"): Verse[] {
  return Array.from(verses.values(), (value) => value[locale]).filter(
    (verse) => !sage || verse.sage === sage
  );
}

export function clientLines(sage?: SageId, locale: Locale = "ko"): SageLine[] {
  return Array.from(lines.values(), (value) => value[locale]).filter(
    (line) => !sage || line.sage === sage
  );
}

export function localizedClientLineByKoreanText(text: string, locale: Locale): string {
  for (const value of lines.values()) {
    if (value.ko.text === text) return value[locale].text;
  }
  return text;
}

export async function loadContent(ids: string[]): Promise<void> {
  const missing = Array.from(new Set(ids)).filter((id) => !verses.has(id));
  if (missing.length === 0) return;
  const params = new URLSearchParams({ ids: missing.join(",") });
  const response = await fetch(`/api/content?${params}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`content ${response.status}`);
  installContent((await response.json()) as ContentPayload);
}

