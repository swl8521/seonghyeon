import { expect, it } from "vitest";

/**
 * 링의 기하와 시계 텍스트는 같은 remainingMs 에서 나와야 한다.
 * 예전에는 링을 CSS 키프레임 애니메이션이 따로 돌려서 숫자는 맞는데 링만
 * 어긋났다. 여기서는 CountdownRing 이 쓰는 계산을 그대로 두고, 남은 시간과
 * 그려지는 양이 항상 같은 비율인지 확인한다.
 */
function ringOffset(remainingMs: number, periodMs: number, size = 48) {
  const fraction = periodMs > 0 ? Math.min(1, Math.max(0, remainingMs / periodMs)) : 0;
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  return { circumference, offset: circumference * (1 - fraction), fraction };
}

function clockSeconds(ms: number) {
  return Math.max(0, Math.ceil(ms / 1000));
}

it("keeps the ring in step with the clock across a whole period", () => {
  const periodMs = 60_000;
  for (let remaining = periodMs; remaining >= 0; remaining -= 1000) {
    const { circumference, offset, fraction } = ringOffset(remaining, periodMs);
    // 남은 시간 비율과 그려진 호의 비율이 같아야 한다.
    const drawn = (circumference - offset) / circumference;
    expect(drawn).toBeCloseTo(remaining / periodMs, 10);
    // 시계가 0을 보이는 순간에만 링이 비어야 한다.
    expect(fraction === 0).toBe(clockSeconds(remaining) === 0);
  }
});

it("is full at the start of a slot and empty at the end", () => {
  const periodMs = 60_000;
  expect(ringOffset(periodMs, periodMs).offset).toBeCloseTo(0, 10);
  expect(ringOffset(0, periodMs).offset).toBeCloseTo(ringOffset(0, periodMs).circumference, 10);
});

it("clamps values outside the period instead of overshooting", () => {
  const periodMs = 60_000;
  // 서버 시계가 앞서서 남은 시간이 주기를 넘겨 들어와도 가득 찬 상태로 멈춘다.
  expect(ringOffset(periodMs + 5_000, periodMs).offset).toBeCloseTo(0, 10);
  // 음수로 들어와도 빈 상태에서 멈춘다.
  const { circumference, offset } = ringOffset(-5_000, periodMs);
  expect(offset).toBeCloseTo(circumference, 10);
});

it("does not divide by zero when the period is missing", () => {
  const { circumference, offset } = ringOffset(10_000, 0);
  expect(Number.isFinite(offset)).toBe(true);
  expect(offset).toBeCloseTo(circumference, 10);
});
