"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/live";
import { usePlayStore, readCountFor, flippedCountFor } from "@/lib/store";
import { track } from "@/lib/analytics";
import type { Sage } from "@/lib/types";
import { TopBar } from "@/components/TopBar";
import { LiveVerseCard } from "@/components/LiveVerseCard";
import { LiveActions } from "@/components/LiveActions";
import { StageCard } from "@/components/StageCard";

const BOW_BATCH_MS = 5000;
const DWELL_TICK_MS = 30_000;

export function HallScreen({ sage }: { sage: Sage }) {
  const sageId = sage.id;

  const { status, verse, presence, bows, bow } = useLive(sageId);
  const devotion = usePlayStore((s) => s.devotion[sageId]);
  const stage = usePlayStore((s) => s.stage[sageId]);
  const readVerseIds = usePlayStore((s) => s.readVerseIds);
  const flippedVerseIds = usePlayStore((s) => s.flippedVerseIds);
  const inventory = usePlayStore((s) => s.inventory);
  const addToInventory = usePlayStore((s) => s.addToInventory);
  const flipLiveVerse = usePlayStore((s) => s.flipLiveVerse);
  const tickDwellCredit = usePlayStore((s) => s.tickDwellCredit);

  const [flipped, setFlipped] = useState(false);
  const lastTrackedSlot = useRef<number | null>(null);
  const joinedRef = useRef(false);
  const bowTapsRef = useRef(0);
  const bowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!verse || verse.slot === lastTrackedSlot.current) return;
    const firstJoin = !joinedRef.current;
    joinedRef.current = true;
    lastTrackedSlot.current = verse.slot;
    if (firstJoin) {
      track("zone_enter", { zone: sageId, presence: presence?.[sageId] ?? 0, from_share: 0 });
    }
    track("live_verse_view", { zone: sageId, verse_id: verse.verseId, slot: verse.slot, late_join: 0 });
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse?.slot]);

  // 전각 체류 점수 — 화면이 보이는 동안만 30초마다 적립 (§5.2)
  useEffect(() => {
    let lastTick = Date.now();
    let visible = document.visibilityState === "visible";
    const interval = setInterval(() => {
      if (!visible) return;
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      tickDwellCredit(sageId, delta);
    }, DWELL_TICK_MS);
    function onVisibility() {
      visible = document.visibilityState === "visible";
      lastTick = Date.now();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sageId, tickDwellCredit]);

  function handleBow() {
    bow();
    bowTapsRef.current += 1;
    if (bowTimerRef.current) clearTimeout(bowTimerRef.current);
    bowTimerRef.current = setTimeout(() => {
      if (verse) track("bow", { zone: sageId, verse_id: verse.verseId, taps: bowTapsRef.current });
      bowTapsRef.current = 0;
    }, BOW_BATCH_MS);
  }

  const inInventory = verse ? inventory.some((i) => i.verseId === verse.verseId) : false;
  const readCount = readCountFor(sageId, readVerseIds);
  const flippedCount = flippedCountFor(sageId, flippedVerseIds);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-6">
      <TopBar
        left={
          <>
            <Link href="/" className="text-muted">
              ← 광장
            </Link>
            <span className="font-semibold">{sage.hall}</span>
            {status !== "fallback" && status !== "closed" && (
              <span className="text-muted">지금 {presence?.[sageId] ?? 0}명</span>
            )}
          </>
        }
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        {status === "connecting" && (
          <div className="flex aspect-[3/4] w-full max-w-[320px] animate-pulse items-center justify-center rounded-2xl border border-border bg-card">
            <p className="font-sans text-sm text-muted">법당 문을 여는 중…</p>
          </div>
        )}

        {status === "closed" && !verse && (
          <div className="flex aspect-[3/4] w-full max-w-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-sans text-sm text-muted">
              법당 문이 잠시 닫혔습니다.
              <br />
              수행은 계속할 수 있습니다.
            </p>
            <Link
              href={`/z/${sageId}/practice`}
              className="rounded-full bg-accent px-6 py-2 font-sans text-sm text-accent-foreground"
            >
              수행하기
            </Link>
          </div>
        )}

        {verse && (
          <>
            <LiveVerseCard
              verseState={verse}
              flipped={flipped}
              onFlip={() => {
                const next = !flipped;
                setFlipped(next);
                if (next) flipLiveVerse(verse.verseId, sageId);
              }}
            />
            <LiveActions
              bows={bows}
              onBow={handleBow}
              inInventory={inInventory}
              onAddToInventory={() => addToInventory(verse.verseId, "live", sageId)}
            />
          </>
        )}

        <Link
          href={`/z/${sageId}/practice`}
          className="w-full max-w-[320px] rounded-full bg-accent py-4 text-center font-sans text-base font-bold text-accent-foreground"
        >
          수행하기
        </Link>

        <StageCard stage={stage} devotion={devotion} readCount={readCount} flippedCount={flippedCount} />

        <details className="w-full max-w-[320px] text-center">
          <summary className="cursor-pointer font-sans text-xs text-muted underline underline-offset-4">
            {sage.name} 소개
          </summary>
          <p className="mt-2 whitespace-pre-line font-serif text-sm leading-relaxed text-muted">
            {sage.intro}
          </p>
        </details>
      </div>
    </main>
  );
}
