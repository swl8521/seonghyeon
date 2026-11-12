import { mkdir, writeFile } from "node:fs/promises";

const source = "https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/web/static/pretendard-dynamic-subset.css";
const response = await fetch(source);
if (!response.ok) throw new Error(`Font stylesheet: ${response.status}`);
const css = await response.text();
const blocks = css.match(/@font-face\s*\{[^}]+\}/g)?.filter((block) => /font-weight:\s*400\s*;/.test(block)) ?? [];
if (!blocks.length || !blocks.every((block) => block.includes("unicode-range"))) throw new Error("No unicode subset faces found");
await mkdir("public/fonts/pretendard-subset", { recursive: true });
for (let i = 0; i < blocks.length; i += 6) {
  await Promise.all(blocks.slice(i, i + 6).map(async (block) => {
    const path = block.match(/url\(['"]?([^)'"\s]+\.woff2)/)?.[1];
    if (!path) throw new Error("Missing woff2 asset");
    const url = new URL(path, source);
    const asset = await fetch(url);
    if (!asset.ok) throw new Error(`Font asset: ${asset.status} ${url}`);
    await writeFile(`public/fonts/pretendard-subset/${url.pathname.split("/").pop()}`, Buffer.from(await asset.arrayBuffer()));
  }));
}
const output = blocks.map((block) => block
  .replace(/font-family:\s*[^;]+;/, "font-family: 'Munha Pretendard';")
  .replace(/font-display:\s*[^;]+;/, "font-display: optional;")
  .replace(/src:[^;]+;/, (src) => {
    const asset = src.match(/([^/'"\s()]+\.woff2)/)?.[1];
    return `src: url('/fonts/pretendard-subset/${asset}') format('woff2');`;
  })).join("\n");
await writeFile("app/pretendard-subset.css", `/* Official Pretendard v1.3.9 regular unicode subsets. See public/fonts/Pretendard-LICENSE.txt. */\n${output}\n`);
console.log(`Vendored ${blocks.length} regular unicode subsets`);
