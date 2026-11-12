export const metadata = {
  title: "개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-10">
      <h1 className="font-serif text-2xl font-bold">개인정보처리방침</h1>
      <p className="font-sans text-sm leading-relaxed text-muted">
        이 서비스는 로그인이나 회원가입, 개인정보 수집이 없습니다. 읽은 구절과 성향 기록은
        서버가 아니라 이 기기의 브라우저(localStorage)에만 저장되며, 다른 기기와 공유되지
        않습니다. 서비스 개선을 위해 Google Analytics for Firebase로 어떤 개인도 식별할 수
        없는 익명 이용 통계를 수집합니다.
      </p>
    </main>
  );
}
