# 성현 문하 MVP: 작업 지시서 v4 (사이버 법당)

> **2026-11-12 사용자 승인 변경 (아래 기존 승급 규칙보다 우선)**
> - 장소 표시: 대성전 → 공자의 배움터, 태청궁 → 노자의 배움터, 병성각 → 손자의 배움터. 사용자 안내의 ‘전각’은 ‘배움터’로 표기한다.
> - 단계 표시: 씨앗(`outside`) → 새싹(`entered`) → 나무(`disciple`) → 고목(`senior`). 내부 키와 기존 사용자의 획득 단계는 유지한다.
> - 점수·읽기·해설 조건 충족 시 자동 승급 대신 성현별 따라쓰기 과제를 연다. 한 번에 한 단계씩, 새싹 1개 / 나무 3개 / 고목 5개의 서로 다른 한국어 번역을 완료해야 한다.
> - 좋아한 구절을 우선하고 짧은 번역으로 채운다. 띄어쓰기·문장부호 차이는 허용하며 한글 조합 중에는 판정하지 않는다. 시간제한은 없다.
> - 과제의 구절·진행·작성 중 문장을 브라우저에 저장한다. 나중에 이어서 할 수 있고 일반 읽기를 막지 않는다. 타자 대신 단어 순서 선택도 제공한다.
> - 전각·수행 결과의 ‘나의 성장’에서 과제를 진행하고 광장 전각 문에 준비 상태를 표시한다. 과제를 모두 완료한 시점에만 승급·축하·`stage_up`을 처리한다.

> 가칭: **성현 문하(門下)** (코드명 `seonghyeon` 유지)
> 한 줄: **사이버 법당에서 모두가 같은 구절을 함께 보고, 전각에 들어가 수행하면 성현이 나를 제자로 들인다.**
> 목적: 고전을 읽게 만드는 것.
> 구성: 프론트 Next.js (Vercel) + **실시간 서버 Node/Socket.IO (집 서버, `server/` 폴더, 구현 완료)**
> 배포: https://seonghyeon-lac.vercel.app

---

## 0. Claude Code에게

- 이 문서는 **v1으로 구현·배포된 코드베이스를 고치는 지시서**야. v2, v3로 이미 작업한 부분이 있으면 이어서 하고, 다른 곳은 **v4가 우선**이야.
- **`server/` 폴더는 이미 구현·테스트된 실시간 서버**야. 레포 루트에 그대로 두고, 프로토콜(§9)에 맞춰 프론트만 붙여. 서버 수정이 꼭 필요하면 이유를 작업 로그에 남기고 `server/test`를 같이 고쳐.
- 서버 설치·운영은 `docs/HOME_SERVER.md`가 따로 있어. 사람이 하는 일이니 너는 건드리지 마.
- **§13 작업 순서대로** 진행. 범위 밖(§14)은 만들지 마.
- 단계마다 `npm run build`, `npm run test`, `npm run check:content`, `cd server && npm test` 통과 확인.

---

## 1. 변경 요약

### 1.1 버전별 방향

| | v3 | **v4** |
|---|---|---|
| 공간 | 랜딩 → 스와이프 21장 | **광장(실시간) → 전각 3곳(실시간) → 전각 안 수행(스와이프)** |
| 구절 | 혼자 덱을 넘김 | 광장·전각: **모두가 같은 구절을 1분마다 함께 봄** / 수행: 혼자 넘김 |
| 함께 있다는 느낌 | 없음 | **구역별 접속자 수, 합장 수** |
| 수행 덱 | 3인 섞어 21장 | **그 전각 성현 구절만 10장** |
| 저장 | `/saved` | **경함(經函)** `/inventory` (실시간 구절 담기 + 수행 와닿음) |
| 분위기 | 한지 | **사이버 법당**: 밤 법당 톤, 등불, 단청 포인트 |

v3에서 그대로 가져오는 것: 와닿음/넘김, 스승의 평(끄덕/일깨움) + 추천 구절, 안 읽은 구절 우선, 정진 점수와 문하 단계(문외·입문·제자·고제), 결과 헤드라인 + 나를 들인 구절, `/s`·`/v` 공유, Firebase 분석, 콘텐츠 규칙.

### 1.2 v1 코드에서 바꿀 것 (요약)

- PostHog 제거 → Firebase Analytics
- `/play`, `/result`의 3인 혼합 21장 → 전각별 `/z/[sage]/practice` 10장
- 대표 유형, 매칭, 관계 판정 삭제
- 좋아요/싫어요 → 와닿음/넘김, 카드 앞면 출처 추가
- 판별 이벤트 → 스승의 평
- `/r/*`, `/play`, `/result` → 리다이렉트 (§4.9)

### 1.3 배포에서 확인된 문제 (같이 고쳐)

- 분석 도구 미로드 → §12
- "매칭 (41)" 라벨 오해 → 경함으로 이동
- 판별 카드에 결과 표시 없음 → 스승의 평 도장
- 카드 앞면 출처 없음, 결과 화면 빈 공간

---

## 2. 검증할 가설과 지표

