import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { HallScreen } from "@/components/HallScreen";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

export default async function HallPage({ params }: PageProps<"/z/[sage]">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return <HallScreen sage={sage} />;
}
