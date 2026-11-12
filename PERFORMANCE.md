# Mobile performance follow-up

Reported production Lighthouse baseline: performance 39, FCP 1.1s, LCP 22.2s, TBT 1110ms, CLS 0.153, transferred resources about 3942KiB. The supplied LCP detail identifies the live verse translation, with a 1470ms render delay; this does not by itself explain the full 22.2s result. A live verse replacement during the audit can change the LCP candidate.

Changes:

- Serve a 640px transparent WebP sprite (71,920 bytes) instead of the 1280px PNG (835,940 bytes). The sixteen-cell layout is unchanged; the source PNG remains for asset regeneration.
- Use Pretendard Regular (765,892 bytes) rather than the full variable font (2,057,688 bytes). Browser-synthesized bold is intentional.
- Avoid preloading full font files and use optional font display to avoid late font swaps shifting visible content. Slow first visits may use fallback fonts; cached visits use downloaded fonts.
- Load Firebase Analytics dynamically during an idle period, keeping pending events on the shared initialization promise.
- Reserve a larger live-card loading area and replace the continuously repainted shadow animation with a static glow.

After an explicitly requested deployment, rerun Lighthouse mobile in an extension-free incognito window three times. Compare the median and individual LCP, TBT, CLS, and resource requests. Check first-visit font appearance, long Korean/English verses, live minute changes, offline fallback, and GA4 DebugView. No new production score has been measured yet; 90+ is not claimed.