| 가설 | 지표 | 측정 |
|---|---|---|
| 광장이 사람을 머물게 한다 | 광장 체류 시간, 본 실시간 구절 수 | `live_verse_view`, GA4 참여 시간 |
| 함께 보는 느낌이 행동을 만든다 | 합장률, 담기율 | `bow`, `inventory_add(source=live)` / `live_verse_view` |
| 광장 → 전각 → 수행으로 깊어진다 | 단계별 전환율 | `zone_enter` → `practice_start` → `practice_complete` |
| 구절을 깊이 읽는다 | 해설 읽기율 | `card_flip`, `live_flip` |
| 승급하려고 다시 온다 | D1 / D7, `stage_up` 발생률 | GA4 리텐션 |
| 공유가 사람을 데려온다 | 공유 랜딩 → 광장 입장 | `share_landing` → `zone_enter` |
| 성현과 대화 수요 | 페이크 도어 클릭률 | `more_talk_click` |

---

## 3. 기술 스택

- 프론트: Next.js App Router, TypeScript, Tailwind, motion, zustand + persist, next/og (v1 유지)
- 실시간 클라이언트: **socket.io-client** (`server/`와 같은 메이저 버전 4)
- 분석: **firebase** (`firebase/app`, `firebase/analytics`). `posthog-js` 제거
- 실시간 서버: `server/` (Node 20+, Socket.IO 4, PM2 fork 1개, Cloudflare Tunnel 뒤)
- 폰트: Noto Serif KR / Noto Sans KR

환경변수 (프론트, `.env.example`에 이름만):
```
NEXT_PUBLIC_LIVE_URL=https://live-munha.yeoul.dev   # Cloudflare Tunnel (집 서버)
NEXT_PUBLIC_SITE_URL=https://munha.yeoul.dev        # OG·공유 링크 절대 주소 (metadataBase)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

### 3.1 도메인

`yeoul.dev`는 앞으로 만들 서비스들이 같이 쓰는 공용 도메인. 성현 문하는 서브도메인으로:

| 주소 | 용도 |
|---|---|
| `https://munha.yeoul.dev` | 프론트 (Vercel 커스텀 도메인) |
| `https://live-munha.yeoul.dev` | 실시간 서버 (Cloudflare Tunnel → 집 서버) |

- `app/layout.tsx`의 `metadata.metadataBase`는 `NEXT_PUBLIC_SITE_URL`로. OG 이미지, 공유 URL(`/s`, `/v`)은 전부 이 값 기준 절대 주소
- 공유 버튼이 만드는 링크도 `window.location.origin` 말고 `NEXT_PUBLIC_SITE_URL` 사용 (프리뷰·vercel.app 주소로 공유되는 것 방지)
- 기존 `seonghyeon-lac.vercel.app`으로 들어온 요청은 `middleware.ts`에서 `munha.yeoul.dev`로 308 리다이렉트 (호스트가 `seonghyeon-lac.vercel.app`일 때만. 프리뷰 주소는 건드리지 않음)

---

## 4. 공간과 화면

### 4.1 구조

```
광장 /  ─────────────── 실시간: 3인 전체 60구절, 1분마다 교체
 ├─ 대성전  /z/confucius ── 실시간: 공자 20구절
 │    └─ 수행 /z/confucius/practice → 결과 /z/confucius/result
 ├─ 태청궁  /z/laozi ────── 실시간: 노자 20구절
 │    └─ 수행 → 결과
 └─ 병성각  /z/sunzi ────── 실시간: 손자 20구절
      └─ 수행 → 결과

경함 /inventory · 공유 /s/[sage]/[verseId], /v/[verseId] · /privacy
```

전각 이름 (`sages.json`에 `hall` 필드로):

| 성현 | 전각 | 한자 |
|---|---|---|
| 공자 | 대성전 | 大成殿 |
| 노자 | 태청궁 | 太淸宮 |
| 손자 | 병성각 | 兵聖閣 |

### 4.2 분위기: 사이버 법당

- **기본 테마는 "밤 법당"**: 먹빛에 가까운 남색 배경, 한지색 글자, 등불(따뜻한 주황) 글로우, 단청 색(녹청·주홍·황)은 포인트로만
- 라이트 모드(시스템 설정)는 **"새벽 법당"**: 기존 한지 톤
- 실시간 구절 카드 뒤에 은은한 등불 글로우가 천천히 숨쉬듯 밝아졌다 어두워짐 (4초 주기). 향 연기 같은 아주 옅은 파티클은 선택 (성능 우선, 모바일에서 30fps 이하로 떨어지면 끔)
- **정각 전환**: 모든 접속자 화면에서 동시에 구절이 바뀜. 이전 구절은 위로 연기처럼 흩어지고 새 구절이 아래에서 떠오름 (600ms)
- **목탁 소리**: 정각 전환 때 "똑" 한 번. **기본 꺼짐**, 우상단 스피커 아이콘으로 켬 (설정은 localStorage)
- `prefers-reduced-motion`이면 글로우·연기·전환 애니메이션 전부 끄고 크로스페이드만
- 모바일 우선 390px, 데스크톱은 가운데 480px 컬럼 (v1 유지)

