"use client";
import { useLocale } from "./LocaleProvider";
export function PrivacyScreen() {
  const { t } = useLocale();
  return <main className="flex flex-1 flex-col gap-4 px-6 py-10"><h1 className="font-serif text-2xl font-bold">{t("개인정보처리방침")}</h1><p className="font-sans text-sm leading-relaxed text-muted">{t("이 서비스는 로그인이나 회원가입 없이 이용할 수 있어요. 읽기 기록, 모아둔 구절, 성장 단계, 따라쓰기 진행과 언어 선택은 이 브라우저에 저장돼요. 다른 기기와 자동으로 동기화되지 않아요. 실시간 서버는 현재 접속 수를 메모리에서 집계해요. 서비스 개선을 위해 Google Analytics for Firebase로 이용 통계를 수집해요.")}</p></main>;
}
