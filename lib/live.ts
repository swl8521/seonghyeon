"use client";

import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Zone } from "./types";

export type LiveStatus = "connecting" | "connected" | "reconnecting" | "fallback" | "closed";

export interface VerseState {
  zone: Zone;
  slot: number;
  verseId: string;
  nextVerseId: string;
  remainingMs: number;
  periodMs: number;
}

export interface PresenceState {
  total: number;
  hall: number;
  confucius: number;
  laozi: number;
  sunzi: number;
}

interface LiveSnapshot {
  status: LiveStatus;
  verse: VerseState | null;
  remainingMs: number;
  presence: PresenceState | null;
  bows: number;
}

const LIVE_URL = process.env.NEXT_PUBLIC_LIVE_URL;
const BOW_COOLDOWN_MS = 800;
const LATE_SWITCH_MS = 1500;
const FALLBACK_POLL_FAILURE_MS = 30_000;
const MAX_SOCKET_RETRIES = 3;
const TICK_MS = 250;

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * 앱 전체에서 소켓 하나만 쓰는 매니저. 라우트가 바뀔 때 useLive(zone)이
 * setZone을 호출해 방을 옮기고, 화면이 여러 개 떠 있어도(드물지만) 구독자
 * 모두에게 같은 스냅샷을 내려준다.
 */
class LiveManager {
  private socket: Socket | null = null;
  private zone: Zone | null = null;
  private listeners = new Set<() => void>();
  private snapshot: LiveSnapshot = {
    status: LIVE_URL ? "connecting" : "closed",
    verse: null,
    remainingMs: 0,
    presence: null,
    bows: 0,
  };
  private verseReceivedAt = 0; // performance.now() 기준
  private lateSwitchTimer: ReturnType<typeof setTimeout> | null = null;
  private fallbackPollTimer: ReturnType<typeof setTimeout> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private retries = 0;
  private lastBowAt = 0;

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  getSnapshot = (): LiveSnapshot => this.snapshot;

  setZone(zone: Zone | null) {
    if (this.zone === zone) return;
    this.zone = zone;
    if (this.lateSwitchTimer) clearTimeout(this.lateSwitchTimer);
    this.lateSwitchTimer = null;
    this.update({ verse: null, remainingMs: 0, bows: 0 });

    if (!LIVE_URL) {
      // 개발 중 서버 없이 화면만 작업할 때 — 소켓을 아예 시도하지 않는다.
      this.update({ status: "closed", verse: null, presence: null, bows: 0 });
      return;
    }

    this.ensureSocket();
    this.stopFallbackPolling();
    this.stopTick();

    if (zone === null) {
      this.socket?.emit("leave");
      this.update({ verse: null, presence: this.snapshot.presence, bows: 0 });
      return;
    }

    if (this.socket?.connected) {
      this.join(zone);
    }
    // 아직 연결 안 됐으면 onConnect에서 현재 zone으로 join한다.
  }

  bow() {
    if (!this.zone || !this.snapshot.verse) return;
    const now = Date.now();
    if (now - this.lastBowAt < BOW_COOLDOWN_MS) return;
    this.lastBowAt = now;

    // 낙관적 갱신 — 서버 값이 오면 덮어쓴다.
    this.update({ bows: this.snapshot.bows + 1 });
    this.socket?.emit("bow", { zone: this.zone, slot: this.snapshot.verse.slot });
  }

