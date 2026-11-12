import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { SAGES, getSage } from "@/lib/content";
import { loadGoogleFont } from "@/lib/og-font";
import type { SageId } from "@/lib/types";

const SIZE = { width: 1080, height: 1920 };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const typeSage = getSage(typeParam as SageId) ?? SAGES[0];
  const intensityLabel = searchParams.get("intensityLabel") ?? "";
  const axisLine = searchParams.get("axisLine") ?? "";
  const closeLine = searchParams.get("closeLine");

  const title = "성현 판별";
  const subsetText = Array.from(
    new Set(
      `${title}${typeSage.hanja}${intensityLabel}${typeSage.name}${typeSage.intro}${axisLine}${closeLine ?? ""}`.split(
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
          backgroundColor: "#f5f0e4",
          fontFamily: "Noto Serif KR",
          padding: "120px 80px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 72,
            right: 72,
            width: 72,
            height: 72,
            backgroundColor: "#b23a2e",
            borderRadius: 8,
          }}
        />

        <p
          style={{
            position: "absolute",
            top: 72,
            left: 80,
            fontSize: 36,
            color: "#6b6156",
            margin: 0,
          }}
        >
          {title}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 220, color: "#2b2724", margin: 0, lineHeight: 1 }}>
            {typeSage.hanja}
          </p>
          <p
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: "#2b2724",
              margin: 0,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            {intensityLabel}
            {typeSage.name} 문하
          </p>
          <p style={{ fontSize: 40, color: "#6b6156", margin: 0, marginTop: 24 }}>
            {typeSage.intro}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: 2,
            backgroundColor: "#ddd4c2",
            marginTop: 96,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            marginTop: 72,
            gap: 24,
          }}
        >
          <p
            style={{
              fontSize: 40,
              color: "#2b2724",
              margin: 0,
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            {axisLine}
          </p>
          {closeLine && (
            <p
              style={{
                fontSize: 36,
                color: "#6b6156",
                margin: 0,
                textAlign: "center",
              }}
            >
              {closeLine}
            </p>
          )}
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [{ name: "Noto Serif KR", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
