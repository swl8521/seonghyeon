// /s, /v의 공유 OG 이미지(1200x630)와 이미지 저장(1080x1920)이 공유하는 카드 레이아웃.
// next/og(ImageResponse)는 일반 CSS 서브셋만 지원하므로 inline style만 쓴다.

const NIGHT_BG = "#10141f";
const INK_TEXT = "#e8dfc9";
const MUTED_TEXT = "#8b8a7c";
const LANTERN = "#d98a4a";

function originalFontSize(text: string): number {
  if (text.length > 24) return 48;
  if (text.length > 16) return 64;
  if (text.length > 10) return 80;
  return 96;
}

export function VerseOgCard({
  header,
  original,
  translation,
  source,
}: {
  header: string;
  original: string;
  translation: string;
  source: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: NIGHT_BG,
        fontFamily: "Noto Serif KR",
        padding: "64px 80px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 64,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            backgroundColor: LANTERN,
            borderRadius: 8,
          }}
        />
        <p style={{ fontSize: 32, color: MUTED_TEXT, margin: 0 }}>{header}</p>
      </div>

      <p
        style={{
          fontSize: originalFontSize(original),
          color: INK_TEXT,
          margin: 0,
          textAlign: "center",
          lineHeight: 1.3,
        }}
      >
        {original}
      </p>
      <p
        style={{
          fontSize: translation.length > 100 ? 28 : 36,
          color: MUTED_TEXT,
          margin: 0,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        {translation}
      </p>
      <p
        style={{
          position: "absolute",
          bottom: 56,
          right: 64,
          fontSize: 28,
          color: MUTED_TEXT,
          margin: 0,
        }}
      >
        {source}
      </p>
    </div>
  );
}

export const OG_FONT_FAMILY = "Noto Serif KR";
