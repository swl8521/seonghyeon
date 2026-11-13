import "server-only";

import { COPY_VERSES, LINES, SAGES, getSage, getVerse, readIndexFor } from "./content";
import { localizedLine, localizedSage, localizedVerse } from "./localized-content";
import type { ContentPayload, LocalizedValue } from "./client-content";
import type { Sage, SageId, SageLine, Verse } from "./types";

interface ContentSelection {
  sageIds?: SageId[];
  verseIds?: string[];
  lineSages?: SageId[];
  /** 이 성현의 읽기 풀 색인을 함께 싣는다 (덱을 고르는 화면에서만 필요). */
  indexSage?: SageId;
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
  const verseIndex = selection.indexSage ? readIndexFor(selection.indexSage) : [];
  return { sages, verses, lines, verseIndex };
}

/**
 * 구역 화면의 초기 페이로드.
 *
 * 본문은 따라쓰기 풀만 싣는다 (승급 따라쓰기가 번역문을 바로 써야 한다).
 * 읽기 풀은 본문 없이 색인으로만 보내 덱을 고를 수 있게 하고, 덱에 뽑힌
 * 구절과 홀에 뜬 구절의 본문은 loadContent 로 그때그때 가져온다
 * (/api/content). 읽기 풀이 늘어도 이 페이로드는 색인만큼만 커진다.
 */
export function sageContentPayload(sage: SageId): ContentPayload {
  return contentPayload({
    sageIds: [sage],
    verseIds: COPY_VERSES.filter((verse) => verse.sage === sage).map((verse) => verse.id),
    lineSages: [sage],
    indexSage: sage,
  });
}

export function squareSagesPayload(): ContentPayload {
  return contentPayload({ sageIds: SAGES.map((sage) => sage.id) });
}

