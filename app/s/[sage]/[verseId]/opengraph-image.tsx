import { ImageResponse } from "next/og";
import { SAGES, VERSES, getSage, getVerse } from "@/lib/content";
import { loadGoogleFont } from "@/lib/og-font";
import { VerseOgCard, OG_FONT_FAMILY } from "@/lib/ogCard";
import type { SageId } from "@/lib/types";

export const alt = "성현 문하";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return SAGES.flatMap((sage) =>
    VERSES.filter((v) => v.sage === sage.id).map((v) => ({ sage: sage.id, verseId: v.id }))
  );
}

export default async function Image({ params }: { params: Promise<{ sage: string; verseId: string }> }) {
  const { sage: sageParam, verseId } = await params;
  const sage = getSage(sageParam as SageId) ?? SAGES[0];
  const verse = getVerse(verseId) ?? VERSES.find((v) => v.sage === sage.id)!;

  const header = `${sage.hanja} 門下`;
  const subsetText = Array.from(
    new Set(`${header}${verse.original}${verse.translation}${verse.source}`.split(""))
  ).join("");
  const fontData = await loadGoogleFont(OG_FONT_FAMILY, subsetText);

  return new ImageResponse(
    (
      <VerseOgCard
        header={header}
        original={verse.original}
        translation={verse.translation}
        source={verse.source}
      />
    ),
    {
      ...size,
      fonts: [{ name: OG_FONT_FAMILY, data: fontData, style: "normal", weight: 700 }],
    }
  );
}