### 4.3 광장 `/`

위에서부터:

1. 상단 바: `광장` · 지금 **N명** (광장 접속자) · 스피커 아이콘 · 경함 아이콘(담은 개수 뱃지)
2. **실시간 구절 카드** (화면 중심, 가장 크게)
   - 성현 이름 작게, 원문 크게, 음독, 번역, 출처
   - 탭하면 해설 (카드 뒤집기, v1 컴포넌트 재사용)
   - 카드 아래: 다음 구절까지 남은 시간 (얇은 원형 게이지 + `0:37`)
3. 행동 버튼 2개
   - **[합장]**: 누를 때마다 작은 빛이 위로 떠오름. 옆에 "함께 합장 **7**" (이 구역, 이 구절 기준 누적. 서버 값)
   - **[담기]**: 경함에 저장. 이미 담았으면 `담음` 상태로 비활성
4. **전각 문 3개** (가로 3칸): 아이콘, 전각 이름, 성현 이름, 지금 **n명**, 내 문하 단계 뱃지
5. 하단 작은 링크: 처음 왔다면 "이곳은" (한 줄 설명 바텀시트), 개인정보처리방침

처음 방문자에게만 카드 위에 한 줄 안내 (닫으면 다시 안 보임): "모두가 같은 구절을 함께 봅니다. 1분마다 바뀝니다."

### 4.4 전각 `/z/[sage]`

광장과 같은 레이아웃, 차이점만:

- 상단 바: `← 광장` · `대성전` · 지금 **n명**
- 실시간 구절은 그 성현 20구절 풀
- 전각 문 3개 대신 **[수행하기]** 큰 버튼 + 내 문하 카드 (단계 뱃지, 다음 단계까지 게이지, 안내 문구 v3 §5.5 `nextRequirement`)
- 성현 소개 2줄 (`intro`), 접힘

### 4.5 수행 `/z/[sage]/practice`

v3의 읽기 화면을 그 성현 전용으로:

- 카드 **10장**, 그 성현 구절만 (덱 규칙 §5.4)
- 와닿음(오른쪽) / 넘김(왼쪽), 드래그·버튼·← → 키, 탭하면 뒤집기, 상단 진행도 `n / 10`
- 카드 앞면 하단 출처, 처음 보는 구절 `처음` 표시, 정진 `+n` 표시
- 넘김 시 25% 확률 반응 토스트 (`skip`)
- **4장, 8장째 직후 스승의 평** (§5.3)
- 상단 바에 이 전각 접속자 수 작게 (수행 중에도 전각 방에 들어가 있는 상태 유지)
- 테마는 전각과 같음

### 4.6 수행 결과 `/z/[sage]/result`

v3 결과 화면을 한 성현 기준으로:

1. **문하 헤드라인 + 나를 들인 구절** (한 장의 카드 = 공유 카드)
   - 헤드라인 (§5.6): 첫 입문 "**대성전**에서 **공자** 문하에 들었습니다" / 승급 "**공자** 문하의 **제자**가 되었습니다" / 유지 "오늘도 **공자** 문하에서 수행했습니다" / 문하 앞 "**공자** 문하 앞에 섰습니다" / 없음 "아직 문이 열리지 않았습니다"
   - 성현 대사 (`admit` / `promote` / `stay`)
   - "당신을 들인 구절": 원문, 음독, 번역, 출처, 탭하면 해설
   - [보내기] (주) [이미지 저장]. 없음이면 구절·공유 대신 "와닿는 구절을 더 찾아보게." + [다시 수행]
2. **내 문하** 카드: 단계 뱃지, 게이지, `n/20`, 다음 단계 안내. 승급했으면 낙관 도장 애니메이션
3. **이번 수행 10구절** (접힘, ☆로 나를 들인 구절 교체, 탭하면 해설)
4. 버튼: [다시 수행] [전각으로] [광장으로]
5. 맨 아래 [성현께 직접 여쭙기] (페이크 도어 §11)

### 4.7 경함 `/inventory`

- 제목 "경함(經函)", 부제 "담아둔 구절"
- 실시간에서 [담기]한 구절 + 수행에서 와닿음 누른 구절, 최신순, 중복 없음
- 필터 탭: 전체 / 공자 / 노자 / 손자
- 각 구절: 원문, 번역, 출처, 담은 곳 작게 (`광장` / `대성전` / `대성전 수행` …), 담은 날짜
- 각 구절 [보내기] → `/v/[verseId]`, [빼기]
- 비어 있으면 "아직 담은 구절이 없습니다" + [광장으로]

### 4.8 공유 랜딩

