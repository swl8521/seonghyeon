import { test } from "node:test";
import assert from "node:assert/strict";
import { ZoneSchedule, buildPools, seededShuffle, verseState, slotOf } from "../src/schedule.js";

function fakeVerses() {
  const out = [];
  for (const sage of ["confucius", "laozi", "sunzi"]) {
    for (let i = 1; i <= 20; i++) out.push({ id: `${sage}-${String(i).padStart(2, "0")}`, sage });
  }
  return out;
}

test("buildPools: 구역별 풀 크기와 버전", () => {
  const { pools, contentVersion } = buildPools(fakeVerses());
  assert.equal(pools.hall.length, 60);
  assert.equal(pools.confucius.length, 20);
  assert.equal(pools.laozi.length, 20);
  assert.equal(pools.sunzi.length, 20);
  assert.match(contentVersion, /^[0-9a-f]{12}$/);
});

test("buildPools: 입력 순서가 달라도 같은 버전", () => {
  const a = buildPools(fakeVerses()).contentVersion;
  const b = buildPools(fakeVerses().reverse()).contentVersion;
  assert.equal(a, b);
});

test("buildPools: 중복 id, 잘못된 sage 거부", () => {
  assert.throws(() => buildPools([{ id: "a", sage: "confucius" }, { id: "a", sage: "laozi" }]));
  assert.throws(() => buildPools([{ id: "a", sage: "mencius" }]));
});

test("seededShuffle: 같은 시드면 같은 결과, 원소 보존", () => {
  const items = Array.from({ length: 20 }, (_, i) => i);
  const a = seededShuffle(items, 42);
  const b = seededShuffle(items, 42);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort((x, y) => x - y), items);
  assert.notDeepEqual(seededShuffle(items, 43), a);
});

test("ZoneSchedule: 한 바퀴 안에서 중복 없음", () => {
  const { pools, contentVersion } = buildPools(fakeVerses());
  for (const zone of ["hall", "confucius"]) {
    const s = new ZoneSchedule(zone, pools[zone], contentVersion);
    const n = pools[zone].length;
    for (const cycle of [0, 1, 7, 12345]) {
      const seen = new Set();
      for (let i = 0; i < n; i++) seen.add(s.verseAt(cycle * n + i));
      assert.equal(seen.size, n, `${zone} cycle ${cycle}`);
    }
  }
});

test("ZoneSchedule: 바퀴 경계에서 연속 중복 없음", () => {
  const { pools, contentVersion } = buildPools(fakeVerses());
  const s = new ZoneSchedule("sunzi", pools.sunzi, contentVersion);
  const n = pools.sunzi.length;
  for (let cycle = 1; cycle < 500; cycle++) {
    assert.notEqual(s.verseAt(cycle * n - 1), s.verseAt(cycle * n), `cycle ${cycle}`);
  }
});

test("ZoneSchedule: 인스턴스가 달라도 같은 슬롯이면 같은 구절 (서버 재시작 안전)", () => {
  const { pools, contentVersion } = buildPools(fakeVerses());
  const a = new ZoneSchedule("hall", pools.hall, contentVersion);
  const b = new ZoneSchedule("hall", pools.hall, contentVersion);
  const slot = 29_000_123;
  // b는 앞 바퀴 캐시 없이 바로 조회
  assert.equal(a.verseAt(slot - 60), b.verseAt(slot - 60));
  assert.equal(b.verseAt(slot), new ZoneSchedule("hall", pools.hall, contentVersion).verseAt(slot));
});

test("verseState: 남은 시간과 다음 구절", () => {
  const { pools, contentVersion } = buildPools(fakeVerses());
  const s = new ZoneSchedule("laozi", pools.laozi, contentVersion);
  const period = 60_000;
  const now = 1_763_000_000_000 + 22_880; // 슬롯 경계 + 22.88초
  const st = verseState(s, now, period);
  assert.equal(st.slot, slotOf(now, period));
  assert.equal(st.remainingMs, (st.slot + 1) * period - now);
  assert.ok(st.remainingMs > 0 && st.remainingMs <= period);
  assert.equal(st.nextVerseId, s.verseAt(st.slot + 1));
  assert.notEqual(st.verseId, st.nextVerseId);
});
