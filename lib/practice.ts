import { DEVOTION, PRACTICE_DECK_SIZE, STAGE_THRESHOLDS } from "./constants";
import { acceptProbability, addVec, cosine, pref, score, zeroVec } from "./judge";
import type { PracticeHeadKind, PracticeOutcome, SageId, Stage, Verse, Vec } from "./types";

export type SwipeDirection = "like" | "dislike";
export type JudgmentResult = "nod" | "nudge";

export interface PracticeState {
  id: string;
  sage: SageId;
  deck: string[]; // 10개
  index: number;
  user: Vec;
  likedIds: string[];
  dislikedIds: string[];
  flippedIds: string[];
  devotionGain: number;
  stageBefore: Stage;
  outcome: PracticeOutcome | null;
  fromShareVerseId: string | null;
  startedAt: number;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 그 성현 구절 20개 중 10장을 뽑는다. 우선순위: 안 읽은 구절 → 읽었지만 경함에
 * 없는 구절 → 경함에 있는 구절. 직전 수행 10장은 안 읽은 구절이 모자랄 때만
 * 다시 허용한다 (§5.4).
 */
export function buildPracticeDeck(
  sage: SageId,
  verses: Verse[],
  readVerseIds: string[],
  inventoryVerseIds: string[],
  lastPracticeVerseIds: string[],
  fromShareVerseId: string | null,
  rng: () => number = Math.random
): string[] {
  const pool = verses.filter((v) => v.sage === sage && v.id !== fromShareVerseId);

  const unread = pool.filter((v) => !readVerseIds.includes(v.id));
  const unreadFresh = unread.filter((v) => !lastPracticeVerseIds.includes(v.id));
  const unreadGroup = unreadFresh.length >= PRACTICE_DECK_SIZE ? unreadFresh : unread;

  const readIds = new Set(unreadGroup.map((v) => v.id));
  const readNotInInventory = pool.filter(
    (v) => !readIds.has(v.id) && readVerseIds.includes(v.id) && !inventoryVerseIds.includes(v.id)
  );
  const readInInventory = pool.filter(
    (v) =>
      !readIds.has(v.id) &&
      readVerseIds.includes(v.id) &&
      inventoryVerseIds.includes(v.id)
  );

  const ordered = [
    ...shuffle(unreadGroup, rng),
    ...shuffle(readNotInInventory, rng),
    ...shuffle(readInInventory, rng),
  ];

  return ordered.slice(0, PRACTICE_DECK_SIZE).map((v) => v.id);
}

export function createPracticeState(
  sage: SageId,
  deck: string[],
  stageBefore: Stage,
  fromShareVerseId: string | null,
  startedAt: number = Date.now()
): PracticeState {
  return {
    id: `p_${startedAt.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    sage,
    deck,
    index: 0,
    user: zeroVec(),
    likedIds: [],
    dislikedIds: [],
    flippedIds: [],
    devotionGain: 0,
    stageBefore,
    outcome: null,
    fromShareVerseId,
    startedAt,
  };
}

export function applyPracticeSwipe(
  state: PracticeState,
  verse: Verse,
  dir: SwipeDirection
): PracticeState {
  const delta = dir === "like" ? 1 : -0.5;
  const user = addVec(state.user, verse.tags, delta);
  const flippedBefore = state.flippedIds.includes(verse.id);

  const likedIds = dir === "like" ? [...state.likedIds, verse.id] : state.likedIds;
  const dislikedIds = dir === "dislike" ? [...state.dislikedIds, verse.id] : state.dislikedIds;

  const gain =
    dir === "like"
      ? DEVOTION.like + (flippedBefore ? DEVOTION.likeWithFlip : 0)
      : DEVOTION.dislike;

  return {
    ...state,
    user,
    likedIds,
    dislikedIds,
    devotionGain: state.devotionGain + gain,
    index: state.index + 1,
  };
}

/**
 * 해설을 읽은 구절을 기록한다. 되돌리지 않는다 — 성장 단계가 이 개수를 세기
 * 때문이다 (store.ts flippedCountFor). 카드가 지금 앞면인지 뒷면인지는
 * 화면이 따로 들고 있다 (PracticeScreen).
 */
export function flipPracticeCard(state: PracticeState, verseId: string): PracticeState {
  if (state.flippedIds.includes(verseId)) return state;
  return { ...state, flippedIds: [...state.flippedIds, verseId] };
}

export interface TeacherVerdict {
  kind: JudgmentResult;
  p: number;
}

/** 수행 4, 8장째 직후 스승의 평 — v1의 score/p(=sigmoid) 공식을 그대로 쓴다 (§5.3). */
export function judgeTeacherNote(
  state: PracticeState,
  sageVec: Vec,
  rng: () => number = Math.random
): TeacherVerdict {
  const s = score(state.user, sageVec, state.likedIds.length, state.dislikedIds.length);
  const p = acceptProbability(s);
  return { kind: rng() < p ? "nod" : "nudge", p };
}

/** 추천 구절: 이번 덱에 없는 것 중 안 읽은 것 우선, 그 다음 user와 tags 코사인 최대. */
export function pickRecommendedVerse(
  state: PracticeState,
  verses: Verse[],
  readVerseIds: string[]
): string | null {
  const candidates = verses.filter(
    (v) => v.sage === state.sage && !state.deck.includes(v.id)
  );
  if (candidates.length === 0) return null;

  const unread = candidates.filter((v) => !readVerseIds.includes(v.id));
  const pool = unread.length > 0 ? unread : candidates;

  let best: Verse = pool[0];
  let bestScore = -Infinity;
  for (const v of pool) {
    const c = cosine(state.user, v.tags);
    if (c > bestScore) {
      bestScore = c;
      best = v;
    }
  }
  return best.id;
}

/** [읽어보기]: 추천 구절을 다음 카드로 삽입하고, 덱 마지막 카드를 하나 빼서 장수를 유지한다. */
export function insertRecommendedVerse(state: PracticeState, verseId: string): PracticeState {
  const nextIndex = state.index;
  const deck = [...state.deck];
  deck.splice(nextIndex, 0, verseId);
  deck.pop();
  return { ...state, deck };
}

const STAGE_ORDER: Stage[] = ["outside", "entered", "disciple", "senior"];

function stageRank(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** 정진/읽기/해설 조건으로 절대 단계를 계산한다 (§5.5). 하락 방지는 advanceStage에서. */
export function computeStage(devotion: number, readCount: number, flippedCount: number): Stage {
  const { entered, disciple, senior } = STAGE_THRESHOLDS;
  if (
    devotion >= senior.devotion &&
    readCount >= senior.read &&
    flippedCount >= senior.flipped
  ) {
    return "senior";
  }
  if (devotion >= disciple.devotion && readCount >= disciple.read) {
    return "disciple";
  }
  if (devotion >= entered.devotion) {
    return "entered";
  }
  return "outside";
}

/** 단계는 내려가지 않는다 — 기존 단계와 새로 계산한 단계 중 더 높은 쪽을 취한다. */
export function advanceStage(current: Stage, computed: Stage): Stage {
  return stageRank(computed) > stageRank(current) ? computed : current;
}

/** 다음 단계까지 필요한 정진 점수 (게이지용). 이미 최고 단계면 null. */
export function stageDevotionTarget(stage: Stage): number | null {
  if (stage === "outside") return STAGE_THRESHOLDS.entered.devotion;
  if (stage === "entered") return STAGE_THRESHOLDS.disciple.devotion;
  if (stage === "disciple") return STAGE_THRESHOLDS.senior.devotion;
  return null;
}

export interface NextRequirement {
  kind: "devotion" | "read" | "flipped";
  remaining: number;
}

/** 다음 단계까지 부족한 조건 중 첫 번째를 돌려준다. 이미 최고 단계면 null. */
export function nextRequirement(
  stage: Stage,
  devotion: number,
  readCount: number,
  flippedCount: number
): NextRequirement | null {
  if (stage === "outside") {
    const remaining = STAGE_THRESHOLDS.entered.devotion - devotion;
    return remaining > 0 ? { kind: "devotion", remaining } : null;
  }
  if (stage === "entered") {
    const devRemaining = STAGE_THRESHOLDS.disciple.devotion - devotion;
    if (devRemaining > 0) return { kind: "devotion", remaining: devRemaining };
    const readRemaining = STAGE_THRESHOLDS.disciple.read - readCount;
    if (readRemaining > 0) return { kind: "read", remaining: readRemaining };
    return null;
  }
  if (stage === "disciple") {
    const devRemaining = STAGE_THRESHOLDS.senior.devotion - devotion;
    if (devRemaining > 0) return { kind: "devotion", remaining: devRemaining };
    const readRemaining = STAGE_THRESHOLDS.senior.read - readCount;
    if (readRemaining > 0) return { kind: "read", remaining: readRemaining };
    const flippedRemaining = STAGE_THRESHOLDS.senior.flipped - flippedCount;
    if (flippedRemaining > 0) return { kind: "flipped", remaining: flippedRemaining };
    return null;
  }
  return null;
}

/** 수행 결과 헤드라인 (§5.6). */
export function computeHeadKind(
  likedCount: number,
  stageBefore: Stage,
  stageAfter: Stage
): PracticeHeadKind {
  if (likedCount <= 1) return "none";
  if (stageAfter !== stageBefore) {
    return stageBefore === "outside" ? "enter" : "promote";
  }
  if (stageAfter === "outside") return "front";
  return "stay";
}

/** 나를 들인 구절 (§5.7): 해설까지 읽은 것 → 코사인 높은 순 → 나중에 읽은 것. */
export function pickHeadlineVerse(state: PracticeState, verses: Verse[]): string | null {
  const liked = state.likedIds
    .map((id) => verses.find((v) => v.id === id))
    .filter((v): v is Verse => Boolean(v));
  if (liked.length === 0) return null;

  let best: Verse | null = null;
  let bestKey: [number, number] = [-Infinity, -Infinity];
  liked.forEach((v, order) => {
    const flipped = state.flippedIds.includes(v.id) ? 1 : 0;
    const c = cosine(state.user, v.tags);
    const key: [number, number] = [flipped, c];
    if (
      key[0] > bestKey[0] ||
      (key[0] === bestKey[0] && key[1] >= bestKey[1])
    ) {
      // order가 커질수록 나중에 읽은 것 — 동점이면 나중 것으로 덮어써 우선시킨다
      bestKey = key;
      best = v;
      void order;
    }
  });
  return best ? (best as Verse).id : null;
}

/** 수행이 끝났을 때(10장 완료) 결과를 확정한다. 이후 재계산하지 않고 outcome에 저장. */
export function finalizePracticeOutcome(
  state: PracticeState,
  stageAfter: Stage,
  verses: Verse[]
): PracticeOutcome {
  const headKind = computeHeadKind(state.likedIds.length, state.stageBefore, stageAfter);
  const pickedVerseId = headKind === "none" ? null : pickHeadlineVerse(state, verses);
  // lineId는 LINES(콘텐츠 레이어)에 접근해야 해서 여기서는 비워두고, 호출하는
  // 쪽(store)에서 채운다 — 한 번만 뽑고 outcome에 고정해 새로고침해도 같게 한다.
  return { headKind, pickedVerseId, lineId: null };
}

export { pref, score };
