export type SageId = "confucius" | "laozi" | "sunzi";
export type Axis = "ren" | "xue" | "dao" | "mou" | "rou";
// ren 仁 관계·도리 / xue 學 배움·수양 / dao 道 비움·자연 / mou 謀 전략·계산 / rou 柔 유연·물러섬
export type Vec = Record<Axis, number>; // 각 0~1

export interface Sage {
  id: SageId;
  name: string; // "공자"
  hanja: string; // "孔子"
  book: string; // "논어"
  hall: string; // "공자의 배움터"
  hallHanja: string; // 옛 장소 이름의 한자 표기 (호환용)
  intro: string; // 성현 소개 2줄 (책 이름, 핵심 사상)
  vec: Vec;
}

/**
 * 구절이 속한 풀.
 * - read: 읽는 풀. 홀의 1분 교체와 '구절 읽기' 덱이 모두 여기서 뽑는다.
 *   원문 전문 단위가 여기 들어간다.
 * - copy: 승급 따라쓰기에서 손으로 옮겨 적는 풀. 번역문을 직접 타이핑하므로
 *   짧은 격언만 둔다. 읽기 화면은 입력이 없어서 이 제한이 필요 없다.
 */
export type VersePool = "read" | "copy";

export interface Verse {
  id: string; // "confucius-01" 또는 "confucius-01-02a" (성현-편-장[분할])
  sage: SageId;
  source: string; // "논어 · 위정편"
  original: string; // 한문 원문
  reading: string; // 음독 (한글)
  translation: string; // 직접 번역
  note: string; // 한두 문장 해설 (카드 뒷면)
  tags: Vec; // 각 0~1
  pools: VersePool[]; // 최소 하나
  reviewed: boolean; // 사람 검수 여부, 생성 시 false
}

/**
 * 덱을 고르는 데 필요한 최소 정보.
 *
 * buildPracticeDeck / pickRecommendedVerse / pickHeadlineVerse 는 id, sage,
 * tags 만 본다. 읽기 풀은 수백 개라 본문까지 실으면 구역 진입 페이로드가
 * 그만큼 커진다. 색인만 싣고 본문은 덱이 정해진 뒤 받아온다.
 */
export type VerseIndexEntry = Pick<Verse, "id" | "sage" | "tags">;

export interface SageLine {
  id: string; // 로드 시 부여 (content/lines.json 자체엔 없음)
  sage: SageId;
  kind: "nod" | "nudge" | "skip" | "admit" | "promote" | "stay";
  original?: string; // 고전에서 따온 구절이면 원문
  text: string; // 화면에 보일 한국어 대사
  reviewed: boolean; // 사람 검수 여부, 생성 시 false
}

export type Stage = "outside" | "entered" | "disciple" | "senior";
export type Zone = "hall" | SageId;

export interface InventoryItem {
  verseId: string;
  source: "live" | "practice";
  zone: Zone; // 담은 곳
  at: number; // epoch ms
}

export interface TeacherNote {
  sage: SageId;
  kind: "nod" | "nudge";
  lineId: string;
  recommendedVerseId: string | null;
  accepted: boolean;
  atIndex: number;
}

export type PracticeHeadKind = "enter" | "promote" | "stay" | "front" | "none";

export interface PracticeOutcome {
  headKind: PracticeHeadKind;
  pickedVerseId: string | null;
  lineId: string | null; // 결과 화면에 보여줄 성현 대사 — 고를 때 한 번만 뽑고 고정한다
}
