"use client";

import { motion } from "motion/react";
import { nextRequirement, stageDevotionTarget, type NextRequirement } from "@/lib/practice";
import { StageBadge } from "@/components/StageBadge";
import type { Stage } from "@/lib/types";

const STAGE_ORDER: Stage[] = ["outside", "entered", "disciple", "senior"];
const NEXT_STAGE_LABEL: Record<Stage, string> = {
  outside: "",
  entered: "입문",
  disciple: "제자",
  senior: "고제",
};

function requirementText(stage: Stage, req: NextRequirement | null): string | null {
  if (!req) return null;
  const nextLabel = NEXT_STAGE_LABEL[STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1]];
  if (req.kind === "devotion") return `${nextLabel}까지: 정진 ${req.remaining}점 더`;
  if (req.kind === "read") return `${nextLabel}까지: 구절 ${req.remaining}개 더 읽기`;
  return `${nextLabel}까지: 해설 ${req.remaining}개 더 읽기`;
}

interface StageCardProps {
  stage: Stage;
  devotion: number;
  readCount: number;
  flippedCount: number;
  promoted?: boolean;
  className?: string;
}

export function StageCard({
  stage,
  devotion,
  readCount,
  flippedCount,
  promoted,
  className = "",
}: StageCardProps) {
  const req = nextRequirement(stage, devotion, readCount, flippedCount);
  const target = stageDevotionTarget(stage);
  const gaugeFraction = target ? Math.min(1, devotion / target) : 1;

  return (
    <div className={`relative w-full max-w-[320px] rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-sans text-sm text-foreground">내 문하</span>
        <StageBadge stage={stage} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${gaugeFraction * 100}%` }}
        />
      </div>
      <p className="mt-2 font-sans text-xs text-muted">
        읽은 구절 {readCount}/20
      </p>
      {req && <p className="font-sans text-xs text-muted">{requirementText(stage, req)}</p>}

      {promoted && (
        <motion.span
          initial={{ opacity: 0, scale: 1.4, rotate: 8 }}
          animate={{ opacity: 1, scale: 1, rotate: -12 }}
          transition={{ duration: 0.4 }}
          className="absolute -right-2 -top-3 rounded-lg border-4 border-accent bg-card px-2 py-1 font-sans text-sm font-bold text-accent"
        >
          승급!
        </motion.span>
      )}
    </div>
  );
}
