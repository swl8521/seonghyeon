import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SAGES, VERSES, getSage, getVerse } from "@/lib/content";
import { ShareLandingTracker } from "@/components/ShareLandingTracker";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.flatMap((sage) =>
    VERSES.filter((v) => v.sage === sage.id).map((v) => ({ sage: sage.id, verseId: v.id }))
  );
}

function resolve(sageParam: string, verseIdParam: string) {
  const sage = getSage(sageParam as SageId);
  const verse = getVerse(verseIdParam);
  if (!sage || !verse || verse.sage !== sage.id) return null;
  return { sage, verse };
}

export async function generateMetadata({
  params,
}: PageProps<"/s/[sage]/[verseId]">): Promise<Metadata> {
  const { sage: sageParam, verseId } = await params;
  const resolved = resolve(sageParam, verseId);
  if (!resolved) return {};
  const { sage, verse } = resolved;

  const title = `${sage.name} 문하에 들었습니다 — 성현 문하`;
  const description = `${verse.translation} · ${verse.source}`.slice(0, 100);
  return { title, description, openGraph: { title, description } };
}

export default async function SageVerseSharePage({
  params,
}: PageProps<"/s/[sage]/[verseId]">) {
  const { sage: sageParam, verseId } = await params;
  const resolved = resolve(sageParam, verseId);
  if (!resolved) notFound();
  const { sage, verse } = resolved;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <ShareLandingTracker kind="sage_verse" sage={sage.id} verseId={verse.id} />
      <p className="font-serif text-xl leading-relaxed text-foreground">
        누군가 <strong>{sage.name}</strong> 문하에 들며 이 구절을 보냈습니다
      </p>

      <div className="w-full max-w-[320px] rounded-xl border border-border bg-card p-5 text-left">
        <p className="font-serif text-xl leading-snug tracking-wide">{verse.original}</p>
        <p className="mt-1 font-sans text-xs text-muted">{verse.reading}</p>
        <p className="mt-2 font-sans text-sm leading-relaxed">{verse.translation}</p>
        <p className="mt-3 border-t border-border pt-3 font-serif text-sm leading-relaxed text-muted">
          {verse.note}
        </p>
        <p className="mt-2 text-right text-xs text-muted">{verse.source}</p>
      </div>

      <Link
        href={`/z/${sage.id}?from=share&id=${verse.id}`}
        className="rounded-full bg-accent px-8 py-3 font-sans text-base text-accent-foreground"
      >
        법당에 들어가기
      </Link>
    </main>
  );
}
