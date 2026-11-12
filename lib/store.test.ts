import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./analytics", () => ({ track: vi.fn() }));
import { usePlayStore } from "./store";
import { track } from "./analytics";

beforeEach(() => {
  usePlayStore.setState(usePlayStore.getInitialState(), true);
  vi.clearAllMocks();
});

describe("live inventory rewards", () => {
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

  it("shows a toast and tracks promotion when a live reward crosses the threshold", () => {
    usePlayStore.setState({ devotion: { confucius: 7, laozi: 0, sunzi: 0 } });
    usePlayStore.getState().addToInventory("confucius-01", "live", "hall");
    expect(usePlayStore.getState().stage.confucius).toBe("entered");
    expect(usePlayStore.getState().toast?.text).toContain("공자");
    expect(track).toHaveBeenCalledWith("stage_up", {
      sage: "confucius", from: "outside", to: "entered", via: "live",
    });
  });
});
