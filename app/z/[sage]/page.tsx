import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { HallScreen } from "@/components/HallScreen";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

// searchParams를 서버에서 await하면 페이지 전체가 요청 시점으로 밀려 정적 셸이
// 비어버린다(LCP 지연). 공유 id는 수행 링크에만 쓰이므로 클라이언트에서 읽는다.
export default async function HallPage({ params }: PageProps<"/z/[sage]">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return (
    <Suspense fallback={null}>
      <HallScreen sage={sage} />
    </Suspense>
  );
}
