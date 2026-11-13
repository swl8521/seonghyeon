/**
 * 구절 길이에 따른 카드 글자 크기.
 *
 * 카드는 320px 폭이고 양쪽 여백을 빼면 본문에 쓸 수 있는 폭이 272px 남는다.
 * 원문이 짧은 격언일 때는 크게 보여주는 편이 좋지만, 원문 전문 단위는 60자까지
 * 들어오기 때문에 같은 크기로는 카드가 세로로 한없이 길어진다. 길이에 따라
 * 한 단계씩 줄여서 어느 구절이든 비슷한 높이에 들어오게 한다.
 *
 * 경계값은 폭 272px에서 한 줄에 들어가는 글자 수로 잡았다. 한자는 정사각형에
 * 가까워서 글자 크기가 곧 글자 폭이다 (예: 30px -> 한 줄 9자).
 */

/** 원문(한문) 글자 크기. 어느 구간이든 네 줄 안쪽에 들어온다. */
export function originalTextClass(original: string): string {
  const length = original.length;
  if (length <= 16) return "text-3xl"; // 30px, 한 줄 9자
  if (length <= 32) return "text-2xl"; // 24px, 한 줄 11자
  if (length <= 48) return "text-xl"; // 20px, 한 줄 13자
  return "text-lg"; // 18px, 한 줄 15자
}

/**
 * 번역 글자 크기. 짧은 격언의 번역은 한 줄이지만 전문 단위의 번역은
 * 150자를 넘기도 해서 같이 줄여 준다.
 */
export function translationTextClass(translation: string): string {
  const length = translation.length;
  if (length <= 40) return "text-lg"; // 18px
  if (length <= 90) return "text-base"; // 16px
  return "text-sm"; // 14px
}
