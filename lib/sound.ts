"use client";

// 정각 전환 때 쓰는 목탁 소리 "똑" — 파일 없이 Web Audio로 짧은 타격음을 만든다.
let ctx: AudioContext | null = null;

export function playWoodenClack(): void {
  if (typeof window === "undefined") return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    const t0 = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1100, t0);
    osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.08);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  } catch {
    // 오디오 컨텍스트를 못 만들면 조용히 무시한다 — 소리는 부가 기능일 뿐이다.
  }
}
