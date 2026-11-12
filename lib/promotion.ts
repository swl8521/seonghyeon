import type { Stage, Verse } from "./types";

export const GROWTH_STAGES: Stage[] = ["outside", "entered", "disciple", "senior"];
export const COPY_COUNTS: Record<Stage, number> = { outside: 0, entered: 1, disciple: 3, senior: 5 };

export interface PromotionChallenge {
  target: Stage;
  verseIds: string[];
  index: number;
  draft: string;
  via: "practice" | "live";
}

export function nextGrowthStage(current: Stage, eligible: Stage): Stage | null {
  const rank = GROWTH_STAGES.indexOf(current);
  return GROWTH_STAGES.indexOf(eligible) > rank ? GROWTH_STAGES[rank + 1] : null;
}

export function normalizeCopy(text: string): string {
  return text.normalize("NFC").replace(/[\s\p{P}]/gu, "");
}

export function matchesCopy(input: string, expected: string): boolean {
  const normalized = normalizeCopy(input);
  return normalized.length > 0 && normalized === normalizeCopy(expected);
}

export function chooseCopyVerses(pool: Verse[], preferredIds: string[], count: number): string[] {
  const preferred = new Set(preferredIds);
  return [...pool].sort((a, b) =>
    Number(preferred.has(b.id)) - Number(preferred.has(a.id)) ||
    a.translation.length - b.translation.length || a.id.localeCompare(b.id)
  ).slice(0, count).map((verse) => verse.id);
}
