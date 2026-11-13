import { BRAND } from "./constants";
import { translate, type Locale } from "./locale";
import type { SageId } from "./types";

const sageLabels: Record<Locale, Record<SageId, { name: string; hall: string }>> = {
  ko: {
    confucius: { name: "공자", hall: "공자의 배움터" },
    laozi: { name: "노자", hall: "노자의 배움터" },
    sunzi: { name: "손자", hall: "손자의 배움터" },
  },
  en: {
    confucius: { name: "Confucius", hall: "Learn with Confucius" },
    laozi: { name: "Laozi", hall: "Learn with Laozi" },
    sunzi: { name: "Sun Tzu", hall: "Learn with Sun Tzu" },
  },
};

export function pageTitle(pathname: string, locale: Locale): string {
  const brand = BRAND;
  let label = "";
  if (pathname === "/privacy") label = translate(locale, "개인정보처리방침");
  if (pathname === "/inventory") label = translate(locale, "모아둔 구절");
  const match = pathname.match(/^\/(z|s)\/(confucius|laozi|sunzi)(?:\/|$)/);
  if (match) {
    const sage = sageLabels[locale][match[2] as SageId];
    label = match[1] === "s"
      ? translate(locale, "{name}와 함께 읽은 구절", { name: sage.name })
      : sage.hall;
  }
  return label ? `${label} — ${brand}` : brand;
}
