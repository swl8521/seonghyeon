import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { HallScreen } from "@/components/HallScreen";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

export default async function HallPage({ params, searchParams }: PageProps<"/z/[sage]">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return (
    <Suspense fallback={null}>
      <HallScreenLoader sage={sage} searchParams={searchParams} />
    </Suspense>
  );
}

async function HallScreenLoader({
  sage,
  searchParams,
}: {
  sage: NonNullable<ReturnType<typeof getSage>>;
  searchParams: PageProps<"/z/[sage]">["searchParams"];
}) {
  const { id } = await searchParams;
  const shareVerseId = typeof id === "string" ? id : undefined;
  return <HallScreen sage={sage} shareVerseId={shareVerseId} />;
}
