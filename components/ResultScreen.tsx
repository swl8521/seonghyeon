"use client";

import { localizedSage, localizedVerse, localizedLine } from "@/lib/localized-content";
import { useLocale } from "@/components/LocaleProvider";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { LINES } from "@/lib/content";
import { usePlayStore, readCountFor, flippedCountFor } from "@/lib/store";
import { track } from "@/lib/analytics";
import type { Sage } from "@/lib/types";
import { StageCard } from "@/components/StageCard";
import { Icon } from "./Icon";
import { KakaoShareButton } from "@/components/KakaoShareButton";
import { MoreTalkSheet } from "@/components/MoreTalkSheet";
import { Toast } from "@/components/Toast";
import { useLive } from "@/lib/live";
import { activeLocale, localeHref, stageLabel } from "@/lib/locale";

export function ResultScreen({ sage: initialSage }: { sage: Sage }) {
  const { locale, t, href, ready } = useLocale();
  const sage = localizedSage(initialSage.id, locale)!;
  const sageId = sage.id;
  useLive(sageId);
  const router = useRouter();

  const hasHydrated = usePlayStore((s) => s.hasHydrated);
  const practice = usePlayStore((s) => s.practice);
  const stage = usePlayStore((s) => s.stage[sageId]);
  const devotion = usePlayStore((s) => s.devotion[sageId]);
  const readVerseIds = usePlayStore((s) => s.readVerseIds);
  const flippedVerseIds = usePlayStore((s) => s.flippedVerseIds);
  const startPractice = usePlayStore((s) => s.startPractice);
  const pickHeadlineVerse = usePlayStore((s) => s.pickHeadlineVerse);

  const [pickedFlipped, setPickedFlipped] = useState(false);
  const [listFlipped, setListFlipped] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [moreTalkOpen, setMoreTalkOpen] = useState(false);
  const [moreTalkOptedIn, setMoreTalkOptedIn] = useState(false);
  const trackedRoundIdRef = useRef<string | null>(null);

  useEffect(() => {
    // hasHydrated가 true가 되기 전의 practice === null은 "완료된 수행 없음"이
    // 아니라 "아직 localStorage를 다 읽지 못함"일 수 있다. 이 체크 없이
    // 리다이렉트하면 새로고침할 때마다 전각으로 튕겨나간다.
    if (!hasHydrated || !ready) return;
    if (!practice || practice.sage !== sageId || !practice.outcome) {
      router.replace(localeHref(`/z/${sageId}`, activeLocale()));
      return;
    }
    if (trackedRoundIdRef.current === practice.id) return;
    trackedRoundIdRef.current = practice.id;
    track("result_view", {
      sage: sageId,
      head_kind: practice.outcome.headKind,
      picked_verse_id: practice.outcome.pickedVerseId,
    });
  }, [hasHydrated, ready, practice, sageId, router]);

  if (!practice || practice.sage !== sageId || !practice.outcome) return null;
  const outcome = practice.outcome;

  const readCount = readCountFor(sageId, readVerseIds);
  const flippedCount = flippedCountFor(sageId, flippedVerseIds);

  const headline = (() => {
    if (outcome.headKind === "enter" || outcome.headKind === "promote") return t("{name}와 함께 {stage} 단계로 자랐어요", { name: sage.name, stage: stageLabel(stage, locale) });
    if (outcome.headKind === "stay") return t("오늘도 {name}와 함께 읽었어요", { name: sage.name });
    if (outcome.headKind === "front") return t("{name}와 함께 배움의 씨앗을 심었어요", { name: sage.name });
    return t("마음에 드는 구절을 더 찾아보세요");
  })();

  // outcome.lineId는 수행이 끝난 시점에 한 번만 뽑혀 고정된다 — 매 렌더마다
  // 다시 뽑으면 새로고침하거나 다른 상태가 바뀔 때마다 대사가 바뀌어버린다.
  const line = outcome.lineId ? LINES.find((l) => l.id === outcome.lineId) : undefined;
  const pickedVerse = outcome.pickedVerseId ? localizedVerse(outcome.pickedVerseId, locale) : null;

  function handleShare() {
    if (!pickedVerse) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const url = `${siteUrl}/s/${sageId}/${pickedVerse.id}?ref=share&lang=${locale}`;
    const shareData = {
      title: t("{name}와 함께 읽은 구절", { name: sage.name }),
      text: pickedVerse.translation,
      url,
    };

    if (typeof navigator.share === "function") {
      navigator.share(shareData).then(
        () => track("share_click", { kind: "sage_verse", sage: sageId, verse_id: pickedVerse.id, method: "native" }),
        () => {}
      );
      return;
    }

    const copy = navigator.clipboard
      ? navigator.clipboard.writeText(url)
      : Promise.reject(new Error("no clipboard"));
    copy
      .then(() => {
        setCopied(true);
        track("share_click", { kind: "sage_verse", sage: sageId, verse_id: pickedVerse.id, method: "copy" });
      })
      .catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        setCopied(true);
      });
  }

  function handleRestart() {
    track("restart", { sage: sageId });
    startPractice(sageId);
    router.push(href(`/z/${sageId}/practice`));
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8">
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="font-serif text-2xl font-bold leading-snug">{headline}</h1>
        {line && (
          <div className="flex flex-col gap-1">
            {line.original && <p className="font-serif text-sm text-muted">{line.original}</p>}
            <p className="font-serif text-base leading-relaxed">{localizedLine(line.id, locale)}</p>
          </div>
        )}

        {pickedVerse ? (
          <div
            onClick={() => setPickedFlipped((f) => !f)}
            className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-background p-5"
          >
            {!pickedFlipped ? (
              <>
                <p className="font-serif text-xl leading-snug tracking-wide">{pickedVerse.original}</p>
                <p className="mt-1 font-sans text-xs text-muted">{pickedVerse.reading}</p>
                <p className="mt-2 font-sans text-sm leading-relaxed">{pickedVerse.translation}</p>
                <p className="mt-2 text-right text-xs text-muted">{pickedVerse.source}</p>
              </>
            ) : (
              <p className="font-serif text-base leading-relaxed text-muted">{pickedVerse.note}</p>
            )}
          </div>
        ) : (
          <p className="mt-2 font-sans text-sm text-muted">{t("마음에 드는 구절을 더 찾아보세요")}</p>
        )}

        {pickedVerse && (
          <div className="mt-3 flex w-full flex-col items-center gap-2">
            <KakaoShareButton
              title={t("{name}와 함께 읽은 구절", { name: sage.name })}
              description={pickedVerse.translation}
              imagePath={`/s/${sageId}/${pickedVerse.id}/opengraph-image`}
              sharePath={`/s/${sageId}/${pickedVerse.id}?ref=share`}
              onShared={() => track("share_click", { kind: "sage_verse", sage: sageId, verse_id: pickedVerse.id, method: "kakao" })}
            />
            <button
              type="button"
              onClick={handleShare}
              className="w-full rounded-full bg-accent py-3 font-sans text-sm font-bold text-accent-foreground"
            >
              {t("보내기")}
            </button>
          </div>
        )}
      </section>

      <StageCard
        fullWidth
        sage={sageId}
        stage={stage}
        devotion={devotion}
        readCount={readCount}
        flippedCount={flippedCount}
        className="mx-auto"
      />

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer font-sans text-sm text-foreground">
          {t("이번에 읽은 {count}구절", { count: practice.deck.length })}
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {practice.deck.map((verseId) => {
            const v = localizedVerse(verseId, locale);
            if (!v) return null;
            const liked = practice.likedIds.includes(verseId);
            const isPicked = outcome.pickedVerseId === verseId;
            const flipped = listFlipped.includes(verseId);
            return (
              <li key={verseId} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() =>
                      setListFlipped((prev) =>
                        prev.includes(verseId) ? prev.filter((id) => id !== verseId) : [...prev, verseId]
                      )
                    }
                    className="flex-1 cursor-pointer"
                  >
                    {!flipped ? (
                      <>
                        <p className="font-serif text-base">
                          {v.original}
                          {liked && <span className="ml-2 text-xs text-accent">{t("마음에 듦")}</span>}
                        </p>
                        <p className="mt-1 font-sans text-xs text-muted">{v.translation}</p>
                      </>
                    ) : (
                      <p className="font-serif text-sm text-muted">{v.note}</p>
                    )}
                  </div>
                  {liked && (
                    <button
                      type="button"
                      onClick={() => pickHeadlineVerse(verseId)}
                      aria-label={t("이 구절을 대표로")}
                      className={`shrink-0 text-lg ${isPicked ? "text-accent" : "text-muted"}`}
                    >
                      <Icon name="star" filled={isPicked} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRestart}
          className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground"
        >
          {t("다시 읽기")}
        </button>
        <button
          type="button"
          onClick={() => router.push(href(`/z/${sageId}`))}
          className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground"
        >
          {t("배움터로")}
        </button>
        <button
          type="button"
          onClick={() => router.push(href("/"))}
          className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground"
        >
          {t("광장으로")}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setMoreTalkOpen(true);
          track("more_talk_click", { sage: sageId });
        }}
        className="mx-auto font-sans text-xs text-muted underline underline-offset-4"
      >
        {t("성현께 직접 여쭙기")}
      </button>

      <AnimatePresence>
        {copied && <Toast text={t("복사됨")} onDone={() => setCopied(false)} />}
      </AnimatePresence>

      <MoreTalkSheet
        open={moreTalkOpen}
        optedIn={moreTalkOptedIn}
        onOptIn={() => {
          setMoreTalkOptedIn(true);
          track("more_talk_optin", { sage: sageId });
        }}
        onClose={() => setMoreTalkOpen(false)}
      />
    </main>
  );
}