- **`/s/[sage]/[verseId]`** (수행 결과에서 보낸 링크): "누군가 **공자** 문하에 들며 이 구절을 보냈습니다" + 구절 카드(해설 펼침) + [법당에 들어가기] → `/z/{sage}?from=share&id=...`
- **`/v/[verseId]`** (경함에서 보낸 링크): "누군가 이 구절을 보냈습니다" + 카드 + [법당에 들어가기] → `/?from=share&id=...`
- 공유로 들어온 사람의 첫 수행은 공유된 구절을 덱에서 빼고 시작
- OG: v3 §8 그대로 (`/s`: `孔子 門下` + 구절, `/v`: 성현 이름 + 구절). **배경만 밤 법당 톤**으로

### 4.9 리다이렉트 (308)

- `/r/[sage]` → `/z/[sage]`
- `/play` → `/`
- `/result` → `/`
- `/saved` → `/inventory`

### 4.10 실시간 서버에 못 붙을 때

- 연결 중: 카드 자리에 "법당 문을 여는 중…" (스켈레톤)
- 3번 재시도 실패 또는 `NEXT_PUBLIC_LIVE_URL` 없음: **폴백 모드**
  - `GET {LIVE_URL}/now?zone=` 폴링으로 구절만 표시 (주기 = 받은 `remainingMs`, 실패하면 30초)
  - 그것도 실패하면 "법당 문이 잠시 닫혔습니다. 수행은 계속할 수 있습니다." + [수행하기] (전각) 또는 전각 문 (광장). 접속자 수·합장 숨김
- **수행, 결과, 경함, 공유는 실시간 서버 없이도 전부 동작해야 함**

---

## 5. 로직

순수 함수는 `lib/`에, **vitest 테스트 필수**. 튜닝 숫자는 `lib/constants.ts`.

### 5.1 상태 (zustand persist, `version: 4`)

```ts
type SageId = "confucius" | "laozi" | "sunzi";
type Zone = "hall" | SageId;
type Stage = "outside" | "entered" | "disciple" | "senior";

interface InventoryItem {
  verseId: string;
  source: "live" | "practice";
  zone: Zone;                              // 담은 곳
  at: number;                              // epoch ms
}

interface PersistedState {
  version: 4;
  practice: PracticeState | null;          // 진행 중인 수행 (전각 하나)
  readVerseIds: string[];                  // 누적 읽음
  flippedVerseIds: string[];               // 누적 해설 읽음
  inventory: InventoryItem[];              // 경함 (verseId 중복 없음, 최신순)
  devotion: Record<SageId, number>;        // 정진 점수 (≥ 0)
  stage: Record<SageId, Stage>;            // 단계 (하락 없음)
  dwellCredit: Record<SageId, { day: string; points: number; accMs: number }>; // 전각 체류 점수 (§5.2)
  practicesDone: Record<SageId, number>;
  lastPracticeVerseIds: Record<SageId, string[]>;
  soundOn: boolean;
  seenIntro: boolean;
}

interface PracticeState {
  id: string;
  sage: SageId;
  deck: string[];                          // 10개
  index: number;
  user: Vec;                               // v1 성향 벡터
  likedIds: string[];
  dislikedIds: string[];
  flippedIds: string[];
  devotionGain: number;
  notes: TeacherNote[];
  stageBefore: Stage;
  outcome: PracticeOutcome | null;         // 완료 시 확정, 새로고침해도 재계산 금지
  fromShareVerseId: string | null;
  startedAt: number;
}
```

**마이그레이션** (v1~v3 → v4):
- v1/v3 `likedVerseIds` → `inventory`에 `{ source: "practice", zone: 해당 성현, at: 마이그레이션 시각 }`
- `readVerseIds` 없으면 `likedVerseIds`로
- `devotion` 없으면 성현별 와닿음 수 × 2, `stage`는 §5.5로 계산
- 진행 중이던 `round`는 버림

### 5.2 정진 점수

| 행동 | 대상 | 점수 |
|---|---|---|
| 수행: 와닿음 | 그 성현 | +2 |
| 수행: 와닿음 전에 해설까지 읽음 | 그 성현 | +1 추가 |
| 수행: 넘김 | 그 성현 | −1 |
| 수행: 스승의 평 `nod` | 그 성현 | +3 |
| 수행: 추천 구절 [읽어보기] | 그 성현 | +1 |
| 실시간: [담기] | 그 구절의 성현 | +1 (구절당 1회) |
| 실시간: 구절 해설 읽기 | 그 구절의 성현 | +1 (구절당 1회) |
| 전각 체류 (화면이 보이는 상태) | 그 전각 성현 | 5분마다 +1, **하루 최대 +3** |

- 실시간 [담기]와 해설 읽기는 그 구절을 `readVerseIds`에 추가 (읽음으로 인정). 해설 읽기는 `flippedVerseIds`에도 추가
- 합장은 점수 없음 (연타 방지)
- 체류 시간은 `visibilitychange`로 보이는 동안만 누적, 날짜는 로컬 기준 `YYYY-MM-DD`
- 단계 재계산은 **수행 완료 시**, 그리고 **실시간 담기·해설·체류로 점수가 오를 때**마다 (§5.5). 실시간에서 승급하면 화면 하단에 토스트 "공자 문하에 들었습니다" + `stage_up`

### 5.3 스승의 평 (수행 4장, 8장째 직후)

