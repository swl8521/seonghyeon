import { expect, it } from "vitest";
import { pageTitle } from "./page-title";

it("keeps context in localized page and shared quote titles", () => {
  expect(pageTitle("/s/laozi/laozi-03", "en")).toBe("A quote from reading with Laozi — CommonLeaf");
  expect(pageTitle("/inventory", "en")).toBe("Saved quotes — CommonLeaf");
  expect(pageTitle("/privacy", "en")).toBe("Privacy — CommonLeaf");
  expect(pageTitle("/z/confucius/practice", "ko")).toBe("공자의 배움터 — CommonLeaf");
  expect(pageTitle("/", "en")).toBe("CommonLeaf");
});
