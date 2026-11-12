"use client";

import { useLocale } from "@/components/LocaleProvider";

import { motion, useReducedMotion } from "motion/react";
import type { JudgmentResult } from "@/lib/practice";
import type { Sage } from "@/lib/types";
import { SAGE_BORDER_CLASS } from "@/lib/sageColors";
import { MonkeyCharacter } from "@/components/MonkeyCharacter";

interface JudgmentCardProps {
  sage: Sage;
  lineText: string;
  result: JudgmentResult;
  recommendedOriginal?: string | null;
  onAccept?: () => void;
  onContinue: () => void;
}

export function JudgmentCard({
  sage,
  lineText,
  result,
  recommendedOriginal,
  onAccept,
  onContinue,
}: JudgmentCardProps) {
  const { t } = useLocale();
  const shouldReduceMotion = useReducedMotion();
  const isNod = result === "nod";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      className={`relative flex min-h-[440px] w-full max-w-[320px] flex-col items-center justify-center gap-4 rounded-2xl border-2 ${SAGE_BORDER_CLASS[sage.id]} bg-card p-6 text-center`}
    >
      <span
        className={`self-end rounded-full border px-3 py-1 font-sans text-xs font-bold ${
          isNod ? "border-accent text-accent" : "border-sage-laozi text-sage-laozi"
        }`}
      >
        {isNod ? t("끄덕") : t("일깨움")}
      </span>

      <MonkeyCharacter pose={sage.id === "confucius" ? "bow" : sage.id === "laozi" ? "meditate" : "point"} size={104} />
      <p className="font-sans text-sm text-muted">
        {sage.hanja} · {sage.name}
      </p>
      <p className="font-serif text-lg leading-relaxed">{lineText}</p>

      {recommendedOriginal && (
        <p className="font-serif text-base text-muted">{t("이것도 읽어보게 — {quote}", { quote: recommendedOriginal })}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {recommendedOriginal && onAccept && (
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground"
          >
            {t("읽어보기")}
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          className="rounded-full bg-accent px-6 py-2 font-sans text-sm text-accent-foreground"
        >
          {t("계속")}
        </button>
      </div>
    </motion.div>
  );
}
