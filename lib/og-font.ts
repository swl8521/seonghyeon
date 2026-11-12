import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Local content-covering TTF, read once per process; compatible with ImageResponse.
const fontData = readFile(join(process.cwd(), "assets/fonts/og-noto-serif-kr.ttf"));
export async function loadOgFont(): Promise<Buffer> {
  return fontData;
}
