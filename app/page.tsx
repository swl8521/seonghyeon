import { SquareScreen } from "@/components/SquareScreen";
import { getInitialVerse } from "@/lib/live-server";
import { Suspense } from "react";

async function CurrentSquare() {
  const initialVerse = await getInitialVerse("hall");
  return <SquareScreen initialVerse={initialVerse} />;
}

// 이 라우트는 정적 셸로 둔다. 구절은 시각에 따라 1분마다 바뀌어서 프리렌더에
// 구워두면 캐시된 동안 낡은 값이 나간다. 대신 클라이언트가 마운트 즉시
// /now를 당겨오고(lib/live.ts primeVerse), 이후 갱신은 소켓이 맡는다.
export default function SquarePage() {
  return (
    <Suspense fallback={<SquareScreen initialVerse={null} />}>
      <CurrentSquare />
    </Suspense>
  );
}
