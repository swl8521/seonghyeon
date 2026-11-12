import { SquareScreen } from "@/components/SquareScreen";
import { fetchCurrentVerse } from "@/lib/liveNow";

// 구절을 SSR에서 미리 받아 HTML에 담아 보낸다. 그 대신 이 라우트는 정적 셸
// 대신 블로킹 렌더가 된다 — 소켓 왕복을 하이드레이션 뒤까지 미루는 것보다
// 본문이 훨씬 일찍 보이기 때문이다. 집 서버가 느리면 fetchCurrentVerse가
// 짧은 타임아웃으로 null을 주고, 화면은 기존 스켈레톤으로 떨어진다.
export const instant = false;

export default async function SquarePage() {
  const initialVerse = await fetchCurrentVerse("hall");
  return <SquareScreen initialVerse={initialVerse} />;
}
