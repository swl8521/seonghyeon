import { afterEach, expect, it, vi } from "vitest";
import { activeLocale, localeHref, resolveLocale, translate, stageLabel } from "./locale";
afterEach(() => vi.unstubAllGlobals());
it("reads the current query on each redirect even if the pathname is unchanged", () => {
  const location = { search: "?lang=en" };
  vi.stubGlobal("window", { location });
  vi.stubGlobal("localStorage", { getItem: () => "ko" });
  vi.stubGlobal("navigator", { languages: ["ko-KR"] });
  expect(localeHref("/z/laozi/result", activeLocale())).toBe("/z/laozi/result?lang=en");
  location.search = "?lang=ko";
  expect(activeLocale()).toBe("ko");
  location.search = "?lang=en";
  expect(activeLocale()).toBe("en");
});
it("still follows browser language when preference storage is blocked", () => {
  vi.stubGlobal("window", { location: { search: "" } });
  vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); } });
  vi.stubGlobal("navigator", { languages: ["en-GB"] });
  expect(activeLocale()).toBe("en");
});
it("prioritizes explicit links, stored preference and supported browser languages", () => {
  expect(resolveLocale("en", "ko", ["ko-KR"])).toBe("en");
  expect(resolveLocale(null, "en", ["ko"])).toBe("en");
  expect(resolveLocale(null, null, ["fr-FR", "ko-KR", "en"])).toBe("ko");
  expect(resolveLocale("invalid", null, ["fr"])).toBe("en");
});
it("preserves query and hash without changing external addresses", () => {
  expect(localeHref("/z/laozi?shareId=x#copy", "en")).toBe("/z/laozi?shareId=x&lang=en#copy");
  expect(localeHref("/?lang=ko", "en")).toBe("/?lang=en");
  expect(localeHref("https://example.com", "en")).toBe("https://example.com");
  expect(localeHref("//example.com", "en")).toBe("//example.com");
});
it("interpolates translated messages and keeps internal growth keys", () => {
  expect(translate("en", "지금 {count}명", { count: 3 })).toBe("3 here now");
  expect(stageLabel("senior", "en")).toBe("Ancient Tree");
});
