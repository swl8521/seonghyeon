"use client";

import { usePlayStore } from "@/lib/store";

export function SoundToggle() {
  const soundOn = usePlayStore((s) => s.soundOn);
  const toggleSound = usePlayStore((s) => s.toggleSound);

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={soundOn ? "목탁 소리 끄기" : "목탁 소리 켜기"}
      className="text-lg leading-none"
    >
      {soundOn ? "🔊" : "🔈"}
    </button>
  );
}
