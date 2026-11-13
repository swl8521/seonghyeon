import sagesData from "@/content/sages.json";
import versesData from "@/content/verses.json";
import linesData from "@/content/lines.json";
import type { Sage, SageId, SageLine, Verse, VersePool } from "./types";

export const SAGES = sagesData as Sage[];
export const VERSES = versesData as Verse[];
// lines.json 자체에는 id가 없다 — 어떤 대사가 나왔는지 추적할 수 있도록 로드 시 부여한다.
export const LINES: SageLine[] = (linesData as Omit<SageLine, "id">[]).map((l, i) => ({
  ...l,
  id: `line-${i}`,
}));
export const SAGE_IDS: SageId[] = SAGES.map((s) => s.id);

export function versesInPool(pool: VersePool): Verse[] {
  return VERSES.filter((v) => v.pools.includes(pool));
}

/** 홀에서 읽히는 풀 — 원문 전문 단위를 포함한다. */
export const READ_VERSES = versesInPool("read");
/** 따라쓰기·승급 풀 — 손으로 옮겨 적을 만한 짧은 구절만. */
export const PRACTICE_VERSES = versesInPool("practice");

const verseById = new Map(VERSES.map((v) => [v.id, v]));
export function getVerse(id: string): Verse | undefined {
  return verseById.get(id);
}

const sageById = new Map(SAGES.map((s) => [s.id, s]));
export function getSage(id: SageId): Sage | undefined {
  return sageById.get(id);
}