- 성현은 그 전각 성현 고정
- 종류: v1 `score`, `p = sigmoid(4·score)` 유지. 단 `score`의 `fit`은 이번 수행 `user` 벡터와 성현 `vec`의 코사인, `pref`는 이번 수행 (와닿음 − 넘김) / (와닿음 + 넘김 + 1)
  - `rng() < p` → `nod` (끄덕), 아니면 `nudge` (일깨움). RNG 주입 가능
- 카드: 성현 이름 + 도장(`끄덕` 주홍 / `일깨움` 녹청) + 대사 + "이것도 읽어보게" 추천 구절 미리보기
- 추천: 그 성현 구절 중 이번 덱에 없는 것 → 안 읽은 것 우선 → `user`와 tags 코사인 최대
- [읽어보기]: 다음 카드로 삽입, 덱 마지막 카드 제거 (10장 유지), 삽입 카드에 `추천` 라벨. [계속]: 그냥 진행
- 금지 표현: 수락, 거절, 받아들임, 인연

### 5.4 수행 덱

- 그 성현 20구절 중 10장
- 우선순위: **안 읽은 구절 → 읽었지만 경함에 없는 구절 → 경함에 있는 구절**, 그룹 안에서는 랜덤
- 직전 수행 10장(`lastPracticeVerseIds[sage]`)은 안 읽은 구절이 모자랄 때만 다시 허용
- `fromShareVerseId`는 제외

### 5.5 문하 단계 (v3 유지)

| 단계 | key | 조건 (그 성현, 누적) |
|---|---|---|
| 문외 | `outside` | 기본 |
| 입문 | `entered` | 정진 ≥ 8 |
| 제자 | `disciple` | 정진 ≥ 25 **그리고** 10구절 이상 읽음 |
| 고제 | `senior` | 정진 ≥ 50 **그리고** 18구절 이상 읽음 **그리고** 해설 10개 이상 |

- 하락 없음. `nextRequirement(sage)` → 부족한 것 중 첫 번째 `{ kind, remaining }`
- 기대 흐름: 첫 수행에 입문, 2~3번째 수행에 제자, 4~5번째에 고제. 수행 한 번 최대 정진은 10×3 + 2×3 + 2 = 38 안팎
- 테스트: 경계값, 하락 없음, 읽기 조건 미달 시 점수만으로 승급 안 됨

### 5.6 수행 결과 헤드라인 (`completePractice`)

순서대로 판정, 결과는 `outcome`에 확정 저장:
1. 이번 수행 와닿음 ≤ 1 → **없음** (`none`)
2. 이번 수행으로 단계가 올랐으면: `outside → entered`면 **첫 입문** (`enter`), 그 외 **승급** (`promote`)
3. 단계가 `outside` 그대로면 **문하 앞** (`front`)
4. 그 외 **유지** (`stay`)

대사: `enter` → `admit`, `promote` → `promote`, `stay`·`front` → `stay`

### 5.7 나를 들인 구절

이번 수행 와닿음 중: 해설까지 읽은 것 → `user`와 tags 코사인 높은 순 → 나중에 읽은 것. 없으면 `null`. ☆로 교체 가능

### 5.8 `completePractice` 순서 (테스트 필수)

1. `readVerseIds`, `flippedVerseIds`, `inventory`(와닿음, `source: "practice"`) 반영
2. `devotion` 반영
3. 단계 재계산, 승급 여부
4. 헤드라인, 나를 들인 구절 → `outcome`
5. `practicesDone[sage] += 1`, `lastPracticeVerseIds[sage]` 갱신
6. 이벤트: `stage_up`(승급 시), `practice_complete`

### 5.9 삭제

- v1 관계 판정, `FIT_THRESHOLD`, 대표 유형, `typeName`/`typeTagline`, "매칭" 섹션
- v1 `/play`, `/result`의 3인 혼합 라운드 로직 (컴포넌트는 수행 화면으로 재사용)

---

## 6. 실시간 클라이언트 (`lib/live.ts`)

- 앱 전체에서 **소켓 하나**. `NEXT_PUBLIC_LIVE_URL`로 `io(url, { transports: ["websocket"], reconnectionDelayMax: 10000 })`
- 라우트에 따라 방 입장: `/` → `hall`, `/z/[sage]`·`/z/[sage]/practice`·`/z/[sage]/result` → 그 성현. 그 외 페이지 → `leave`
- 입장은 `emit("join", { zone }, ack)`. ack로 받은 `verse`, `presence`, `bows`로 즉시 화면 구성
- 이벤트 처리
  - `verse`: 현재 구절 교체 (`slot`이 지금보다 작으면 무시)
  - `presence`: 상단 바와 전각 문 숫자 갱신
  - `bows`: 현재 `zone`·`slot`과 같을 때만 숫자 갱신
