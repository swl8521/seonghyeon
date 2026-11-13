# 자체 서버 운영

현재 공개 주소를 바꾸지 않고 다음 두 프로세스를 한 서버에서 운영한다.

| 공개 주소 | 로컬 프로세스 | 역할 |
|---|---|---|
| `https://munha.yeoul.dev` | `127.0.0.1:3000` | Next.js 화면·공유 페이지·OG 이미지 |
| `https://live-munha.yeoul.dev` | `127.0.0.1:4000` | Socket.IO·현재 구절·접속자·합장 |

두 프로세스 모두 로컬 주소에만 바인딩한다. 방화벽으로 포트를 공개하지 않고
Cloudflare Tunnel이 TLS와 외부 연결을 담당한다.

## 1. 최초 준비

Node.js 20 이상, Git, PM2, cloudflared를 설치하고 저장소를 서버에 복제한다.

```bash
git clone https://github.com/swl8521/seonghyeon.git ~/apps/seonghyeon
cd ~/apps/seonghyeon
cp .env.example .env.production.local
cp server/.env.example server/.env
```

`.env.production.local`의 공개 변수는 브라우저 번들에 들어가므로 비밀값으로
취급할 수 없다. 운영값은 적어도 다음과 같이 설정한다.

```dotenv
NEXT_PUBLIC_SITE_URL=https://munha.yeoul.dev
NEXT_PUBLIC_LIVE_URL=https://live-munha.yeoul.dev
```

`server/.env`에서는 `ALLOWED_ORIGINS=https://munha.yeoul.dev`를 사용한다.
Firebase를 쓸 경우 기존 `NEXT_PUBLIC_FIREBASE_*` 값도 옮긴다. 환경 파일은
Git에 커밋하지 않는다.

`cloudflared.example.yml`을 `/etc/cloudflared/config.yml`로 복사하고 터널 ID와
인증 파일을 설정한다. 설정 검증 후 서비스를 시작한다.

```bash
cloudflared tunnel ingress validate
sudo systemctl enable --now cloudflared
```

처음에는 공개 DNS를 Vercel에 둔 채 서버 로컬에서 먼저 배포를 검증한다.

```bash
cd ~/apps/seonghyeon
bash server/scripts/deploy.sh
curl -I http://127.0.0.1:3000/
curl http://127.0.0.1:4000/healthz
```

## 2. 도메인 전환 전 확인

- `pm2 status`에서 `seonghyeon-web`, `seonghyeon-live`가 `online`
- 로컬 `/` 응답이 200이고 `/opengraph-image`가 `image/png`
- 로컬 실시간 `/healthz`, `/now?zone=hall`이 200
- 임시 Tunnel 주소 또는 hosts 우회로 한국어·영어, 읽기, 따라쓰기 확인
- 두 브라우저에서 같은 구절, 접속자 수, 합장, 1분 전환 확인

모두 통과한 뒤 Cloudflare DNS의 `munha.yeoul.dev` 연결만 새 터널로 전환한다.
`live-munha.yeoul.dev`가 이미 같은 서버 터널을 사용한다면 해당 항목은 그대로
유지한다. 도메인이 같으므로 공유 링크 설정은 바꿀 필요가 없다.

## 3. 이후 배포

```bash
cd ~/apps/seonghyeon
bash server/scripts/deploy.sh
```

스크립트는 코드를 받은 뒤 콘텐츠 검사, 테스트, 린트, Next.js 빌드를 모두
통과해야 PM2를 갱신한다. 마지막에는 로컬 서비스 상태를 다시 검사한다.

문제가 생기면 `pm2 logs seonghyeon-web`과 `pm2 logs seonghyeon-live`를 먼저
확인한다. 이전 커밋으로 되돌릴 때는 복구할 커밋을 명시적으로 체크아웃한 뒤
같은 배포 스크립트를 실행한다.
