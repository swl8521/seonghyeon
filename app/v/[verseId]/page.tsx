import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VERSES, getVerse } from "@/lib/content";
import { ShareLandingTracker } from "@/components/ShareLandingTracker";

export function generateStaticParams() {
  return VERSES.map((v) => ({ verseId: v.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/v/[verseId]">): Promise<Metadata> {
  const { verseId } = await params;
  const verse = getVerse(verseId);
  if (!verse) return {};

  const title = "성현 문하";
  const description = `${verse.translation} · ${verse.source}`.slice(0, 100);
  return { title, description, openGraph: { title, description } };
}

export default async function VerseSharePage({ params }: PageProps<"/v/[verseId]">) {
  const { verseId } = await params;
  const verse = getVerse(verseId);
  if (!verse) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <ShareLandingTracker kind="verse" verseId={verse.id} />
      <p className="font-serif text-xl leading-relaxed text-foreground">
        누군가 이 구절을 보냈습니다
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
        href={`/?from=share&id=${verse.id}`}
        className="rounded-full bg-accent px-8 py-3 font-sans text-base text-accent-foreground"
      >
        법당에 들어가기
      </Link>
    </main>
  );
}
