import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./analytics", () => ({ track: vi.fn() }));
import { usePlayStore } from "./store";
import { track } from "./analytics";
import { getVerse, VERSES } from "./content";
import { localizedVerse } from "./localized-content";

beforeEach(() => {
  usePlayStore.setState(usePlayStore.getInitialState(), true);
  vi.clearAllMocks();
});

describe("live inventory rewards", () => {
  it("keeps an English challenge language and draft through persistence", () => {
    usePlayStore.setState({ promotions: { confucius: { target: "entered", verseIds: ["confucius-01"], index: 0, draft: "", via: "practice", locale: "en" } } });
    usePlayStore.getState().updatePromotionDraft("confucius", getVerse("confucius-01")!.translation);
    expect(usePlayStore.getState().submitPromotion("confucius")).toBe(false);
    const text = localizedVerse("confucius-01", "en")!.translation;
    usePlayStore.getState().updatePromotionDraft("confucius", text.toUpperCase());
    const options = usePlayStore.persist.getOptions();
    const saved = JSON.parse(JSON.stringify(options.partialize!(usePlayStore.getState())));
    usePlayStore.setState(options.merge!(saved, usePlayStore.getInitialState()));
    expect(usePlayStore.getState().promotions.confucius?.locale).toBe("en");
    expect(usePlayStore.getState().submitPromotion("confucius")).toBe(true);
  });
  it("removing and adding a verse again does not award another point", () => {
    const store = usePlayStore.getState();
    store.addToInventory("confucius-01", "live", "hall");
    store.removeFromInventory("confucius-01");
    store.addToInventory("confucius-01", "live", "hall");
    expect(usePlayStore.getState().devotion.confucius).toBe(1);
    expect(usePlayStore.getState().inventory).toHaveLength(1);
    expect(usePlayStore.persist.getOptions().partialize!(usePlayStore.getState()))
      .toHaveProperty("liveAddedVerseIds", ["confucius-01"]);
  });

  it("preserves existing v4 live rewards when loading older state", () => {
    const merged = usePlayStore.persist.getOptions().merge!({
      inventory: [{ verseId: "confucius-01", source: "live", zone: "hall", at: 1 }],
      devotion: { confucius: 1, laozi: 0, sunzi: 0 },
    }, usePlayStore.getState());
    usePlayStore.setState(merged);
    merged.removeFromInventory("confucius-01");
    merged.addToInventory("confucius-01", "live", "hall");
    expect(usePlayStore.getState().devotion.confucius).toBe(1);
  });

  it("requires copying before promotion and tracks it only after completion", () => {
    usePlayStore.setState({ devotion: { confucius: 7, laozi: 0, sunzi: 0 } });
    usePlayStore.getState().addToInventory("confucius-01", "live", "hall");
    expect(usePlayStore.getState().stage.confucius).toBe("outside");
    expect(track).not.toHaveBeenCalledWith("stage_up", expect.anything());
    const challenge = usePlayStore.getState().promotions.confucius!;
    expect(challenge.verseIds).toHaveLength(1);
    usePlayStore.getState().updatePromotionDraft("confucius", "wrong");
    expect(usePlayStore.getState().submitPromotion("confucius")).toBe(false);
    usePlayStore.getState().updatePromotionDraft("confucius", getVerse(challenge.verseIds[0])!.translation);
    expect(usePlayStore.getState().submitPromotion("confucius")).toBe(true);
    expect(usePlayStore.getState().stage.confucius).toBe("entered");
    expect(usePlayStore.getState().toast?.text).toContain("성장");
    expect(track).toHaveBeenCalledWith("stage_up", {
      sage: "confucius", from: "outside", to: "entered", via: "live",
    });
  });

  it("requires all 1, 3 and 5 different verses without skipping a stage", () => {
    usePlayStore.setState({
      devotion: { confucius: 100, laozi: 0, sunzi: 0 },
      readVerseIds: VERSES.filter((v) => v.sage === "confucius").map((v) => v.id),
      flippedVerseIds: VERSES.filter((v) => v.sage === "confucius").map((v) => v.id),
    });
    usePlayStore.getState().refreshPromotions();
    for (const [target, count] of [["entered", 1], ["disciple", 3], ["senior", 5]] as const) {
      const challenge = usePlayStore.getState().promotions.confucius!;
      expect(challenge.target).toBe(target);
      expect(new Set(challenge.verseIds).size).toBe(count);
      for (let i = 0; i < count; i++) {
        const before = usePlayStore.getState().stage.confucius;
        const current = usePlayStore.getState().promotions.confucius!;
        usePlayStore.getState().updatePromotionDraft("confucius", getVerse(current.verseIds[i])!.translation);
        expect(usePlayStore.getState().submitPromotion("confucius")).toBe(true);
        if (i < count - 1) expect(usePlayStore.getState().stage.confucius).toBe(before);
      }
      expect(usePlayStore.getState().stage.confucius).toBe(target);
    }
    expect(usePlayStore.getState().promotions.confucius).toBeUndefined();
  });

  it("persists progress and draft while retaining existing stages", () => {
    usePlayStore.setState({ stage: { confucius: "entered", laozi: "outside", sunzi: "outside" }, devotion: { confucius: 30, laozi: 0, sunzi: 0 }, readVerseIds: VERSES.filter((v) => v.sage === "confucius").map((v) => v.id) });
    usePlayStore.getState().refreshPromotions();
    const challenge = usePlayStore.getState().promotions.confucius!;
    usePlayStore.getState().updatePromotionDraft("confucius", getVerse(challenge.verseIds[0])!.translation);
    usePlayStore.getState().submitPromotion("confucius");
    usePlayStore.getState().updatePromotionDraft("confucius", "이어 쓸 문장");
    const options = usePlayStore.persist.getOptions();
    const saved = JSON.parse(JSON.stringify(options.partialize!(usePlayStore.getState())));
    const loaded = options.merge!(saved, usePlayStore.getInitialState());
    expect(loaded.stage.confucius).toBe("entered");
    expect(loaded.promotions.confucius?.index).toBe(1);
    expect(loaded.promotions.confucius?.draft).toBe("이어 쓸 문장");
  });

  it("opens a task after practice without automatically changing the stage", () => {
    const store = usePlayStore.getState();
    store.startPractice("confucius");
    for (let i = 0; i < 10; i++) {
      usePlayStore.getState().swipePractice("like", "button");
      if (usePlayStore.getState().pendingNote) usePlayStore.getState().dismissNote();
    }
    expect(usePlayStore.getState().practice?.outcome).not.toBeNull();
    expect(usePlayStore.getState().stage.confucius).toBe("outside");
    expect(usePlayStore.getState().promotions.confucius?.target).toBe("entered");
    expect(usePlayStore.getState().promotions.confucius?.via).toBe("practice");
    expect(track).not.toHaveBeenCalledWith("stage_up", expect.anything());
    const challenge = usePlayStore.getState().promotions.confucius!;
    usePlayStore.getState().updatePromotionDraft("confucius", getVerse(challenge.verseIds[0])!.translation);
    usePlayStore.getState().submitPromotion("confucius");
    expect(track).toHaveBeenCalledWith("stage_up", { sage: "confucius", from: "outside", to: "entered", via: "practice" });
    const outcome = usePlayStore.getState().practice?.outcome;
    usePlayStore.getState().refreshPromotions();
    expect(usePlayStore.getState().practice?.outcome).toEqual(outcome);
  });

  it("does not create higher tasks when reading or explanation requirements are missing", () => {
    usePlayStore.setState({ stage: { confucius: "entered", laozi: "outside", sunzi: "outside" }, devotion: { confucius: 100, laozi: 0, sunzi: 0 } });
    usePlayStore.getState().refreshPromotions();
    expect(usePlayStore.getState().promotions.confucius).toBeUndefined();
    usePlayStore.setState({ stage: { confucius: "disciple", laozi: "outside", sunzi: "outside" }, readVerseIds: VERSES.filter((v) => v.sage === "confucius").map((v) => v.id) });
    usePlayStore.getState().refreshPromotions();
    expect(usePlayStore.getState().promotions.confucius).toBeUndefined();
    expect(usePlayStore.getState().stage.confucius).toBe("disciple");
  });
});
