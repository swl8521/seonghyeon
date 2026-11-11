"use client";

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

function ensureInit(): boolean {
  if (!POSTHOG_KEY || typeof window === "undefined") return false;
  if (!initialized) {
    try {
      posthog.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, capture_pageview: false });
      initialized = true;
    } catch {
      return false;
    }
  }
  return true;
}

export function track(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  if (ensureInit()) {
    try {
      posthog.capture(name, props);
      return;
    } catch {
      // PostHog 캡처가 실패해도 콘솔 기록으로 폴백한다
    }
  }

  console.debug(`[track] ${name}`, props);
}
