import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { HallScreen } from "@/components/HallScreen";
import { fetchCurrentVerse } from "@/lib/liveNow";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

// 광장과 같은 이유로 구절을 SSR에서 미리 받는다 (app/page.tsx 주석 참고).
export const instant = false;

export default async function HallPage({ params }: PageProps<"/z/[sage]">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  const initialVerse = await fetchCurrentVerse(sage.id);
  return <HallScreen sage={sage} initialVerse={initialVerse} />;
}
