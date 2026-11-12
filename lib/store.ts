"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { LINES, SAGE_IDS, VERSES, getSage, getVerse } from "./content";
import { DEVOTION, NOTE_INDICES, SKIP_REACTION_CHANCE } from "./constants";
import { track } from "./analytics";
import {
  advanceStage,
  applyPracticeSwipe,
  buildPracticeDeck,
  computeStage,
  createPracticeState,
  finalizePracticeOutcome,
  flipPracticeCard as flipPracticeCardPure,
  insertRecommendedVerse,
  judgeTeacherNote,
  pickRecommendedVerse,
  type JudgmentResult,
  type PracticeState,
  type SwipeDirection,
} from "./practice";
import type { InventoryItem, SageId, SageLine, Stage, Zone } from "./types";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickRandomLine(sage: SageId, kind: SageLine["kind"]): SageLine | undefined {
  const pool = LINES.filter((l) => l.sage === sage && l.kind === kind);
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickUnusedLine(
  sage: SageId,
  kind: SageLine["kind"],
  usedIds: string[]
): SageLine | undefined {
  const pool = LINES.filter((l) => l.sage === sage && l.kind === kind);
  const unused = pool.filter((l) => !usedIds.includes(l.id));
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

export interface PendingNote {
  sage: SageId;
  kind: JudgmentResult;
  lineId: string;
  lineText: string;
  recommendedVerseId: string | null;
  atIndex: number;
}

export interface SkipToast {
  id: number;
  text: string;
}

function zeroCounts(): Record<SageId, number> {
  const out = {} as Record<SageId, number>;
  for (const id of SAGE_IDS) out[id] = 0;
  return out;
}

function zeroStages(): Record<SageId, Stage> {
  const out = {} as Record<SageId, Stage>;
  for (const id of SAGE_IDS) out[id] = "outside";
  return out;
}

function zeroDwell(): Record<SageId, { day: string; points: number; accMs: number }> {
  const out = {} as Record<SageId, { day: string; points: number; accMs: number }>;
  for (const id of SAGE_IDS) out[id] = { day: todayKey(), points: 0, accMs: 0 };
  return out;
}

function readCountFor(sage: SageId, readVerseIds: string[]): number {
  return readVerseIds.filter((id) => getVerse(id)?.sage === sage).length;
}

function flippedCountFor(sage: SageId, flippedVerseIds: string[]): number {
  return flippedVerseIds.filter((id) => getVerse(id)?.sage === sage).length;
}

interface PlayStore {
  practice: PracticeState | null;
  readVerseIds: string[];
  flippedVerseIds: string[];
  inventory: InventoryItem[];
  devotion: Record<SageId, number>;
  stage: Record<SageId, Stage>;
  dwellCredit: Record<SageId, { day: string; points: number; accMs: number }>;
  practicesDone: Record<SageId, number>;
  lastPracticeVerseIds: Record<SageId, string[]>;
  soundOn: boolean;
  seenIntro: boolean;
  pendingNote: PendingNote | null;
  toast: SkipToast | null;
  usedSkipLineIds: string[];
  // localStorage에서 저장된 상태를 다 읽어오기 전까지는 true가 아니다.
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  startPractice: (sage: SageId, opts?: { fromShareVerseId?: string }) => void;
  swipePractice: (dir: SwipeDirection, method: "drag" | "button" | "key") => void;
  flipPracticeCard: (verseId: string) => void;
  dismissNote: () => void;
  acceptRecommendation: () => void;
  addToInventory: (verseId: string, source: InventoryItem["source"], zone: Zone) => void;
  removeFromInventory: (verseId: string) => void;
  tickDwellCredit: (sage: SageId, deltaMs: number) => void;
  toggleSound: () => void;
  dismissIntro: () => void;
  dismissToast: () => void;
}

export const usePlayStore = create<PlayStore>()(
  persist(
    (set, get) => ({
      practice: null,
      readVerseIds: [],
      flippedVerseIds: [],
      inventory: [],
      devotion: zeroCounts(),
      stage: zeroStages(),
      dwellCredit: zeroDwell(),
      practicesDone: zeroCounts(),
      lastPracticeVerseIds: { confucius: [], laozi: [], sunzi: [] },
      soundOn: false,
      seenIntro: false,
      pendingNote: null,
      toast: null,
      usedSkipLineIds: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      startPractice: (sage, opts) => {
        const { readVerseIds, inventory, lastPracticeVerseIds, stage } = get();
        const inventoryVerseIds = inventory.map((i) => i.verseId);
        const deck = buildPracticeDeck(
          sage,
          VERSES,
          readVerseIds,
          inventoryVerseIds,
          lastPracticeVerseIds[sage] ?? [],
          opts?.fromShareVerseId ?? null
        );
        const practice = createPracticeState(sage, deck, stage[sage], opts?.fromShareVerseId ?? null);
        set({ practice, pendingNote: null, toast: null, usedSkipLineIds: [] });
        track("practice_start", {
          sage,
          practices_done: get().practicesDone[sage],
          stage: stage[sage],
        });
      },

      swipePractice: (dir, method) => {
        const { practice, pendingNote } = get();
        if (!practice || pendingNote || practice.index >= practice.deck.length) return;

        const swipeIndex = practice.index;
        const verseId = practice.deck[swipeIndex];
        const verse = getVerse(verseId);
        if (!verse) return;

        track("swipe", { sage: practice.sage, verseId, dir, index: swipeIndex, method });

        let next = applyPracticeSwipe(practice, verse, dir);

        let nextPendingNote: PendingNote | null = null;
        const sageDef = getSage(next.sage)!;
        if ((NOTE_INDICES as readonly number[]).includes(next.index)) {
          const verdict = judgeTeacherNote(next, sageDef.vec);
          const line = pickRandomLine(next.sage, verdict.kind);
          const recommendedVerseId =
            verdict.kind === "nod" ? pickRecommendedVerse(next, VERSES, get().readVerseIds) : null;
          if (verdict.kind === "nod") {
            next = { ...next, devotionGain: next.devotionGain + DEVOTION.nod };
          }
          nextPendingNote = line
            ? {
                sage: next.sage,
                kind: verdict.kind,
                lineId: line.id,
                lineText: line.text,
                recommendedVerseId,
                atIndex: next.index,
              }
            : null;
          track("teacher_note_shown", {
            sage: next.sage,
            kind: verdict.kind,
            has_rec: recommendedVerseId ? 1 : 0,
          });
        }

        let nextToast = get().toast;
        let nextUsedSkipLineIds = get().usedSkipLineIds;
        if (dir === "dislike" && Math.random() < SKIP_REACTION_CHANCE) {
          const line = pickUnusedLine(verse.sage, "skip", nextUsedSkipLineIds);
          if (line) {
            nextToast = { id: Date.now(), text: line.text };
            nextUsedSkipLineIds = [...nextUsedSkipLineIds, line.id];
            track("skip_reaction", { sage: verse.sage });
          }
        }

        const done = next.index >= next.deck.length;
        if (done && !nextPendingNote) {
          next = finishPracticeInternal(get, set, next);
        }

        set({
          practice: next,
          pendingNote: nextPendingNote,
          toast: nextToast,
          usedSkipLineIds: nextUsedSkipLineIds,
        });
      },

      flipPracticeCard: (verseId) => {
        const { practice } = get();
        if (!practice) return;
        set({ practice: flipPracticeCardPure(practice, verseId) });
        track("card_flip", { verseId, index: practice.index });
      },

      dismissNote: () => {
        const { practice, pendingNote } = get();
        if (!practice) {
          set({ pendingNote: null });
          return;
        }
        let next = practice;
        const done = next.index >= next.deck.length;
        if (done) {
          next = finishPracticeInternal(get, set, next);
        }
        set({ practice: next, pendingNote: null });
        void pendingNote;
      },

      acceptRecommendation: () => {
        const { practice, pendingNote } = get();
        if (!practice || !pendingNote?.recommendedVerseId) return;
        const next = insertRecommendedVerse(practice, pendingNote.recommendedVerseId);
        set({
          practice: { ...next, devotionGain: next.devotionGain + DEVOTION.recAccept },
          pendingNote: null,
        });
        track("rec_accept", { sage: practice.sage, verseId: pendingNote.recommendedVerseId });
      },

      addToInventory: (verseId, source, zone) => {
        const { inventory, readVerseIds, devotion } = get();
        if (inventory.some((i) => i.verseId === verseId)) return;
        const verse = getVerse(verseId);
        if (!verse) return;

        const item: InventoryItem = { verseId, source, zone, at: Date.now() };
        const nextReadVerseIds = readVerseIds.includes(verseId)
          ? readVerseIds
          : [...readVerseIds, verseId];
        const nextDevotion = { ...devotion };
        if (source === "live") {
          nextDevotion[verse.sage] = (nextDevotion[verse.sage] ?? 0) + DEVOTION.liveAdd;
        }

        set({
          inventory: [item, ...inventory],
          readVerseIds: nextReadVerseIds,
          devotion: nextDevotion,
        });
        recalcStage(get, set, verse.sage);
        track("inventory_add", { source, zone, verseId });
      },

      removeFromInventory: (verseId) => {
        set((state) => ({
          inventory: state.inventory.filter((i) => i.verseId !== verseId),
        }));
        track("inventory_remove", { verseId });
      },

      tickDwellCredit: (sage, deltaMs) => {
        const { dwellCredit, devotion } = get();
        const today = todayKey();
        const current = dwellCredit[sage] ?? { day: today, points: 0, accMs: 0 };
        const reset = current.day === today ? current : { day: today, points: 0, accMs: 0 };
        const accMs = reset.accMs + deltaMs;

        const ticks = Math.floor(accMs / DEVOTION.dwellTickMs);
        const remainderMs = accMs % DEVOTION.dwellTickMs;
        const affordable = Math.max(0, DEVOTION.dwellDailyCap - reset.points);
        const award = Math.min(ticks, affordable);

        const nextDwell = {
          ...dwellCredit,
          [sage]: { day: today, points: reset.points + award, accMs: award > 0 ? remainderMs : accMs },
        };
        if (award > 0) {
          set({
            dwellCredit: nextDwell,
            devotion: { ...devotion, [sage]: (devotion[sage] ?? 0) + award * DEVOTION.dwellPerTick },
          });
          recalcStage(get, set, sage);
        } else {
          set({ dwellCredit: nextDwell });
        }
      },

      toggleSound: () => {
        set((state) => {
          track("sound_toggle", { on: state.soundOn ? 0 : 1 });
          return { soundOn: !state.soundOn };
        });
      },

      dismissIntro: () => set({ seenIntro: true }),
      dismissToast: () => set({ toast: null }),
    }),
    {
      name: "seonghyeon-round",
      version: 4,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        practice: state.practice,
        readVerseIds: state.readVerseIds,
        flippedVerseIds: state.flippedVerseIds,
        inventory: state.inventory,
        devotion: state.devotion,
        stage: state.stage,
        dwellCredit: state.dwellCredit,
        practicesDone: state.practicesDone,
        lastPracticeVerseIds: state.lastPracticeVerseIds,
        soundOn: state.soundOn,
        seenIntro: state.seenIntro,
      }),
      // v1(및 한 번도 안 쓰인 v3) 저장 데이터를 v4 모양으로 옮긴다.
      migrate: (persistedState) => {
        const old = persistedState as {
          version?: number;
          likedVerseIds?: string[];
          roundsPlayed?: number;
        } | null;

        if (!old || old.version === 4) return old as unknown;

        const likedVerseIds = old.likedVerseIds ?? [];
        const readVerseIds = likedVerseIds;
        const now = Date.now();
        const inventory: InventoryItem[] = likedVerseIds
          .map((verseId): InventoryItem | null => {
            const verse = getVerse(verseId);
            if (!verse) return null;
            return { verseId, source: "practice", zone: verse.sage, at: now };
          })
          .filter((i): i is InventoryItem => i !== null);

        const devotion = zeroCounts();
        for (const id of likedVerseIds) {
          const verse = getVerse(id);
          if (verse) devotion[verse.sage] = (devotion[verse.sage] ?? 0) + 2;
        }

        const stage = zeroStages();
        for (const id of SAGE_IDS) {
          stage[id] = computeStage(devotion[id], readCountFor(id, readVerseIds), 0);
        }

        return {
          version: 4,
          practice: null,
          readVerseIds,
          flippedVerseIds: [],
          inventory,
          devotion,
          stage,
          dwellCredit: zeroDwell(),
          practicesDone: zeroCounts(),
          lastPracticeVerseIds: { confucius: [], laozi: [], sunzi: [] },
          soundOn: false,
          seenIntro: false,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/** 수행이 끝났을 때(10장 완료) 누적 상태에 반영하고 outcome을 확정한다 (§5.8). 재계산 금지. */
function finishPracticeInternal(
  get: () => PlayStore,
  set: (partial: Partial<PlayStore>) => void,
  practice: PracticeState
): PracticeState {
  const { readVerseIds, flippedVerseIds, inventory, devotion, practicesDone, lastPracticeVerseIds } =
    get();

  const nextReadVerseIds = Array.from(new Set([...readVerseIds, ...practice.deck]));
  const nextFlippedVerseIds = Array.from(new Set([...flippedVerseIds, ...practice.flippedIds]));

  const now = Date.now();
  const newItems: InventoryItem[] = practice.likedIds
    .filter((id) => !inventory.some((i) => i.verseId === id))
    .map((verseId) => ({ verseId, source: "practice" as const, zone: practice.sage, at: now }));
  const nextInventory = [...newItems, ...inventory];

  const nextDevotion = {
    ...devotion,
    [practice.sage]: Math.max(0, (devotion[practice.sage] ?? 0) + practice.devotionGain),
  };

  const stageComputed = computeStage(
    nextDevotion[practice.sage],
    readCountFor(practice.sage, nextReadVerseIds),
    flippedCountFor(practice.sage, nextFlippedVerseIds)
  );
  const stageAfter = advanceStage(practice.stageBefore, stageComputed);

  const outcome = finalizePracticeOutcome(practice, stageAfter, VERSES);

  const nextStageMap = { ...get().stage, [practice.sage]: stageAfter };
  const nextPracticesDone = {
    ...practicesDone,
    [practice.sage]: (practicesDone[practice.sage] ?? 0) + 1,
  };
  const nextLastPracticeVerseIds = { ...lastPracticeVerseIds, [practice.sage]: practice.deck };

  set({
    readVerseIds: nextReadVerseIds,
    flippedVerseIds: nextFlippedVerseIds,
    inventory: nextInventory,
    devotion: nextDevotion,
    stage: nextStageMap,
    practicesDone: nextPracticesDone,
    lastPracticeVerseIds: nextLastPracticeVerseIds,
  });

  if (stageAfter !== practice.stageBefore) {
    track("stage_up", { sage: practice.sage, from: practice.stageBefore, to: stageAfter, via: "practice" });
  }
  track("practice_complete", {
    sage: practice.sage,
    liked_count: practice.likedIds.length,
    flipped_count: practice.flippedIds.length,
    duration_ms: now - practice.startedAt,
    head_kind: outcome.headKind,
  });

  return { ...practice, outcome };
}

function recalcStage(get: () => PlayStore, set: (partial: Partial<PlayStore>) => void, sage: SageId) {
  const { devotion, readVerseIds, flippedVerseIds, stage } = get();
  const computed = computeStage(
    devotion[sage] ?? 0,
    readCountFor(sage, readVerseIds),
    flippedCountFor(sage, flippedVerseIds)
  );
  const before = stage[sage];
  const after = advanceStage(before, computed);
  if (after !== before) {
    set({ stage: { ...stage, [sage]: after } });
    track("stage_up", { sage, from: before, to: after, via: "live" });
  }
}
