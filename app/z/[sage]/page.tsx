import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { HallScreen } from "@/components/HallScreen";
import type { SageId } from "@/lib/types";
import { getInitialVerse } from "@/lib/live-server";
import type { Sage } from "@/lib/types";
import { Suspense } from "react";
import { sageContentPayload } from "@/lib/content-payload";

async function CurrentHall({ sage }: { sage: Sage }) {
  const initialVerse = await getInitialVerse(sage.id);
  return <HallScreen sage={sage} initialVerse={initialVerse} content={sageContentPayload(sage.id)} />;
}

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

// 광장과 같은 이유로 정적 셸을 유지한다 (app/page.tsx 주석 참고).
export default async function HallPage({ params }: PageProps<"/z/[sage]">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return (
    <Suspense fallback={<HallScreen sage={sage} initialVerse={null} content={sageContentPayload(sage.id)} />}>
      <CurrentHall sage={sage} />
    </Suspense>
  );
}
