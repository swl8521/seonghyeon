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
  const [failed, setFailed] = useState(false);
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

  if (!kakaoKey) return null;

  function handleClick() {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const imageUrl = new URL(href(imagePath), origin).href;
    const shareUrl = new URL(href(sharePath), origin).href;
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
    setFailed(!sent);
  }

  return (
    <>
      <Script
        src={KAKAO_SDK_SRC}
        strategy="afterInteractive"
        onReady={() => {
          const initialized = Boolean(ensureKakaoInit());
          setReady(initialized);
          setFailed(!initialized);
        }}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready}
        className="rounded-full bg-[#FEE500] px-5 py-2 font-sans text-sm text-[#191919] disabled:opacity-50"
      >
        {t("카카오톡 공유")}
      </button>
      {failed && <p role="status" className="text-xs text-muted">{t("카카오톡 공유를 열지 못했어요. 보내기 버튼을 이용해 주세요.")}</p>}
    </>
  );
}
