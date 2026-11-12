import sageText from "@/content/en/sages.json";
import verseText from "@/content/en/verses.json";
import lineText from "@/content/en/lines.json";
import { getSage, getVerse, LINES } from "./content";
import type { Locale } from "./locale";
import type { SageId, Verse } from "./types";

const sections: Record<string, string> = {
  "학이편": "1", "위정편": "2", "술이편": "7", "안연편": "12", "자한편": "9", "이인편": "4", "위령공편": "15", "자로편": "13",
  "모공편": "3", "계편": "1", "작전편": "2", "허실편": "6", "지형편": "10", "군쟁편": "7", "용간편": "13", "구지편": "11", "형편": "4",
};
function englishSource(verse: Verse): string {
  const section = verse.source.split("·")[1]?.trim() ?? "";
  const chapter = sections[section] ?? section.replace(/[^0-9]/g, "");
  return `${sageText[verse.sage].book} · ${verse.sage === "confucius" ? "Book" : "Chapter"} ${chapter}`;
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
