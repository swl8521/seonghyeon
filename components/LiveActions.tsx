"use client";

import { useLocale } from "@/components/LocaleProvider";

import { useEffect, useState } from "react";
import { usePlayStore } from "@/lib/store";
import { playSingingBowl, stopSingingBowl } from "@/lib/sound";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";

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
  const { t } = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const [sparks, setSparks] = useState<number[]>([]);
  const soundOn = usePlayStore((s) => s.soundOn);

  useEffect(() => {
    if (!soundOn) stopSingingBowl();
    return stopSingingBowl;
  }, [soundOn]);

  function handleBow() {
    if (disabled) return;
    onBow();
    if (soundOn) void playSingingBowl(() => usePlayStore.getState().soundOn);
    const id = Date.now() + Math.random();
    setSparks((prev) => [...prev, id]);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleBow}
        disabled={disabled}
        className="relative flex items-center gap-2 rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground disabled:opacity-50"
      >
        <Image
          src="/characters/monkey-v2/monkey-13-praying.webp"
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          className="-my-1 h-7 w-7 shrink-0 object-contain"
        />
        <span>{t("함께 합장")} {bows}</span>
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
        {inInventory ? t("담음") : t("담기")}
      </button>
    </div>
  );
}