- **지연 대비**: 마지막으로 받은 `remainingMs`로 로컬 타이머를 걸고, 시간이 됐는데 `verse`가 1.5초 안에 안 오면 받아둔 `nextVerseId`로 먼저 넘김 (다음 `verse`가 오면 덮어씀)
- 카운트다운은 마지막 수신 시각 + `remainingMs` 기준 (`performance.now()`), 기기 시계 사용 금지
- 탭이 다시 보이면(`visibilitychange`) 연결 상태 확인, 끊겼으면 재접속 후 현재 방 다시 `join`
- 합장: `emit("bow", { zone, slot })`. 클라이언트도 800ms 쿨다운. 누른 즉시 화면 숫자 +1 (낙관적 갱신), 서버 값이 오면 서버 값으로
- React에서는 `useLive(zone)` 훅으로 `{ status, verse, remainingMs, presence, bows, bow() }` 노출
- 개발 중 서버 없이 화면 작업하려면 `NEXT_PUBLIC_LIVE_URL`을 비워서 폴백 모드로

---

## 7. 콘텐츠

### 7.1 `sages.json`

- `typeName`, `typeTagline` 삭제
- 추가: `intro` (2줄), `hall` (`"대성전"`), `hallHanja` (`"大成殿"`)

### 7.2 `lines.json` (v3와 같음)

성현별 `nod` 5, `nudge` 5, `skip` 5, `admit` 3, `promote` 3, `stay` 3 = 24개, 총 72개.
- 말투: 공자 점잖은 하게체, 노자 느긋하고 선문답 같은 말투, 손자 짧고 단호한 말투
- `admit`·`stay`에는 전각 분위기를 살짝 (예: 노자 `stay` "오늘도 태청궁에 들렀구나. 물처럼, 서두를 것 없다.")
- 금지 어휘: 매칭, 인연, 짝, 사랑, 연애, 거절, 수락, 판별, 유형
- 전부 `reviewed: false`

### 7.3 `verses.json`

- 변경 없음 (60개). **실시간 서버도 이 파일을 읽음** (`server/`의 `CONTENT_PATH` 기본값이 `../content/verses.json`)
- 구절을 고치면 서버에서 `pm2 sendSignal SIGHUP seonghyeon-live`로 다시 읽게 (사람이 함, `docs/HOME_SERVER.md`)
- 저작권 규칙: 원문은 퍼블릭 도메인, **번역·해설은 직접 작성, 기존 출판 번역 문장 재현 금지**

### 7.4 `check:content`

- lines kind별 개수, 금지 어휘
- sages `intro`, `hall`, `hallHanja` 필수, `typeName`·`typeTagline` 금지
- verses: 성현별 정확히 20개, id 중복 없음 (서버가 성현별 3개 이상을 요구함)

---

## 8. 공유

- `/s/[sage]/[verseId]`: 성현 × 그 성현 구절 60개 정적 생성 (☆로 다른 성현 구절을 고를 수 없으니 60개로 충분)
  - title `"공자 문하에 들었습니다 — 성현 문하"`, description `"{번역} · {출처}"`
  - OG 1200x630: 밤 법당 배경, 좌상단 `孔子 門下` + 낙관, 원문 크게, 번역 한 줄, 출처
- `/v/[verseId]`: 60개, OG는 성현 이름 + 구절
- 보내기: `navigator.share`, 아니면 링크 복사. URL에 `?ref=share`
- 이미지 저장 1080x1920: `/s/[sage]/[verseId]/story?stage=` 라우트에서 `ImageResponse`. 상단 `大成殿 · 孔子 門下` + 단계 뱃지, 원문, 음독, 번역, 출처, 하단 서비스 이름

---

## 9. 실시간 서버 프로토콜 (구현 완료, 참고용)

서버 코드: `server/src/index.js`, `server/src/schedule.js`. Socket.IO 기본 네임스페이스.

**방(zone)**: `hall`, `confucius`, `laozi`, `sunzi`. 소켓은 한 번에 한 방에만 있음.

| 방향 | 이벤트 | 페이로드 |
|---|---|---|
| C→S | `join` | `{ zone }`, ack → `{ verse, presence, bows }` 또는 `{ error }` |
| C→S | `leave` | 없음 |
| C→S | `bow` | `{ zone, slot }` (현재 방, 현재 슬롯만 인정, 소켓당 800ms 쿨다운) |
| S→C | `verse` | `{ zone, slot, verseId, nextVerseId, remainingMs, periodMs }` (방 전원, 매 정각) |
| S→C | `presence` | `{ total, hall, confucius, laozi, sunzi }` (전원, 변화 시 1초 묶음) |
| S→C | `bows` | `{ zone, slot, count }` (방 전원, 500ms 묶음) |

HTTP:
- `GET /now?zone=hall` → `verse`와 같은 형식 (폴백용)
- `GET /healthz` → `{ ok, uptimeSec, connections, contentVersion }`

방송 순서: 슬롯 = `floor(서버시각 / periodMs)`. 구역 풀 크기 N을 한 바퀴로 보고 바퀴마다 시드 셔플(시드 = 콘텐츠 버전 + 구역 + 바퀴 번호) → 한 바퀴 안에 중복 없음, 바퀴 경계 연속 중복 없음, 서버를 재시작해도 같은 시각엔 같은 구절.

