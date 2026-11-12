import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { PracticeScreen } from "@/components/PracticeScreen";
import type { SageId } from "@/lib/types";
import { sageContentPayload } from "@/lib/content-payload";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

export default async function PracticePage({ params }: PageProps<"/z/[sage]/practice">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return (
    <Suspense fallback={null}>
      <PracticeScreen sage={sage} content={sageContentPayload(sage.id)} />
    </Suspense>
  );
}
