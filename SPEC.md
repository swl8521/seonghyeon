# 성현 문하 MVP: 작업 지시서 v3

> 가칭: **성현 문하(門下)** (코드명 `seonghyeon` 유지)
> 한 줄: **고전을 스와이프로 읽으면, 성현이 나를 제자로 들인다.**
> 목적: 고전을 읽게 만드는 것. 다른 구절 앱과의 차이는 **성현이 내 독서에 반응하고, 많이 읽을수록 문하가 깊어진다**는 점.
> 형태: Next.js 웹 하나. 서버 DB, 로그인, 결제, LLM은 없음.
> 배포: https://seonghyeon-lac.vercel.app

---

## 0. Claude Code에게

- 이 문서는 **v1으로 구현·배포된 코드베이스를 고치는 지시서**야. 새로 만들지 말고 기존 코드를 수정해.
- v2 지시서로 이미 작업한 부분이 있으면 버리지 말고 이어서 해. v2와 v3가 다른 곳은 **v3가 우선**이야.
- 먼저 **§1 변경 요약**을 읽고 **§11 작업 순서대로** 진행해.
- 범위 밖(§12)은 만들지 마. 애매하면 더 작게.
- 단계마다 `npm run build`, `npm run test`, `npm run check:content` 통과를 확인하고 넘어가.

---

## 1. 변경 요약

### 1.1 버전별 방향

| | v1 (배포됨) | v2 (폐기된 방향) | **v3 (이번)** |
|---|---|---|---|
| 성현의 역할 | 나를 판별, 매칭 | 곁에서 한마디 | **스승. 나를 제자로 들이고, 문하가 깊어짐** |
| 주인공 | 대표 유형 | 구절 | **문하 + 나를 들인 구절** (둘이 한 세트) |
| 어휘 | 인연, 매칭 | 와닿음 | **문하, 입문, 제자, 고제, 스승** |
| 반복 동기 | 없음 | 읽기 진행도 | **문하 단계 승급 = 더 읽어야 오름** |
| 공유 | 유형 (`/r/[sage]`) | 구절 (`/v/[id]`) | **문하 + 구절** (`/s/[sage]/[id]`) |

v2에서 가져오는 것: 와닿음/넘김 라벨, 스승의 평 + 추천 구절, 안 읽은 구절 우선 덱, 오늘 읽은 21구절 목록, `/saved`, Firebase 분석.
v2에서 버리는 것: "오늘 가장 와닿은 구절"이 단독 주인공인 결과 화면, "한 줄 성향".

### 1.2 v1 코드에서 바꿀 것

| 영역 | v1 | v3 |
|---|---|---|
| 스와이프 라벨 | 좋아요 / 싫어요 | **와닿음 / 넘김** |
| 카드 앞면 | 출처 없음 | 하단에 출처 |
| 6·12·18장 이벤트 | 수락/거절 판정, 표시 없음 | **스승의 평**(끄덕 / 일깨움 도장) + 추천 구절 |
| 결과 화면 | 대표 유형 크게 + "매칭 (41)" | **문하 헤드라인 + 나를 들인 구절** → 세 문하 단계 → 오늘 읽은 21구절 |
| 누적 | 좋아요 구절만 | **성현별 정진 점수, 단계, 읽은 구절, 해설 읽은 구절** |
| 덱 | 랜덤 | 안 읽은 구절 우선 |
| 공유 | `/r/[sage]` | `/s/[sage]/[verseId]` (+ `/v/[verseId]`), `/r/*`는 `/`로 리다이렉트 |
| 분석 | PostHog (배포에서 로드 안 됨) | **Firebase Analytics(GA4)** |

### 1.3 배포에서 확인된 문제 (같이 고쳐)

- 분석 도구가 로드되지 않아 이벤트가 하나도 안 쌓임 → §10
- "매칭 (41)"은 누적 좋아요 구절인데 라벨이 오해를 부름 → 삭제, `/saved`로 이동
- 판별 카드에 수락/거절 표시가 없음 → 스승의 평 도장 (§5.3)
- 카드 앞면에 출처 없음
- 결과 화면에서 목록을 접으면 버튼까지 빈 공간이 큼

---

## 2. 검증할 가설과 지표