CORS: 서버 `.env`의 `ALLOWED_ORIGINS`. Vercel 프리뷰 도메인으로 테스트하려면 거기에 추가해야 함 (사람이 함).

---

## 10. 개인정보 `/privacy`

- 로그인·개인정보 수집 없음
- 읽기 기록·경함·문하 단계는 브라우저(localStorage)에만 저장, 기기를 바꾸면 이어지지 않음
- 실시간 서버는 접속 중인 연결 수만 세고 저장하지 않음
- Google Analytics for Firebase로 익명 이용 통계 수집

---

## 11. 페이크 도어: "성현께 직접 여쭙기"

- 수행 결과 맨 아래 텍스트 링크
- 바텀시트: "읽다가 궁금한 걸 성현께 직접 여쭙는 기능을 준비 중입니다. 열리면 가장 먼저 알려드릴까요?" [알림 받기] / [닫기]
- 이메일 수집 없음

---

## 12. 분석: Firebase Analytics (GA4)

### 12.1 연결

- `posthog-js` 제거
- `lib/firebase.ts`: `initializeApp` 한 번만 (`getApps().length`)
- `lib/analytics.ts`: 클라이언트에서만, `isSupported()` false면 `console.debug`, 초기화 전 이벤트 큐, 환경변수 없으면 `console.debug` + production 빌드 경고, `localhost` 또는 `?debug=1`이면 `debug_mode: 1`
- `page_view`는 `usePathname` 변화마다 수동 전송. GA4 향상된 측정의 "브라우저 기록 기반 페이지 변경"은 사람이 끔 (작업 로그에 남겨)

### 12.2 GA4 제약 (`track()` 안에서)

- 이벤트 이름 40자 이내, 예약어 금지
- 파라미터 25개 이내, 이름 40자, 문자열 100자 (자름)
- **boolean → 1/0**, 객체·배열 금지
- `setUserId` 금지. 사용자 속성 `top_stage`, `read_count`, `inventory_count` (변화 시 갱신)
- 맞춤 정의 목록 `docs/ga4-custom-dimensions.md` (등록은 사람이)

### 12.3 이벤트

| 이벤트 | 시점 | 파라미터 |
|---|---|---|
| `page_view` | 경로 변경 | `page_path`, `page_title` |
| `zone_enter` | 광장·전각 입장 (join ack) | `zone`, `presence`, `from_share` |
| `live_verse_view` | 실시간 구절이 화면에 뜸 | `zone`, `verse_id`, `slot`, `late_join`(교체 후 10초 넘어서 봤는지) |
| `live_flip` | 실시간 구절 해설 | `zone`, `verse_id` |
| `bow` | 합장 (5초 묶음으로 한 번, `taps` 개수) | `zone`, `verse_id`, `taps` |
| `inventory_add` | 담기 / 수행 와닿음 | `source`(live\|practice), `zone`, `verse_id` |
| `inventory_remove` | 경함에서 빼기 | `verse_id` |
| `live_status` | 실시간 상태 변화 | `status`(connected\|reconnecting\|fallback\|closed) |
| `practice_start` | 수행 첫 카드 | `sage`, `practices_done`, `stage` |
| `verse_view` | 수행 카드 표시 | `sage`, `verse_id`, `index`, `first_time`, `recommended` |
| `card_flip` | 수행 카드 뒤집기 | `verse_id`, `index` |
| `swipe` | 와닿음/넘김 | `sage`, `verse_id`, `dir`, `index`, `method`, `dwell_ms`, `flipped` |
| `teacher_note_shown` | 스승의 평 | `sage`, `kind`, `has_rec` |
| `rec_accept` | 추천 [읽어보기] | `sage`, `verse_id` |
| `skip_reaction` | 넘김 토스트 | `sage` |
| `practice_abandon` | 10장 전 이탈 | `sage`, `index` |
| `practice_complete` | 10장 완료 | `sage`, `liked_count`, `flipped_count`, `duration_ms`, `head_kind` |
| `stage_up` | 승급 (수행·실시간 모두) | `sage`, `from`, `to`, `via`(practice\|live) |
| `result_view` | 수행 결과 진입 | `sage`, `head_kind`, `picked_verse_id` |
| `pick_change` | ☆ 교체 | `verse_id` |
| `share_click` | 보내기 | `kind`(sage_verse\|verse), `sage`, `verse_id`, `method` |
| `image_save` | 이미지 저장 | `sage`, `verse_id`, `stage` |
| `share_landing` | `/s`·`/v` 진입 | `kind`, `sage`, `verse_id`, `ref` |
| `sound_toggle` | 목탁 소리 | `on` |
| `read_milestone` | 누적 읽음 20, 40, 60 | `read_count` |
| `more_talk_click` / `more_talk_optin` | 페이크 도어 | `sage` |

- localStorage 접근은 전부 try/catch. 실패해도 메모리 상태로 동작

---

## 13. 작업 순서

