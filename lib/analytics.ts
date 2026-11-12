"use client";

import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { getFirebaseApp } from "./firebase";

let analyticsPromise: Promise<Analytics | null> | null = null;

function ensureAnalytics(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      const app = getFirebaseApp();
      if (!app) return null;
      const supported = await isSupported().catch(() => false);
      if (!supported) return null;
      return getAnalytics(app);
    })();
  }
  return analyticsPromise;
}

export function track(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  ensureAnalytics()
    .then((analytics) => {
      if (analytics) {
        logEvent(analytics, name, props);
      } else {
        console.debug(`[track] ${name}`, props);
      }
    })
    .catch(() => {
      console.debug(`[track] ${name}`, props);
    });
}
