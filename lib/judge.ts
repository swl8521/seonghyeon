import type { Axis, Sage, SageId, Vec, Verse } from "./types";

export const AXES: Axis[] = ["ren", "xue", "dao", "mou", "rou"];
export const FIT_THRESHOLD = 0.5;
export const JUDGMENT_INDICES = [6, 12, 18];
export const JUDGMENT_WINDOW = 6; // 직전 몇 장 중 가장 많이 나온 성현을 등장시킬지
export const DISLIKE_REACTION_CHANCE = 0.25;

export type SwipeDirection = "like" | "dislike";
export type JudgmentResult = "accept" | "reject";
export type Relation = "mutual" | "unrequited" | "unexpected" | "none";

export interface JudgmentEvent {
  index: number; // 몇 번째 스와이프 직후 발생했는지
  sage: SageId;
  result: JudgmentResult;
  p: number;
}

export interface RoundState {
  roundId: string;
  deck: string[]; // verse id 21개
  index: number; // 현재까지 스와이프한 카드 수
  // 라운드를 거듭해도 리셋되지 않는 누적 성향 — 중간 판별(accept/reject) 연출에 쓰인다.
  user: Vec;
  likes: Record<SageId, number>;
  dislikes: Record<SageId, number>;
  // 이번 라운드에서만 쌓인 성향 — 결과 화면의 "대표 유형"은 이걸로 계산한다.
  roundUser: Vec;
  roundLikes: Record<SageId, number>;
  roundDislikes: Record<SageId, number>;
  events: JudgmentEvent[];
  startedAt: number;
}

export interface ResultSummary {
  type: SageId; // argmax score, 대표 유형
  scores: Record<SageId, number>;
  relations: Record<SageId, Relation>;
}

function zeroVec(): Vec {
  return { ren: 0, xue: 0, dao: 0, mou: 0, rou: 0 };
}

function zeroCounts(sageIds: SageId[]): Record<SageId, number> {
  const out = {} as Record<SageId, number>;
  for (const id of sageIds) out[id] = 0;
  return out;
}

function addVec(a: Vec, b: Vec, scale: number): Vec {
  const out = {} as Vec;
  for (const axis of AXES) out[axis] = a[axis] + scale * b[axis];
  return out;
}

