"use client";

import type { Analytics } from "firebase/analytics";
import { analyticsPayload, validEventName } from "./analytics-payload";

let analyticsPromise: Promise<Analytics | null> | null = null;

function ensureAnalytics(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      // Keep Firebase out of the initial interactive bundle. Calls still queue
      // on this shared promise while the SDK loads.
      await new Promise<void>((resolve) => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => resolve(), { timeout: 2000 });
        } else {
          setTimeout(resolve, 1000);
        }
      });
      const [{ getAnalytics, isSupported }, { getFirebaseApp }] = await Promise.all([
        import("firebase/analytics"), import("./firebase"),
      ]);
      const app = getFirebaseApp();
      if (!app) return null;
      const supported = await isSupported().catch(() => false);
      if (!supported) return null;
      return getAnalytics(app);
    })();
  }
  return analyticsPromise;
}

function isDebugMode(): boolean {
  if (window.location.hostname === "localhost") return true;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

export function track(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !validEventName(name)) return;

  const payload = analyticsPayload(isDebugMode() ? { debug_mode: 1, ...props } : props);

  ensureAnalytics()
    .then(async (analytics) => {
      if (analytics) {
        const { logEvent } = await import("firebase/analytics");
        logEvent(analytics, name, payload);
      } else {
        console.debug(`[track] ${name}`, payload);
      }
    })
    .catch(() => {
      console.debug(`[track] ${name}`, payload);
    });
}

export function updateGrowthProperties(props: { top_stage: string; read_count: number; inventory_count: number }): void {
  if (typeof window === "undefined") return;
  void ensureAnalytics().then(async (analytics) => {
    if (analytics) {
      const { setUserProperties } = await import("firebase/analytics");
      setUserProperties(analytics, props);
    }
  }).catch(() => {});
}