| 가설 | 지표 | 측정 |
|---|---|---|
| 스와이프로 고전을 끝까지 읽는다 | 21장 완독률 | `round_start` → `round_complete` |
| 구절을 깊이 읽는다 | 해설 읽기율 | `card_flip` / `verse_view` |
| 문하 결과를 남에게 보여주고 싶다 | 결과 대비 공유율 | `result_view` → `share_click` |
| 공유가 사람을 데려온다 | 공유 랜딩 대비 읽기 시작률 | `share_landing` → `round_start` |
| 승급하려고 다시 온다 | D1 / D7 재방문, 2판 이상 비율, `stage_up` 발생률 | GA4 리텐션, `round_start.rounds_played` |
| 성현과 대화 수요가 있다 | 페이크 도어 클릭률 | `more_talk_click` |

---

## 3. 기술 스택

- Next.js App Router, TypeScript, Tailwind CSS (v1 유지)
- motion (카드 드래그), zustand + persist (localStorage) (v1 유지)
- next/og (OG 이미지)
- **firebase** (`firebase/app`, `firebase/analytics`만). `posthog-js` 제거
- Noto Serif KR / Noto Sans KR, Vercel 배포

---

## 4. 화면

### 4.1 흐름

```
랜딩(/) ─▶ 읽기(/play) 21장 ─▶ 문하 결과(/result) ─▶ 공유
   ▲                                                │
   └──────── 공유 랜딩(/s/[sage]/[verseId]) ◀─────────┘
```

### 4.2 랜딩 `/`

- 메인 카피: **"구절을 읽으면, 성현이 당신을 제자로 들입니다."**
- 서브 카피: "와닿으면 오른쪽, 아니면 왼쪽. 많이 읽을수록 문하가 깊어집니다."
- 성현 3인 원형 아이콘 (현재 유지)
- **재방문자**: 아이콘 아래에 각 성현의 단계 뱃지(`문외` / `입문` / `제자` / `고제`)와 읽은 구절 `n/20`
- 버튼: [읽기 시작] (재방문자는 [이어 읽기])
- 하단 작은 링크: [내가 고른 구절] [개인정보처리방침]

### 4.3 읽기 `/play`

- v1 유지: 카드 21장, 드래그 / 버튼 / ← → 키, 탭하면 뒤집기, 상단 진행도
- **라벨 변경**: 와닿음(오른쪽) / 넘김(왼쪽). 버튼, 드래그 스탬프 모두. 내부 값은 `like` / `dislike` 유지 가능
- **카드 앞면 하단에 출처**: `손자병법 · 허실편` (작게, 흐린 색)
- 처음 보는 구절이면 카드 우상단에 작은 `처음` 표시
- 넘김 시 25% 확률로 성현 반응 토스트 (대사 `skip`, §7.2)
- 6, 12, 18장째 직후 **스승의 평** 카드 (§5.3)
- 스와이프 직후, 그 성현의 정진 점수가 오른 경우 카드가 날아가는 방향에 작은 `+2` 같은 표시 (300ms, reduced-motion이면 생략)

### 4.4 문하 결과 `/result`

위에서부터 이 순서로. 섹션 간격은 촘촘하게, 빈 공간 없이.

**① 문하 헤드라인 + 나를 들인 구절** (한 장의 카드, 가장 크게. 이게 공유 카드 그 자체)

- 헤드라인 (§5.6 규칙):
  - 승급: "**공자** 문하의 **제자**가 되었습니다"
  - 첫 입문: "**공자** 문하에 들었습니다"
  - 유지: "오늘도 **공자** 문하에서 읽었습니다"
  - 없음: "아직 어느 문하에도 들지 못했습니다"
- 헤드라인 아래, 그 성현의 한마디 (대사 `admit` / `promote` / `stay`, §7.2). 원문 인용이 있으면 원문 작게 + 풀이
- 그 아래 **"당신을 들인 구절"**: 원문 크게, 음독, 번역, 출처. 탭하면 해설
- 버튼: [보내기] (주 버튼) [이미지 저장]
- "없음"일 때: 구절 대신 "와닿는 구절을 더 찾아보게." + [다시 읽기]. 공유 버튼 숨김

**② 세 문하**

