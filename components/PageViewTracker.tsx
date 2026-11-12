"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, updateGrowthProperties } from "@/lib/analytics";
import { usePlayStore } from "@/lib/store";

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const hydrated = usePlayStore((s) => s.hasHydrated);
  const stages = usePlayStore((s) => s.stage);
  const readCount = usePlayStore((s) => s.readVerseIds.length);
  const inventoryCount = usePlayStore((s) => s.inventory.length);

  useEffect(() => {
    if (!hydrated) return;
    const order = ["outside", "entered", "disciple", "senior"];
    const top = Math.max(...Object.values(stages).map((stage) => order.indexOf(stage)));
    updateGrowthProperties({ top_stage: order[top], read_count: readCount, inventory_count: inventoryCount });
  }, [hydrated, stages, readCount, inventoryCount]);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page_view", { page_path: pathname, page_title: document.title });
  }, [pathname]);

  return null;
}
