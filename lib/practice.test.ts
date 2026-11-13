import { describe, expect, it } from "vitest";
import {
  advanceStage,
  buildPracticeDeck,
  computeHeadKind,
  computeStage,
  nextRequirement,
} from "./practice";
import type { Verse } from "./types";

function makeVerse(id: string, overrides: Partial<Verse> = {}): Verse {
  return {
    id,
    sage: "confucius",
    source: "논어",
    original: "원문",
    reading: "음독",
    translation: "번역",
    note: "해설",
    tags: { ren: 0.5, xue: 0.5, dao: 0, mou: 0, rou: 0 },
    pools: ["read", "practice"],
    reviewed: false,
    ...overrides,
  };
}

describe("computeStage", () => {
  it("경계값 미만이면 문외", () => {
    expect(computeStage(7, 100, 100)).toBe("outside");
  });

  it("정진 8 이상이면 입문", () => {
    expect(computeStage(8, 0, 0)).toBe("entered");
  });

  it("정진만 높고 읽은 구절이 모자라면 제자가 안 됨", () => {
    expect(computeStage(25, 9, 0)).toBe("entered");
  });

  it("정진 25 + 읽음 10이면 제자", () => {
    expect(computeStage(25, 10, 0)).toBe("disciple");
  });

  it("정진·읽음은 충분해도 해설이 모자라면 고제가 안 됨", () => {
    expect(computeStage(50, 18, 9)).toBe("disciple");
  });

  it("정진 50 + 읽음 18 + 해설 10이면 고제", () => {
    expect(computeStage(50, 18, 10)).toBe("senior");
  });
});

describe("advanceStage", () => {
  it("더 높은 단계로만 이동하고, 내려가지 않는다", () => {
    expect(advanceStage("disciple", "entered")).toBe("disciple");
    expect(advanceStage("disciple", "senior")).toBe("senior");
    expect(advanceStage("outside", "outside")).toBe("outside");
  });
});

describe("nextRequirement", () => {
  it("문외일 때 정진 부족분을 알려준다", () => {
    expect(nextRequirement("outside", 3, 0, 0)).toEqual({ kind: "devotion", remaining: 5 });
  });

  it("고제면 더 요구할 게 없다", () => {
    expect(nextRequirement("senior", 999, 999, 999)).toBeNull();
  });

  it("제자에서 정진은 충분하고 읽기만 모자라면 read를 요구한다", () => {
    expect(nextRequirement("disciple", 60, 15, 0)).toEqual({ kind: "read", remaining: 3 });
  });
});

describe("computeHeadKind", () => {
  it("와닿음이 1개 이하면 없음", () => {
    expect(computeHeadKind(1, "outside", "outside")).toBe("none");
  });

  it("문외에서 입문으로 오르면 첫 입문", () => {
    expect(computeHeadKind(3, "outside", "entered")).toBe("enter");
  });

  it("이미 입문한 상태에서 더 오르면 승급", () => {
    expect(computeHeadKind(3, "entered", "disciple")).toBe("promote");
  });

  it("단계가 그대로고 여전히 문외면 문하 앞", () => {
    expect(computeHeadKind(2, "outside", "outside")).toBe("front");
  });

  it("단계가 그대로고 입문 이상이면 유지", () => {
    expect(computeHeadKind(2, "entered", "entered")).toBe("stay");
  });
});

describe("buildPracticeDeck", () => {
  const verses: Verse[] = Array.from({ length: 20 }, (_, i) => makeVerse(`confucius-${i + 1}`));
  const rng = () => 0.5; // 결정적 셔플

  it("10장을 뽑는다", () => {
    const deck = buildPracticeDeck("confucius", verses, [], [], [], null, rng);
    expect(deck).toHaveLength(10);
  });

  it("안 읽은 구절을 우선하되, 모자라면 읽은 구절로 채운다", () => {
    const readVerseIds = verses.slice(0, 15).map((v) => v.id);
    const unreadIds = verses.slice(15).map((v) => v.id); // 5개뿐
    const deck = buildPracticeDeck("confucius", verses, readVerseIds, [], [], null, rng);
    expect(deck).toHaveLength(10);
    expect(unreadIds.every((id) => deck.includes(id))).toBe(true);
  });

  it("공유로 들어온 구절은 덱에서 뺀다", () => {
    const deck = buildPracticeDeck("confucius", verses, [], [], [], "confucius-1", rng);
    expect(deck).not.toContain("confucius-1");
  });

  it("안 읽은 구절이 모자라면 직전 수행 구절도 다시 허용한다", () => {
    const readVerseIds = verses.slice(0, 18).map((v) => v.id); // 안 읽은 구절 2개뿐
    const lastPractice = verses.slice(0, 5).map((v) => v.id);
    const deck = buildPracticeDeck("confucius", verses, readVerseIds, [], lastPractice, null, rng);
    expect(deck).toHaveLength(10);
  });
});
