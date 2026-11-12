import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import localFont from "next/font/local";
import { PageViewTracker } from "@/components/PageViewTracker";
import { LocaleProvider, LanguagePicker } from "@/components/LocaleProvider";
import "./globals.css";

// UI는 기본 굵기 고딕, 한국어 구절·제목은 마루 부리로 자체 호스팅한다.
// Noto 명조는 한문 원문용으로 기본 굵기만 유지한다.
const pretendard = localFont({
  src: "../public/fonts/Pretendard-Regular.woff2",
  variable: "--font-pretendard",
  weight: "400",
  display: "optional",
  preload: false,
});
const maruBuri = localFont({
  src: "../public/fonts/MaruBuri-Regular.woff2",
  variable: "--font-maru-buri",
  weight: "400",
  display: "optional",
  preload: false,
});

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${maruBuri.variable} ${notoSerifKR.variable} h-full antialiased`}
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
