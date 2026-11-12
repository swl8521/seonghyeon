import type { ReactNode } from "react";

interface TopBarProps {
  left: ReactNode;
  right?: ReactNode;
}

export function TopBar({ left, right }: TopBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 font-sans text-sm text-foreground">
      <div className="flex items-center gap-2">{left}</div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}