- 성현 3줄. 각 줄: 아이콘, 이름, 단계 뱃지, 다음 단계까지 게이지, 읽은 구절 `n/20`
- 게이지 아래 작은 안내 (§5.5의 부족한 조건 중 하나): "제자까지: 정진 6점 더" 또는 "제자까지: 구절 3개 더 읽기" 또는 "고제까지: 해설 4개 더 읽기"
- 이번 판에 승급한 성현은 줄에 낙관 도장 애니메이션 한 번
- 성현 이름 탭하면 소개 2줄 (`intro`)

**③ 오늘 읽은 21구절**

- 기본 접힘. 펼치면 한 줄씩: 원문 + 번역 앞부분. 와닿음 누른 건 낙관 표시
- 각 줄의 ☆를 누르면 ①의 "당신을 들인 구절"을 그걸로 교체 (헤드라인 성현 구절이 아니어도 허용)
- 줄을 탭하면 해설 펼침

**④ 버튼**: [다시 읽기] [내가 고른 구절]

**⑤ 맨 아래 텍스트 링크**: [성현께 직접 여쭙기] (페이크 도어, §9)

- "매칭", "유형", "손자형" 같은 v1 표현 전부 제거

### 4.5 내가 고른 구절 `/saved`

- 누적 와닿음 구절 전체, 최신순. 성현별 필터 탭 (전체 / 공자 / 노자 / 손자)
- 각 구절 [보내기] → `/v/[verseId]` 링크
- 비어 있으면 "아직 고른 구절이 없어요" + [읽기 시작]

### 4.6 공유 랜딩

**`/s/[sage]/[verseId]`** (결과 화면에서 보낸 링크)
- 상단: "누군가 **공자** 문하에 들며 이 구절을 보냈어요"
- 구절 카드 (원문, 음독, 번역, 해설 펼침, 출처)
- 버튼: [나도 읽어보기] → `/play?from=share&sage=confucius&id=...`

**`/v/[verseId]`** (`/saved`에서 보낸 링크)
- 상단: "누군가 이 구절을 보냈어요" + 같은 카드 + [다른 구절도 읽어보기]

**공통**: 공유로 들어온 첫 판은 그 구절을 덱에 넣지 **않고**, 그 성현 구절을 최소 2장 포함

**`/r/[sage]`** (v1 링크): `/`로 308 리다이렉트

### 4.7 `/privacy`

- 한 문단: 로그인·개인정보 수집 없음, 읽기 기록은 브라우저(localStorage)에만 저장, Google Analytics for Firebase로 익명 이용 통계 수집

---

## 5. 로직

순수 함수는 `lib/`에. **vitest 테스트 필수**. 튜닝할 숫자는 전부 `lib/constants.ts`에.

### 5.1 상태 (zustand persist)

```ts
type SageId = "confucius" | "laozi" | "sunzi";
type Stage = "outside" | "entered" | "disciple" | "senior";   // 문외 / 입문 / 제자 / 고제

interface PersistedState {
  version: 3;
  round: RoundState | null;
  readVerseIds: string[];                 // 누적 읽음 (중복 없음)
  likedVerseIds: string[];                // 누적 와닿음 (최신순)
  flippedVerseIds: string[];              // 누적 해설 읽음
  devotion: Record<SageId, number>;       // 누적 정진 점수 (0 미만 불가)
  stage: Record<SageId, Stage>;           // 누적 단계 (내려가지 않음)
  roundsPlayed: number;
  lastRoundVerseIds: string[];
}

interface RoundState {
  roundId: string;
  deck: string[];                         // 21개
  index: number;
  user: Vec;                              // 이번 판 성향 벡터 (v1 공식 유지)
  likes: Record<SageId, number>;
  dislikes: Record<SageId, number>;
  likedIds: string[];
  flippedIds: string[];
  devotionGain: Record<SageId, number>;   // 이번 판에 오른 점수
  notes: TeacherNote[];
  stageBefore: Record<SageId, Stage>;     // 판 시작 시 단계 (승급 판정용)
  pickedVerseId: string | null;
  fromShare: { sage: SageId; verseId: string } | null;
  startedAt: number;
}
```

**마이그레이션**: persist `version`을 3으로, `migrate`에서 v1(·v2) 데이터 변환
- `likedVerseIds` 유지
- `readVerseIds`가 없으면 `likedVerseIds`로 초기화
- `devotion`은 `likedVerseIds`의 성현별 개수 × 2로 초기화, `stage`는 §5.5로 계산
- 진행 중이던 v1 `round`는 버림 (`null`)

