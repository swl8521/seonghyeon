"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { LINES, SAGE_IDS, SAGES, VERSES, getVerse } from "./content";
import { buildDeck } from "./deck";
import { track } from "./analytics";
import {
  applySwipe,
  createRoundState,
  isJudgmentIndex,
  runJudgment,
  DISLIKE_REACTION_CHANCE,
  JUDGMENT_WINDOW,
  type JudgmentResult,
  type RoundState,
  type SwipeDirection,
} from "./judge";
import type { SageId, SageLine } from "./types";

const RECENT_LIMIT = 21;

function makeRoundId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickRandomLine(sage: SageId, kind: SageLine["kind"]): SageLine | undefined {
  const pool = LINES.filter((l) => l.sage === sage && l.kind === kind);
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickUnusedLine(
  sage: SageId,
  kind: SageLine["kind"],
  usedTexts: string[]
): SageLine | undefined {
  const pool = LINES.filter((l) => l.sage === sage && l.kind === kind);
  const unused = pool.filter((l) => !usedTexts.includes(l.text));
  const source = unused.length > 0 ? unused : pool;
  if (source.length === 0) return undefined;
  return source[Math.floor(Math.random() * source.length)];
}

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // localStorage 접근이 막혀도 앱은 메모리 상태로 계속 동작해야 한다.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export interface PendingJudgment {
  index: number;
  sage: SageId;
  result: JudgmentResult;
  p: number;
  lineText: string;
}

export interface DislikeToast {
  id: number;
  text: string;
}

interface PlayStore {
  round: RoundState | null;
  recentVerseIds: string[];
  flippedIds: string[];
  usedDislikeLines: string[];
  likedVerseIds: string[];
  pendingJudgment: PendingJudgment | null;
  toast: DislikeToast | null;
  // localStorage에서 저장된 라운드를 다 읽어오기 전까지는 true가 아니다.
  // 이 값을 보지 않고 round만으로 "새 라운드 시작"을 판단하면, 하이드레이션이
  // 끝나기 전의 과도기 null 상태를 "진행 중인 라운드 없음"으로 오인해
  // 진행하던 라운드를 새 라운드로 덮어써 버린다.
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  // 지금까지 시작한 라운드 수. 성향(user/likes/dislikes)은 라운드마다 리셋되지
  // 않고 이어지므로, 몇 번째 라운드인지를 결과 화면에 보여주기 위한 값.
  roundsPlayed: number;
  startRound: (opts?: { fromShare?: boolean }) => void;
  swipe: (dir: SwipeDirection, method: "drag" | "button" | "key") => void;
  flipCard: (verseId: string) => void;
  dismissJudgment: () => void;
  dismissToast: () => void;
}

export const usePlayStore = create<PlayStore>()(
  persist(
    (set, get) => ({
      round: null,
      recentVerseIds: [],
      flippedIds: [],
      usedDislikeLines: [],
      likedVerseIds: [],
      pendingJudgment: null,
      toast: null,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      roundsPlayed: 0,

      startRound: (opts) => {
        const { recentVerseIds, round: prevRound, roundsPlayed } = get();
        const deck = buildDeck(VERSES, SAGE_IDS, Math.random, recentVerseIds);
        // 이전 라운드가 있었다면 그 성향(user/likes/dislikes)을 이어받는다 —
        // "다시 하기"가 성향을 0으로 리셋하지 않고 계속 누적되게 하기 위함.
        const seed = prevRound
          ? { user: prevRound.user, likes: prevRound.likes, dislikes: prevRound.dislikes }
          : undefined;
        const round = createRoundState(deck, makeRoundId(), SAGE_IDS, Date.now(), seed);
        set({
          round,
          flippedIds: [],
          usedDislikeLines: [],
          pendingJudgment: null,
          toast: null,
          roundsPlayed: roundsPlayed + 1,
        });
        track("round_start", { roundId: round.roundId, fromShare: !!opts?.fromShare });
      },

      swipe: (dir, method) => {
        const { round, pendingJudgment, usedDislikeLines } = get();
        if (!round || pendingJudgment || round.index >= round.deck.length) return;

        const swipeIndex = round.index;
        const verseId = round.deck[swipeIndex];
        const verse = getVerse(verseId);
        if (!verse) return;

        track("swipe", {
          roundId: round.roundId,
          verseId,
          sage: verse.sage,
          dir,
          index: swipeIndex,
          method,
        });

        let nextRound = applySwipe(round, verse, dir);

        let nextPendingJudgment: PendingJudgment | null = null;
        if (isJudgmentIndex(nextRound.index)) {
          const recentIds = nextRound.deck.slice(
            nextRound.index - JUDGMENT_WINDOW,
            nextRound.index
          );
          const recentSages = recentIds
            .map((id) => getVerse(id)?.sage)
            .filter((s): s is SageId => Boolean(s));

          const { state: stateWithEvent, event } = runJudgment(
            nextRound,
            SAGES,
            recentSages,
            Math.random
          );
          nextRound = stateWithEvent;

          const line = pickRandomLine(event.sage, event.result === "accept" ? "nod" : "nudge");
          nextPendingJudgment = { ...event, lineText: line?.text ?? "" };
          track("judgment_shown", {
            roundId: round.roundId,
            sage: event.sage,
            result: event.result,
            p: event.p,
          });
        }

        let nextToast = get().toast;
        let nextUsedDislikeLines = usedDislikeLines;
        if (dir === "dislike" && Math.random() < DISLIKE_REACTION_CHANCE) {
          const line = pickUnusedLine(verse.sage, "skip", nextUsedDislikeLines);
          if (line) {
            nextToast = { id: Date.now(), text: line.text };
            nextUsedDislikeLines = [...nextUsedDislikeLines, line.text];
            track("dislike_reaction", { sage: verse.sage });
          }
        }

        set((state) => ({
          round: nextRound,
          recentVerseIds: [verseId, ...state.recentVerseIds].slice(0, RECENT_LIMIT),
          pendingJudgment: nextPendingJudgment,
          toast: nextToast,
          usedDislikeLines: nextUsedDislikeLines,
          likedVerseIds:
            dir === "like" && !state.likedVerseIds.includes(verseId)
              ? [...state.likedVerseIds, verseId]
              : state.likedVerseIds,
        }));
      },

      flipCard: (verseId) => {
        const { flippedIds } = get();
        const flippedNow = !flippedIds.includes(verseId);
        set({
          flippedIds: flippedNow
            ? [...flippedIds, verseId]
            : flippedIds.filter((id) => id !== verseId),
        });
        track("card_flip", { verseId, flipped: flippedNow });
      },

      dismissJudgment: () => set({ pendingJudgment: null }),
      dismissToast: () => set({ toast: null }),
    }),
    {
      name: "seonghyeon-round",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        round: state.round,
        recentVerseIds: state.recentVerseIds,
        flippedIds: state.flippedIds,
        usedDislikeLines: state.usedDislikeLines,
        likedVerseIds: state.likedVerseIds,
        roundsPlayed: state.roundsPlayed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
