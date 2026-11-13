import type { CSSProperties } from "react";

interface CountdownRingProps {
  remainingMs: number;
  periodMs: number;
  /** 슬롯이 바뀌면 전환 없이 가득 찬 상태에서 다시 시작하기 위한 key. */
  slot?: number;
  size?: number;
  /** 남은 시간이 갱신되는 주기. 링은 이 시간에 걸쳐 다음 위치로 미끄러진다. */
  tickMs?: number;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * 구절 카운트다운 링.
 *
 * 링과 시계 텍스트는 반드시 같은 remainingMs 하나에서 나와야 한다. 예전에는
 * 링을 CSS 키프레임 애니메이션에 따로 맡겼는데, 그러면 애니메이션이 제 시간을
 * 따로 세기 때문에 숫자는 맞는데 링만 어긋나는 일이 생긴다. 지금은 React가
 * 1초마다 주는 값으로 stroke-dashoffset 을 직접 정하고, 그 사이는 CSS
 * transition 이 메운다. 리렌더가 몇 번 일어나도 값이 같으면 아무 일도
 * 생기지 않으므로 합장 같은 다른 갱신에 흔들리지 않는다.
 */
export function CountdownRing({
  remainingMs,
  periodMs,
  slot,
  size = 48,
  tickMs = 1000,
}: CountdownRingProps) {
  const fraction = periodMs > 0 ? Math.min(1, Math.max(0, remainingMs / periodMs)) : 0;
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={3}
        />
        <circle
          // 슬롯이 바뀌면 remount되어 전환 없이 가득 찬 상태에서 다시 시작한다.
          // key가 없으면 링이 빈 상태에서 가득 찬 상태로 거꾸로 미끄러진다.
          key={slot}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="countdown-ring"
          style={{ transitionDuration: `${tickMs}ms` } as CSSProperties}
        />
      </svg>
      <span className="font-sans text-xs tabular-nums text-muted">{formatClock(remainingMs)}</span>
    </div>
  );
}
