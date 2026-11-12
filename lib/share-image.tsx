import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { resolveShare } from "./share";
import { isLocale } from "./locale";
import { loadOgFont } from "./og-font";
import { VerseOgCard, OG_FONT_FAMILY } from "./ogCard";

export async function renderShareImage(request: NextRequest, verseId: string, sageId?: string) {
  const lang = request.nextUrl.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "ko";
  const data = resolveShare(verseId, locale, sageId);
  if (!data) return new Response("Not found", { status: 404 });
  const { verse, sage } = data;
  const header = sageId ? sage.hall : sage.name;
  const fontData = await loadOgFont();
  return new ImageResponse(<VerseOgCard header={header} original={verse.original} translation={verse.translation} source={verse.source} />, {
    width: 1200, height: 630,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    fonts: [{ name: OG_FONT_FAMILY, data: fontData, style: "normal", weight: 400 }],
  });
}
