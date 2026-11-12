import type { Axis, Vec } from "./types";

// 성향 벡터·점수 계산의 범용 수학 함수들. v1부터 그대로 쓰는 공식이라 축 이름이나
// 스케일이 바뀌어도(§5.1 참고) 다시 조정할 필요가 없다 — cosine은 스케일 불변,
// pref 비율은 항상 [-1,1]로 정규화된다.

export const AXES: Axis[] = ["ren", "xue", "dao", "mou", "rou"];

export function addVec(a: Vec, b: Vec, scale: number): Vec {
  const out = {} as Vec;
  for (const axis of AXES) out[axis] = a[axis] + scale * b[axis];
  return out;
}

export function zeroVec(): Vec {
  return { ren: 0, xue: 0, dao: 0, mou: 0, rou: 0 };
}

export function cosine(a: Vec, b: Vec): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const axis of AXES) {
    dot += a[axis] * b[axis];
    na += a[axis] * a[axis];
    nb += b[axis] * b[axis];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function fit(user: Vec, sageVec: Vec): number {
  return cosine(user, sageVec);
}

export function pref(liked: number, disliked: number): number {
  return (liked - disliked) / (liked + disliked + 1);
}

export function score(user: Vec, sageVec: Vec, liked: number, disliked: number): number {
  return 0.6 * fit(user, sageVec) + 0.4 * pref(liked, disliked);
}

export function acceptProbability(scoreValue: number): number {
  return sigmoid(4 * scoreValue);
}
