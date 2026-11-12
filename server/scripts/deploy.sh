#!/usr/bin/env bash
# 집 서버에서 실행: 최신 코드로 Next.js와 실시간 서버를 함께 배포
# 사용: ~/apps/seonghyeon/server/scripts/deploy.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER_DIR="$REPO_DIR/server"
WEB_PORT="${WEB_PORT:-3000}"
LIVE_PORT="${PORT:-4000}"

need_file() {
  if [[ ! -f "$1" ]]; then
    echo "✘ 필요한 설정 파일이 없습니다: $1" >&2
    exit 1
  fi
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempts="${3:-30}"

  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS --max-time 3 "$url" > /dev/null; then
      echo "✔ $name"
      return 0
    fi
    sleep 1
  done

  echo "✘ $name 응답 실패: $url" >&2
  return 1
}

need_file "$REPO_DIR/.env.production.local"
need_file "$SERVER_DIR/.env"

echo "▶ git pull ($REPO_DIR)"
git -C "$REPO_DIR" pull --ff-only

echo "▶ web dependencies"
cd "$REPO_DIR"
npm ci --no-audit --no-fund

echo "▶ quality checks"
npm run check:content
npm run test
npm run lint

echo "▶ Next.js production build"
npm run build

echo "▶ live server dependencies and tests"
cd "$SERVER_DIR"
npm ci --no-audit --no-fund
npm test
npm prune --omit=dev --no-audit --no-fund

echo "▶ pm2 reload"
mkdir -p "$REPO_DIR/logs" "$SERVER_DIR/logs"
cd "$REPO_DIR"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "▶ health check"
wait_for_url "Next.js" "http://127.0.0.1:${WEB_PORT}/"
wait_for_url "공유 미리보기" "http://127.0.0.1:${WEB_PORT}/opengraph-image"
wait_for_url "실시간 서버" "http://127.0.0.1:${LIVE_PORT}/healthz"
wait_for_url "현재 구절 API" "http://127.0.0.1:${LIVE_PORT}/now?zone=hall"
echo "✔ done"
