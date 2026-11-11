import type { SageId, Verse } from "./types";

export const CARDS_PER_SAGE = 7;
export const MAX_CONSECUTIVE_SAME_SAGE = 2;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], count: number, rng: () => number): T[] {
  return shuffle(arr, rng).slice(0, count);
}

/**
 * 성현별 20개 중 랜덤 7개씩 뽑아 21장 덱을 만든다. 같은 성현이 3장 연속 나오지 않게 섞고,
 * 가능하면 excludeIds(직전 라운드 구절)를 제외한다.
 */
export function buildDeck(
  verses: Verse[],
  sageIds: SageId[],
  rng: () => number = Math.random,
  excludeIds: string[] = []
): string[] {
  const queues = new Map<SageId, string[]>();
  for (const sage of sageIds) {
    const pool = verses.filter((v) => v.sage === sage);
    const preferred = pool.filter((v) => !excludeIds.includes(v.id));
    const source = preferred.length >= CARDS_PER_SAGE ? preferred : pool;
    const picked = pickRandom(source, CARDS_PER_SAGE, rng).map((v) => v.id);
    queues.set(sage, picked);
  }

  const result: string[] = [];
  const resultSages: SageId[] = [];
  const total = sageIds.length * CARDS_PER_SAGE;

  while (result.length < total) {
    const available = sageIds.filter((s) => (queues.get(s)?.length ?? 0) > 0);
    if (available.length === 0) break;

    const lastTwo = resultSages.slice(-MAX_CONSECUTIVE_SAME_SAGE);
    const blocked =
      lastTwo.length === MAX_CONSECUTIVE_SAME_SAGE && lastTwo.every((s) => s === lastTwo[0])
        ? lastTwo[0]
        : null;

    let candidates = available.filter((s) => s !== blocked);
    if (candidates.length === 0) candidates = available;

    // 남은 카드가 가장 많은 성현을 우선 선택해 특정 성현이 먼저 소진되어
    // 막판에 연속 배치가 강제되는 상황을 막는다.
    const maxRemaining = Math.max(...candidates.map((s) => queues.get(s)?.length ?? 0));
    const balanced = candidates.filter((s) => (queues.get(s)?.length ?? 0) === maxRemaining);

    const sage = balanced[Math.floor(rng() * balanced.length)];
    const queue = queues.get(sage)!;
    const id = queue.shift();
    if (!id) continue;

    result.push(id);
    resultSages.push(sage);
  }

  return result;
}
