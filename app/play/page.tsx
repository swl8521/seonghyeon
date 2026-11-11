"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { getSage, getVerse } from "@/lib/content";
import { usePlayStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import { SwipeCard, type SwipeCardHandle } from "@/components/SwipeCard";
import { JudgmentCard } from "@/components/JudgmentCard";
import { Toast } from "@/components/Toast";

export default function PlayPage() {
  const router = useRouter();
  const round = usePlayStore((s) => s.round);
  const hasHydrated = usePlayStore((s) => s.hasHydrated);
  const flippedIds = usePlayStore((s) => s.flippedIds);
  const pendingJudgment = usePlayStore((s) => s.pendingJudgment);
  const toast = usePlayStore((s) => s.toast);
  const startRound = usePlayStore((s) => s.startRound);
  const swipe = usePlayStore((s) => s.swipe);
  const flipCard = usePlayStore((s) => s.flipCard);
  const dismissJudgment = usePlayStore((s) => s.dismissJudgment);
  const dismissToast = usePlayStore((s) => s.dismissToast);
  const cardRef = useRef<SwipeCardHandle>(null);

  useEffect(() => {
    // hasHydrated가 true가 되기 전의 round === null은 "저장된 라운드가 없음"이
    // 아니라 "아직 localStorage를 다 읽지 못함"일 수 있다. 이 체크 없이 시작하면
    // 진행 중이던 라운드를 매번 새 라운드로 덮어쓰게 된다.
    if (hasHydrated && !round) {
      const params = new URLSearchParams(window.location.search);
      startRound({ fromShare: params.get("fromShare") === "1" });
    }
  }, [hasHydrated, round, startRound]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (usePlayStore.getState().pendingJudgment) return;
      if (e.key === "ArrowRight") cardRef.current?.flyOff("like", "key");
      if (e.key === "ArrowLeft") cardRef.current?.flyOff("dislike", "key");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onLeave() {
      const current = usePlayStore.getState().round;
      if (current && current.index < current.deck.length) {
        track("round_abandon", { roundId: current.roundId, index: current.index });
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") onLeave();
    }
    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onLeave);
    };
  }, []);

  const total = round?.deck.length ?? 0;
  const index = round ? Math.min(round.index, total) : 0;
  const done = round ? index >= total : false;

  useEffect(() => {
    if (done) router.replace("/result");
  }, [done, router]);

  if (!round) return null;

  const verseId = done ? undefined : round.deck[index];
  const verse = verseId ? getVerse(verseId) : undefined;
  const sage = verse ? getSage(verse.sage) : undefined;
  const judgmentSage = pendingJudgment ? getSage(pendingJudgment.sage) : undefined;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-6">
      <div className="flex items-center gap-3 text-sm text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>
        <span>
          {index} / {total}
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {!pendingJudgment && !done && verse && (
          <>
            <div className="pointer-events-none absolute inset-x-0 mx-auto aspect-[3/4] w-full max-w-[320px] origin-bottom translate-y-4 scale-[0.94] rounded-2xl border border-border bg-card opacity-60 shadow-md shadow-black/5" />
            <div className="pointer-events-none absolute inset-x-0 mx-auto aspect-[3/4] w-full max-w-[320px] origin-bottom translate-y-2 scale-[0.97] rounded-2xl border border-border bg-card opacity-85 shadow-md shadow-black/5" />
          </>
        )}

        {pendingJudgment && judgmentSage ? (
          <JudgmentCard
            sage={judgmentSage}
            lineText={pendingJudgment.lineText}
            onContinue={dismissJudgment}
          />
        ) : done || !verse || !sage ? null : (
          <SwipeCard
            key={verse.id}
            ref={cardRef}
            verse={verse}
            sageName={sage.name}
            flipped={flippedIds.includes(verse.id)}
            onFlip={() => flipCard(verse.id)}
            onSwipe={(dir, method) => swipe(dir, method)}
          />
        )}
      </div>

      {!done && verse && !pendingJudgment && (
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => cardRef.current?.flyOff("dislike", "button")}
            className="rounded-full border-2 border-dislike px-6 py-3 font-sans text-sm text-dislike"
          >
            싫어요
          </button>
          <button
            type="button"
            onClick={() => cardRef.current?.flyOff("like", "button")}
            className="rounded-full bg-like px-6 py-3 font-sans text-sm text-like-foreground"
          >
            좋아요
          </button>
        </div>
      )}

      <AnimatePresence>
        {toast && <Toast key={toast.id} text={toast.text} onDone={dismissToast} />}
      </AnimatePresence>
    </main>
  );
}
