import type { SageId } from "./types";

// 성현별 포인트 색 (judgment 카드 테두리, 랜딩 배지 등에서 재사용)
export const SAGE_BORDER_CLASS: Record<SageId, string> = {
  confucius: "border-sage-confucius",
  laozi: "border-sage-laozi",
  sunzi: "border-sage-sunzi",
};