export function cosine(a: Vec, b: Vec): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const axis of AXES) {
    dot += a[axis] * b[axis];
    na += a[axis] * a[axis];
    nb += b[axis] * b[axis];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function fit(user: Vec, sageVec: Vec): number {
  return cosine(user, sageVec);
}

export function pref(
  sage: SageId,
  likes: Record<SageId, number>,
  dislikes: Record<SageId, number>
): number {
  const l = likes[sage] ?? 0;
  const d = dislikes[sage] ?? 0;
  return (l - d) / (l + d + 1);
}

export function score(
  user: Vec,
  sageVec: Vec,
  sage: SageId,
  likes: Record<SageId, number>,
  dislikes: Record<SageId, number>
): number {
  return 0.6 * fit(user, sageVec) + 0.4 * pref(sage, likes, dislikes);
}

export function acceptProbability(scoreValue: number): number {
  return sigmoid(4 * scoreValue);
}

export interface RoundSeed {
  user: Vec;
  likes: Record<SageId, number>;
  dislikes: Record<SageId, number>;
}

/**
 * 새 라운드를 만든다. seed를 주면(이전 라운드가 있었다면) user/likes/dislikes를
 * 0부터 시작하지 않고 그 값을 이어받는다 — 성향이 라운드를 거듭할수록 누적되게
 * 하기 위함. fit()은 코사인 유사도라 스케일에 무관하고, pref()도 항상 [-1,1]로
 * 정규화되는 비율이라 값이 아무리 누적돼도 기존 임계값(FIT_THRESHOLD 등)을
 * 다시 조정할 필요가 없다.
 */
export function createRoundState(
  deck: string[],
  roundId: string,
  sageIds: SageId[],
  startedAt: number = Date.now(),
  seed?: RoundSeed
): RoundState {
  return {
    roundId,
    deck,
    index: 0,
    user: seed ? { ...seed.user } : zeroVec(),
    likes: seed ? { ...seed.likes } : zeroCounts(sageIds),
    dislikes: seed ? { ...seed.dislikes } : zeroCounts(sageIds),
    roundUser: zeroVec(),
    roundLikes: zeroCounts(sageIds),
    roundDislikes: zeroCounts(sageIds),
    events: [],
    startedAt,
  };
}

export function applySwipe(
  state: RoundState,
  verse: Verse,
  dir: SwipeDirection
): RoundState {
  const delta = dir === "like" ? 1 : -0.5;
  const user = addVec(state.user, verse.tags, delta);
  const likes = { ...state.likes };
  const dislikes = { ...state.dislikes };
  const roundUser = addVec(state.roundUser, verse.tags, delta);
  const roundLikes = { ...state.roundLikes };
  const roundDislikes = { ...state.roundDislikes };
  if (dir === "like") {
    likes[verse.sage] = (likes[verse.sage] ?? 0) + 1;
    roundLikes[verse.sage] = (roundLikes[verse.sage] ?? 0) + 1;
  } else {
    dislikes[verse.sage] = (dislikes[verse.sage] ?? 0) + 1;
    roundDislikes[verse.sage] = (roundDislikes[verse.sage] ?? 0) + 1;
  }

  return {
    ...state,
    user,
    likes,
    dislikes,
    roundUser,
    roundLikes,
    roundDislikes,
    index: state.index + 1,
  };
}

export function isJudgmentIndex(index: number): boolean {
  return JUDGMENT_INDICES.includes(index);
}

export function pickMostFrequentSage(
  recentSages: SageId[],
  rng: () => number = Math.random
): SageId {
  const counts = new Map<SageId, number>();
  for (const s of recentSages) counts.set(s, (counts.get(s) ?? 0) + 1);

  let max = -1;
  let candidates: SageId[] = [];
  for (const [sage, count] of counts) {
    if (count > max) {
      max = count;
      candidates = [sage];
    } else if (count === max) {
      candidates.push(sage);
    }
  }
  if (candidates.length === 1) return candidates[0];
  return candidates[Math.floor(rng() * candidates.length)];
}

export function runJudgment(
  state: RoundState,
  sages: Sage[],
  recentSages: SageId[],
  rng: () => number = Math.random
): { state: RoundState; event: JudgmentEvent } {
  const sage = pickMostFrequentSage(recentSages, rng);
  const sageDef = sages.find((s) => s.id === sage);
  if (!sageDef) throw new Error(`unknown sage: ${sage}`);

  const s = score(state.user, sageDef.vec, sage, state.likes, state.dislikes);
  const p = acceptProbability(s);
  const result: JudgmentResult = rng() < p ? "accept" : "reject";
  const event: JudgmentEvent = { index: state.index, sage, result, p };

  return {
    state: { ...state, events: [...state.events, event] },
    event,
  };
}

export function relationFor(prefValue: number, fitValue: number): Relation {
  if (prefValue > 0 && fitValue >= FIT_THRESHOLD) return "mutual";
  if (prefValue > 0 && fitValue < FIT_THRESHOLD) return "unrequited";
  if (prefValue <= 0 && fitValue >= FIT_THRESHOLD) return "unexpected";
  return "none";
}

export function computeResult(
  user: Vec,
  likes: Record<SageId, number>,
  dislikes: Record<SageId, number>,
  sages: Sage[]
): ResultSummary {
  const scores = {} as Record<SageId, number>;
  const relations = {} as Record<SageId, Relation>;

  for (const sageDef of sages) {
    const sc = score(user, sageDef.vec, sageDef.id, likes, dislikes);
    scores[sageDef.id] = sc;
    relations[sageDef.id] = relationFor(
      pref(sageDef.id, likes, dislikes),
      fit(user, sageDef.vec)
    );
  }

  let type: SageId = sages[0].id;
  let best = -Infinity;
  for (const sageDef of sages) {
    if (scores[sageDef.id] > best) {
      best = scores[sageDef.id];
      type = sageDef.id;
    }
  }

  return { type, scores, relations };
}
