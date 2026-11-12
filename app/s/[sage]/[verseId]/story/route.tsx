import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { localizedSage, localizedVerse } from "@/lib/localized-content";
import { loadGoogleFont } from "@/lib/og-font";
import { isLocale, stageLabel, translate } from "@/lib/locale";
import type { SageId, Stage } from "@/lib/types";

const SIZE = { width: 1080, height: 1920 };
const STAGES: Stage[] = ["outside", "entered", "disciple", "senior"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sage: string; verseId: string }> }
) {
  const { sage: sageParam, verseId } = await params;
  const lang = request.nextUrl.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "ko";
  const sage = localizedSage(sageParam as SageId, locale);
  const verse = localizedVerse(verseId, locale);
  if (!sage || !verse || verse.sage !== sage.id) {
    return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const stageParam = searchParams.get("stage");
  const stage = (STAGES as string[]).includes(stageParam ?? "") ? (stageParam as Stage) : null;

  const header = sage.hall;
  const stageText = stage ? stageLabel(stage, locale) : "";
  const brand = translate(locale, "성현 문하");
  const subsetText = Array.from(
    new Set(
      `${brand}${header}${stageText}${verse.original}${verse.reading}${verse.translation}${verse.source}`.split(
        ""
      )
    )
  ).join("");
  const fontData = await loadGoogleFont("Noto Serif KR", subsetText);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#10141f",
          fontFamily: "Noto Serif KR",
          padding: "140px 96px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 96,
            left: 96,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <p style={{ fontSize: locale === "en" ? 36 : 44, color: "#8b8a7c", margin: 0 }}>{header}</p>
          {stage && (
            <p
              style={{
                fontSize: 32,
                color: "#d98a4a",
                margin: 0,
                border: "2px solid #d98a4a",
                borderRadius: 999,
                padding: "6px 20px",
              }}
            >
              {stageText}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontSize: verse.original.length > 16 ? 72 : 96,
              color: "#e8dfc9",
              margin: 0,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            {verse.original}
          </p>
          <p style={{ fontSize: 36, color: "#8b8a7c", margin: 0, marginTop: 32 }}>
            {verse.reading}
          </p>
          <p
            style={{
              fontSize: 44,
              color: "#e8dfc9",
              margin: 0,
              marginTop: 40,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {verse.translation}
          </p>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 140,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <p style={{ fontSize: 32, color: "#8b8a7c", margin: 0 }}>{verse.source}</p>
          <p style={{ fontSize: 24, color: "#5c5b50", margin: 0 }}>{brand}</p>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [{ name: "Noto Serif KR", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
