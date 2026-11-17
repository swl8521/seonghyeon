import type { CSSProperties } from "react";

interface CountdownProgressProps {
  remainingMs: number;
  periodMs: number;
  slot?: number;
  tickMs?: number;
}

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function CountdownProgress({
  remainingMs,
  periodMs,
  slot,
  tickMs = 1000,
}: CountdownProgressProps) {
  const fraction = periodMs > 0 ? Math.min(1, Math.max(0, remainingMs / periodMs)) : 0;

  return (
    <div className="flex w-full flex-col gap-1.5" aria-label={`남은 시간 ${formatClock(remainingMs)}`}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          key={slot}
          className="h-full rounded-full bg-accent transition-[width] ease-linear"
          style={{
            width: `${fraction * 100}%`,
            transitionDuration: `${tickMs}ms`,
          } as CSSProperties}
        />
      </div>
      <span className="self-end font-sans text-xs tabular-nums text-muted">
        {formatClock(remainingMs)}
      </span>
    </div>
  );
}
