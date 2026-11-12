// 튜닝 가능한 숫자는 전부 여기에 모아둔다 (SPEC §5).

export const PRACTICE_DECK_SIZE = 10;
export const NOTE_INDICES = [4, 8]; // 수행 4, 8장째 직후 스승의 평

export const DEVOTION = {
  like: 2,
  likeWithFlip: 1, // 해설까지 읽고 와닿음이면 추가
  dislike: -1,
  nod: 3,
  recAccept: 1,
  liveAdd: 1,
  liveFlip: 1,
  dwellPerTick: 1,
  dwellTickMs: 5 * 60 * 1000, // 5분마다 +1
  dwellDailyCap: 3,
} as const;

export const STAGE_THRESHOLDS = {
  entered: { devotion: 8 },
  disciple: { devotion: 25, read: 10 },
  senior: { devotion: 50, read: 18, flipped: 10 },
} as const;

export const SKIP_REACTION_CHANCE = 0.25; // 넘김 반응 토스트 확률 (v1의 DISLIKE_REACTION_CHANCE와 동일)
