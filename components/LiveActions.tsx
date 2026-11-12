"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface LiveActionsProps {
  bows: number;
  onBow: () => void;
  inInventory: boolean;
  onAddToInventory: () => void;
  disabled?: boolean;
}

export function LiveActions({
  bows,
  onBow,
  inInventory,
  onAddToInventory,
  disabled,
}: LiveActionsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [sparks, setSparks] = useState<number[]>([]);

  function handleBow() {
    if (disabled) return;
    onBow();
    const id = Date.now() + Math.random();
    setSparks((prev) => [...prev, id]);
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={handleBow}
        disabled={disabled}
        className="relative flex items-center gap-2 rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground disabled:opacity-50"
      >
        <span aria-hidden>🙏</span>
        <span>함께 합장 {bows}</span>
        <AnimatePresence>
          {sparks.map((id) => (
            <motion.span
              key={id}
              aria-hidden
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: shouldReduceMotion ? 0 : -36 }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.9, ease: "easeOut" }}
              onAnimationComplete={() => setSparks((prev) => prev.filter((s) => s !== id))}
              className="pointer-events-none absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-lantern-glow"
            />
          ))}
        </AnimatePresence>
      </button>

      <button
        type="button"
        onClick={onAddToInventory}
        disabled={disabled || inInventory}
        className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground disabled:opacity-50"
      >
        {inInventory ? "담음" : "담기"}
      </button>
    </div>
  );
}
