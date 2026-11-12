"use client";
import { stageLabel } from "@/lib/locale";
import { useLocale } from "./LocaleProvider";
import type { Stage } from "@/lib/types";

const STAGE_TONE: Record<Stage, string> = {
  outside: "border-border text-muted",
  entered: "border-accent/60 text-accent",
  disciple: "border-accent text-accent",
  senior: "border-accent bg-accent text-accent-foreground",
};

export function StageBadge({ stage, className = "" }: { stage: Stage; className?: string }) {
  const { locale } = useLocale();
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-sans text-xs ${STAGE_TONE[stage]} ${className}`}
    >
      {stageLabel(stage, locale)}
    </span>
  );
}
