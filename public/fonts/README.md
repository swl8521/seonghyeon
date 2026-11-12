# Font assets

- Pretendard Regular: https://github.com/orioncactus/pretendard (SIL OFL 1.1). See Pretendard-LICENSE.txt. The UI uses official v1.3.9 unicode-range subsets from `pretendard-subset/`, vendored by `scripts/vendor-pretendard.mjs`. Only needed character groups download. Bold is synthesized by the browser.
- Pretendard is self-hosted without modification. Do not sell font files separately.
- Noto Serif KR is managed by next/font/google and covers both the Chinese original text and the Korean literary text. Google serves it as unicode-range subsets, so only the needed groups download and there is nothing to regenerate when content changes.

The webpage uses Noto Serif KR for literary text and Pretendard for controls and explanations. Maru Buri was used for literary text until it was dropped: it ships as a single 424 KiB file with no dynamic-subset distribution, and keeping it small meant regenerating a content-derived subset by hand. Generated share images retain their existing font setup.
