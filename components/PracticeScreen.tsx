"use client";
import { Icon } from "./Icon";

import { useLocale } from "@/components/LocaleProvider";
import { activeLocale, localeHref } from "@/lib/locale";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Link from "@/components/LocaleLink";
import { usePlayStore } from "@/lib/store";
import { useLive } from "@/lib/live";
import { track } from "@/lib/analytics";
import type { Sage } from "@/lib/types";
import { SwipeCard, type SwipeCardHandle } from "@/components/SwipeCard";
import { JudgmentCard } from "@/components/JudgmentCard";
import { Toast } from "@/components/Toast";
import { TopBar } from "@/components/TopBar";
import { clientLine, clientSage, clientVerse, installContent, type ContentPayload } from "@/lib/client-content";

export function PracticeScreen({ sage: initialSage, content }: { sage: Sage; content: ContentPayload }) {
  installContent(content);
  const { locale, t, ready } = useLocale();
  const sage = clientSage(initialSage.id, locale)!;
  const sageId = sage.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareVerseId = searchParams.get("shareId") ?? undefined;
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
  const cardShownAtRef = useRef(0);
  const recommendedVerseIdsRef = useRef<Set<string>>(new Set());
  const lastViewedIndexRef = useRef<number | null>(null);
  const [devotionFlash, setDevotionFlash] = useState<{ id: number; delta: number } | null>(null);

  useEffect(() => {
    if (!hasHydrated || !ready) return;
    if (practice?.sage === sageId && practice.outcome) {
      router.replace(localeHref(`/z/${sageId}/result`, activeLocale()));
      return;
    }
    if (!practice || practice.sage !== sageId) {
      startPractice(sageId, { fromShareVerseId: shareVerseId });
      lastDevotionGainRef.current = 0;
    }
  }, [hasHydrated, ready, practice, sageId, router, shareVerseId, startPractice]);

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
    if (!practice || practice.sage !== sageId || practice.outcome) return;
    if (practice.index >= practice.deck.length) return;
    if (lastViewedIndexRef.current === practice.index) return;
    lastViewedIndexRef.current = practice.index;
    cardShownAtRef.current = Date.now();

    const verseId = practice.deck[practice.index];
    track("verse_view", {
      sage: sageId,
      verse_id: verseId,
      index: practice.index,
      first_time: readVerseIds.includes(verseId) ? 0 : 1,
      recommended: recommendedVerseIdsRef.current.has(verseId) ? 1 : 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practice?.index, practice?.sage]);

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
  const verse = verseId ? clientVerse(verseId, locale) : undefined;
  const recommendedVerse = pendingNote?.recommendedVerseId
    ? clientVerse(pendingNote.recommendedVerseId, locale)
    : null;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-6">
      <TopBar
        left={
          <>
            <Link href={`/z/${sageId}`} className="inline-flex items-center gap-1 text-muted">
              <Icon name="back" width={16} height={16} />{sage.hall}
            </Link>
            <span className="text-muted">{t("지금 {count}명", { count: presence?.[sageId] ?? 0 })}</span>
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

        {pendingNote ? (
          <JudgmentCard
            sage={sage}
            lineText={clientLine(pendingNote.lineId, locale)?.text ?? pendingNote.lineText}
            result={pendingNote.kind}
            recommendedOriginal={recommendedVerse?.original ?? null}
            onAccept={
              pendingNote.recommendedVerseId
                ? () => {
                    recommendedVerseIdsRef.current.add(pendingNote.recommendedVerseId!);
                    acceptRecommendation();
                  }
                : undefined
            }
            onContinue={dismissNote}
          />
        ) : done || !verse ? null : (
          <div className="relative my-5 w-full max-w-[320px] shrink-0">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 origin-bottom translate-y-4 scale-[0.94] rounded-2xl border border-border bg-card shadow-md shadow-black/5" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 origin-bottom translate-y-2 scale-[0.97] rounded-2xl border border-border bg-card shadow-md shadow-black/5" />
          <SwipeCard
            key={verse.id}
            ref={cardRef}
            verse={verse}
            sageName={sage.name}
            isFirstTime={!readVerseIds.includes(verse.id)}
            flipped={practice.flippedIds.includes(verse.id)}
            onFlip={() => flipPracticeCard(verse.id)}
            onSwipe={(dir, method) =>
              swipePractice(dir, method, Date.now() - cardShownAtRef.current)
            }
          />
          </div>
        )}
      </div>

      {!done && verse && !pendingNote && (
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => cardRef.current?.flyOff("dislike", "button")}
            className="rounded-full border-2 border-dislike px-6 py-3 font-sans text-sm text-dislike"
          >
            {t("넘김")}
          </button>
          <button
            type="button"
            onClick={() => cardRef.current?.flyOff("like", "button")}
            className="rounded-full bg-like px-6 py-3 font-sans text-sm text-like-foreground"
          >
            {t("마음에 들어요")}
          </button>
        </div>
      )}

      <AnimatePresence>
        {toast && <Toast key={toast.id} text={toast.text} onDone={dismissToast} />}
      </AnimatePresence>
    </main>
  );
}
