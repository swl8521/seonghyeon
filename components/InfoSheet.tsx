"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

interface InfoSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function InfoSheet({ open, onClose, children }: InfoSheetProps) {
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
            {children}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full border border-border py-3 font-sans text-sm text-foreground"
            >
              닫기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
