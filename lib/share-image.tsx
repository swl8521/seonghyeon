import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { resolveShare } from "./share";
import { isLocale } from "./locale";
import { loadGoogleFont } from "./og-font";
import { VerseOgCard, OG_FONT_FAMILY } from "./ogCard";

export async function renderShareImage(request: NextRequest, verseId: string, sageId?: string) {
  const lang = request.nextUrl.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "ko";
  const data = resolveShare(verseId, locale, sageId);
  if (!data) return new Response("Not found", { status: 404 });
  const { verse, sage } = data;
  const header = sageId ? sage.hall : sage.name;
  const text = Array.from(new Set(`${header}${verse.original}${verse.translation}${verse.source}`)).join("");
  const fontData = await loadGoogleFont(OG_FONT_FAMILY, text);
  return new ImageResponse(<VerseOgCard header={header} original={verse.original} translation={verse.translation} source={verse.source} />, {
    width: 1200, height: 630,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    fonts: [{ name: OG_FONT_FAMILY, data: fontData, style: "normal", weight: 700 }],
  });
}
