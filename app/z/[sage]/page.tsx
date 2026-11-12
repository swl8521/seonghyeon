import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { HallScreen } from "@/components/HallScreen";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

// 광장과 같은 이유로 정적 셸을 유지한다 (app/page.tsx 주석 참고).
export default async function HallPage({ params }: PageProps<"/z/[sage]">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return <HallScreen sage={sage} />;
}
