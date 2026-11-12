import { readFile, mkdir, writeFile } from "node:fs/promises";

// Run only when content changes; production image rendering makes no font requests.
const paths = ["content/verses.json", "content/sages.json", "content/en/verses.json", "content/en/sages.json"];
const contents = await Promise.all(paths.map(async (path) => JSON.parse(await readFile(path, "utf8"))));
const text = Array.from(new Set(`성현 문하 · 孔子老子孫子Learn with the Sages${contents.map((data) => JSON.stringify(data)).join("")}`)).join("");
const url = `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400&text=${encodeURIComponent(text)}`;
const css = await (await fetch(url)).text();
const assetUrl = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"](?:truetype|opentype)['"]\)/)?.[1];
if (!assetUrl) throw new Error("Expected TTF/OTF font response");
const response = await fetch(assetUrl);
if (!response.ok) throw new Error(`Font download: ${response.status}`);
await mkdir("assets/fonts", { recursive: true });
await writeFile("assets/fonts/og-noto-serif-kr.ttf", Buffer.from(await response.arrayBuffer()));
console.log(`Saved OG font covering ${Array.from(text).length} unique characters`);
