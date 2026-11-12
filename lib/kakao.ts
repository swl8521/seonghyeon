export interface KakaoShareFeedTemplate {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: { mobileWebUrl: string; webUrl: string };
  };
  buttons?: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
}

interface KakaoSDK {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (template: KakaoShareFeedTemplate) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

export const KAKAO_SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.5/kakao.min.js";

export function ensureKakaoInit(): KakaoSDK | null {
  if (typeof window === "undefined" || !window.Kakao) return null;

  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) return null;

  try {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(key);
    }
    return window.Kakao;
  } catch {
    return null;
  }
}

export function shareKakaoFeed(template: KakaoShareFeedTemplate): boolean {
  const kakao = ensureKakaoInit();
  if (!kakao) return false;

  try {
    kakao.Share.sendDefault(template);
    return true;
  } catch {
    return false;
  }
}
