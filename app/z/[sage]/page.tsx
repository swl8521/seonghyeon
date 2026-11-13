import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { HallScreen } from "@/components/HallScreen";
import type { SageId } from "@/lib/types";
import { getInitialVerse } from "@/lib/live-server";
import type { Sage } from "@/lib/types";
import { Suspense } from "react";
import { sageContentPayload } from "@/lib/content-payload";

type Params = PageProps<"/z/[sage]">["params"];

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

async function CurrentHall({ sage }: { sage: Sage }) {
  const initialVerse = await getInitialVerse(sage.id);
  return <HallScreen sage={sage} initialVerse={initialVerse} content={sageContentPayload(sage.id)} />;
}

/**
 * params 를 여기서 await 한다. 페이지 본체에서 await 하면 URL 데이터를
 * <Suspense> 밖에서 읽는 셈이라 구역 사이 이동이 즉시 일어나지 못한다
 * (Cache Components 검증이 blocking-route 로 잡는다).
 */
async function Hall({ params }: { params: Params }) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  // 안쪽 경계: 지금 구절은 요청마다 달라지므로 구절 없는 화면을 먼저 보여준다.
  return (
    <Suspense fallback={<HallScreen sage={sage} initialVerse={null} content={sageContentPayload(sage.id)} />}>
      <CurrentHall sage={sage} />
    </Suspense>
  );
}

// 광장과 같은 이유로 정적 셸을 유지한다 (app/page.tsx 주석 참고).
export default function HallPage(props: PageProps<"/z/[sage]">) {
  return (
    <Suspense fallback={null}>
      <Hall params={props.params} />
    </Suspense>
  );
}