1. **Firebase 교체** (§12.1~12.2), `/privacy`
2. **콘텐츠** (§7): `sages.json` 필드, `lines.json` 72개, `check:content`
3. **상태 + 마이그레이션** (§5.1)
4. **로직** (§5.2~5.8): 정진(실시간 포함), 스승의 평, 수행 덱, 단계, 헤드라인, 나를 들인 구절, `completePractice`. **테스트 통과**
5. **삭제** (§5.9), 리다이렉트 (§4.9)
6. **실시간 클라이언트** (§6): `lib/live.ts`, `useLive`. 로컬에서 `cd server && npm run dev` 띄우고 `NEXT_PUBLIC_LIVE_URL=http://localhost:4000`으로 확인. 브라우저 창 2개로 같은 구절·접속자 수·합장 수가 맞는지
7. **테마**: 밤 법당 / 새벽 법당 토큰 (§4.2)
8. **광장** (§4.3), **전각** (§4.4), 폴백 상태 (§4.10)
9. **수행** (§4.5), **결과** (§4.6)
10. **경함** (§4.7)
11. **공유** (§4.8, §8), OG, 이미지 저장
12. **분위기 마감**: 글로우, 정각 전환, 합장 빛, 목탁 소리 토글, reduced-motion
13. **페이크 도어** (§11)
14. **이벤트 연결** (§12.3)
15. **마무리**: 금지 어휘 grep, 다크/라이트, 390px, Lighthouse 모바일 성능 90+, 실시간 서버를 끈 상태에서 전 화면 점검

---

## 14. 범위 밖 (만들지 마)

- 로그인, 서버 DB, 기기 간 동기화 (경함·단계는 브라우저 저장)
- 다른 사람 닉네임, 채팅, 랭킹, 누가 접속했는지 목록 (숫자만)
- 결제, 구독, LLM
- 성현·구절 추가 (60개 유지)
- 푸시 알림, PWA 설치 유도, 다국어, 관리자 페이지, 카카오톡 SDK
- 실시간 서버의 수평 확장 (Redis 어댑터 등)

---

## 15. 완료 기준

**빌드·코드**
- [ ] `npm run build`, `npm run test`, `npm run check:content`, `cd server && npm test` 통과
- [ ] `posthog` 문자열 없음, UI에 금지 어휘(매칭, 인연, 판별, 유형, 수락, 거절) 없음

**실시간**
- [ ] 브라우저 2개로 광장 접속 시 같은 구절, 같은 카운트다운, 정각에 동시에 교체
- [ ] 광장 N명, 전각 문 n명이 입장·퇴장에 맞춰 1~2초 안에 바뀜
- [ ] 합장이 다른 창에 반영됨, 연타해도 800ms에 한 번만 셈
- [ ] 탭을 백그라운드로 보냈다가 돌아오면 현재 구절로 맞춰짐
- [ ] 실시간 서버를 끄면 폴백 → 닫힘 안내로 바뀌고, 수행·경함·공유는 정상

**수행·문하**
- [ ] 전각 수행은 그 성현 구절 10장, 두 번째 수행부터 안 읽은 구절 우선 (테스트)
- [ ] 4·8장째 스승의 평, [읽어보기] 시 다음 카드 삽입, 10장 유지
- [ ] 정진 점수 §5.2대로, 체류 점수 하루 +3 상한 (테스트)
- [ ] 읽기·해설 조건 미달이면 점수만으로 승급 안 됨, 단계 하락 없음 (테스트)
- [ ] 실시간 담기로 승급하면 토스트 + `stage_up(via=live)`
- [ ] 결과 헤드라인 5종이 §5.6대로 (테스트), 새로고침해도 같음

**경함·공유**
- [ ] 실시간 [담기]와 수행 와닿음이 경함에 중복 없이 모이고, 담은 곳 표시
- [ ] `/s/{sage}/{verseId}`, `/v/{verseId}` OG가 카카오톡/인스타 DM에서 뜸
- [ ] `/r/sunzi` → `/z/sunzi`, `/saved` → `/inventory`
- [ ] 이미지 저장 1080x1920

**분석·기타**
- [ ] `?debug=1`로 GA4 DebugView에 `zone_enter`, `live_verse_view`, `bow`, `swipe`, `stage_up` 확인 (환경변수 설정 후)
- [ ] 파라미터에 boolean 없음, 카카오톡 인앱 브라우저에서 정상 동작
- [ ] v1 사용자 localStorage가 깨지지 않고 이어짐
- [ ] 밤 법당 / 새벽 법당 모두 글자가 읽힘

---

## 16. 이후 (참고만)

- 지표가 좋으면 Flutter 앱. 같은 실시간 서버에 붙고, FCM 푸시로 "지금 광장에 N명이 함께 읽고 있습니다"
- 특정 시각 행사: 매일 밤 10시 "저녁 예불", 모두가 같은 구절을 5분간 함께 읽기
- 페이크 도어 반응이 좋으면 "성현께 여쭙기"를 LLM으로, 고제 단계 특전 또는 구독으로 검토
- 접속자가 수천 명을 넘으면 서버에 Redis 어댑터, 또는 클라우드로 이전
