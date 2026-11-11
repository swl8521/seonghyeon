import { useEffect, type DependencyList, type RefObject } from "react";

/**
 * 가로 스크롤 컨테이너를 마우스로 클릭+드래그해서 넘길 수 있게 하고, 손을 놓으면
 * 가장 가까운 자식 요소의 왼쪽 끝에 맞춰 부드럽게 스냅한다.
 *
 * CSS scroll-snap은 scrollLeft를 코드로 직접 바꾸는 경우(마우스 드래그처럼)에는
 * 적용되지 않고, 오히려 컨테이너의 좌우 padding을 초기 스크롤 위치에서
 * 깨 먹는 부작용이 있어 쓰지 않는다 — 대신 pointerup 시점에 직접 계산해서
 * scrollTo(behavior: "smooth")로 정렬한다. 터치는 네이티브 스크롤에 맡긴다.
 *
 * deps에는 "이 요소가 실제로 DOM에 나타나는 조건"을 넣어야 한다 — 예를 들어
 * 리스트가 하이드레이션 전에는 비어 있다가 나중에 채워지는 경우, ref만으로는
 * effect가 처음 한 번(요소가 아직 없을 때) 실행된 뒤 다시 실행되지 않는다.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDragging = false;
    let moved = false;
    let startX = 0;
    let startScrollLeft = 0;

    function snapToNearestChild() {
      if (!el) return;
      // getBoundingClientRect()는 border box 기준이라, padding만큼은 직접
      // 보정해야 "자식의 왼쪽 끝 = 스크롤 영역의 콘텐츠 시작점"이 맞는다.
      const paddingLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const containerContentLeft = el.getBoundingClientRect().left + paddingLeft;

      let closest: Element | null = null;
      let closestDist = Infinity;

      for (const child of Array.from(el.children)) {
        const dist = Math.abs(child.getBoundingClientRect().left - containerContentLeft);
        if (dist < closestDist) {
          closestDist = dist;
          closest = child;
        }
      }

      if (!closest) return;
      const delta = closest.getBoundingClientRect().left - containerContentLeft;
      el.scrollTo({ left: el.scrollLeft + delta, behavior: "smooth" });
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "mouse" || !el) return;
      isDragging = true;
      moved = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging || !el) return;
      moved = true;
      el.scrollLeft = startScrollLeft - (e.clientX - startX);
    }

    function onPointerUp() {
      if (isDragging && moved) snapToNearestChild();
      isDragging = false;
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointerleave", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointerleave", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}
