"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { SageId } from "@/lib/types";

export function ShareLandingTracker({ sage }: { sage: SageId }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    track("share_landing", { sage, ref: params.get("ref") ?? undefined });
  }, [sage]);

  return null;
}