### 5.2 정진 점수 (devotion)

스와이프마다 해당 구절의 성현 `s`에:

| 행동 | 점수 |
|---|---|
| 와닿음 | +2 |
| 와닿음 전에 해설(카드 뒤집기)까지 읽음 | +1 추가 |
| 넘김 | −1 |
| 스승의 평이 `nod` | +3 (그 성현) |
| 추천 구절 [읽어보기] 수락 | +1 (그 성현) |

- 누적 `devotion[s]`는 0 아래로 내려가지 않음
- `devotionGain`에도 같이 기록

### 5.3 스승의 평 (6, 12, 18장째 직후)

- **등장 성현**: 직전 6장 중 가장 많이 나온 성현 (동률이면 랜덤) (v1 유지)
- **종류**: v1의 `score(s)`, `p(s) = sigmoid(4·score)` 공식 유지
  - `Math.random() < p(s)` → **`nod` (끄덕)**: 그 성현 구절을 와닿아한 걸 알아봐 주는 말
  - 그 외 → **`nudge` (일깨움)**: 다시 생각해보게 툭 던지는 말. 꾸짖음이 아니라 궁금하게 만드는 톤
  - RNG 주입 가능하게 (`rng = Math.random`), 테스트에서 시드 고정
- **카드 구성**: 성현 이름 + 상단 도장(`끄덕` 붉은 낙관 / `일깨움` 먹색 낙관) + 대사 + 하단 "이것도 읽어보게" 추천 구절 미리보기(원문만)
- **추천 구절 선택**: 그 성현 구절 중 이번 판 덱에 없는 것 → 안 읽은 것 우선 → 이번 판 `user` 벡터와 tags 코사인이 가장 높은 것
- [읽어보기]: 추천 구절을 **바로 다음 카드로 삽입**, 덱 마지막 카드 하나를 빼서 21장 유지. 삽입 카드 우상단에 `공자 추천` 라벨
- [계속]: 추천 없이 진행
- 금지 표현: 수락, 거절, 받아들임, 인연

```ts
interface TeacherNote {
  sage: SageId;
  kind: "nod" | "nudge";
  lineId: string;
  recommendedVerseId: string | null;
  accepted: boolean;
  atIndex: number;
}
```

### 5.4 덱 구성

- 성현별 7장씩 21장, 같은 성현 3장 연속 금지 (v1 유지)
- 성현별 뽑는 순서: **안 읽은 구절 → 읽었지만 와닿음 안 누른 구절 → 와닿음 누른 구절**. 같은 그룹 안에서는 랜덤
- 직전 판 21장(`lastRoundVerseIds`)은 안 읽은 구절이 모자랄 때만 다시 허용
- 공유로 들어온 경우 §4.6 규칙 적용 (해당 성현 최소 2장, 공유된 구절 제외)

### 5.5 문하 단계

판이 끝날 때(`round_complete`) 성현별로 계산. **단계는 내려가지 않음.**

| 단계 | key | 조건 (그 성현 기준, 누적) |
|---|---|---|
| 문외 | `outside` | 기본 |
| 입문 | `entered` | 정진 ≥ 8 |
| 제자 | `disciple` | 정진 ≥ 25 **그리고** 그 성현 구절 10개 이상 읽음 |
| 고제 | `senior` | 정진 ≥ 50 **그리고** 18개 이상 읽음 **그리고** 해설 10개 이상 읽음 |

- **더 읽어야 오르게** 만든 게 핵심. 점수만으로는 못 오르고 읽기·해설 조건이 같이 걸려 있음
- 다음 단계까지 남은 조건 계산 함수 `nextRequirement(s)` → `{ kind: "devotion" | "read" | "flipped", remaining: number } | null` (§4.4 ② 안내 문구용, 부족한 것 중 첫 번째)
- 기준값은 전부 상수. 성현당 한 판 최대 정진은 대략 7×3 + 3×3 + 추천 = 30 안팎이라, 첫 판에 입문, 2~3판에 제자, 5판 안팎에 고제가 목표
- 테스트: 경계값, 단계 하락 없음, 읽기 조건 미달 시 점수만 높아도 승급 안 됨

### 5.6 결과 헤드라인

