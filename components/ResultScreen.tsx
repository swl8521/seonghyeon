"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { LINES, getVerse } from "@/lib/content";
import { usePlayStore, readCountFor, flippedCountFor } from "@/lib/store";
import { track } from "@/lib/analytics";
import type { Sage } from "@/lib/types";
import { StageCard } from "@/components/StageCard";
import { MoreTalkSheet } from "@/components/MoreTalkSheet";
import { Toast } from "@/components/Toast";

export function ResultScreen({ sage }: { sage: Sage }) {
  const sageId = sage.id;
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
  const [savingImage, setSavingImage] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [moreTalkOpen, setMoreTalkOpen] = useState(false);
  const [moreTalkOptedIn, setMoreTalkOptedIn] = useState(false);
  const trackedRoundIdRef = useRef<string | null>(null);

  useEffect(() => {
    // hasHydrated가 true가 되기 전의 practice === null은 "완료된 수행 없음"이
    // 아니라 "아직 localStorage를 다 읽지 못함"일 수 있다. 이 체크 없이
    // 리다이렉트하면 새로고침할 때마다 전각으로 튕겨나간다.
    if (!hasHydrated) return;
    if (!practice || practice.sage !== sageId || !practice.outcome) {
      router.replace(`/z/${sageId}`);
      return;
    }
    if (trackedRoundIdRef.current === practice.id) return;
    trackedRoundIdRef.current = practice.id;
    track("result_view", {
      sage: sageId,
      head_kind: practice.outcome.headKind,
      picked_verse_id: practice.outcome.pickedVerseId,
    });
  }, [hasHydrated, practice, sageId, router]);

  if (!practice || practice.sage !== sageId || !practice.outcome) return null;
  const outcome = practice.outcome;

  const promoted = practice.stageBefore !== stage;
  const readCount = readCountFor(sageId, readVerseIds);
  const flippedCount = flippedCountFor(sageId, flippedVerseIds);

  const headline = (() => {
    switch (outcome.headKind) {
      case "enter":
        return `${sage.hall}에서 ${sage.name} 문하에 들었습니다`;
      case "promote":
        return `${sage.name} 문하의 ${stage === "senior" ? "고제" : "제자"}가 되었습니다`;
      case "stay":
        return `오늘도 ${sage.name} 문하에서 수행했습니다`;
      case "front":
        return `${sage.name} 문하 앞에 섰습니다`;
      case "none":
        return "아직 문이 열리지 않았습니다";
    }
  })();

  // outcome.lineId는 수행이 끝난 시점에 한 번만 뽑혀 고정된다 — 매 렌더마다
  // 다시 뽑으면 새로고침하거나 다른 상태가 바뀔 때마다 대사가 바뀌어버린다.
  const line = outcome.lineId ? LINES.find((l) => l.id === outcome.lineId) : undefined;
  const pickedVerse = outcome.pickedVerseId ? getVerse(outcome.pickedVerseId) : null;

  function handleShare() {
    if (!pickedVerse) return;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const url = `${siteUrl}/s/${sageId}/${pickedVerse.id}?ref=share`;
    const shareData = {
      title: `${sage.name} 문하에 들었습니다 — 성현 문하`,
      text: `${sage.name} 문하에 들었습니다. "${pickedVerse.translation}"`,
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
    router.push(`/z/${sageId}/practice`);
  }

  async function handleSaveImage() {
    if (!pickedVerse || savingImage) return;
    setSavingImage(true);
    try {
      const params = new URLSearchParams({ stage });
      const res = await fetch(`/s/${sageId}/${pickedVerse.id}/story?${params.toString()}`);
      if (!res.ok) throw new Error("failed to generate image");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `seonghyeon-${sageId}-${pickedVerse.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      track("image_save", { sage: sageId, verse_id: pickedVerse.id, stage });
    } catch {
      setSaveError(true);
    } finally {
      setSavingImage(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8">
      <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="font-serif text-2xl font-bold leading-snug">{headline}</h1>
        {line && (
          <div className="flex flex-col gap-1">
            {line.original && <p className="font-serif text-sm text-muted">{line.original}</p>}
            <p className="font-serif text-base leading-relaxed">{line.text}</p>
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
          <p className="mt-2 font-sans text-sm text-muted">와닿는 구절을 더 찾아보게.</p>
        )}

        {pickedVerse && (
          <div className="mt-3 flex w-full flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="w-full rounded-full bg-accent py-3 font-sans text-sm font-bold text-accent-foreground"
            >
              보내기
            </button>
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={savingImage}
              className="w-full rounded-full border border-border py-3 font-sans text-sm text-foreground disabled:opacity-50"
            >
              {savingImage ? "이미지 만드는 중..." : "이미지 저장"}
            </button>
          </div>
        )}
      </section>

      <StageCard
        stage={stage}
        devotion={devotion}
        readCount={readCount}
        flippedCount={flippedCount}
        promoted={promoted}
        className="mx-auto"
      />

      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer font-sans text-sm text-foreground">
          이번 수행 {practice.deck.length}구절
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {practice.deck.map((verseId) => {
            const v = getVerse(verseId);
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
                          {liked && <span className="ml-2 text-xs text-accent">낙관</span>}
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
                      aria-label="이 구절을 대표로"
                      className={`shrink-0 text-lg ${isPicked ? "text-accent" : "text-muted"}`}
                    >
                      {isPicked ? "★" : "☆"}
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
          다시 수행
        </button>
        <button
          type="button"
          onClick={() => router.push(`/z/${sageId}`)}
          className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground"
        >
          전각으로
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground"
        >
          광장으로
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setMoreTalkOpen(true);
          track("more_talk_click", { head_sage: sageId });
        }}
        className="mx-auto font-sans text-xs text-muted underline underline-offset-4"
      >
        성현께 직접 여쭙기
      </button>

      <AnimatePresence>
        {copied && <Toast text="복사됨" onDone={() => setCopied(false)} />}
        {saveError && (
          <Toast text="이미지 저장에 실패했습니다" onDone={() => setSaveError(false)} />
        )}
      </AnimatePresence>

      <MoreTalkSheet
        open={moreTalkOpen}
        optedIn={moreTalkOptedIn}
        onOptIn={() => {
          setMoreTalkOptedIn(true);
          track("more_talk_optin", { head_sage: sageId });
        }}
        onClose={() => setMoreTalkOpen(false)}
      />
    </main>
  );
}
