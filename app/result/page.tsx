"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { SAGES, getSage, getVerse } from "@/lib/content";
import { usePlayStore } from "@/lib/store";
import { computeResult } from "@/lib/judge";
import { buildResultNarrative } from "@/lib/narrative";
import { track } from "@/lib/analytics";
import { Toast } from "@/components/Toast";
import { MoreTalkSheet } from "@/components/MoreTalkSheet";
import { KakaoShareButton } from "@/components/KakaoShareButton";
import { useDragScroll } from "@/lib/useDragScroll";
import { MonkeyCharacter } from "@/components/MonkeyCharacter";
import { getVersePose } from "@/lib/monkey";

export default function ResultPage() {
  const router = useRouter();
  const round = usePlayStore((s) => s.round);
  const hasHydrated = usePlayStore((s) => s.hasHydrated);
  const likedVerseIds = usePlayStore((s) => s.likedVerseIds);
  const roundsPlayed = usePlayStore((s) => s.roundsPlayed);
  const startRound = usePlayStore((s) => s.startRound);
  const [copied, setCopied] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [moreTalkOpen, setMoreTalkOpen] = useState(false);
  const [moreTalkOptedIn, setMoreTalkOptedIn] = useState(false);
  const trackedRoundId = useRef<string | null>(null);
  const matchesRef = useRef<HTMLUListElement>(null);
  useDragScroll(matchesRef, [likedVerseIds.length]);

  const done = !!round && round.index >= round.deck.length;

  useEffect(() => {
    // 하이드레이션이 끝나기 전엔 round가 일시적으로 null일 수 있으므로
    // 그 전에는 리다이렉트하지 않는다.
    if (hasHydrated && (!round || !done)) {
      router.replace("/play");
    }
  }, [hasHydrated, round, done, router]);

  useEffect(() => {
    if (!round || !done) return;
    if (trackedRoundId.current === round.roundId) return;
    trackedRoundId.current = round.roundId;

    const result = computeResult(round.roundUser, round.roundLikes, round.roundDislikes, SAGES);
    track("result_view", {
      roundId: round.roundId,
      type: result.type,
      relations: result.relations,
      durationMs: Date.now() - round.startedAt,
    });
  }, [round, done]);

  if (!round || !done) return null;

  const result = computeResult(round.roundUser, round.roundLikes, round.roundDislikes, SAGES);
  // SAGES는 고정된 3인 목록이라 result.type은 항상 존재하는 성현을 가리킨다.
  const typeSage = getSage(result.type)!;
  const narrative = buildResultNarrative(result, SAGES, round.roundUser);

  const likedVerses = likedVerseIds
    .map((id) => getVerse(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  function handleRestart() {
    track("restart", { prevType: result.type });
    startRound();
    router.push("/play");
  }

  async function handleShare() {
    const url = `${window.location.origin}/r/${result.type}?ref=share`;
    const shareData = {
      title: `나는 ${typeSage.typeName} — 성현 판별`,
      text: typeSage.typeTagline,
      url,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        track("share_click", { type: result.type, method: "native" });
      } catch {
        // 사용자가 공유를 취소한 경우 등은 조용히 무시
      }
      return;
    }

    // navigator.share/clipboard는 https(또는 localhost) 같은 보안 컨텍스트에서만
    // 쓸 수 있다 — 사내망 IP로 http 접속한 경우 등엔 둘 다 조용히 실패하므로
    // execCommand 기반 폴백으로 최소한 복사는 되게 한다.
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopied(true);
      track("share_click", { type: result.type, method: "copy" });
    } catch {
      setShareError(true);
    }
  }

  async function handleSaveImage() {
    if (savingImage) return;
    setSavingImage(true);
    try {
      const params = new URLSearchParams({
        type: result.type,
        intensityLabel: narrative.intensityLabel,
        axisLine: narrative.axisLine,
      });
      if (narrative.closeLine) params.set("closeLine", narrative.closeLine);
      const res = await fetch(`/api/result-card?${params.toString()}`);
      if (!res.ok) throw new Error("failed to generate image");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `seonghyeon-${result.type}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setSaveError(true);
    } finally {
      setSavingImage(false);
    }
  }

  function handleOpenMoreTalk() {
    setMoreTalkOpen(true);
    track("more_talk_click", { sage: result.type });
  }

  function handleMoreTalkOptIn() {
    setMoreTalkOptedIn(true);
    track("more_talk_optin", { sage: result.type });
  }

  function handleCloseMoreTalk() {
    setMoreTalkOpen(false);
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <section className="flex flex-col items-center gap-2 text-center">
          <p className="font-sans text-sm text-muted">이번 판의 대표 유형</p>
          <h1 className="font-serif text-4xl font-bold">
            {narrative.intensityLabel}
            {typeSage.typeName}
          </h1>
          <p className="font-sans text-base text-muted">{typeSage.typeTagline}</p>
          <p className="font-sans text-sm text-muted">{narrative.axisLine}</p>
          {narrative.closeLine && (
            <p className="font-sans text-sm text-muted">{narrative.closeLine}</p>
          )}
          <p className="font-sans text-xs text-muted">
            지금까지 {roundsPlayed}번 판별했어요 · 성향은 계속 쌓여요
          </p>
        </section>

        <details className="w-full rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer font-sans text-sm text-foreground">
            지금까지 내가 고른 구절 ({likedVerses.length})
          </summary>
          {likedVerses.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-muted">
              좋아요 누른 구절이 없습니다.
            </p>
          ) : (
            <ul
              ref={matchesRef}
              className="-mx-4 mt-3 flex cursor-grab gap-3 overflow-x-auto px-4 pb-1 select-none active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {likedVerses.map((verse, i) => (
                <li
                  key={verse.id}
                  className="relative min-h-[320px] w-72 shrink-0 rounded-lg border border-border bg-background p-5"
                >
                  <span className="absolute right-4 top-4 font-sans text-xs text-muted">
                    {i + 1} / {likedVerses.length}
                  </span>
                  <MonkeyCharacter pose={getVersePose(verse)} size={56} />
                  <p className="mt-2 font-serif text-xl leading-snug tracking-wide">
                    {verse.original}
                  </p>
                  <p className="mt-1 font-sans text-xs text-muted">{verse.reading}</p>
                  <p className="mt-3 font-sans text-sm leading-relaxed">{verse.translation}</p>
                  <p className="mt-2 text-xs text-muted">{verse.source}</p>
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-center gap-8">
          <button
            type="button"
            onClick={handleRestart}
            className="flex flex-col items-center gap-1.5 text-foreground"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M20.49 15a9 9 0 0 1-14.85 3.36L1 14"
                />
              </svg>
            </span>
            <span className="font-sans text-xs text-muted">다시하기</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-black/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path strokeLinecap="round" d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
              </svg>
            </span>
            <span className="font-sans text-xs font-bold text-foreground">공유하기</span>
          </button>

          <button
            type="button"
            onClick={handleSaveImage}
            disabled={savingImage}
            className="flex flex-col items-center gap-1.5 text-foreground disabled:opacity-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
            <span className="font-sans text-xs text-muted">
              {savingImage ? "저장 중" : "이미지 저장"}
            </span>
          </button>
        </div>

        <div className="flex justify-center">
          <KakaoShareButton
            title={`나는 ${typeSage.typeName} — 성현 판별`}
            description={typeSage.typeTagline}
            imagePath={`/r/${result.type}/opengraph-image`}
            sharePath={`/r/${result.type}?ref=kakao`}
            onShared={() => track("share_click", { type: result.type, method: "kakao" })}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleOpenMoreTalk}
        className="mx-auto font-sans text-xs text-muted underline underline-offset-4"
      >
        성현과 더 대화하기
      </button>

      <AnimatePresence>
        {copied && <Toast text="복사됨" onDone={() => setCopied(false)} />}
        {saveError && (
          <Toast text="이미지 저장에 실패했습니다" onDone={() => setSaveError(false)} />
        )}
        {shareError && (
          <Toast text="공유에 실패했습니다" onDone={() => setShareError(false)} />
        )}
      </AnimatePresence>

      <MoreTalkSheet
        open={moreTalkOpen}
        optedIn={moreTalkOptedIn}
        onOptIn={handleMoreTalkOptIn}
        onClose={handleCloseMoreTalk}
      />
    </main>
  );
}