  private ensureSocket() {
    if (this.socket) return;

    const socket = io(LIVE_URL!, {
      transports: ["websocket"],
      reconnectionDelayMax: 10_000,
    });
    this.socket = socket;

    socket.on("connect", () => {
      this.retries = 0;
      this.stopFallbackPolling();
      this.update({ status: "connected" });
      if (this.zone) this.join(this.zone);
    });

    socket.on("disconnect", () => {
      this.update({ status: "reconnecting" });
    });

    socket.io.on("reconnect_attempt", () => {
      this.retries += 1;
      if (this.retries >= MAX_SOCKET_RETRIES) {
        this.startFallbackPolling();
      }
    });

    socket.on("verse", (state: VerseState) => {
      if (state.zone !== this.zone) return;
      this.applyVerse(state);
    });

    socket.on("presence", (p: PresenceState) => {
      this.update({ presence: p });
    });

    socket.on("bows", (b: { zone: Zone; slot: number; count: number }) => {
      if (!this.zone || b.zone !== this.zone) return;
      if (this.snapshot.verse?.slot !== b.slot) return;
      this.update({ bows: b.count });
    });

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibility);
    }
  }

  private handleVisibility = () => {
    if (document.visibilityState !== "visible") return;
    if (!this.socket?.connected) {
      this.socket?.connect();
    } else if (this.zone) {
      // 탭이 백그라운드에 있는 동안 놓친 정각 전환을 따라잡는다.
      this.join(this.zone);
    }
  };

  private join(zone: Zone) {
    this.socket?.emit(
      "join",
      { zone },
      (reply: { verse?: VerseState; presence?: PresenceState; bows?: { count: number }; error?: string }) => {
        if (this.zone !== zone || reply?.error || !reply?.verse || reply.verse.zone !== zone) return;
        this.applyVerse(reply.verse, reply.bows?.count ?? 0);
        this.update({ status: "connected", presence: reply.presence ?? null });
      }
    );
  }

  private applyVerse(state: VerseState, bows?: number) {
    if (state.zone !== this.zone) return;
    // slot이 지금보다 작으면(지연 도착) 무시한다.
    if (this.snapshot.verse && state.slot < this.snapshot.verse.slot) return;

    if (this.lateSwitchTimer) {
      clearTimeout(this.lateSwitchTimer);
      this.lateSwitchTimer = null;
    }

    this.verseReceivedAt = nowMs();
    const sameSlot = this.snapshot.verse?.slot === state.slot;
    this.update({ verse: state, remainingMs: state.remainingMs, bows: bows ?? (sameSlot ? this.snapshot.bows : 0) });
    this.scheduleLateSwitch(state);
  }

  private scheduleLateSwitch(state: VerseState) {
    const delay = state.remainingMs + LATE_SWITCH_MS;
    this.lateSwitchTimer = setTimeout(() => {
      const current = this.snapshot.verse;
      if (!current || current.slot !== state.slot) return;
      // 정각이 지났는데 다음 verse 이벤트가 안 왔다 — 받아둔 nextVerseId로 먼저 넘긴다.
      // 실제 verse 이벤트가 나중에 오면 applyVerse가 그대로 덮어쓴다.
      this.verseReceivedAt = nowMs();
      this.update({
        verse: {
          ...current,
          slot: current.slot + 1,
          verseId: current.nextVerseId,
          nextVerseId: current.nextVerseId,
          remainingMs: current.periodMs,
        },
        bows: 0,
      });
    }, delay);
    this.startTick();
  }

  private startTick() {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => {
      const verse = this.snapshot.verse;
      if (!verse) return;
      const elapsed = nowMs() - this.verseReceivedAt;
      const remainingMs = Math.max(0, verse.remainingMs - elapsed);
      this.update({ remainingMs });
    }, TICK_MS);
  }

  private stopTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private async startFallbackPolling() {
    if (this.fallbackPollTimer || !this.zone) return;
    this.update({ status: "fallback" });

    const poll = async () => {
      if (!this.zone) return;
      try {
        const res = await fetch(`${LIVE_URL}/now?zone=${this.zone}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const state = (await res.json()) as VerseState;
        this.applyVerse(state);
        this.fallbackPollTimer = setTimeout(poll, state.remainingMs);
      } catch {
        this.update({ status: "closed" });
        this.fallbackPollTimer = setTimeout(poll, FALLBACK_POLL_FAILURE_MS);
      }
    };
    poll();
  }

  private stopFallbackPolling() {
    if (this.fallbackPollTimer) {
      clearTimeout(this.fallbackPollTimer);
      this.fallbackPollTimer = null;
    }
  }

  private update(partial: Partial<LiveSnapshot>) {
    this.snapshot = { ...this.snapshot, ...partial };
    for (const l of this.listeners) l();
  }
}

export const liveManager = new LiveManager();

export interface UseLiveResult {
  status: LiveStatus;
  verse: VerseState | null;
  remainingMs: number;
  presence: PresenceState | null;
  bows: number;
  bow: () => void;
}

/** 라우트에 따라 zone을 바꿔가며 방에 들어가는 훅 (§6). zone이 null이면 leave. */
export function useLive(zone: Zone | null): UseLiveResult {
  const [snapshot, setSnapshot] = useState<LiveSnapshot>(liveManager.getSnapshot());

  useEffect(() => {
    return liveManager.subscribe(() => setSnapshot(liveManager.getSnapshot()));
  }, []);

  useEffect(() => {
    liveManager.setZone(zone);
    return () => {
      liveManager.setZone(null);
    };
  }, [zone]);

  const bow = useCallback(() => liveManager.bow(), []);

  return { ...snapshot, bow };
}