1. 이번 판 와닿음이 2개 이하 → **없음**
2. 이번 판에 승급한 성현이 있으면 → 그중 가장 높은 단계로 오른 성현 (동률이면 `devotionGain` 큰 쪽)
   - `outside → entered`면 **첫 입문**, 그 외 승급이면 **승급**
3. 승급이 없으면 → `score(s)` 최대 성현 (v1 공식, 이번 판 기준)
   - 그 성현이 `outside`면 **없음**이 아니라 "**공자** 문하 앞에 섰습니다" (입문 직전 상태. 대사는 `stay`)
   - 그 외 **유지**
4. 대사: 첫 입문 `admit`, 승급 `promote`, 유지·문하 앞 `stay`

### 5.7 나를 들인 구절

헤드라인 성현의 이번 판 와닿음 구절 중:
1. 해설까지 읽은 것 우선
2. 이번 판 `user` 벡터와 tags 코사인이 높은 순
3. 같으면 나중에 읽은 것

- 헤드라인 성현 구절이 없으면 이번 판 와닿음 전체에서 같은 규칙. 그래도 없으면 `null`
- 결과는 `pickedVerseId`. 사용자가 ☆로 바꾸면 덮어씀
- 공유 URL의 `sage`는 헤드라인 성현, `verseId`는 `pickedVerseId`

### 5.8 삭제

- v1 관계 판정 관련 코드·상수(`FIT_THRESHOLD`)·문구
- 대표 유형(`손자형`) 표시, `typeName`, `typeTagline`
- "매칭" 섹션

---

## 6. 판 끝 처리 순서 (`completeRound`)

한 함수에서 이 순서로 (테스트 필수):

1. `readVerseIds`, `likedVerseIds`, `flippedVerseIds` 누적 반영 (스와이프 시점에 이미 반영했다면 생략)
2. `devotion` 누적 반영
3. 단계 재계산 → `stageBefore`와 비교해서 승급 목록
4. 헤드라인(§5.6), 나를 들인 구절(§5.7) 결정
5. `roundsPlayed += 1`, `lastRoundVerseIds` 갱신
6. 승급마다 `stage_up` 이벤트, `round_complete` 이벤트

새로고침해도 같은 결과가 나와야 함 (결정 결과를 `round`에 저장, 재계산 금지).

---

## 7. 콘텐츠

### 7.1 `sages.json`

- `typeName`, `typeTagline` 삭제
- `intro` 추가: 성현 소개 2줄 (책 이름, 핵심 사상을 쉬운 말로)
- `vec` 유지

### 7.2 `lines.json` 재작성

kind와 개수 (성현별):

| kind | 개수 | 쓰이는 곳 | 예 |
|---|---|---|---|
| `nod` | 5 | 스승의 평 · 끄덕 | 공자: "그 구절에 멈췄다면, 자네는 배울 줄 아는 사람이네." |
| `nudge` | 5 | 스승의 평 · 일깨움 | 노자: "너무 붙잡으려 하지 마라. 다음 구절은 가볍게 읽어보게." |
| `skip` | 5 | 넘김 반응 토스트 | 손자: "지나쳐도 좋다. 다만 왜 지나쳤는지는 알고 가라." |
| `admit` | 3 | 결과 · 첫 입문 | 공자: "배우려는 뜻이 보이니, 오늘부터 내 문하에서 읽게." |
| `promote` | 3 | 결과 · 승급 | 손자: "이제 판을 읽는구나. 한 걸음 더 들어와라." |
| `stay` | 3 | 결과 · 유지 / 문하 앞 | 노자: "오늘도 왔구나. 물처럼, 서두를 것 없다." |

- 성현당 24개, 총 72개
- 말투: 공자 점잖은 하게체, 노자 느긋하고 선문답 같은 말투, 손자 짧고 단호한 말투
- 고전 구절을 인용하면 `original` 필드에 원문
- **금지 어휘**: 매칭, 인연, 짝, 사랑, 연애, 거절, 수락, 판별, 유형
- 전부 `reviewed: false`

### 7.3 `verses.json`

- 변경 없음 (성현별 20개, 총 60개)
- 저작권 규칙 유지: 원문은 퍼블릭 도메인, **번역·해설은 직접 작성, 기존 출판 번역 문장 재현 금지**

### 7.4 `check:content` 수정

