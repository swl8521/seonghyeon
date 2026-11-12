"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Sage } from "@/lib/types";
import { SAGE_BORDER_CLASS } from "@/lib/sageColors";
import { MonkeyCharacter } from "@/components/MonkeyCharacter";

interface JudgmentCardProps {
  sage: Sage;
  lineText: string;
  onContinue: () => void;
}

export function JudgmentCard({ sage, lineText, onContinue }: JudgmentCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      className={`flex aspect-[3/4] w-full max-w-[320px] flex-col items-center justify-center gap-4 rounded-2xl border-2 ${SAGE_BORDER_CLASS[sage.id]} bg-card p-6 text-center`}
    >
      <MonkeyCharacter pose={sage.id === "confucius" ? "bow" : sage.id === "laozi" ? "meditate" : "point"} size={104} />
      <p className="font-sans text-sm text-muted">
        {sage.hanja} · {sage.name}
      </p>
      <p className="font-serif text-lg leading-relaxed">{lineText}</p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-4 rounded-full bg-accent px-6 py-2 font-sans text-sm text-accent-foreground"
      >
        계속
      </button>
    </motion.div>
  );
}
