import { Suspense } from "react";
import { notFound } from "next/navigation";
import { VERSES } from "@/lib/content";
import { isLocale } from "@/lib/locale";
import { resolveShare, shareMetadata } from "@/lib/share";
import { ShareScreen } from "@/components/ShareScreen";

type Props = PageProps<"/s/[sage]/[verseId]">;
export function generateStaticParams() { return VERSES.map((v) => ({ sage: v.sage, verseId: v.id })); }
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
