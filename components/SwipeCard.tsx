"use client";

import { useLocale } from "@/components/LocaleProvider";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { SwipeDirection } from "@/lib/practice";
import type { Verse } from "@/lib/types";
import { getVersePose } from "@/lib/monkey";
import { originalTextClass, translationTextClass } from "@/lib/verse-layout";
import { MonkeyCharacter } from "@/components/MonkeyCharacter";

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 300;
const FLY_OFF_DISTANCE = 600;
const FLY_OFF_DURATION = 0.25;

export type SwipeMethod = "drag" | "button" | "key";

export interface SwipeCardHandle {
  flyOff: (dir: SwipeDirection, method: SwipeMethod) => void;
}

interface SwipeCardProps {
  verse: Verse;
  sageName: string;
  flipped: boolean;
  isFirstTime?: boolean;
  onFlip: () => void;
  onSwipe: (dir: SwipeDirection, method: SwipeMethod) => void;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { verse, sageName, flipped, isFirstTime, onFlip, onSwipe },
  ref
) {
  const { t } = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], shouldReduceMotion ? [0, 0] : [-14, 14]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const dislikeOpacity = useTransform(x, [-120, -20], [1, 0]);
  const flipDuration = shouldReduceMotion ? 0 : 0.25;
  const enterDuration = shouldReduceMotion ? 0 : 0.2;

  const hasTriggeredRef = useRef(false);
  const draggedRef = useRef(false);
  const [exiting, setExiting] = useState(false);

  function flyOff(dir: SwipeDirection, method: SwipeMethod) {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setExiting(true);

    if (shouldReduceMotion) {
      onSwipe(dir, method);
      return;
    }

    const target = dir === "like" ? FLY_OFF_DISTANCE : -FLY_OFF_DISTANCE;
    animate(x, target, { duration: FLY_OFF_DURATION, ease: "easeOut" });
    window.setTimeout(() => onSwipe(dir, method), FLY_OFF_DURATION * 1000 - 30);
  }

  useImperativeHandle(ref, () => ({ flyOff }));

  function handleTap() {
    if (exiting || draggedRef.current) return;
    onFlip();
  }

  function handleDragEnd(_event: PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY) {
      flyOff("like", "drag");
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) {
      flyOff("dislike", "drag");
    } else {
      // dragMomentum이 꺼져 있어 기준치에 못 미치면 Framer가 자동으로
      // 가운데로 되돌리지 않는다 — 직접 되돌려줘야 한다.
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  }

  return (
    <>
      <motion.div
        aria-hidden
        style={{ opacity: likeOpacity }}
        className="pointer-events-none fixed inset-0 z-0 bg-like/10"
      />
      <motion.div
        aria-hidden
        style={{ opacity: dislikeOpacity }}
        className="pointer-events-none fixed inset-0 z-0 bg-dislike/10"
      />

      <motion.div
        drag="x"
        style={{ x, rotate }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        dragMomentum={false}
        onPointerDown={() => {
          draggedRef.current = false;
        }}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: enterDuration }}
        className={`relative z-10 w-full max-w-[320px] touch-pan-y select-none [perspective:1200px] ${exiting ? "pointer-events-none" : ""}`}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: flipDuration }}
          role="button"
          tabIndex={0}
          aria-label={t(flipped ? "원문 보기" : "해설 보기")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleTap();
            }
          }}
          className="relative grid min-h-[480px] w-full cursor-grab rounded-2xl [transform-style:preserve-3d] active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <div aria-hidden={flipped} inert={flipped} className="relative flex min-w-0 flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/10 [grid-area:1/1] [backface-visibility:hidden]">
            <motion.span
              style={{ opacity: likeOpacity }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-xl border-4 border-like px-4 py-2 text-2xl font-bold text-like"
            >
              {t("마음에 들어요")}
            </motion.span>
            <motion.span
              style={{ opacity: dislikeOpacity }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-xl border-4 border-dislike px-4 py-2 text-2xl font-bold text-dislike"
            >
              {t("넘김")}
            </motion.span>

            {isFirstTime && (
              <span className="absolute right-4 top-4 rounded border border-border px-1.5 py-0.5 font-sans text-[10px] text-muted">
                {t("처음")}
              </span>
            )}

            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <MonkeyCharacter pose={getVersePose(verse)} size={72} />
              <div className="flex flex-col gap-1.5">
                <p className={`font-original ${originalTextClass(verse.original)} leading-snug tracking-wide`}>
                  {verse.original}
                </p>
                {verse.reading && <p className="font-sans text-sm text-muted">{verse.reading}</p>}
              </div>
              <p className={`font-serif ${translationTextClass(verse.translation)} leading-relaxed`}>
                {verse.translation}
              </p>
            </div>

            <p className="text-right text-xs text-muted">{verse.source}</p>
          </div>

          <div aria-hidden={!flipped} inert={!flipped} className="relative flex min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-lg shadow-black/10 [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <MonkeyCharacter pose="think" size={96} />
            <p className="font-sans text-sm text-muted">{sageName}</p>
            <p className="font-sans text-lg leading-relaxed">{verse.note}</p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
});
