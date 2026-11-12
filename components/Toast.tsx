"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "./LocaleProvider";
import { localizedClientLineByKoreanText } from "@/lib/client-content";

const TOAST_DURATION_MS = 2500;

interface ToastProps {
  text: string;
  onDone: () => void;
}

export function Toast({ text, onDone }: ToastProps) {
  const { locale, t } = useLocale();
  const localized = localizedClientLineByKoreanText(text, locale);
  const message = localized === text ? t(text) : localized;
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(onDone, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-6"
    >
      <div className="max-w-[320px] rounded-full bg-foreground px-4 py-2 text-center text-sm text-background shadow-lg">
        {message}
      </div>
    </motion.div>
  );
}
