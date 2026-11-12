import { expect, it } from "vitest";
import { localeHref, resolveLocale, translate, stageLabel } from "./locale";
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
