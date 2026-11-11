import { AXES, type ResultSummary } from "./judge";
import type { Axis, Sage, SageId, Vec } from "./types";

export const MARGIN_STRONG = 0.15;
export const MARGIN_CLOSE = 0.05;

export type Intensity = "strong" | "normal" | "close";

export const AXIS_LABELS: Record<Axis, { hanja: string; label: string }> = {
  ren: { hanja: "仁", label: "관계와 도리" },
  xue: { hanja: "學", label: "배움과 수양" },
  dao: { hanja: "道", label: "비움과 자연" },
  mou: { hanja: "謀", label: "전략과 계산" },
  rou: { hanja: "柔", label: "유연함과 물러섬" },
};

export interface ResultNarrative {
  intensity: Intensity;
  intensityLabel: string; // "확고한 " | "" | "아슬아슬한 "
  margin: number;
  dominantAxis: Axis;
  axisLine: string;
  runnerUp?: { sage: SageId; name: string };
  closeLine?: string;
}

/** 대표 유형과 2위 성현의 score 격차 */
export function scoreMargin(scores: Record<SageId, number>, type: SageId): number {
  let secondBest = -Infinity;
  for (const [sageId, value] of Object.entries(scores) as [SageId, number][]) {
    if (sageId === type) continue;
    if (value > secondBest) secondBest = value;
  }
  if (secondBest === -Infinity) return Infinity;
  return scores[type] - secondBest;
}

export function intensityFor(margin: number): Intensity {
  if (margin >= MARGIN_STRONG) return "strong";
  if (margin < MARGIN_CLOSE) return "close";
  return "normal";
}

export function intensityLabelFor(intensity: Intensity): string {
  switch (intensity) {
    case "strong":
      return "확고한 ";
    case "close":
      return "아슬아슬한 ";
    case "normal":
      return "";
  }
}

/**
 * 사용자 벡터와 성현 벡터의 축별 곱(기여도)이 가장 큰 축을 고른다.
 * 그 축이 '왜' 이 성현과 가장 가까웠는지를 설명한다.
 */
export function pickDominantAxis(user: Vec, sageVec: Vec): Axis {
  let best: Axis = AXES[0];
  let bestValue = -Infinity;
  for (const axis of AXES) {
    const contribution = user[axis] * sageVec[axis];
    if (contribution > bestValue) {
      bestValue = contribution;
      best = axis;
    }
  }
  return best;
}

export function buildResultNarrative(
  result: ResultSummary,
  sages: Sage[],
  user: Vec
): ResultNarrative {
  const typeSage = sages.find((s) => s.id === result.type) ?? sages[0];
  const margin = scoreMargin(result.scores, result.type);
  const intensity = intensityFor(margin);
  const dominantAxis = pickDominantAxis(user, typeSage.vec);
  const { hanja, label } = AXIS_LABELS[dominantAxis];

  const narrative: ResultNarrative = {
    intensity,
    intensityLabel: intensityLabelFor(intensity),
    margin,
    dominantAxis,
    axisLine: `특히 ${hanja}(${label}) 쪽으로 강하게 끌렸어요`,
  };

  if (intensity === "close") {
    let runnerUpId: SageId | null = null;
    let runnerUpScore = -Infinity;
    for (const sage of sages) {
      if (sage.id === result.type) continue;
      if (result.scores[sage.id] > runnerUpScore) {
        runnerUpScore = result.scores[sage.id];
        runnerUpId = sage.id;
      }
    }
    if (runnerUpId) {
      const runnerUpSage = sages.find((s) => s.id === runnerUpId)!;
      narrative.runnerUp = { sage: runnerUpId, name: runnerUpSage.name };
      narrative.closeLine = `${runnerUpSage.name}와도 거의 비슷한 점수였어요`;
    }
  }

  return narrative;
}
