"use client";

import { getAnalytics, isSupported, logEvent, setUserProperties, type Analytics } from "firebase/analytics";
import { analyticsPayload, validEventName } from "./analytics-payload";
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

function isDebugMode(): boolean {
  if (window.location.hostname === "localhost") return true;
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

export function track(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !validEventName(name)) return;

  const payload = analyticsPayload(isDebugMode() ? { debug_mode: 1, ...props } : props);

  ensureAnalytics()
    .then((analytics) => {
      if (analytics) {
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
  void ensureAnalytics().then((analytics) => {
    if (analytics) setUserProperties(analytics, props);
  }).catch(() => {});
}
