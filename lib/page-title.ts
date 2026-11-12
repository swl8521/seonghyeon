import { localizedSage } from "./localized-content";
import { translate, type Locale } from "./locale";
import type { SageId } from "./types";

export function pageTitle(pathname: string, locale: Locale): string {
  const brand = translate(locale, "성현 문하");
  let label = "";
  if (pathname === "/privacy") label = translate(locale, "개인정보처리방침");
  if (pathname === "/inventory") label = translate(locale, "모아둔 구절");
  const match = pathname.match(/^\/(z|s)\/(confucius|laozi|sunzi)(?:\/|$)/);
  if (match) {
    const sage = localizedSage(match[2] as SageId, locale)!;
    label = match[1] === "s"
      ? translate(locale, "{name}와 함께 읽은 구절", { name: sage.name })
      : sage.hall;
  }
  return label ? `${label} — ${brand}` : brand;
}
