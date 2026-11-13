import { expect, it } from "vitest";
import { resolveShare, shareMetadata } from "./share";
it("renders the requested locale and rejects a quote from another sage", () => {
  expect(resolveShare("laozi-03", "en", "confucius")).toBeNull();
  expect(resolveShare("missing", "en")).toBeNull();
  expect(resolveShare("laozi-03", "en")?.sage.name).toBe("Laozi");
  expect(resolveShare("laozi-03", "en")?.verse.translation).toBe("The highest goodness is like water.");
});
it("carries locale into metadata, canonical links and image URLs", () => {
  const metadata = shareMetadata("laozi-03", "en", "laozi");
  expect(metadata.title).toBe("A quote from reading with Laozi");
  expect(metadata.description).not.toMatch(/[가-힣]/);
  expect(metadata.alternates?.canonical).toBe("/s/laozi/laozi-03?lang=en");
  expect(metadata.openGraph?.images).toEqual([{ url: "/s/laozi/laozi-03/opengraph-image?lang=en", width: 1200, height: 630, alt: metadata.title }]);
  expect(shareMetadata("laozi-03", "ko").title).toBe("CommonLeaf");
});
