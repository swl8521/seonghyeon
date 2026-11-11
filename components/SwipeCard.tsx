"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { SwipeDirection } from "@/lib/judge";
import type { Verse } from "@/lib/types";

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY = 500;
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
  onFlip: () => void;
  onSwipe: (dir: SwipeDirection, method: SwipeMethod) => void;
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { verse, sageName, flipped, onFlip, onSwipe },
  ref
) {
  const shouldReduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], shouldReduceMotion ? [0, 0] : [-14, 14]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const dislikeOpacity = useTransform(x, [-120, -20], [1, 0]);
  const flipDuration = shouldReduceMotion ? 0 : 0.25;
  const enterDuration = shouldReduceMotion ? 0 : 0.2;

  const hasTriggeredRef = useRef(false);
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

  function handleDragEnd(_event: PointerEvent, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY) {
      flyOff("like", "drag");
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) {
      flyOff("dislike", "drag");
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
        drag={exiting ? false : "x"}
        style={{ x, rotate }}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        onDragEnd={handleDragEnd}
        onTap={exiting ? undefined : onFlip}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: enterDuration }}
        className="relative z-10 aspect-[3/4] w-full max-w-[320px] touch-none select-none [perspective:1200px]"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: flipDuration }}
          className="relative h-full w-full cursor-grab [transform-style:preserve-3d] active:cursor-grabbing"
        >
          <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-lg shadow-black/10 [backface-visibility:hidden]">
            <motion.span
              style={{ opacity: likeOpacity }}
              className="absolute right-4 top-4 rounded border-2 border-like px-2 py-1 text-sm font-bold text-like"
            >
              좋아요
            </motion.span>
            <motion.span
              style={{ opacity: dislikeOpacity }}
              className="absolute left-4 top-4 rounded border-2 border-dislike px-2 py-1 text-sm font-bold text-dislike"
            >
              싫어요
            </motion.span>

            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="font-serif text-3xl leading-snug">{verse.original}</p>
              <p className="font-sans text-sm text-muted">{verse.reading}</p>
              <p className="font-sans text-base leading-relaxed">{verse.translation}</p>
            </div>

            <p className="text-right text-xs text-muted">{verse.source}</p>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-lg shadow-black/10 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="font-sans text-sm text-muted">{sageName}</p>
            <p className="font-serif text-lg leading-relaxed">{verse.note}</p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
});
