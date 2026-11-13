import { expect, it } from "vitest";
import { SAGES, VERSES, LINES } from "./content";
import { localizedSage, localizedVerse, localizedLine } from "./localized-content";
import verseText from "@/content/en/verses.json";
import lineText from "@/content/en/lines.json";
it("covers all 3 sages, every quote and all teacher lines without changing quote identity", () => {
  expect(Object.keys(verseText).sort()).toEqual(VERSES.map((v) => v.id).sort());
  expect(lineText).toHaveLength(LINES.length);
  for (const sage of SAGES) expect(localizedSage(sage.id, "en")?.hall).toMatch(/^Learn with/);
  for (const verse of VERSES) {
    const en = localizedVerse(verse.id, "en")!;
    expect(en.id).toBe(verse.id);
    expect(en.original).toBe(verse.original);
    expect(en.tags).toEqual(verse.tags);
    expect(en.translation).toMatch(/[a-z]/i);
    expect(en.note).toMatch(/[a-z]/i);
    expect(en.source).not.toMatch(/[가-힣]/);
    expect(en.reviewed).toBe(false);
    expect(localizedVerse(verse.id, "ko")).toBe(verse);
  }
  for (const line of LINES) expect(localizedLine(line.id, "en")).toMatch(/[a-z]/i);
});
