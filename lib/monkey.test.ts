import { describe, expect, it } from "vitest";
import { getVersePose, MONKEY_IMAGE_BY_POSE } from "./monkey";
import type { Verse } from "./types";

function verse(id: string): Verse {
  return { id, sage: id.split("-")[0] as Verse["sage"] } as Verse;
}

describe("getVersePose", () => {
  it("keeps a pose stable for a quote id", () => {
    expect(getVersePose(verse("confucius-12-21b"))).toBe(
      getVersePose(verse("confucius-12-21b")),
    );
  });

  it("supports letter-suffixed ids without collapsing to think", () => {
    const ids = [
      "confucius-12-21b",
      "confucius-17-04a",
      "laozi-02-69a",
      "laozi-02-59b",
      "sunzi-11-j",
      "sunzi-07-j",
    ];
    const poses = ids.map((id) => getVersePose(verse(id)));

    expect(new Set(poses).size).toBeGreaterThan(2);
    expect(poses.every((pose) => MONKEY_IMAGE_BY_POSE[pose])).toBe(true);
  });
});
