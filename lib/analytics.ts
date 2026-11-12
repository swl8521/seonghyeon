"use client";

import type { Analytics } from "firebase/analytics";
import { analyticsPayload, validEventName } from "./analytics-payload";

let analyticsPromise: Promise<Analytics | null> | null = null;

function ensureAnalytics(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = (async () => {
      // Keep Firebase out of the initial interactive bundle. Calls still queue
      // on this shared promise while the SDK loads.
      //
      // gtag.js는 150KB가 넘어서, 초기 렌더가 끝나기 전에 받기 시작하면 느린
      // 기기에서 첫 화면 그리기와 메인 스레드를 두고 경쟁한다. load 이후의
      // 유휴 시간까지 기다린다. 그 사이 발생한 이벤트는 이 프로미스에 큐로
      // 쌓였다가 그대로 전송되므로 유실되지 않는다.
      await new Promise<void>((resolve) => {
        const whenIdle = () => {
          if ("requestIdleCallback" in window) {
            window.requestIdleCallback(() => resolve(), { timeout: 2000 });
          } else {
            setTimeout(resolve, 1000);
          }
        };
        if (document.readyState === "complete") whenIdle();
        else window.addEventListener("load", whenIdle, { once: true });
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
