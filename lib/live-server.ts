import "server-only";

import { connection } from "next/server";
import type { Zone } from "./types";
import { isVerseState, type VerseState } from "./live-state";

const LIVE_REQUEST_TIMEOUT_MS = 1500;

export async function getInitialVerse(zone: Zone): Promise<VerseState | null> {
  // 현재 슬롯은 빌드 시각이 아니라 실제 방문 시각을 기준으로 받아야 한다.
  await connection();

  const liveUrl = process.env.LIVE_INTERNAL_URL || process.env.NEXT_PUBLIC_LIVE_URL;
  if (!liveUrl) return null;

  try {
    const url = new URL("/now", liveUrl);
    url.searchParams.set("zone", zone);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(LIVE_REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const state: unknown = await response.json();
    return isVerseState(state, zone) ? state : null;
  } catch {
    // 실시간 서버가 잠시 닫혀도 페이지 자체는 기존 클라이언트 폴백으로 연다.
    return null;
  }
}
