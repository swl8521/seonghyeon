import type { Zone } from "./types";

export interface VerseState {
  zone: Zone;
  slot: number;
  verseId: string;
  nextVerseId: string;
  remainingMs: number;
  periodMs: number;
}

export function isVerseState(value: unknown, zone: Zone): value is VerseState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return (
    state.zone === zone &&
    Number.isInteger(state.slot) &&
    typeof state.verseId === "string" &&
    typeof state.nextVerseId === "string" &&
    typeof state.remainingMs === "number" &&
    state.remainingMs >= 0 &&
    typeof state.periodMs === "number" &&
    state.periodMs > 0
  );
}
