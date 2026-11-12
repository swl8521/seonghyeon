"use client";

// 정각 전환 때 쓰는 목탁 소리 "똑" — 파일 없이 Web Audio로 짧은 타격음을 만든다.
let ctx: AudioContext | null = null;
let bowlGain: GainNode | null = null;
let lastBowlAt = -Infinity;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx || ctx.state === "closed") ctx = new Ctor();
  return ctx;
}

export function stopSingingBowl(): void {
  if (!ctx || !bowlGain) return;
  const gain = bowlGain;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setTargetAtTime(0, now, 0.025);
  bowlGain = null;
}

/** Soft strike with inharmonic, gently beating partials; no sampled audio. */
export async function playSingingBowl(isEnabled: () => boolean = () => true): Promise<void> {
  try {
    const context = audioContext();
    if (!context || !isEnabled()) return;
    const clickedAt = performance.now();
    if (clickedAt - lastBowlAt < 800) return;
    lastBowlAt = clickedAt;
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running" || !isEnabled()) return;
    stopSingingBowl();
    const now = context.currentTime;
    const master = context.createGain();
    bowlGain = master;
    master.gain.value = 0.22;
    master.connect(context.destination);
    const partials = [
      [392, 0.46, 4.2], [393.4, 0.22, 3.8],
      [1062, 0.16, 2.8], [2070, 0.08, 1.8], [3470, 0.025, 0.9],
    ];
    let remaining = partials.length;
    for (const [frequency, level, decay] of partials) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(level, now + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      oscillator.connect(envelope).connect(master);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        if (--remaining === 0) {
          master.disconnect();
          if (bowlGain === master) bowlGain = null;
        }
      };
      oscillator.start(now);
      oscillator.stop(now + decay + 0.05);
    }
  } catch {
    // Audio unavailable or blocked: the bow action still works.
  }
}

export function playWoodenClack(): void {
  if (typeof window === "undefined") return;
  try {
    ctx = audioContext();
    if (!ctx || ctx.state !== "running") return;
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
