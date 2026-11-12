import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { socket, handlers } = vi.hoisted(() => {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const socket = {
    connected: true,
    emit: vi.fn(),
    on: vi.fn((name, cb) => { handlers[name] = cb; }),
    io: { on: vi.fn() },
  };
  return { socket, handlers };
});
vi.mock("socket.io-client", () => ({ io: () => socket }));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubEnv("NEXT_PUBLIC_LIVE_URL", "http://localhost:4000");
  socket.emit.mockReset();
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

it("preserves join bow counts, rejects old room replies, and leaves the room", async () => {
  const { liveManager } = await import("./live");
  liveManager.setZone("hall");
  const ack = socket.emit.mock.calls.find(([name]) => name === "join")![2];
  const verse = { zone: "hall", slot: 1, verseId: "confucius-01", nextVerseId: "confucius-02", remainingMs: 10000, periodMs: 60000 };
  ack({ verse, bows: { count: 7 } });
  expect(liveManager.getSnapshot().bows).toBe(7);
  handlers.verse(verse);
  expect(liveManager.getSnapshot().bows).toBe(7);
  liveManager.setZone("sunzi");
  ack({ verse, bows: { count: 9 } });
  expect(liveManager.getSnapshot().verse).toBeNull();
  liveManager.setZone(null);
  expect(socket.emit).toHaveBeenCalledWith("leave");
  vi.advanceTimersByTime(12000);
  expect(liveManager.getSnapshot().verse).toBeNull();
});
