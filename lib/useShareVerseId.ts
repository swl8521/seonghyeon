"use client";

import { useSyncExternalStore } from "react";

/**
 * 공유 링크(`?from=share&id=...`)로 들어왔을 때의 구절 id.
 *
 * useSearchParams()를 쓰면 cacheComponents 환경에서 해당 서브트리가 프리렌더
 * 시점에 서스펜드돼 정적 셸이 비어버린다(LCP 지연). 이 값은 전각/수행 링크를
 * 장식하는 데만 쓰이고 클릭은 마운트 이후에나 일어나므로, 서버 스냅샷을
 * undefined로 두고 클라이언트에서만 URL을 읽어 프리렌더를 막지 않는다.
 */
const subscribe = () => () => {};

function getSnapshot(): string | undefined {
  // 같은 URL이면 같은 문자열을 돌려주므로 Object.is 비교가 안정적이다.
  return new URLSearchParams(window.location.search).get("id") ?? undefined;
}

function getServerSnapshot(): undefined {
  return undefined;
}

export function useShareVerseId(): string | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
