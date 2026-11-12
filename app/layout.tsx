import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { PageViewTracker } from "@/components/PageViewTracker";
import { LocaleProvider, LanguagePicker } from "@/components/LocaleProvider";
import "./globals.css";

// 한글 폰트는 굵기마다 전체 유니코드 서브셋 @font-face 선언이 추가되어 렌더링 차단 CSS가
// 크게 불어난다(굵기당 약 150KB). 기본 굵기만 로드하고, 굵게 표시가 필요한 곳은
// 브라우저의 합성 볼드(synthetic bold)에 맡긴다.
const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400"],
});

const notoSerifKR = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["400"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${notoSerifKR.variable} h-full antialiased`}
    >
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
