import { Suspense } from "react";
import { SquareScreen } from "@/components/SquareScreen";

export default function SquarePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={null}>
      <SquareScreenLoader searchParams={searchParams} />
    </Suspense>
  );
}

async function SquareScreenLoader({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const { id } = await searchParams;
  const shareVerseId = typeof id === "string" ? id : undefined;
  return <SquareScreen shareVerseId={shareVerseId} />;
}
