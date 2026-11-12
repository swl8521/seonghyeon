# Local share-preview font

`og-noto-serif-kr.ttf` is a Google Fonts subset of Noto Serif KR Regular covering the current Korean/English content and root preview text. Distributed under SIL OFL 1.1; see `NotoSerif-LICENSE.txt`.

Regenerate after content changes using `node scripts/vendor-og-font.mjs`. This maintenance command requires network access; production image rendering reads the checked-in TTF and makes no Google Fonts request. Both root and per-verse previews use this asset.

Source family: https://fonts.google.com/noto/specimen/Noto+Serif+KR
Upstream license: https://github.com/notofonts/noto-cjk/blob/main/Serif/LICENSE
