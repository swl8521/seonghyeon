import { createHash } from "node:crypto";

export const ZONES = ["hall", "confucius", "laozi", "sunzi"];
export const SAGES = ["confucius", "laozi", "sunzi"];

/** 문자열 → 32비트 시드 */
export function hashSeed(str) {
  return createHash("sha256").update(str).digest().readUInt32LE(0);
}

/** 시드 고정 난수 (mulberry32) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates 셔플 (원본 불변) */
export function seededShuffle(items, seed) {
  const arr = items.slice();
  const rng = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * verses.json 배열 → 구역별 풀과 콘텐츠 버전
 * @param {{id:string, sage:string}[]} verses
 */
export function buildPools(verses) {
  // 홀은 읽기 풀만 돌린다. pools 가 없는 예전 데이터는 읽기 풀로 본다.
  verses = verses.filter((v) => !v.pools || v.pools.includes("read"));
  if (!Array.isArray(verses) || verses.length === 0) throw new Error("verses must be a non-empty array");
  const ids = new Set();
  const pools = { hall: [], confucius: [], laozi: [], sunzi: [] };
  for (const v of verses) {
    if (!v || typeof v.id !== "string" || !SAGES.includes(v.sage)) {
      throw new Error(`invalid verse entry: ${JSON.stringify(v)}`);
    }
    if (ids.has(v.id)) throw new Error(`duplicate verse id: ${v.id}`);
    ids.add(v.id);
    pools.hall.push(v.id);
    pools[v.sage].push(v.id);
  }
  for (const z of ZONES) {
    pools[z].sort();
    if (pools[z].length < 3) throw new Error(`zone "${z}" needs at least 3 verses`);
  }
  const contentVersion = createHash("sha256").update(pools.hall.join(",")).digest("hex").slice(0, 12);
  return { pools, contentVersion };
}

/**
 * 구역 하나의 방송 순서.
 * 한 바퀴(cycle) = 풀 크기만큼의 슬롯. 바퀴마다 시드 셔플한 순열을 쓰므로
 * 한 바퀴 안에서는 같은 구절이 다시 나오지 않는다.
 */
export class ZoneSchedule {
  constructor(zone, pool, contentVersion) {
    this.zone = zone;
    this.pool = pool;
    this.contentVersion = contentVersion;
    this.cache = new Map(); // cycle -> permutation
  }

  rawPermutation(cycle) {
    return seededShuffle(this.pool, hashSeed(`${this.contentVersion}:${this.zone}:${cycle}`));
  }

  permutation(cycle) {
    let perm = this.cache.get(cycle);
    if (perm) return perm;
    perm = this.rawPermutation(cycle);
    // 바퀴 경계에서 같은 구절이 연달아 나오지 않게.
    // 0·1번만 바꾸므로 마지막 원소는 항상 raw와 같다 (풀 크기 ≥ 3) → 앞 바퀴는 raw만 보면 되고 재귀가 없다
    const prev = this.rawPermutation(cycle - 1);
    if (perm[0] === prev[prev.length - 1]) [perm[0], perm[1]] = [perm[1], perm[0]];
    this.cache.set(cycle, perm);
    if (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value);
    return perm;
  }

  verseAt(slot) {
    const n = this.pool.length;
    const cycle = Math.floor(slot / n);
    return this.permutation(cycle)[((slot % n) + n) % n];
  }
}

export function slotOf(nowMs, periodMs) {
  return Math.floor(nowMs / periodMs);
}

/** 클라이언트에 보내는 현재 구절 상태 */
export function verseState(schedule, nowMs, periodMs) {
  const slot = slotOf(nowMs, periodMs);
  return {
    zone: schedule.zone,
    slot,
    verseId: schedule.verseAt(slot),
    nextVerseId: schedule.verseAt(slot + 1),
    remainingMs: (slot + 1) * periodMs - nowMs,
    periodMs,
  };
}
