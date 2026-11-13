import type { Metadata } from "next";
import { localizedSage, localizedVerse } from "./localized-content";
import { localeHref, translate, type Locale } from "./locale";
import type { SageId } from "./types";
import { BRAND } from "./constants";

export function resolveShare(verseId: string, locale: Locale, sageId?: string) {
  const verse = localizedVerse(verseId, locale);
  if (!verse || (sageId !== undefined && verse.sage !== sageId)) return null;
  const sage = localizedSage(verse.sage as SageId, locale);
  return sage ? { verse, sage } : null;
}
export function shareMetadata(verseId: string, locale: Locale, sageId?: string): Metadata {
  const data = resolveShare(verseId, locale, sageId);
  if (!data) return {};
  const { verse, sage } = data;
  const title = sageId ? translate(locale, "{name}와 함께 읽은 구절", { name: sage.name }) : BRAND;
  const description = `${verse.translation} · ${verse.source}`;
  const path = sageId ? `/s/${sage.id}/${verse.id}` : `/v/${verse.id}`;
  const image = localeHref(`${path}/opengraph-image`, locale);
  return {
    title, description,
    alternates: { canonical: localeHref(path, locale), languages: { ko: localeHref(path, "ko"), en: localeHref(path, "en") } },
    openGraph: { title, description, locale: locale === "en" ? "en_US" : "ko_KR", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
