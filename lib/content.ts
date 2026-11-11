import sagesData from "@/content/sages.json";
import versesData from "@/content/verses.json";
import linesData from "@/content/lines.json";
import type { Sage, SageId, SageLine, Verse } from "./types";

export const SAGES = sagesData as Sage[];
export const VERSES = versesData as Verse[];
export const LINES = linesData as SageLine[];
export const SAGE_IDS: SageId[] = SAGES.map((s) => s.id);

const verseById = new Map(VERSES.map((v) => [v.id, v]));
export function getVerse(id: string): Verse | undefined {
  return verseById.get(id);
}

const sageById = new Map(SAGES.map((s) => [s.id, s]));
export function getSage(id: SageId): Sage | undefined {
  return sageById.get(id);
}
