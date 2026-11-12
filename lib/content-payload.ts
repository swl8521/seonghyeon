import "server-only";

import { LINES, SAGES, VERSES, getSage, getVerse } from "./content";
import { localizedLine, localizedSage, localizedVerse } from "./localized-content";
import type { ContentPayload, LocalizedValue } from "./client-content";
import type { Sage, SageId, SageLine, Verse } from "./types";

interface ContentSelection {
  sageIds?: SageId[];
  verseIds?: string[];
  lineSages?: SageId[];
}

export function contentPayload(selection: ContentSelection): ContentPayload {
  const selectedVerses = selection.verseIds
    ? selection.verseIds.map(getVerse).filter((verse): verse is Verse => Boolean(verse))
    : [];
  const sageIds = new Set<SageId>(selection.sageIds ?? []);
  for (const verse of selectedVerses) sageIds.add(verse.sage);

  const sages = Array.from(sageIds)
    .map(getSage)
    .filter((sage): sage is Sage => Boolean(sage))
    .map((sage): LocalizedValue<Sage> => ({ ko: sage, en: localizedSage(sage.id, "en")! }));
  const verses = selectedVerses.map(
    (verse): LocalizedValue<Verse> => ({ ko: verse, en: localizedVerse(verse.id, "en")! })
  );
  const lineSages = new Set(selection.lineSages ?? []);
  const lines = LINES.filter((line) => lineSages.has(line.sage)).map(
    (line): LocalizedValue<SageLine> => ({
      ko: line,
      en: { ...line, text: localizedLine(line.id, "en") },
    })
  );
  return { sages, verses, lines };
}

export function sageContentPayload(sage: SageId): ContentPayload {
  return contentPayload({
    sageIds: [sage],
    verseIds: VERSES.filter((verse) => verse.sage === sage).map((verse) => verse.id),
    lineSages: [sage],
  });
}

export function squareSagesPayload(): ContentPayload {
  return contentPayload({ sageIds: SAGES.map((sage) => sage.id) });
}

