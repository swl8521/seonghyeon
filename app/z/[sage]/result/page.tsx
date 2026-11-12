import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { ResultScreen } from "@/components/ResultScreen";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

export default async function ResultPage({ params }: PageProps<"/z/[sage]/result">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return <ResultScreen sage={sage} />;
}
