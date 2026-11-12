import { Suspense } from "react";
import { SquareScreen } from "@/components/SquareScreen";

// searchParams를 서버에서 await하면 페이지 전체가 요청 시점으로 밀려 정적 셸이
// 비어버린다(LCP 지연). 공유 id는 전각 링크에만 쓰이므로 클라이언트에서 읽는다.
export default function SquarePage() {
  return (
    <Suspense fallback={null}>
      <SquareScreen />
    </Suspense>
  );
}
