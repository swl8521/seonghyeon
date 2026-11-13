import { Suspense } from "react";
import { notFound } from "next/navigation";
import { COPY_VERSES } from "@/lib/content";
import { isLocale } from "@/lib/locale";
import { resolveShare, shareMetadata } from "@/lib/share";
import { ShareScreen } from "@/components/ShareScreen";

type Props = PageProps<"/s/[sage]/[verseId]">;
// 읽기 풀 전부를 미리 만들면 구절 수만큼 OG 이미지를 빌드해야 한다.
// 자주 공유되는 짧은 구절만 미리 만들고, 나머지는 요청 시 생성한다.
export function generateStaticParams() { return COPY_VERSES.map((v) => ({ sage: v.sage, verseId: v.id })); }
export async function generateMetadata({ params, searchParams }: Props) {
  const values = await params;
  const { lang } = await searchParams;
  return shareMetadata(values.verseId, isLocale(lang) ? lang : "ko", values.sage);
}
export default function Page(props: Props) {
  return <Suspense fallback={null}><ShareLoader {...props} /></Suspense>;
}
async function ShareLoader({ params, searchParams }: Props) {
  const values = await params;
  const { lang } = await searchParams;
  const locale = isLocale(lang) ? lang : "ko";
  const ko = resolveShare(values.verseId, "ko", values.sage);
  const en = resolveShare(values.verseId, "en", values.sage);
  if (!ko || !en) notFound();
  return <ShareScreen data={{ ko, en }} initialLocale={locale} sageId={values.sage} />;
}
