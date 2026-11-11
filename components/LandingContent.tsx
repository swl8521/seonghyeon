"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { SAGES } from "@/lib/content";
import { SAGE_BORDER_CLASS } from "@/lib/sageColors";

export function LandingContent() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    track("landing_view", { ref: params.get("ref") ?? undefined });
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <p className="font-serif text-2xl leading-relaxed text-foreground">
        구절을 고르면,
        <br />
        성현이 당신을 고릅니다.
      </p>

      <div className="flex items-start gap-6">
        {SAGES.map((sage) => (
          <div key={sage.id} className="flex flex-col items-center gap-2">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${SAGE_BORDER_CLASS[sage.id]} bg-card font-serif text-2xl text-foreground`}
            >
              {sage.hanja[0]}
            </div>
            <span className="font-sans text-xs text-muted">{sage.name}</span>
          </div>
        ))}
      </div>

      <Link
        href="/play"
        className="rounded-full bg-accent px-8 py-3 font-sans text-base text-accent-foreground"
      >
        시작하기
      </Link>
    </main>
  );
}
