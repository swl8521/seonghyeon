import type { CSSProperties } from "react";

interface CountdownRingProps {
  remainingMs: number;
  periodMs: number;
  /** 슬롯이 바뀌면 링 애니메이션을 처음부터 다시 돌리기 위한 key. */
  slot?: number;
  size?: number;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CountdownRing({ remainingMs, periodMs, slot, size = 48 }: CountdownRingProps) {
  const fraction = periodMs > 0 ? Math.min(1, Math.max(0, remainingMs / periodMs)) : 0;
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);
  // 이번 슬롯에서 이미 지난 시간. 음수 delay로 그만큼 건너뛴다.
  const elapsedMs = Math.max(0, periodMs - remainingMs);

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
          // 슬롯이 바뀌면 remount되어 애니메이션이 처음부터 다시 돈다.
          key={slot}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          // CSS 애니메이션이 이 값을 덮어쓴다. prefers-reduced-motion으로
          // 애니메이션이 꺼졌을 때만 이 속성값이 그대로 보인다.
          strokeDashoffset={offset}
          className="countdown-ring"
          style={
            {
              animationDuration: `${periodMs}ms`,
              animationDelay: `-${elapsedMs}ms`,
              "--countdown-circumference": circumference,
            } as CSSProperties
          }
        />
      </svg>
      <span className="font-sans text-xs tabular-nums text-muted">{formatClock(remainingMs)}</span>
    </div>
  );
}
