"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getSage, getVerse } from "@/lib/content";
import type { VerseState } from "@/lib/live";
import { CountdownRing } from "@/components/CountdownRing";
import { MonkeyCharacter } from "@/components/MonkeyCharacter";
import { getVersePose } from "@/lib/monkey";

interface LiveVerseCardProps {
  verseState: VerseState;
  remainingMs: number;
  flipped: boolean;
  onFlip: () => void;
}

export function LiveVerseCard({ verseState, remainingMs, flipped, onFlip }: LiveVerseCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const verse = getVerse(verseState.verseId);
  const sage = verse ? getSage(verse.sage) : undefined;
  if (!verse || !sage) return null;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="lantern-glow aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-2xl [perspective:1200px]">
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
            className="h-full w-full"
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              onClick={onFlip}
              className="relative h-full w-full cursor-pointer [transform-style:preserve-3d]"
            >
              <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/10 [backface-visibility:hidden]">
                <p className="font-sans text-sm text-muted">
                  {sage.hanja} · {sage.name}
                </p>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                  <MonkeyCharacter pose={getVersePose(verse)} size={72} />
                  <p className="font-serif text-3xl leading-snug tracking-wide">{verse.original}</p>
                  <p className="font-sans text-sm text-muted">{verse.reading}</p>
                  <p className="font-sans text-lg leading-relaxed">{verse.translation}</p>
                </div>
                <p className="text-right text-xs text-muted">{verse.source}</p>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-lg shadow-black/10 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <MonkeyCharacter pose="think" size={96} />
                <p className="font-sans text-sm text-muted">
                  {sage.hanja} · {sage.name}
                </p>
                <p className="font-serif text-lg leading-relaxed">{verse.note}</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <CountdownRing remainingMs={remainingMs} periodMs={verseState.periodMs} />
    </div>
  );
}
