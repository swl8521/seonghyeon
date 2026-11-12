"use client";

import { useLocale } from "@/components/LocaleProvider";

import { useState } from "react";
import Script from "next/script";
import { KAKAO_SDK_SRC, ensureKakaoInit, shareKakaoFeed } from "@/lib/kakao";

interface KakaoShareButtonProps {
  title: string;
  description: string;
  imagePath: string;
  sharePath: string;
  onShared?: () => void;
}

export function KakaoShareButton({
  title,
  description,
  imagePath,
  sharePath,
  onShared,
}: KakaoShareButtonProps) {
  const { t, href } = useLocale();
  const [ready, setReady] = useState(false);
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  if (!kakaoKey) return null;

  function handleClick() {
    const origin = window.location.origin;
    const imageUrl = `${origin}${href(imagePath)}`;
    const shareUrl = `${origin}${href(sharePath)}`;
    const sent = shareKakaoFeed({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        {
          title: t("나도 해보기"),
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      ],
    });
    if (sent) onShared?.();
  }

  return (
    <>
      <Script
        src={KAKAO_SDK_SRC}
        strategy="afterInteractive"
        onLoad={() => {
          ensureKakaoInit();
          setReady(true);
        }}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready}
        className="rounded-full border border-border px-5 py-2 font-sans text-sm text-foreground disabled:opacity-50"
      >
        {t("카카오톡 공유")}
      </button>
    </>
  );
}
