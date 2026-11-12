import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import { PageViewTracker } from "@/components/PageViewTracker";
import { LocaleProvider, LanguagePicker } from "@/components/LocaleProvider";
import "./globals.css";
import "./pretendard-subset.css";

// UI는 기본 굵기 고딕, 구절·제목은 Noto 명조를 쓴다. 한문 원문과 한국어 본문을
// 같은 패밀리로 그리므로 받아오는 폰트가 한 벌로 끝나고, 유니코드 레인지 분할은
// next/font/google이 알아서 한다. 굵은 글씨는 브라우저 합성에 맡긴다.
const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400"],
  display: "optional",
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "성현 문하",
  description: "모두가 같은 구절을 함께 읽고, 마음에 든 구절을 따라 쓰며 씨앗에서 고목으로 자라요.",
};

const liveOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_LIVE_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
})();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSerifKR.variable} h-full antialiased`}
    >
      {/* 광장·전각의 본문(실시간 구절)은 하이드레이션 직후 실시간 서버로 거는
          WebSocket 응답을 기다린다. DNS·TCP·TLS를 미리 끝내두면 그 왕복이
          그만큼 일찍 시작된다. */}
      {liveOrigin && (
        <head>
          <link rel="preconnect" href={liveOrigin} crossOrigin="anonymous" />
          <link rel="dns-prefetch" href={liveOrigin} />
        </head>
      )}
      <body className="min-h-full flex flex-col overflow-x-hidden font-sans">
        <LocaleProvider>
        <PageViewTracker />
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[480px]">
          <LanguagePicker />
          {children}
        </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
