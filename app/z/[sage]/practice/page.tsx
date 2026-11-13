import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { PracticeScreen } from "@/components/PracticeScreen";
import type { SageId } from "@/lib/types";
import { sageContentPayload } from "@/lib/content-payload";

type Params = PageProps<"/z/[sage]/practice">["params"];

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

// params 는 <Suspense> 안쪽에서 await 한다 (app/z/[sage]/page.tsx 주석 참고).
async function Practice({ params }: { params: Params }) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return <PracticeScreen sage={sage} content={sageContentPayload(sage.id)} />;
}

export default function PracticePage(props: PageProps<"/z/[sage]/practice">) {
  return (
    <Suspense fallback={null}>
      <Practice params={props.params} />
    </Suspense>
  );
}
