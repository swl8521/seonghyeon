import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { ResultScreen } from "@/components/ResultScreen";
import type { SageId } from "@/lib/types";
import { sageContentPayload } from "@/lib/content-payload";

type Params = PageProps<"/z/[sage]/result">["params"];

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

// params 는 <Suspense> 안쪽에서 await 한다 (app/z/[sage]/page.tsx 주석 참고).
async function Result({ params }: { params: Params }) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return <ResultScreen sage={sage} content={sageContentPayload(sage.id)} />;
}

export default function ResultPage(props: PageProps<"/z/[sage]/result">) {
  return (
    <Suspense fallback={null}>
      <Result params={props.params} />
    </Suspense>
  );
}
