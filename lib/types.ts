export type SageId = "confucius" | "laozi" | "sunzi";
export type Axis = "ren" | "xue" | "dao" | "mou" | "rou";
// ren 仁 관계·도리 / xue 學 배움·수양 / dao 道 비움·자연 / mou 謀 전략·계산 / rou 柔 유연·물러섬
export type Vec = Record<Axis, number>; // 각 0~1

export interface Sage {
  id: SageId;
  name: string; // "공자"
  hanja: string; // "孔子"
  book: string; // "논어"
  intro: string; // 성현 소개 2줄 (책 이름, 핵심 사상)
  vec: Vec;
}

export interface Verse {
  id: string; // "confucius-01"
  sage: SageId;
  source: string; // "논어 · 위정편"
  original: string; // 한문 원문
  reading: string; // 음독 (한글)
  translation: string; // 직접 번역
  note: string; // 한두 문장 해설 (카드 뒷면)
  tags: Vec; // 각 0~1
  reviewed: boolean; // 사람 검수 여부, 생성 시 false
}

export interface SageLine {
  sage: SageId;
  kind: "nod" | "nudge" | "skip" | "admit" | "promote" | "stay";
  original?: string; // 고전에서 따온 구절이면 원문
  text: string; // 화면에 보일 한국어 대사
  reviewed: boolean; // 사람 검수 여부, 생성 시 false
}
