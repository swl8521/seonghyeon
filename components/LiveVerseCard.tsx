"use client";

import { useLocale } from "@/components/LocaleProvider";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { TICK_MS, type VerseState } from "@/lib/live";
import { CountdownRing } from "@/components/CountdownRing";
import { MonkeyCharacter } from "@/components/MonkeyCharacter";
import { getVersePose } from "@/lib/monkey";
import { clientSage, clientVerse, loadContent } from "@/lib/client-content";
import { originalTextClass, translationTextClass } from "@/lib/verse-layout";

interface LiveVerseCardProps {
  verseState: VerseState;
  remainingMs: number;
  flipped: boolean;
  onFlip: () => void;
}

export function LiveVerseCard({ verseState, remainingMs, flipped, onFlip }: LiveVerseCardProps) {
  const { locale, t } = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const [, setContentRevision] = useState(0);
  const verse = clientVerse(verseState.verseId, locale);
  const sage = verse ? clientSage(verse.sage, locale) : undefined;

  useEffect(() => {
    if (verse) return;
    let active = true;
    loadContent([verseState.verseId])
      .then(() => { if (active) setContentRevision((value) => value + 1); })
      .catch(() => {});
    return () => { active = false; };
  }, [verse, verseState.verseId]);

  if (!verse || !sage) return null;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="lantern-glow w-full max-w-[320px] overflow-hidden rounded-2xl [perspective:1200px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={verseState.slot}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : -16,
              scale: shouldReduceMotion ? 1 : 1.02,
              filter: shouldReduceMotion ? "blur(0px)" : "blur(4px)",
            }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
            className="w-full"
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              onClick={onFlip}
              role="button"
              tabIndex={0}
              aria-label={t(flipped ? "원문 보기" : "해설 보기")}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onFlip();
                }
              }}
              className="relative grid min-h-[480px] w-full cursor-pointer rounded-2xl [transform-style:preserve-3d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <div aria-hidden={flipped} inert={flipped} className="relative flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/10 [grid-area:1/1] [backface-visibility:hidden]">
                <p className="font-sans text-sm text-muted">
                  {sage.hanja} · {sage.name}
                </p>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <MonkeyCharacter pose={getVersePose(verse)} size={72} />
                  <p className={`font-original ${originalTextClass(verse.original)} leading-snug tracking-wide`}>
                    {verse.original}
                  </p>
                  {verse.reading && <p className="font-sans text-sm text-muted">{verse.reading}</p>}
                  <p className={`font-serif ${translationTextClass(verse.translation)} leading-relaxed`}>
                    {verse.translation}
                  </p>
                </div>
                <p className="text-right text-xs text-muted">{verse.source}</p>
              </div>

              <div aria-hidden={!flipped} inert={!flipped} className="relative flex min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-lg shadow-black/10 [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <MonkeyCharacter pose="think" size={96} />
                <p className="font-sans text-sm text-muted">
                  {sage.hanja} · {sage.name}
                </p>
                <p className="font-sans text-lg leading-relaxed">{verse.note}</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <CountdownRing
        remainingMs={remainingMs}
        periodMs={verseState.periodMs}
        slot={verseState.slot}
        tickMs={TICK_MS}
      />
    </div>
  );
}
