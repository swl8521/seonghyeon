"use client";
import { Icon } from "./Icon";

import { localizedSage } from "@/lib/localized-content";
import { useLocale } from "@/components/LocaleProvider";

import { useEffect, useRef, useState } from "react";
import { useShareVerseId } from "@/lib/useShareVerseId";
import Link from "@/components/LocaleLink";
import { useLive } from "@/lib/live";
import { Toast } from "@/components/Toast";
import { usePlayStore, readCountFor, flippedCountFor } from "@/lib/store";
import { playWoodenClack } from "@/lib/sound";
import { track } from "@/lib/analytics";
import type { Sage } from "@/lib/types";
import { TopBar } from "@/components/TopBar";
import { LiveVerseCard } from "@/components/LiveVerseCard";
import { LiveActions } from "@/components/LiveActions";
import { StageCard } from "@/components/StageCard";
import type { VerseState } from "@/lib/live-state";

const BOW_BATCH_MS = 5000;
const DWELL_TICK_MS = 30_000;

export function HallScreen({ sage: initialSage, initialVerse }: { sage: Sage; initialVerse: VerseState | null }) {
  const shareVerseId = useShareVerseId();
  const { locale, t } = useLocale();
  const sage = localizedSage(initialSage.id, locale)!;
  const sageId = sage.id;
  const practiceHref = shareVerseId
    ? `/z/${sageId}/practice?shareId=${shareVerseId}`
    : `/z/${sageId}/practice`;

  const { status, verse, remainingMs, presence, bows, bow } = useLive(sageId);
  const soundOn = usePlayStore((s) => s.soundOn);
  const toast = usePlayStore((s) => s.toast);
  const dismissToast = usePlayStore((s) => s.dismissToast);
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
  const lastStatusRef = useRef<string | null>(null);
  const activeVerse = verse ?? initialVerse;
  const activeRemainingMs = verse ? remainingMs : initialVerse?.remainingMs ?? 0;

  useEffect(() => {
    if (status !== lastStatusRef.current) {
      lastStatusRef.current = status;
      track("live_status", { status });
    }
  }, [status]);

  useEffect(() => {
    if (!verse || verse.slot === lastTrackedSlot.current) return;
    const firstJoin = !joinedRef.current;
    joinedRef.current = true;
    lastTrackedSlot.current = verse.slot;
    if (firstJoin) {
      track("zone_enter", {
        zone: sageId,
        presence: presence?.[sageId] ?? 0,
        from_share: shareVerseId ? 1 : 0,
      });
    }
    track("live_verse_view", { zone: sageId, verse_id: verse.verseId, slot: verse.slot, late_join: 0 });
    setFlipped(false);
    if (soundOn && !firstJoin) playWoodenClack();
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

  const inInventory = activeVerse ? inventory.some((i) => i.verseId === activeVerse.verseId) : false;
  const readCount = readCountFor(sageId, readVerseIds);
  const flippedCount = flippedCountFor(sageId, flippedVerseIds);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-6">
      {toast && <Toast key={toast.id} text={toast.text} onDone={dismissToast} />}
      <TopBar
        left={
          <>
            <Link href="/" className="inline-flex items-center gap-1 text-muted">
              <Icon name="back" width={16} height={16} />{t("광장")}
            </Link>
            <span className="font-semibold">{sage.hall}</span>
            {status !== "fallback" && status !== "closed" && (
              <span className="text-muted">{t("지금 {count}명", { count: presence?.[sageId] ?? 0 })}</span>
            )}
          </>
        }
      />

      <div className="flex flex-col items-center gap-6">
        <div className="flex min-h-[652px] w-full shrink-0 flex-col items-center gap-6">
        {!activeVerse && status !== "closed" && (
          <div className="flex min-h-[580px] w-full max-w-[320px] animate-pulse items-center justify-center rounded-2xl border border-border bg-card">
            <p className="font-sans text-sm text-muted">{t("법당 문을 여는 중…")}</p>
          </div>
        )}

        {status === "closed" && !activeVerse && (
          <div className="flex aspect-[3/4] w-full max-w-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-sans text-sm text-muted">
              {t("법당 문이 잠시 닫혔습니다.")}
              <br />
              {t("수행은 계속할 수 있습니다.")}
            </p>
            <Link
              href={practiceHref}
              className="rounded-full bg-accent px-6 py-2 font-sans text-sm text-accent-foreground"
            >
              {t("구절 읽기")}
            </Link>
          </div>
        )}

        {activeVerse && (
          <>
            <LiveVerseCard
              verseState={activeVerse}
              remainingMs={activeRemainingMs}
              flipped={flipped}
              onFlip={() => {
                const next = !flipped;
                setFlipped(next);
                if (next) flipLiveVerse(activeVerse.verseId, sageId);
              }}
            />
            <LiveActions
              bows={bows}
              onBow={handleBow}
              inInventory={inInventory}
              onAddToInventory={() => addToInventory(activeVerse.verseId, "live", sageId)}
            />
          </>
        )}

        </div>
        <Link
          href={practiceHref}
          className="w-full max-w-[320px] rounded-full bg-accent py-4 text-center font-sans text-base font-bold text-accent-foreground"
        >
          {t("구절 읽기")}
        </Link>

        <StageCard sage={sageId} stage={stage} devotion={devotion} readCount={readCount} flippedCount={flippedCount} />

        <details className="w-full max-w-[320px] text-center">
          <summary className="cursor-pointer font-sans text-xs text-muted underline underline-offset-4">
            {t("{name} 소개", { name: sage.name })}
          </summary>
          <p className="mt-2 whitespace-pre-line font-serif text-sm leading-relaxed text-muted">
            {sage.intro}
          </p>
        </details>
      </div>
    </main>
  );
}
