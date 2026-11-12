import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const alt = "성현 문하 — 사이버 법당에서 함께 고전을 읽습니다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const subsetText = "성현 문하 · 孔子老子孫子";
  const fontData = await loadGoogleFont("Noto Serif KR", subsetText);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#10141f",
          fontFamily: "Noto Serif KR",
        }}
      >
        <p style={{ fontSize: 56, color: "#8b8a7c", margin: 0 }}>孔子 · 老子 · 孫子</p>
        <p
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#e8dfc9",
            margin: 0,
            marginTop: 20,
          }}
        >
          성현 문하
        </p>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Serif KR", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