- lines: kind별 개수, 성현별 합계 24
- lines 텍스트(`text`)에 금지 어휘가 있으면 실패
- sages: `intro` 필수, `typeName`·`typeTagline` 있으면 실패

---

## 8. 공유

### 8.1 `/s/[sage]/[verseId]` (메인 공유)

- `generateStaticParams`: **모든 성현 × 그 성현의 구절** (60개). 헤드라인 성현과 다른 성현 구절을 ☆로 고른 경우를 위해 성현 × 전체 구절(180개)로 생성해도 됨. 빌드 시간 보고 결정
- `generateMetadata`:
  - title: `"공자 문하에 들었습니다 — 성현 문하"`
  - description: `"{번역} · {출처}"` (100자 이내)
- `opengraph-image.tsx` (1200x630): 한지색 배경, 좌상단 `孔子 門下` + 낙관, 중앙에 원문 크게, 그 아래 번역 한 줄, 하단 출처. 원문이 길면 폰트 자동 축소
- 단계(제자, 고제)는 URL에 넣지 않음 (정적 페이지 수 유지)

### 8.2 `/v/[verseId]` (구절만)

- 60개 정적 생성, OG는 8.1에서 `孔子 門下` 대신 성현 이름만

### 8.3 보내기 버튼

- `navigator.share({ title, text, url })` 지원 시 사용, 아니면 링크 복사 + "복사됨" 토스트
  - text: `"공자 문하에 들었습니다. \"{번역}\""`
- URL: `/s/{sage}/{verseId}?ref=share`

### 8.4 이미지 저장 (1080x1920, 인스타 스토리)

- `/s/[sage]/[verseId]/story` 라우트에서 `ImageResponse`로 생성해 다운로드 (또는 클라이언트 canvas)
- 구성: 상단 `孔子 門下` + 단계 뱃지(이미지에는 단계 포함 가능, 쿼리 `?stage=`로 받음), 중앙 원문 크게, 음독, 번역, 출처, 하단 작게 서비스 이름

---

## 9. 페이크 도어: "성현께 직접 여쭙기"

- 결과 화면 맨 아래 텍스트 링크
- 바텀시트: "읽다가 궁금한 걸 성현께 직접 여쭙는 기능을 준비 중입니다. 열리면 가장 먼저 알려드릴까요?"
- [알림 받기] → `more_talk_optin` / [닫기]
- 이메일 수집 없음

---

## 10. 분석: Firebase Analytics (GA4)

### 10.1 연결 (최우선)

