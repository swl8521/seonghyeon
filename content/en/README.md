# Korean and English localization

English quote renderings and notes are newly written from the supplied classical text, with the Korean content as context. They are not copied from a modern published translation. English teacher lines are fictional character dialogue, not historical quotations.

All English content is an editorial draft. The `reviewed: false` status is preserved; fluent English and classical-text review is required before promoting it as a verified translation. Check especially interpretive readings in Analects 2, Dao De Jing 41 (大器晚成), and the military context of The Art of War. The English note on confucius-09 identifies Zengzi as the speaker.

Use stable quote IDs across languages. Never translate IDs, sage keys, stage keys or analytical event names. Adding a language must not reset saved reading records or growth.

Language URLs use `?lang=ko` and `?lang=en`. Explicit links take precedence over saved preference, then supported browser languages. Unsupported browser languages fall back to English. The selector saves a separate local preference.

Translation QA: all 3 sages, 60 quote IDs, 72 dialogue IDs, source book/chapter, original text preservation, consistent labels, short mobile buttons, and complete share metadata/image text. Test a partially completed copying challenge through reload and language switching.

Verification completed: 38 unit tests, 8 live-server tests, ESLint, Korean/English content coverage and placeholder checks, and production build. Local production HTTP checks confirmed Korean/English share pages and locale-specific OG URLs. English and Korean OG images rendered at 1200×630; English story downloads rendered at 1080×1920. The longest English quote's OG/story layouts were visually inspected. Interactive mobile/IME flows and third-party KakaoTalk/Instagram crawlers still need user testing.

Language selection and UI switching happen after client hydration on ordinary pages. Share pages render the explicitly requested language on the server for crawlers. Language subpaths and fully localized search-engine landing pages are outside this initial implementation.
