#!/usr/bin/env bash
# 집 서버에서 실행: 최신 코드 받고 실시간 서버 재시작
# 사용: ~/apps/seonghyeon/server/scripts/deploy.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER_DIR="$REPO_DIR/server"

echo "▶ git pull ($REPO_DIR)"
git -C "$REPO_DIR" pull --ff-only

echo "▶ npm ci"
cd "$SERVER_DIR"
npm ci --omit=dev --no-audit --no-fund

echo "▶ pm2 reload"
mkdir -p logs
if pm2 describe seonghyeon-live > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "▶ health check"
sleep 2
curl -fsS "http://127.0.0.1:${PORT:-4000}/healthz" && echo
echo "✔ done"
