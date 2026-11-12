"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import type { SageId } from "@/lib/types";

interface ShareLandingTrackerProps {
  kind: "sage_verse" | "verse";
  sage?: SageId;
  verseId: string;
}

export function ShareLandingTracker({ kind, sage, verseId }: ShareLandingTrackerProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    track("share_landing", { kind, sage, verse_id: verseId, ref: params.get("ref") ?? undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
