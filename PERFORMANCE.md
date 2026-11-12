# Mobile performance follow-up

## Where this landed

Measured on the production deployment at `https://munha.yeoul.dev`, Lighthouse
13.6.0 mobile, emulated Moto G Power on slow 4G. Three consecutive runs scored
**86, 86, 87**. The last of those:

| Metric | Value |
|---|---|
| First Contentful Paint | 1.1 s |
| Largest Contentful Paint | 4.1 s |
| Total Blocking Time | 50 ms |
| Cumulative Layout Shift | 0 |
| Speed Index | 2.1 s |

Against the original baseline of performance 39, FCP 1.1 s, LCP 22.2 s, TBT
1110 ms, CLS 0.153 and about 3942 KiB transferred. LCP, TBT and CLS score at or
near full marks now; the whole remaining gap sits in LCP.

90 is not claimed. The runs settled at 86-87 and stopped improving, and the
reasons are recorded under "Dead ends" below so the same ground isn't covered
twice.

## What changed

Earlier round, before the production move:

- Serve a 640px transparent WebP sprite (71,920 bytes) instead of the 1280px PNG
  (835,940 bytes). The sixteen-cell layout is unchanged; the source PNG remains
  for asset regeneration.
- Use Pretendard's official unicode-range subsets rather than the full variable
  font (2,057,688 bytes). Browser-synthesized bold is intentional.
- Avoid preloading full font files and use `font-display: optional` to avoid late
  font swaps shifting visible content. Slow first visits use fallback fonts;
  cached visits use downloaded fonts.
- Load Firebase Analytics dynamically during an idle period, keeping pending
  events on the shared initialization promise.
- Reserve a larger live-card loading area and replace the continuously repainted
  shadow animation with a static glow.

This round:

- Moved off Vercel to the self-hosted pair behind Cloudflare Tunnel (see
  `server/SELF_HOSTING.md`). TTFB for the LCP element is now 10 ms.
- Render the current verse on the Next.js server per request, behind
  `connection()` and a `<Suspense>` boundary, so the verse arrives inside the
  initial HTML instead of waiting on hydration and a socket round trip. The
  live socket still owns every later update.
- Hand the countdown ring to a CSS animation driven by a negative
  `animation-delay`, and drop the live tick from 250 ms to 1 s. The ring and
  clock never stop moving, so the old tick re-rendered every subscriber of the
  live snapshot four times a second. Speed Index fell from 5.2 s to 1.3-2.1 s.
- Dropped Maru Buri and draw the literary text with Noto Serif KR, which
  `next/font/google` already served for the hanja. Removed 424 KiB from the
  first visit at no visual cost to first-time visitors, who never saw Maru Buri
  anyway: `font-display: optional` gives a cold cache no time to fetch it.

## Dead ends

Recorded because each one looks attractive from the audit output and none of
them works here.

- **A 97 that meant the opposite.** An earlier Vercel deployment scored 97 while
  serving a page whose verse never arrived: the route prerendered, Vercel served
  it with `x-nextjs-stale-time: 300`, and the verse-less HTML got cached. LCP
  landed on a small early element. Any score measured on this app has to be read
  together with proof that the verse is actually in the HTML. `curl` the page and
  grep for the translation text.
- **`export const instant = false` does not make a route render per request.**
  In this Next version it is a navigation-validation config only. Per-request
  rendering comes from `connection()` inside a `<Suspense>` boundary.
- **The font stylesheets cannot be deferred.** They are pure `@font-face` blocks
  with `font-display: optional`, whose swap period is 0 s. A stylesheet that
  arrives after first paint leaves the font in the failure period, so it is never
  applied - not on that visit and not on later cached ones. Deferring them
  deletes the fonts while still paying for the bytes.
- **`@import` does not merge the two blocking stylesheets.** Turbopack keeps the
  imported file as its own chunk. The two also load in parallel (679 ms and
  661 ms in the trace), so merging them would buy a connection slot, not a round
  trip.
- **Unicode-range splitting does not pay off for a Korean font.** Splitting Maru
  Buri into 92 chunks the way Pretendard is split made the homepage want twenty
  of them, 290 KiB in twenty requests, because one Korean sentence reaches
  syllables scattered across the whole Hangul block. A content-derived subset got
  the same font to 85,688 bytes in one request - but it had to be regenerated
  whenever `content/` changed, which is why the font was dropped instead.

## What is left, and what it is worth

- **Render-blocking CSS, about 430 ms.** This is the only remaining lever on LCP.
  The Tailwind chunk cannot go, and the font chunk cannot be deferred (above).
  Dropping Pretendard for a system stack would remove a blocking request and
  about 135 KiB, for an estimated 100-200 ms - not judged worth the UI's
  appearance.
- **Legacy JavaScript, 24 KiB.** Polyfills for `Array.prototype.at/flat/flatMap`,
  `Object.fromEntries/hasOwn` and `String.prototype.trimStart/trimEnd`. A modern
  `browserslist` in `package.json` removes them. Cheap, worth about a point.
- **Cache lifetimes, 137 KiB.** `/characters/*` and `/fonts/*` sit at
  Cloudflare's default 4 hours. A `headers()` entry in `next.config.ts` can make
  them immutable for a year. This does not move the score at all, since
  Lighthouse measures a cold load; it only helps repeat visits.
- **Unused CSS, 39 KiB.** Mostly Tailwind. Fiddly, worth about a point.
- **Cloudflare Web Analytics beacon.** `beacon.min.js` into `/cdn-cgi/rum` adds a
  third-party chain the page does not need, since GA4 is already in use. It is
  turned off in the Cloudflare dashboard, not in this repo.

## Measurement notes

LCP is the noisy one. The verse replaces itself every 60 seconds with an enter
animation, so a replacement during the trace re-targets the LCP candidate. In
the run detailed above, the LCP subparts (10 ms TTFB plus 1,390 ms element render
delay, with no resource-load phase, on the `font-serif` translation paragraph)
add up to about 1.4 s and do not reconcile with the 4.1 s headline, which points
at a later repaint of the same element.

Rerun Lighthouse mobile in an extension-free incognito window three times and
compare the median and the individual LCP values rather than trusting one run.

## Still unverified

Functional checks have not been run against this deployment: KakaoTalk sharing,
send, the live verse changing on the minute, shared bows and the singing bowl,
Korean/English switching, the Samsung Internet layout, and GA4 DebugView. The
build warns that the `@firebase/*` packages want Node >= 24.12.0 while the server
runs 22.23.5; if analytics turn out empty, start there.
