import type { SVGProps } from "react";

type IconName = "sound-on" | "sound-off" | "collection" | "bow" | "back" | "close" | "star" | "globe";

/** Code-owned SVG artwork: independent of installed emoji and symbol fonts. */
export function Icon({ name, filled = false, ...props }: SVGProps<SVGSVGElement> & { name: IconName; filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {name === "back" && <path d="m10 5-7 7 7 7M3 12h18" />}
      {name === "close" && <path d="m6 6 12 12M18 6 6 18" />}
      {name === "globe" && <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>}
      {(name === "sound-on" || name === "sound-off") && <>
        <path d="M11 4 5 9H2v6h3l6 5Z" />
        {name === "sound-on" ? <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}
      </>}
      {name === "collection" && <><path d="M4 4h6a3 3 0 0 1 3 3v14a5 5 0 0 0-4-2H4Zm16 0h-4a3 3 0 0 0-3 3v14a5 5 0 0 1 4-2h3Z" /><path d="M7 8h2M7 12h2m7-4h1m-1 4h1" /></>}
      {name === "bow" && <><path d="M12 3v13m0-13c-2 0-2 3-3 6l-3 5 4 4 2-2m0-13c2 0 2 3 3 6l3 5-4 4-2-2M6 14l-4 4 4 4 4-4m8-4 4 4-4 4-4-4" /></>}
      {name === "star" && <path fill={filled ? "currentColor" : "none"} d="m12 3 2.8 5.7 6.3.9-4.6 4.4 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.6l6.3-.9Z" />}
    </svg>
  );
}
