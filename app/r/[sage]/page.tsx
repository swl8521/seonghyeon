import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SAGES, getSage } from "@/lib/content";
import { ShareLandingTracker } from "@/components/ShareLandingTracker";
import type { SageId } from "@/lib/types";

export function generateStaticParams() {
  return SAGES.map((s) => ({ sage: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/r/[sage]">): Promise<Metadata> {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) return {};

  const title = `${sage.name} 문하 — 성현 문하`;
  return {
    title,
    description: sage.intro,
    openGraph: { title, description: sage.intro },
  };
}

export default async function ShareLandingPage({ params }: PageProps<"/r/[sage]">) {
  const { sage: sageParam } = await params;
  const sage = getSage(sageParam as SageId);
  if (!sage) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <ShareLandingTracker sage={sage.id} />
      <p className="font-serif text-2xl leading-relaxed text-foreground">
        친구는 {sage.name} 문하였습니다.
        <br />
        당신은?
      </p>
      <Link
        href="/play?fromShare=1"
        className="rounded-full bg-accent px-8 py-3 font-sans text-base text-accent-foreground"
      >
        나도 해보기
      </Link>
    </main>
  );
}
