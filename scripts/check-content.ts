import sages from "../content/sages.json" with { type: "json" };
import verses from "../content/verses.json" with { type: "json" };
import lines from "../content/lines.json" with { type: "json" };
import type { Axis, SageId, SageLine, Sage, Verse } from "../lib/types";

const AXES: Axis[] = ["ren", "xue", "dao", "mou", "rou"];
const SAGE_IDS: SageId[] = ["confucius", "laozi", "sunzi"];
const KINDS: SageLine["kind"][] = ["accept", "reject", "dislike"];

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
  const found = sagesTyped.find((s) => s.id === id);
  if (!found) {
    fail(`sages.json: "${id}" 성현이 없음`);
    continue;
  }
  checkVec(`sages.json[${id}].vec`, found.vec);
  for (const field of ["name", "hanja", "book", "typeName", "typeTagline"] as const) {
    if (!found[field]) fail(`sages.json[${id}]: 필드 "${field}"가 비어있음`);
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
if (linesTyped.length !== 45) {
  fail(`lines.json: 총 45개여야 하는데 ${linesTyped.length}개임`);
}

const countByKey: Record<string, number> = {};

for (const [i, l] of linesTyped.entries()) {
  if (!SAGE_IDS.includes(l.sage)) fail(`lines.json[${i}]: 알 수 없는 sage "${l.sage}"`);
  if (!KINDS.includes(l.kind)) fail(`lines.json[${i}]: 알 수 없는 kind "${l.kind}"`);
  if (!l.text) fail(`lines.json[${i}]: text가 비어있음`);

  const key = `${l.sage}:${l.kind}`;
  countByKey[key] = (countByKey[key] ?? 0) + 1;
}

for (const id of SAGE_IDS) {
  for (const kind of KINDS) {
    const key = `${id}:${kind}`;
    if (countByKey[key] !== 5) {
      fail(`lines.json: "${id}"의 "${kind}" 대사가 5개여야 하는데 ${countByKey[key] ?? 0}개임`);
    }
  }
}

if (errors.length > 0) {
  console.error(`콘텐츠 검증 실패 (${errors.length}건):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `콘텐츠 검증 통과: sages ${sagesTyped.length}, verses ${versesTyped.length}, lines ${linesTyped.length}`
);
