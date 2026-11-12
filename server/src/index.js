import http from "node:http";
import { readFileSync } from "node:fs";
import { Server } from "socket.io";
import { config } from "./config.js";
import { ZONES, ZoneSchedule, buildPools, slotOf, verseState } from "./schedule.js";

const log = (...args) => console.log(new Date().toISOString(), ...args);

/* ───────────── 콘텐츠 ───────────── */

let schedules = {};
let contentVersion = "";

function loadContent() {
  const verses = JSON.parse(readFileSync(config.contentPath, "utf8"));
  const built = buildPools(verses);
  const next = {};
  for (const z of ZONES) next[z] = new ZoneSchedule(z, built.pools[z], built.contentVersion);
  schedules = next;
  contentVersion = built.contentVersion;
  log(`content loaded: ${built.pools.hall.length} verses, version ${contentVersion}`);
}

loadContent();

/* ───────────── HTTP ───────────── */

function corsHeaders(origin) {
  if (!origin) return {};
  if (config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) {
    return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
  }
  return {};
}

const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(req.headers.origin) };

  if (req.method === "GET" && url.pathname === "/healthz") {
    res.writeHead(200, headers);
    res.end(JSON.stringify({ ok: true, uptimeSec: Math.round(process.uptime()), connections: io.engine.clientsCount, contentVersion }));
    return;
  }

  // 소켓이 안 될 때 쓰는 폴백: 현재 구절 한 번 조회
  if (req.method === "GET" && url.pathname === "/now") {
    const zone = url.searchParams.get("zone") || "hall";
    if (!ZONES.includes(zone)) {
      res.writeHead(400, headers);
      res.end(JSON.stringify({ error: "unknown zone" }));
      return;
    }
    res.writeHead(200, headers);
    res.end(JSON.stringify(verseState(schedules[zone], Date.now(), config.periodMs)));
    return;
  }

  res.writeHead(404, headers);
  res.end(JSON.stringify({ error: "not found" }));
});

/* ───────────── Socket.IO ───────────── */

const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || config.allowedOrigins.length === 0 || config.allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error("origin not allowed"), false);
    },
  },
  pingInterval: 25_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 1_000,
});

function clientIp(socket) {
  const h = socket.handshake.headers;
  return (
    h["cf-connecting-ip"] ||
    (typeof h["x-forwarded-for"] === "string" ? h["x-forwarded-for"].split(",")[0].trim() : "") ||
    socket.handshake.address
  );
}

// IP당 연결 수 제한
const connPerIp = new Map();
io.use((socket, next) => {
  const ip = clientIp(socket);
  const n = connPerIp.get(ip) || 0;
  if (n >= config.maxConnPerIp) return next(new Error("too many connections"));
  connPerIp.set(ip, n + 1);
  socket.data.ip = ip;
  socket.on("disconnect", () => {
    const left = (connPerIp.get(ip) || 1) - 1;
    if (left <= 0) connPerIp.delete(ip);
    else connPerIp.set(ip, left);
  });
  next();
});

/* 접속자 수 */

function presence() {
  const counts = { total: io.engine.clientsCount };
  for (const z of ZONES) counts[z] = io.sockets.adapter.rooms.get(z)?.size || 0;
  return counts;
}

let presenceTimer = null;
function schedulePresence() {
  if (presenceTimer) return;
  presenceTimer = setTimeout(() => {
    presenceTimer = null;
    io.emit("presence", presence());
  }, config.presenceThrottleMs);
}

/* 합장 수 (구역 + 슬롯 단위, 현재 슬롯만 유지) */

const bows = new Map(); // `${zone}:${slot}` -> count
const bowTimers = new Map(); // zone -> timeout

function bowCount(zone, slot) {
  return bows.get(`${zone}:${slot}`) || 0;
}

function scheduleBows(zone, slot) {
  if (bowTimers.has(zone)) return;
  bowTimers.set(
    zone,
    setTimeout(() => {
      bowTimers.delete(zone);
      io.to(zone).emit("bows", { zone, slot, count: bowCount(zone, slot) });
    }, config.bowThrottleMs),
  );
}

function pruneBows(currentSlot) {
  for (const key of bows.keys()) {
    const slot = Number(key.split(":")[1]);
    if (slot < currentSlot) bows.delete(key);
  }
}

/* 연결 */

io.on("connection", (socket) => {
  socket.data.zone = null;
  socket.data.lastBowAt = 0;

  // 구역 입장: { zone } → ack({ verse, presence, bows })
  socket.on("join", (payload, ack) => {
    const zone = payload?.zone;
    if (!ZONES.includes(zone)) {
      if (typeof ack === "function") ack({ error: "unknown zone" });
      return;
    }
    if (socket.data.zone && socket.data.zone !== zone) socket.leave(socket.data.zone);
    socket.join(zone);
    socket.data.zone = zone;

    const state = verseState(schedules[zone], Date.now(), config.periodMs);
    const reply = { verse: state, presence: presence(), bows: { zone, slot: state.slot, count: bowCount(zone, state.slot) } };
    if (typeof ack === "function") ack(reply);
    else socket.emit("verse", state);
    schedulePresence();
  });

  socket.on("leave", () => {
    if (socket.data.zone) socket.leave(socket.data.zone);
    socket.data.zone = null;
    schedulePresence();
  });

  // 합장: { zone, slot }. 현재 구역·현재 슬롯만 인정, 소켓당 쿨다운
  socket.on("bow", (payload) => {
    const zone = socket.data.zone;
    if (!zone || payload?.zone !== zone) return;
    const slot = slotOf(Date.now(), config.periodMs);
    if (payload?.slot !== slot) return;
    const now = Date.now();
    if (now - socket.data.lastBowAt < config.bowCooldownMs) return;
    socket.data.lastBowAt = now;
    const key = `${zone}:${slot}`;
    bows.set(key, (bows.get(key) || 0) + 1);
    scheduleBows(zone, slot);
  });

  socket.on("disconnect", () => schedulePresence());
});

/* ───────────── 정각 방송 ───────────── */

let tickTimer = null;

function tick() {
  const now = Date.now();
  const slot = slotOf(now, config.periodMs);
  pruneBows(slot);
  for (const z of ZONES) {
    io.to(z).emit("verse", verseState(schedules[z], now, config.periodMs));
  }
  scheduleNextTick();
}

function scheduleNextTick() {
  const now = Date.now();
  // 경계 직후에 깨도록 20ms 여유
  const delay = config.periodMs - (now % config.periodMs) + 20;
  tickTimer = setTimeout(tick, delay);
}

/* ───────────── 시작 / 종료 ───────────── */

httpServer.listen(config.port, config.host, () => {
  log(`listening on http://${config.host}:${config.port} (period ${config.periodMs}ms)`);
  if (config.allowedOrigins.length === 0) log("WARNING: ALLOWED_ORIGINS is empty, all origins allowed");
  scheduleNextTick();
});

// 콘텐츠 다시 읽기: kill -HUP <pid> 또는 pm2 sendSignal SIGHUP seonghyeon-live
process.on("SIGHUP", () => {
  try {
    loadContent();
    const now = Date.now();
    for (const z of ZONES) io.to(z).emit("verse", verseState(schedules[z], now, config.periodMs));
  } catch (err) {
    log("content reload failed, keeping previous content:", err.message);
  }
});

function shutdown(signal) {
  log(`${signal} received, shutting down`);
  clearTimeout(tickTimer);
  io.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
