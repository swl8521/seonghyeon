import { ImageResponse } from "next/og";
import { SAGES, getSage } from "@/lib/content";
import { loadGoogleFont } from "@/lib/og-font";
import type { SageId } from "@/lib/types";

export const alt = "성현 판별 결과";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

export default async function Image({ params }: { params: Promise<{ sage: string }> }) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId) ?? SAGES[0];

  const subsetText = Array.from(new Set(`${sage.hanja}${sage.typeName}`.split(""))).join("");
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
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 56,
            right: 64,
            width: 96,
            height: 96,
            backgroundColor: "#b23a2e",
            borderRadius: 10,
          }}
        />
        <p style={{ fontSize: 180, color: "#2b2724", margin: 0, lineHeight: 1 }}>
          {sage.hanja}
        </p>
        <p
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#2b2724",
            margin: 0,
            marginTop: 32,
          }}
        >
          {sage.typeName}
        </p>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Serif KR", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
