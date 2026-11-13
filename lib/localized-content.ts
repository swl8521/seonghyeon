import sageText from "@/content/en/sages.json";
import verseText from "@/content/en/verses.json";
import lineText from "@/content/en/lines.json";
import { getSage, getVerse, LINES } from "./content";
import type { Locale } from "./locale";
import type { SageId, Verse } from "./types";

// 편 이름 -> 번호. 논어 20편과 손자 13편을 모두 적어 둔다.
// 빠진 편이 있으면 영문 출처가 "Chapter " 로 비어 버린다.
const sections: Record<string, string> = {
  // 논어
  "학이편": "1", "위정편": "2", "팔일편": "3", "이인편": "4", "공야장편": "5",
  "옹야편": "6", "술이편": "7", "태백편": "8", "자한편": "9", "향당편": "10",
  "선진편": "11", "안연편": "12", "자로편": "13", "헌문편": "14", "위령공편": "15",
  "계씨편": "16", "양화편": "17", "미자편": "18", "자장편": "19", "요왈편": "20",
  // 손자병법
  "계편": "1", "작전편": "2", "모공편": "3", "형편": "4", "세편": "5",
  "허실편": "6", "군쟁편": "7", "구변편": "8", "행군편": "9", "지형편": "10",
  "구지편": "11", "화공편": "12", "용간편": "13",
};

/**
 * "논어 · 학이편 2장 (a)" -> "Analects · Book 1.2a"
 * "논어 · 학이편"          -> "Analects · Book 1"
 * "도덕경 · 73장"          -> "Tao Te Ching · Chapter 73"
 */
function englishSource(verse: Verse): string {
  const section = verse.source.split("·")[1]?.trim() ?? "";
  const label = verse.sage === "confucius" ? "Book" : "Chapter";
  const parsed = /^(.*?편)(?:\s+(\d+)장)?(?:\s*\(([a-z])\))?$/.exec(section);
  if (parsed) {
    const [, name, chapter, segment] = parsed;
    const number = sections[name] ?? name.replace(/[^0-9]/g, "");
    return `${sageText[verse.sage].book} · ${label} ${number}${chapter ? `.${chapter}` : ""}${segment ?? ""}`;
  }
  // 도덕경처럼 편 이름 없이 "73장" 으로 끝나는 경우
  const bare = /^(\d+)장(?:\s*\(([a-z])\))?$/.exec(section);
  const number = bare ? bare[1] : section.replace(/[^0-9]/g, "");
  return `${sageText[verse.sage].book} · ${label} ${number}${bare?.[2] ?? ""}`;
}
export function localizedSage(id: SageId, locale: Locale) {
  const sage = getSage(id);
  return sage && locale === "en" ? { ...sage, ...sageText[id] } : sage;
}
export function localizedVerse(id: string, locale: Locale): Verse | undefined {
  const verse = getVerse(id);
  const text = (verseText as Record<string, { translation: string; note: string }>)[id];
  return verse && locale === "en" && text ? { ...verse, ...text, source: englishSource(verse), reading: "" } : verse;
}
export function localizedLine(id: string, locale: Locale): string {
  const line = LINES.find((line) => line.id === id);
  return locale === "en" ? lineText[Number(id.replace("line-", ""))] ?? line?.text ?? "" : line?.text ?? "";
}
