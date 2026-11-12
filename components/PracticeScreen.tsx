"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { getVerse } from "@/lib/content";
import { usePlayStore } from "@/lib/store";
import { useLive } from "@/lib/live";
import { track } from "@/lib/analytics";
import type { Sage } from "@/lib/types";
import { SwipeCard, type SwipeCardHandle } from "@/components/SwipeCard";
import { JudgmentCard } from "@/components/JudgmentCard";
import { Toast } from "@/components/Toast";
import { TopBar } from "@/components/TopBar";

export function PracticeScreen({ sage }: { sage: Sage }) {
  const sageId = sage.id;
  const router = useRouter();
  const { presence } = useLive(sageId);

  const hasHydrated = usePlayStore((s) => s.hasHydrated);
  const practice = usePlayStore((s) => s.practice);
  const readVerseIds = usePlayStore((s) => s.readVerseIds);
  const pendingNote = usePlayStore((s) => s.pendingNote);
  const toast = usePlayStore((s) => s.toast);
  const startPractice = usePlayStore((s) => s.startPractice);
  const swipePractice = usePlayStore((s) => s.swipePractice);
  const flipPracticeCard = usePlayStore((s) => s.flipPracticeCard);
  const dismissNote = usePlayStore((s) => s.dismissNote);
  const acceptRecommendation = usePlayStore((s) => s.acceptRecommendation);
  const dismissToast = usePlayStore((s) => s.dismissToast);

  const cardRef = useRef<SwipeCardHandle>(null);
  const lastDevotionGainRef = useRef(0);
  const [devotionFlash, setDevotionFlash] = useState<{ id: number; delta: number } | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (practice?.sage === sageId && practice.outcome) {
      router.replace(`/z/${sageId}/result`);
      return;
    }
    if (!practice || practice.sage !== sageId) {
      startPractice(sageId);
      lastDevotionGainRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, practice, sageId]);

  useEffect(() => {
    if (!practice || practice.sage !== sageId) return;
    const delta = practice.devotionGain - lastDevotionGainRef.current;
    lastDevotionGainRef.current = practice.devotionGain;
    if (delta !== 0) {
      setDevotionFlash({ id: Date.now(), delta });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice?.devotionGain]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (usePlayStore.getState().pendingNote) return;
      if (e.key === "ArrowRight") cardRef.current?.flyOff("like", "key");
      if (e.key === "ArrowLeft") cardRef.current?.flyOff("dislike", "key");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onLeave() {
      const current = usePlayStore.getState().practice;
      if (current && current.sage === sageId && !current.outcome && current.index < current.deck.length) {
        track("practice_abandon", { sage: sageId, index: current.index });
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
  }, [sageId]);

  if (!practice || practice.sage !== sageId || practice.outcome) return null;

  const total = practice.deck.length;
  const index = Math.min(practice.index, total);
  const done = index >= total;
  const verseId = done ? undefined : practice.deck[index];
  const verse = verseId ? getVerse(verseId) : undefined;
  const recommendedVerse = pendingNote?.recommendedVerseId
    ? getVerse(pendingNote.recommendedVerseId)
    : null;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-6">
      <TopBar
        left={
          <>
            <Link href={`/z/${sageId}`} className="text-muted">
              ← {sage.hall}
            </Link>
            <span className="text-muted">지금 {presence?.[sageId] ?? 0}명</span>
          </>
        }
      />

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
        <AnimatePresence>
          {devotionFlash && (
            <motion.span
              key={devotionFlash.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => setDevotionFlash(null)}
              className={`pointer-events-none absolute top-6 z-20 font-sans text-lg font-bold ${
                devotionFlash.delta > 0 ? "text-like" : "text-dislike"
              }`}
            >
              {devotionFlash.delta > 0 ? `+${devotionFlash.delta}` : devotionFlash.delta}
            </motion.span>
          )}
        </AnimatePresence>

        {!pendingNote && !done && verse && (
          <>
            <div className="pointer-events-none absolute inset-x-0 mx-auto aspect-[3/4] w-full max-w-[320px] origin-bottom translate-y-4 scale-[0.94] rounded-2xl border border-border bg-card opacity-60 shadow-md shadow-black/5" />
            <div className="pointer-events-none absolute inset-x-0 mx-auto aspect-[3/4] w-full max-w-[320px] origin-bottom translate-y-2 scale-[0.97] rounded-2xl border border-border bg-card opacity-85 shadow-md shadow-black/5" />
          </>
        )}

        {pendingNote ? (
          <JudgmentCard
            sage={sage}
            lineText={pendingNote.lineText}
            result={pendingNote.kind}
            recommendedOriginal={recommendedVerse?.original ?? null}
            onAccept={pendingNote.recommendedVerseId ? acceptRecommendation : undefined}
            onContinue={dismissNote}
          />
        ) : done || !verse ? null : (
          <SwipeCard
            key={verse.id}
            ref={cardRef}
            verse={verse}
            sageName={sage.name}
            isFirstTime={!readVerseIds.includes(verse.id)}
            flipped={practice.flippedIds.includes(verse.id)}
            onFlip={() => flipPracticeCard(verse.id)}
            onSwipe={(dir, method) => swipePractice(dir, method)}
          />
        )}
      </div>

      {!done && verse && !pendingNote && (
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => cardRef.current?.flyOff("dislike", "button")}
            className="rounded-full border-2 border-dislike px-6 py-3 font-sans text-sm text-dislike"
          >
            넘김
          </button>
          <button
            type="button"
            onClick={() => cardRef.current?.flyOff("like", "button")}
            className="rounded-full bg-like px-6 py-3 font-sans text-sm text-like-foreground"
          >
            와닿음
          </button>
        </div>
      )}

      <AnimatePresence>
        {toast && <Toast key={toast.id} text={toast.text} onDone={dismissToast} />}
      </AnimatePresence>
    </main>
  );
}
