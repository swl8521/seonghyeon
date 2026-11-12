import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be a positive integer, got "${raw}"`);
  return n;
}

export const config = {
  port: int("PORT", 4000),
  host: process.env.HOST || "127.0.0.1",
  // 구절 교체 주기 (ms). 기본 1분
  periodMs: int("PERIOD_MS", 60_000),
  // verses.json 위치. 기본은 레포 루트의 content/verses.json
  contentPath: process.env.CONTENT_PATH || path.resolve(here, "../../content/verses.json"),
  // 쉼표 구분. 비우면 개발용으로 전부 허용
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  // IP 하나당 동시 연결 수 상한
  maxConnPerIp: int("MAX_CONN_PER_IP", 20),
  // 접속자 수 방송 간격 (ms)
  presenceThrottleMs: int("PRESENCE_THROTTLE_MS", 1000),
  // 합장 수 방송 간격 (ms)
  bowThrottleMs: int("BOW_THROTTLE_MS", 500),
  // 소켓 하나당 합장 최소 간격 (ms)
  bowCooldownMs: int("BOW_COOLDOWN_MS", 800),
};
