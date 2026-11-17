import { expect, it } from "vitest";

/**
 * 진행 바와 시계 텍스트는 같은 remainingMs 에서 나와야 한다.
 */
function progressFraction(remainingMs: number, periodMs: number) {
  const fraction = periodMs > 0 ? Math.min(1, Math.max(0, remainingMs / periodMs)) : 0;
  return fraction;
}

function clockSeconds(ms: number) {
  return Math.max(0, Math.ceil(ms / 1000));
}

it("keeps the progress bar in step with the clock across a whole period", () => {
  const periodMs = 60_000;
  for (let remaining = periodMs; remaining >= 0; remaining -= 1000) {
    const fraction = progressFraction(remaining, periodMs);
    expect(fraction).toBeCloseTo(remaining / periodMs, 10);
    expect(fraction === 0).toBe(clockSeconds(remaining) === 0);
  }
});

it("is full at the start of a slot and empty at the end", () => {
  const periodMs = 60_000;
  expect(progressFraction(periodMs, periodMs)).toBe(1);
  expect(progressFraction(0, periodMs)).toBe(0);
});

it("clamps values outside the period instead of overshooting", () => {
  const periodMs = 60_000;
  // 서버 시계가 앞서서 남은 시간이 주기를 넘겨 들어와도 가득 찬 상태로 멈춘다.
  expect(progressFraction(periodMs + 5_000, periodMs)).toBe(1);
  expect(progressFraction(-5_000, periodMs)).toBe(0);
});

it("does not divide by zero when the period is missing", () => {
  expect(progressFraction(10_000, 0)).toBe(0);
});
