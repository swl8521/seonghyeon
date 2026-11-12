interface CountdownRingProps {
  remainingMs: number;
  periodMs: number;
  size?: number;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CountdownRing({ remainingMs, periodMs, size = 48 }: CountdownRingProps) {
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
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 250ms linear" }}
        />
      </svg>
      <span className="font-sans text-xs tabular-nums text-muted">{formatClock(remainingMs)}</span>
    </div>
  );
}
