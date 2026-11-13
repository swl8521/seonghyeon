"use client";
import { useLocale } from "./LocaleProvider";
import { localeHref, translate, type Locale } from "@/lib/locale";
import Link from "./LocaleLink";
import { ShareLandingTracker } from "./ShareLandingTracker";
import type { Sage, Verse } from "@/lib/types";

export interface ShareScreenData {
  ko: { verse: Verse; sage: Sage };
  en: { verse: Verse; sage: Sage };
}

export function ShareScreen({ data, sageId, initialLocale }: { data: ShareScreenData; sageId?: string; initialLocale: Locale }) {
  const context = useLocale();
  const locale = context.ready ? context.locale : initialLocale;
  const { verse, sage } = data[locale];
  const t = (key: string, values?: Record<string, string | number>) => translate(locale, key, values);
  return <main lang={locale} className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
    <ShareLandingTracker kind={sageId ? "sage_verse" : "verse"} sage={sageId ? sage.id : undefined} verseId={verse.id} />
    <p className="font-serif text-xl leading-relaxed">{sageId ? t("누군가 {name}와 함께 읽으며 이 구절을 보냈습니다", { name: sage.name }) : t("누군가 이 구절을 보냈습니다")}</p>
    <div className="w-full rounded-xl border border-border bg-card p-5 text-left">
      <p className="font-serif text-xl leading-snug tracking-wide">{verse.original}</p>
      {verse.reading && <p className="mt-1 text-xs text-muted">{verse.reading}</p>}
      <p className="mt-2 text-sm leading-relaxed">{verse.translation}</p>
      <p className="mt-3 border-t border-border pt-3 font-serif text-sm leading-relaxed text-muted">{verse.note}</p>
      <p className="mt-2 text-right text-xs text-muted">{verse.source}</p>
    </div>
    <Link href={localeHref(sageId ? `/z/${sage.id}?from=share&id=${verse.id}` : `/?from=share&id=${verse.id}`, locale)} className="rounded-full bg-accent px-8 py-3 text-base text-accent-foreground">{t("지금 함께 읽는 구절 보기")}</Link>
  </main>;
}
