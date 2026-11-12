import { describe, expect, it } from "vitest";
import { isVerseState } from "./live-state";

const validState = {
  zone: "hall",
  slot: 123,
  verseId: "confucius-01",
  nextVerseId: "laozi-01",
  remainingMs: 30_000,
  periodMs: 60_000,
};

describe("isVerseState", () => {
  it("accepts a complete state for the requested zone", () => {
    expect(isVerseState(validState, "hall")).toBe(true);
  });

  it("rejects another zone and malformed timing values", () => {
    expect(isVerseState(validState, "sunzi")).toBe(false);
    expect(isVerseState({ ...validState, remainingMs: -1 }, "hall")).toBe(false);
    expect(isVerseState({ ...validState, periodMs: 0 }, "hall")).toBe(false);
  });
});
