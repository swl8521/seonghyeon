"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SAGES } from "@/lib/content";
import { useLive } from "@/lib/live";
import { usePlayStore } from "@/lib/store";
import { playWoodenClack } from "@/lib/sound";
import { track } from "@/lib/analytics";
import { TopBar } from "@/components/TopBar";
import { SoundToggle } from "@/components/SoundToggle";
import { InventoryLink } from "@/components/InventoryLink";
import { LiveVerseCard } from "@/components/LiveVerseCard";
import { LiveActions } from "@/components/LiveActions";
import { StageBadge } from "@/components/StageBadge";
import { InfoSheet } from "@/components/InfoSheet";
import { SAGE_BORDER_CLASS } from "@/lib/sageColors";

const BOW_BATCH_MS = 5000;

export function SquareScreen({ shareVerseId }: { shareVerseId?: string }) {
  const { status, verse, presence, bows, bow } = useLive("hall");
  const soundOn = usePlayStore((s) => s.soundOn);
  const seenIntro = usePlayStore((s) => s.seenIntro);
  const dismissIntro = usePlayStore((s) => s.dismissIntro);
  const stage = usePlayStore((s) => s.stage);
  const inventory = usePlayStore((s) => s.inventory);
  const addToInventory = usePlayStore((s) => s.addToInventory);
  const flipLiveVerse = usePlayStore((s) => s.flipLiveVerse);

  const [flipped, setFlipped] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const lastTrackedSlot = useRef<number | null>(null);
  const joinedRef = useRef(false);
  const bowTapsRef = useRef(0);
  const bowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStatusRef = useRef<string | null>(null);

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
      track("zone_enter", { zone: "hall", presence: presence?.total ?? 0, from_share: shareVerseId ? 1 : 0 });
    }
    track("live_verse_view", { zone: "hall", verse_id: verse.verseId, slot: verse.slot, late_join: 0 });
    setFlipped(false);
    if (soundOn && !firstJoin) playWoodenClack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse?.slot]);

  function handleBow() {
    bow();
    bowTapsRef.current += 1;
    if (bowTimerRef.current) clearTimeout(bowTimerRef.current);
    bowTimerRef.current = setTimeout(() => {
      if (verse) track("bow", { zone: "hall", verse_id: verse.verseId, taps: bowTapsRef.current });
      bowTapsRef.current = 0;
    }, BOW_BATCH_MS);
  }

  const inInventory = verse ? inventory.some((i) => i.verseId === verse.verseId) : false;

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-6">
      <TopBar
        left={
          <>
            <span className="font-semibold">광장</span>
            {status !== "fallback" && status !== "closed" && (
              <span className="text-muted">지금 {presence?.hall ?? 0}명</span>
            )}
          </>
        }
        right={
          <>
            <SoundToggle />
            <InventoryLink />
          </>
        }
      />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
        {!seenIntro && verse && (
          <div className="absolute -top-2 z-10 flex max-w-[320px] items-start gap-2 rounded-full border border-border bg-card px-4 py-2 text-center font-sans text-xs text-muted">
            <span>모두가 같은 구절을 함께 봅니다. 1분마다 바뀝니다.</span>
            <button type="button" onClick={dismissIntro} aria-label="닫기" className="shrink-0">
              ×
            </button>
          </div>
        )}

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
                if (next) flipLiveVerse(verse.verseId, "hall");
              }}
            />
            <LiveActions
              bows={bows}
              onBow={handleBow}
              inInventory={inInventory}
              onAddToInventory={() => addToInventory(verse.verseId, "live", "hall")}
            />
          </>
        )}

        <div className="grid w-full grid-cols-3 gap-3">
          {SAGES.map((sage) => (
            <Link
              key={sage.id}
              href={shareVerseId ? `/z/${sage.id}?from=share&id=${shareVerseId}` : `/z/${sage.id}`}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${SAGE_BORDER_CLASS[sage.id]} bg-card`}
            >
              <span className="font-serif text-xl">{sage.hanja[0]}</span>
              <span className="font-sans text-xs text-foreground">{sage.hall}</span>
              <span className="font-sans text-[11px] text-muted">{sage.name}</span>
              {status !== "fallback" && status !== "closed" && (
                <span className="font-sans text-[11px] text-muted">
                  지금 {presence?.[sage.id] ?? 0}명
                </span>
              )}
              <StageBadge stage={stage[sage.id]} />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 font-sans text-xs text-muted underline underline-offset-4">
        <button type="button" onClick={() => setInfoOpen(true)}>
          이곳은
        </button>
        <Link href="/privacy">개인정보처리방침</Link>
      </div>

      <InfoSheet open={infoOpen} onClose={() => setInfoOpen(false)}>
        <p className="text-center font-serif text-lg leading-relaxed">
          모두가 같은 구절을 함께 읽는 사이버 법당입니다.
          <br />
          구절은 1분마다 바뀌고, 전각에 들어가면 그 성현의 구절만 모아 수행할 수 있어요.
        </p>
      </InfoSheet>
    </main>
  );
}