- `posthog-js` 의존성과 관련 코드 전부 제거
- 환경변수 (`.env.example`에 키 이름만. 값은 사람이 Firebase 콘솔 → 프로젝트 설정 → 웹 앱에서 복사해 Vercel Production·Preview에 넣음):
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=
  NEXT_PUBLIC_FIREBASE_APP_ID=
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=   # G-로 시작
  ```
- `lib/firebase.ts`: `initializeApp`은 한 번만 (`getApps().length` 체크)
- `lib/analytics.ts`:
  - **클라이언트에서만** 초기화. 서버에서 import돼도 안 터지게 `typeof window` 체크
  - `isSupported()`가 false면 (인앱 웹뷰, 프라이빗 모드 등) `console.debug`로 대체, 앱은 정상 동작
  - 초기화 전 이벤트는 큐에 쌓았다가 flush
  - 환경변수가 없으면 `console.debug`. **production 빌드에서 `MEASUREMENT_ID`가 없으면 빌드 로그에 경고**
  - `localhost` 또는 `?debug=1`이면 `debug_mode: 1`을 붙여 GA4 DebugView에서 확인 가능하게
- **페이지뷰**: `usePathname` 변화마다 `page_view` 수동 전송 (`page_path`, `page_title`). GA4의 향상된 측정 "브라우저 기록 기반 페이지 변경"은 사람이 꺼야 함 → 작업 로그에 남겨

### 10.2 GA4 제약 (`track()` 안에서 처리)

- 이벤트 이름: 영문·숫자·밑줄, 40자 이내, 예약어(`first_open`, `session_start`, `user_engagement` 등) 금지
- 파라미터: 이벤트당 25개 이내, 이름 40자 이내, 문자열 값 100자 이내 (넘으면 자름)
- **boolean은 1/0 숫자로 변환**, 객체·배열 금지
- 보고서용 맞춤 정의 등록 목록을 `docs/ga4-custom-dimensions.md`에 표로 (이름, 범위, 설명). 등록은 사람이 함
- 익명 client id만 사용, `setUserId` 금지
- 사용자 속성: `setUserProperties({ rounds_played, read_count, top_stage })` (결과 진입 시 갱신. `top_stage`는 세 성현 중 가장 높은 단계)

### 10.3 이벤트

| 이벤트 | 시점 | 파라미터 |
|---|---|---|
| `page_view` | 경로 변경 | `page_path`, `page_title` |
| `landing_view` | 랜딩 진입 | `ref`, `returning`, `read_count` |
| `round_start` | 첫 카드 표시 | `round_id`, `from_share`, `rounds_played` |
| `verse_view` | 카드가 앞에 뜸 | `round_id`, `verse_id`, `sage`, `index`, `first_time`, `recommended` |
| `card_flip` | 카드 뒤집기 | `verse_id`, `index` |
| `swipe` | 와닿음 / 넘김 | `round_id`, `verse_id`, `sage`, `dir`(like\|dislike), `index`, `method`(drag\|button\|key), `dwell_ms`, `flipped` |
| `teacher_note_shown` | 스승의 평 | `round_id`, `sage`, `kind`(nod\|nudge), `has_rec` |
| `rec_accept` | [읽어보기] | `round_id`, `sage`, `verse_id` |
| `skip_reaction` | 넘김 토스트 | `sage` |
| `round_abandon` | 21장 전 이탈 (`pagehide`) | `round_id`, `index` |
| `round_complete` | 21장 완료 | `round_id`, `liked_count`, `flipped_count`, `duration_ms` |
| `stage_up` | 승급 | `sage`, `from`, `to`, `rounds_played` |
| `result_view` | 결과 진입 | `round_id`, `head_sage`, `head_kind`(enter\|promote\|stay\|front\|none), `picked_verse_id`, `read_count` |
| `pick_change` | ☆로 교체 | `verse_id` |
| `share_click` | 보내기 | `kind`(sage_verse\|verse), `sage`, `verse_id`, `method`(native\|copy) |
| `image_save` | 이미지 저장 | `sage`, `verse_id`, `stage` |
| `share_landing` | `/s/*`, `/v/*` 진입 | `kind`, `sage`, `verse_id`, `ref` |
| `restart` | 다시 읽기 | `rounds_played` |
| `saved_view` | `/saved` 진입 | `count` |
| `read_milestone` | 누적 읽음 20, 40, 60 | `read_count` |
| `more_talk_click` / `more_talk_optin` | 페이크 도어 | `head_sage` |

- localStorage 접근은 전부 try/catch. 실패해도 앱은 메모리 상태로 동작

### 10.4 보는 법 (사람용 메모, 구현 X)

- 실시간: GA4 → 관리 → DebugView (`?debug=1`)
- 퍼널: 탐색 → 유입경로 (`round_start` → `round_complete` → `result_view` → `share_click`)
- 리텐션: 보고서 → 리텐션, 탐색 → 동질 집단
- 승급 동기 확인: `stage_up`이 있는 사용자 vs 없는 사용자의 D7 비교
- 표준 보고서는 24~48시간 지연

---

## 11. 작업 순서

1. **Firebase 교체** (§10.1~10.2): PostHog 제거, `lib/firebase.ts`, `lib/analytics.ts`, `page_view`, `.env.example`, 빌드 경고, `/privacy`. 사람이 할 일(Vercel 환경변수, 향상된 측정 끄기, 맞춤 정의 등록)을 작업 로그에 정리
2. **콘텐츠** (§7): `sages.json` intro, `lines.json` 72개 재작성, `check:content` 수정 후 통과
3. **상태 + 마이그레이션** (§5.1)
4. **로직** (§5.2~5.7, §6): 정진 점수, 스승의 평 + 추천, 덱 우선순위, 단계·`nextRequirement`, 헤드라인, 나를 들인 구절, `completeRound`. **테스트 통과**
5. **삭제** (§5.8)
6. **읽기 화면** (§4.3): 와닿음/넘김, 앞면 출처, `처음` 표시, 정진 `+n` 표시, 스승의 평 카드 + 추천 삽입
7. **결과 화면** (§4.4)
8. **`/saved`** (§4.5)
9. **공유** (§4.6, §8.1~8.3): `/s`, `/v` 정적 생성 + OG, 보내기, `/r` 리다이렉트
10. **이미지 저장** (§8.4)
11. **랜딩** (§4.2): 카피, 재방문 단계 뱃지
12. **페이크 도어** (§9)
13. **이벤트 전부 연결** (§10.3), 발생 지점 확인
14. **마무리**: UI 문자열에서 금지 어휘 grep, 다크모드, reduced-motion, 390px, Lighthouse 모바일 성능 90+

---

## 12. 범위 밖 (만들지 마)

- 로그인, 회원, 서버 DB, 기기 간 동기화
- 결제, 구독, 열람 제한
- LLM 호출
- 성현 3인 외 추가, 구절 추가 (60개 유지)
- 푸시 알림, PWA 설치 유도
- 다국어, 관리자 페이지
- 카카오톡 공유 SDK (다음 단계)
- 문하 단계 하락, 랭킹, 다른 사용자와 비교

---

## 13. 완료 기준

**빌드·코드**
- [ ] `npm run build`, `npm run test`, `npm run check:content` 통과
- [ ] `posthog` 문자열이 코드와 `package.json`에 없음
- [ ] UI에 "매칭", "인연", "판별", "유형", "손자형", "수락", "거절" 문자열 없음

**읽기**
- [ ] 버튼·스탬프 라벨이 와닿음 / 넘김, 카드 앞면에 출처
- [ ] 6, 12, 18장째 스승의 평이 `끄덕` / `일깨움` 도장과 함께 뜨고, [읽어보기] 시 추천 구절이 다음 카드로 나오며 21장 유지
- [ ] 두 번째 판부터 안 읽은 구절이 우선 나옴 (테스트로 검증)

**문하**
- [ ] 정진 점수가 §5.2대로 쌓이고 0 아래로 안 내려감
- [ ] 점수가 높아도 읽기·해설 조건이 모자라면 승급 안 됨 (테스트)
- [ ] 단계가 내려가지 않음 (테스트)
- [ ] 첫 판에서 한 성현 구절을 꾸준히 와닿음 누르면 그 성현 입문 (테스트)

**결과**
- [ ] 헤드라인 4가지(첫 입문, 승급, 유지, 문하 앞)와 없음이 §5.6대로 나옴 (테스트)
- [ ] 헤드라인 아래에 성현 대사와 "당신을 들인 구절", ☆로 교체 가능
- [ ] 세 문하 줄에 단계 뱃지, 게이지, `n/20`, 다음 단계 안내 문구
- [ ] 새로고침해도 결과가 같음

**공유**
- [ ] `/s/{sage}/{verseId}` 링크를 카카오톡/인스타 DM에 붙이면 `孔子 門下` + 구절 OG 이미지가 뜸
- [ ] `/v/{verseId}` OG 정상, `/r/sunzi`는 `/`로 리다이렉트
- [ ] 이미지 저장이 1080x1920으로 다운로드됨

**분석**
- [ ] 배포에서 `?debug=1`로 접속하면 GA4 DebugView에 `page_view`, `verse_view`, `swipe`, `stage_up`이 찍힘 (환경변수 설정 후)
- [ ] 파라미터에 boolean 없음
- [ ] 카카오톡 인앱 브라우저에서도 앱 정상 동작
- [ ] `docs/ga4-custom-dimensions.md` 작성

**기타**
- [ ] v1 사용자의 localStorage 데이터가 깨지지 않고 이어짐 (좋아요 → 정진 점수 초기화 포함)
- [ ] 다크모드에서 글자가 읽힘

---

## 14. 이후 (참고만, 지금 구현 X)

- 지표가 좋으면 Flutter 앱으로 이전. 같은 Firebase 프로젝트에 앱을 추가하면 웹·앱 지표를 한 곳에서 비교 가능
- 앱 푸시(FCM): "공자께서 기다리십니다", 승급 직전 알림
- 문하별 책 순서 완독 모드 (논어 1편부터), 고제 이상 전용 구절
- 페이크 도어 클릭률이 높으면 "성현께 여쭙기"를 LLM으로, 고제 단계 특전 또는 구독 기능으로 검토
