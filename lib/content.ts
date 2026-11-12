import sagesData from "@/content/sages.json";
import versesData from "@/content/verses.json";
import linesData from "@/content/lines.json";
import type { Sage, SageId, SageLine, Verse } from "./types";

export const SAGES = sagesData as Sage[];
export const VERSES = versesData as Verse[];
// lines.json 자체에는 id가 없다 — 어떤 대사가 나왔는지 추적할 수 있도록 로드 시 부여한다.
export const LINES: SageLine[] = (linesData as Omit<SageLine, "id">[]).map((l, i) => ({
  ...l,
  id: `line-${i}`,
}));
export const SAGE_IDS: SageId[] = SAGES.map((s) => s.id);

const verseById = new Map(VERSES.map((v) => [v.id, v]));
export function getVerse(id: string): Verse | undefined {
  return verseById.get(id);
}

const sageById = new Map(SAGES.map((s) => [s.id, s]));
export function getSage(id: SageId): Sage | undefined {
  return sageById.get(id);
}
