"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { getSage, getVerse } from "@/lib/content";
import { usePlayStore } from "@/lib/store";
import { track } from "@/lib/analytics";
import type { SageId } from "@/lib/types";
import { Toast } from "@/components/Toast";

const FILTERS: { id: SageId | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "confucius", label: "공자" },
  { id: "laozi", label: "노자" },
  { id: "sunzi", label: "손자" },
];

function zoneLabel(zone: string, source: "live" | "practice"): string {
  if (zone === "hall") return "광장";
  const hall = getSage(zone as SageId)?.hall ?? zone;
  return source === "practice" ? `${hall} 수행` : hall;
}

function formatDate(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function InventoryScreen() {
  const inventory = usePlayStore((s) => s.inventory);
  const removeFromInventory = usePlayStore((s) => s.removeFromInventory);
  const [filter, setFilter] = useState<SageId | "all">("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track("saved_view", { count: inventory.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = inventory
    .map((item) => ({ item, verse: getVerse(item.verseId) }))
    .filter((row): row is { item: (typeof inventory)[number]; verse: NonNullable<ReturnType<typeof getVerse>> } =>
      Boolean(row.verse)
    )
    .filter((row) => filter === "all" || row.verse.sage === filter)
    .sort((a, b) => b.item.at - a.item.at);

  async function handleShare(verseId: string, translation: string) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const url = `${siteUrl}/v/${verseId}?ref=share`;
    const shareData = { title: "성현 문하", text: translation, url };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        track("share_click", { kind: "verse", verse_id: verseId, method: "native" });
      } catch {
        // 공유 취소는 조용히 무시
      }
      return;
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("no clipboard");
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    track("share_click", { kind: "verse", verse_id: verseId, method: "copy" });
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <Link href="/" className="font-sans text-xs text-muted">
          ← 광장
        </Link>
        <h1 className="font-serif text-2xl font-bold">경함(經函)</h1>
        <p className="font-sans text-sm text-muted">담아둔 구절</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-4 py-1.5 font-sans text-sm ${
              filter === f.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="font-sans text-sm text-muted">아직 담은 구절이 없습니다</p>
          <Link
            href="/"
            className="rounded-full bg-accent px-6 py-2 font-sans text-sm text-accent-foreground"
          >
            광장으로
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ item, verse }) => (
            <li key={item.verseId} className="rounded-xl border border-border bg-card p-4">
              <p className="font-serif text-lg leading-snug tracking-wide">{verse.original}</p>
              <p className="mt-1 font-sans text-sm leading-relaxed">{verse.translation}</p>
              <p className="mt-2 text-xs text-muted">{verse.source}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-sans text-xs text-muted">
                  {zoneLabel(item.zone, item.source)} · {formatDate(item.at)}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleShare(item.verseId, verse.translation)}
                    className="rounded-full border border-border px-3 py-1 font-sans text-xs text-foreground"
                  >
                    보내기
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromInventory(item.verseId)}
                    className="rounded-full border border-border px-3 py-1 font-sans text-xs text-muted"
                  >
                    빼기
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {copied && <Toast text="복사됨" onDone={() => setCopied(false)} />}
      </AnimatePresence>
    </main>
  );
}
