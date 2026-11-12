"use client";

import { useLocale } from "@/components/LocaleProvider";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface MoreTalkSheetProps {
  open: boolean;
  optedIn: boolean;
  onOptIn: () => void;
  onClose: () => void;
}

export function MoreTalkSheet({ open, optedIn, onOptIn, onClose }: MoreTalkSheetProps) {
  const { t } = useLocale();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40"
        >
          <motion.div
            initial={{ y: shouldReduceMotion ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: shouldReduceMotion ? 0 : "100%" }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-t-2xl border border-border bg-card p-6"
          >
            {optedIn ? (
              <p className="text-center font-serif text-lg leading-relaxed">
                {t("관심을 남겨 주셔서 고마워요.")}
              </p>
            ) : (
              <>
                <p className="text-center font-serif text-lg leading-relaxed">
                  {t("읽다가 궁금한 걸 성현께 직접 여쭙는 기능을 준비 중입니다.")}
                  <br />
                  {t("열리면 가장 먼저 알려드릴까요?")}
                </p>
                <button
                  type="button"
                  onClick={onOptIn}
                  className="mt-6 w-full rounded-full bg-accent py-3 font-sans text-sm text-accent-foreground"
                >
                  {t("알림 받기")}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full rounded-full border border-border py-3 font-sans text-sm text-foreground"
            >
              {t("닫기")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
