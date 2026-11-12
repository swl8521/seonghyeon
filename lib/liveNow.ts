import "server-only";

import type { VerseState } from "./live";
import type { Zone } from "./types";

// 집 서버가 느리거나 죽었을 때 페이지 전체가 그만큼 늦어지면 안 되므로 짧게 끊는다.
// 실패하면 null을 돌려주고, 화면은 기존대로 스켈레톤을 띄운 뒤 소켓이 채운다.
const TIMEOUT_MS = 800;

/**
 * 현재 구절을 실시간 서버에서 한 번 받아온다 (§9의 폴백 엔드포인트).
 *
 * 소켓은 하이드레이션이 끝나야 열리기 때문에, 그때까지 기다리면 본문인 구절이
 * 한참 뒤에야 그려진다. 같은 왕복을 SSR 중에 끝내두면 구절이 HTML에 담겨 와서
 * 첫 페인트와 함께 보인다. 이후 갱신은 평소대로 소켓이 맡는다.
 */
export async function fetchCurrentVerse(zone: Zone): Promise<VerseState | null> {
  const base = process.env.NEXT_PUBLIC_LIVE_URL;
  if (!base) return null;

  try {
    const res = await fetch(`${base}/now?zone=${zone}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const state = (await res.json()) as VerseState;
    return state?.verseId ? state : null;
  } catch {
    return null;
  }
}
