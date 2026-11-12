import { ImageResponse } from "next/og";
import { VERSES, getSage, getVerse } from "@/lib/content";
import { loadGoogleFont } from "@/lib/og-font";
import { VerseOgCard, OG_FONT_FAMILY } from "@/lib/ogCard";

export const alt = "성현 문하";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return VERSES.map((v) => ({ verseId: v.id }));
}

export default async function Image({ params }: { params: Promise<{ verseId: string }> }) {
  const { verseId } = await params;
  const verse = getVerse(verseId) ?? VERSES[0];
  const sage = getSage(verse.sage)!;

  const header = sage.name;
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
