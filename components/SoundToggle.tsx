"use client";

import { useLocale } from "@/components/LocaleProvider";

import { usePlayStore } from "@/lib/store";
import { Icon } from "./Icon";

export function SoundToggle() {
  const { t } = useLocale();
  const soundOn = usePlayStore((s) => s.soundOn);
  const toggleSound = usePlayStore((s) => s.toggleSound);

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={soundOn ? t("목탁 소리 끄기") : t("목탁 소리 켜기")}
      aria-pressed={soundOn}
      className="text-lg leading-none"
    >
      <Icon name={soundOn ? "sound-on" : "sound-off"} />
    </button>
  );
}
