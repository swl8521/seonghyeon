import { describe, expect, it } from "vitest";
import { analyticsPayload, validEventName } from "./analytics-payload";

describe("analytics payload", () => {
  it("keeps scalar values and converts booleans without sending invalid data", () => {
    expect(analyticsPayload({ yes: true, no: false, count: 3, object: {}, array: [], absent: undefined, nan: NaN, ga_reserved: 1 })).toEqual({ yes: 1, no: 0, count: 3 });
  });
  it("caps parameters and unicode strings", () => {
    expect(Object.keys(analyticsPayload(Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`p${i}`, i]))))).toHaveLength(25);
    expect(Array.from(analyticsPayload({ text: "🌱".repeat(101) }).text as string)).toHaveLength(100);
  });
  it("rejects invalid and automatically collected event names", () => {
    expect(validEventName("stage_up")).toBe(true);
    for (const name of ["first_visit", "ga_event", "1event", "x".repeat(41)]) expect(validEventName(name)).toBe(false);
  });
});
