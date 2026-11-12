"use client";

import { useRef, useState } from "react";
import { usePlayStore } from "@/lib/store";
import { localizedVerse } from "@/lib/localized-content";
import { matchesCopy, normalizeCopy } from "@/lib/promotion";
import { stageLabel } from "@/lib/locale";
import { useLocale } from "./LocaleProvider";
import type { SageId, Stage } from "@/lib/types";
import { MonkeyCharacter } from "./MonkeyCharacter";

export function PromotionPractice({ sage }: { sage: SageId }) {
  const { locale, t } = useLocale();
  const challenge = usePlayStore((state) => state.promotions[sage]);
  const updateDraft = usePlayStore((state) => state.updatePromotionDraft);
  const submit = usePlayStore((state) => state.submitPromotion);
  const [open, setOpen] = useState(false);
  const [wordMode, setWordMode] = useState(false);
  const [celebration, setCelebration] = useState<Stage | null>(null);
  const composing = useRef(false);
  const [isComposing, setIsComposing] = useState(false);
  if (!challenge) return celebration ? <div className="mt-4 flex flex-col items-center gap-2" role="status"><MonkeyCharacter pose="cheer" size={88} /><p className="text-sm">{t("{stage} 단계로 자랐어요!", { stage: stageLabel(celebration, locale) })}</p></div> : null;
  const challengeLocale = challenge.locale ?? "ko";
  const verse = localizedVerse(challenge.verseIds[challenge.index], challengeLocale);
  if (!verse) return null;
  const correct = matchesCopy(challenge.draft, verse.translation, challengeLocale);
  const typed = Array.from(normalizeCopy(challenge.draft, challengeLocale));
  const expected = Array.from(normalizeCopy(verse.translation, challengeLocale));
  const mismatch = !expected.join("").startsWith(typed.join(""));
  const firstMismatch = typed.findIndex((letter, index) => letter !== expected[index]);
  const words = verse.translation.split(/\s+/);
  const order = words.map((_, index) => index).reverse();
  const selected = challenge.draft.trim() ? challenge.draft.trim().split(/\s+/) : [];
  const used = new Set<number>();
  for (const word of selected) {
    const index = words.findIndex((candidate, index) => candidate === word && !used.has(index));
    if (index >= 0) used.add(index);
  }
  return (
    <section className="mt-4 border-t border-border pt-4">
      {celebration && <div className="flex items-center gap-2" role="status"><MonkeyCharacter pose="cheer" size={64} /><p className="text-sm">{t("{stage} 단계로 자랐어요!", { stage: stageLabel(celebration, locale) })}</p></div>}
      <p className="font-sans text-sm">{t("{stage}로 자랄 준비가 됐어요!", { stage: stageLabel(challenge.target, locale) })}</p>
      <p className="mt-1 text-xs text-muted">{t("좋아한 구절부터 짧은 번역 {total}개를 따라 써요. {done}/{total}개 완료", { total: challenge.verseIds.length, done: challenge.index })}</p>
      {challengeLocale !== locale && <p className="mt-2 text-xs text-muted">{t("이 과제는 {language}로 시작했어요. 끝날 때까지 같은 언어로 이어집니다.", { language: t(challengeLocale === "ko" ? "한국어" : "영어") })}</p>}
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-3 rounded-full bg-accent px-4 py-2 text-sm text-accent-foreground">{t(challenge.index || challenge.draft ? "따라쓰기 이어하기" : "따라쓰기 시작")}</button>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex justify-center"><MonkeyCharacter pose="read" size={64} /></div>
          <p className="text-xs text-muted">{challenge.index + 1} / {challenge.verseIds.length} · {verse.source}</p>
          <blockquote lang={challengeLocale} className="rounded-lg bg-background p-3 font-serif text-base leading-relaxed">{verse.translation}</blockquote>
          <button type="button" className="text-left text-xs text-muted underline" onClick={() => { setWordMode(!wordMode); updateDraft(sage, ""); }}>{t(wordMode ? "직접 입력하기" : "타자가 어렵다면 단어 선택하기")}</button>
          {wordMode ? (
            <>
              <p className="min-h-16 rounded-lg border border-border p-3 text-sm" aria-live="polite">{challenge.draft || t("아래 단어를 문장 순서대로 눌러 주세요.")}</p>
              <div className="flex flex-wrap gap-2">{order.map((index) => <button key={index} type="button" disabled={used.has(index)} onClick={() => updateDraft(sage, [...selected, words[index]].join(" "))} className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-30">{words[index]}</button>)}</div>
              <button type="button" onClick={() => updateDraft(sage, selected.slice(0, -1).join(" "))} className="text-left text-xs underline">{t("마지막 단어 지우기")}</button>
            </>
          ) : (
            <label className="text-sm">{t("위 문장을 따라 써 주세요")}
              <textarea lang={challengeLocale} autoCapitalize="off" autoCorrect="off" spellCheck={false} value={challenge.draft} onChange={(event) => updateDraft(sage, event.target.value)} onCompositionStart={() => { composing.current = true; setIsComposing(true); }} onCompositionEnd={(event) => { composing.current = false; setIsComposing(false); updateDraft(sage, event.currentTarget.value); }} rows={3} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-base text-foreground" />
            </label>
          )}
          {!isComposing && mismatch && <p className="break-all rounded-lg border border-border p-2 text-sm" aria-label={t("입력한 글자 확인")}>{typed.map((letter, index) => letter === expected[index] ? <span key={index}>{letter}</span> : <mark key={index} className="bg-amber-200 text-black underline">{letter}</mark>)}</p>}
          <p className="text-xs text-muted" role="status">{!isComposing && challenge.draft ? correct ? t("잘 썼어요! 완료 버튼을 눌러 주세요.") : mismatch ? t("{position}번째 글자를 확인해 주세요.", { position: firstMismatch + 1 }) + (expected[firstMismatch] ? t(" ‘{letter}’ 글자가 들어갈 자리예요.", { letter: expected[firstMismatch] }) : t(" 문장 끝에 글자가 더 있어요.")) : t("잘 쓰고 있어요.") : t("시간제한은 없어요. 띄어쓰기와 문장부호는 달라도 괜찮아요.")}</p>
          <button type="button" disabled={!correct || isComposing} onClick={() => { if (!composing.current && submit(sage) && challenge.index + 1 === challenge.verseIds.length) setCelebration(challenge.target); }} className="rounded-full bg-accent px-4 py-3 text-sm text-accent-foreground disabled:opacity-40">{t(challenge.index + 1 === challenge.verseIds.length ? "완료하고 성장하기" : "완료하고 다음 구절")}</button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted underline">{t("나중에 하기 · 지금까지 쓴 내용은 저장돼요")}</button>
        </div>
      )}
    </section>
  );
}
