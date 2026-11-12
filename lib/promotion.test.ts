import { expect, it } from "vitest";
import { matchesCopy, nextGrowthStage, chooseCopyVerses } from "./promotion";
import { VERSES } from "./content";

it("accepts spacing, punctuation and normalized Korean but rejects wrong or blank text", () => {
  expect(matchesCopy("배우고, 익혀요!", "배우고 익혀요.")).toBe(true);
  expect(matchesCopy("배워요".normalize("NFD"), "배워요")).toBe(true);
  expect(matchesCopy("배우고 잊어요", "배우고 익혀요")).toBe(false);
  expect(matchesCopy("...", "배워요")).toBe(false);
  expect(matchesCopy("배워요🌳", "배워요")).toBe(false);
});

it("advances one step and never demotes", () => {
  expect(nextGrowthStage("outside", "senior")).toBe("entered");
  expect(nextGrowthStage("disciple", "entered")).toBeNull();
});

it("selects preferred verses first and uses distinct short translations", () => {
  const pool = VERSES.filter((v) => v.sage === "laozi");
  const ids = chooseCopyVerses(pool, [pool[19].id], 5);
  expect(ids[0]).toBe(pool[19].id);
  expect(new Set(ids).size).toBe(5);
});
