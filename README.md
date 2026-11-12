# 성현 판별
구절을 스와이프하면, 성현(공자·노자·손자)이 나를 판별해 주는 웹 앱 MVP.

## 주요 기능

- 카드 스와이프(motion)로 고전 구절에 공감/비공감 표시
- 취향 벡터 기반 판별 로직으로 성현 유형 결정 (`lib/judge.ts`)
- 결과별 OG 이미지 생성(`next/og`) 및 카카오톡 공유
- Firebase Analytics 퍼널 분석 (시작 → 결과 → 공유 → 공유 랜딩)

## 기술 스택

Next.js (App Router) · TypeScript · Tailwind CSS · motion · zustand · Firebase Analytics

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

| 명령 | 설명 |
|---|---|
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |

## 환경 변수

모두 선택 사항이며, 없으면 해당 기능만 비활성화됩니다.

| 변수 | 용도 | 없을 때 동작 |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` 등 Firebase 설정값 5종 | Firebase Analytics | `track()`이 `console.debug`로 대체 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오톡 공유 SDK 키 | 공유 버튼 숨김 |
| `NEXT_PUBLIC_SITE_URL` | OG/메타데이터 절대 URL | `VERCEL_URL` 또는 localhost |

## 구조

```
app/        라우트 (play, result, r/[sage], api/result-card, OG 이미지)
components/ UI 컴포넌트
content/    콘텐츠 데이터(JSON). 저장소에는 포함하지 않음
lib/        판별·덱 구성·분석 등 로직
scripts/    콘텐츠 검증 스크립트
```

## 설계 포인트

- **가설 중심 설계:** "구절 스와이프 → 성현 판별" 콘셉트가 먹히는지 검증하는 것이 목표라, 시작→결과→공유→공유 랜딩 퍼널 이벤트를 먼저 정의하고 Firebase Analytics로 측정하도록 구현했습니다.
- **판별 로직 분리:** 취향 벡터와 코사인 유사도, 시그모이드 기반 확률 판정을 `lib/judge.ts`의 순수 함수로 두어 UI와 분리했고, RNG를 주입받아 결과를 재현할 수 있습니다.
- **상태 복원:** zustand persist로 라운드를 localStorage에 저장해 새로고침해도 진행하던 카드부터 이어집니다.
- **공유 최적화:** 유형별 정적 페이지(`/r/[sage]`)와 `next/og` 동적 OG 이미지로 링크 미리보기를 제공합니다.
- **외부 서비스는 선택 사항:** 키가 없으면 분석·카카오 공유만 비활성화되고 앱은 그대로 동작합니다.

## 스크린샷

## 배포

## 역할
