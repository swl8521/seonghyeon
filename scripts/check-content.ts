import sages from "../content/sages.json" with { type: "json" };
import verses from "../content/verses.json" with { type: "json" };
import lines from "../content/lines.json" with { type: "json" };
import englishSages from "../content/en/sages.json" with { type: "json" };
import englishVerses from "../content/en/verses.json" with { type: "json" };
import englishLines from "../content/en/lines.json" with { type: "json" };
import englishUi from "../content/i18n/en.json" with { type: "json" };
import { readFileSync, readdirSync } from "node:fs";
import type { Axis, SageId, SageLine, Sage, Verse } from "../lib/types";

const AXES: Axis[] = ["ren", "xue", "dao", "mou", "rou"];
const SAGE_IDS: SageId[] = ["confucius", "laozi", "sunzi"];
const KINDS: SageLine["kind"][] = ["nod", "nudge", "skip", "admit", "promote", "stay"];
const KIND_COUNTS: Record<SageLine["kind"], number> = {
  nod: 5,
  nudge: 5,
  skip: 5,
  admit: 3,
  promote: 3,
  stay: 3,
};
const FORBIDDEN_WORDS = [
  "매칭",
  "인연",
  "짝",
  "사랑",
  "연애",
  "거절",
  "수락",
  "판별",
  "유형",
];

const errors: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

function checkVec(label: string, vec: Record<string, number>) {
  for (const axis of AXES) {
    const v = vec[axis];
    if (typeof v !== "number" || Number.isNaN(v) || v < 0 || v > 1) {
      fail(`${label}: axis "${axis}"의 값이 0~1 범위가 아님 (${v})`);
    }
  }
  const extraKeys = Object.keys(vec).filter((k) => !AXES.includes(k as Axis));
  if (extraKeys.length > 0) {
    fail(`${label}: 알 수 없는 축 키 ${extraKeys.join(", ")}`);
  }
}

// --- sages.json ---
const sagesTyped = sages as Sage[];
if (sagesTyped.length !== SAGE_IDS.length) {
  fail(`sages.json: 성현 수가 ${SAGE_IDS.length}이어야 하는데 ${sagesTyped.length}개임`);
}
for (const id of SAGE_IDS) {
  const found = sagesTyped.find((s) => s.id === id) as (Sage & Record<string, unknown>) | undefined;
  if (!found) {
    fail(`sages.json: "${id}" 성현이 없음`);
    continue;
  }
  checkVec(`sages.json[${id}].vec`, found.vec);
  for (const field of ["name", "hanja", "book", "hall", "hallHanja", "intro"] as const) {
    if (!found[field]) fail(`sages.json[${id}]: 필드 "${field}"가 비어있음`);
  }
  for (const banned of ["typeName", "typeTagline"]) {
    if (banned in found) fail(`sages.json[${id}]: 삭제했어야 할 필드 "${banned}"가 남아있음`);
  }
}

// --- verses.json ---
const versesTyped = verses as Verse[];
if (versesTyped.length !== 60) {
  fail(`verses.json: 총 60개여야 하는데 ${versesTyped.length}개임`);
}

const verseIds = new Set<string>();
const countBySage: Record<string, number> = {};

for (const v of versesTyped) {
  if (verseIds.has(v.id)) fail(`verses.json: id 중복 "${v.id}"`);
  verseIds.add(v.id);

  if (!SAGE_IDS.includes(v.sage)) fail(`verses.json[${v.id}]: 알 수 없는 sage "${v.sage}"`);
  countBySage[v.sage] = (countBySage[v.sage] ?? 0) + 1;

  for (const field of ["source", "original", "reading", "translation", "note"] as const) {
    if (!v[field]) fail(`verses.json[${v.id}]: 필드 "${field}"가 비어있음`);
  }

  if (v.reviewed !== false) {
    fail(`verses.json[${v.id}]: reviewed는 생성 시 false여야 함 (현재 ${v.reviewed})`);
  }

  checkVec(`verses.json[${v.id}].tags`, v.tags);
}

for (const id of SAGE_IDS) {
  if (countBySage[id] !== 20) {
    fail(`verses.json: "${id}" 구절이 20개여야 하는데 ${countBySage[id] ?? 0}개임`);
  }
}

// --- lines.json ---
const linesTyped = lines as SageLine[];
const expectedTotal = SAGE_IDS.length * Object.values(KIND_COUNTS).reduce((a, b) => a + b, 0);
if (linesTyped.length !== expectedTotal) {
  fail(`lines.json: 총 ${expectedTotal}개여야 하는데 ${linesTyped.length}개임`);
}

const countByKey: Record<string, number> = {};

for (const [i, l] of linesTyped.entries()) {
  if (!SAGE_IDS.includes(l.sage)) fail(`lines.json[${i}]: 알 수 없는 sage "${l.sage}"`);
  if (!KINDS.includes(l.kind)) fail(`lines.json[${i}]: 알 수 없는 kind "${l.kind}"`);
  if (!l.text) fail(`lines.json[${i}]: text가 비어있음`);
  if (l.reviewed !== false) {
    fail(`lines.json[${i}]: reviewed는 생성 시 false여야 함 (현재 ${l.reviewed})`);
  }

  for (const word of FORBIDDEN_WORDS) {
    if (l.text.includes(word)) {
      fail(`lines.json[${i}]: 금지 어휘 "${word}"가 text에 있음 ("${l.text}")`);
    }
  }

  const key = `${l.sage}:${l.kind}`;
  countByKey[key] = (countByKey[key] ?? 0) + 1;
}

for (const id of SAGE_IDS) {
  for (const kind of KINDS) {
    const key = `${id}:${kind}`;
    const expected = KIND_COUNTS[kind];
    if (countByKey[key] !== expected) {
      fail(`lines.json: "${id}"의 "${kind}" 대사가 ${expected}개여야 하는데 ${countByKey[key] ?? 0}개임`);
    }
  }
}

// Locale content must preserve stable IDs and remain marked as an editorial draft.
if (Object.keys(englishSages).sort().join() !== [...SAGE_IDS].sort().join()) fail("en/sages: sage IDs differ");
if (Object.keys(englishVerses).sort().join() !== [...verseIds].sort().join()) fail("en/verses: quote IDs differ");
if (englishLines.length !== linesTyped.length || englishLines.some((line) => !line.trim())) fail("en/lines: dialogue coverage differs");
for (const [id, verse] of Object.entries(englishVerses)) {
  if (!verse.translation.trim() || !verse.note.trim() || verse.reviewed !== false) fail(`en/verses: invalid draft ${id}`);
}
for (const [key, value] of Object.entries(englishUi)) {
  const placeholders = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort().join();
  if (!value.trim() || placeholders(key) !== placeholders(value)) fail(`en/ui: missing text or placeholder mismatch: ${key}`);
}
for (const file of readdirSync(new URL("../components/", import.meta.url))) {
  if (!file.endsWith(".tsx")) continue;
  const source = readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8");
  for (const match of source.matchAll(/\bt\("([^"\n]+)"/g)) {
    if (!(match[1] in englishUi)) fail(`en/ui: missing key in ${file}: ${match[1]}`);
  }
}

if (errors.length > 0) {
  console.error(`콘텐츠 검증 실패 (${errors.length}건):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `콘텐츠 검증 통과 (ko/en): sages ${sagesTyped.length}, verses ${versesTyped.length}, lines ${linesTyped.length}`
);
