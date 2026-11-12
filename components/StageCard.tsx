"use client";

import { nextRequirement, stageDevotionTarget, type NextRequirement } from "@/lib/practice";
import { StageBadge } from "@/components/StageBadge";
import { PromotionPractice } from "./PromotionPractice";
import { stageLabel, translate, type Locale } from "@/lib/locale";
import { useLocale } from "./LocaleProvider";
import type { SageId, Stage } from "@/lib/types";

const STAGE_ORDER: Stage[] = ["outside", "entered", "disciple", "senior"];
function requirementText(stage: Stage, req: NextRequirement | null, locale: Locale): string | null {
  if (!req) return null;
  const nextLabel = stageLabel(STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1], locale);
  const key = req.kind === "devotion" ? "{stage}까지: 정진 {count}점 더" : req.kind === "read" ? "{stage}까지: 구절 {count}개 더 읽기" : "{stage}까지: 해설 {count}개 더 읽기";
  return translate(locale, key, { stage: nextLabel, count: req.remaining });
}

interface StageCardProps {
  sage: SageId;
  stage: Stage;
  devotion: number;
  readCount: number;
  flippedCount: number;
  fullWidth?: boolean;
  className?: string;
}

export function StageCard({
  sage,
  stage,
  devotion,
  readCount,
  flippedCount,
  fullWidth = false,
  className = "",
}: StageCardProps) {
  const { locale, t } = useLocale();
  const req = nextRequirement(stage, devotion, readCount, flippedCount);
  const target = stageDevotionTarget(stage);
  const gaugeFraction = target ? Math.min(1, devotion / target) : 1;

  return (
    <div className={`relative w-full ${fullWidth ? "" : "max-w-[320px]"} rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm text-foreground">{t("나의 성장")}</span>
        <StageBadge stage={stage} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${gaugeFraction * 100}%` }}
        />
      </div>
      <p className="mt-2 font-sans text-xs text-muted">
        {t("읽은 구절 {count}/20", { count: readCount })}
      </p>
      {req && <p className="font-sans text-xs text-muted">{requirementText(stage, req, locale)}</p>}
      <PromotionPractice sage={sage} />

    </div>
  );
}
