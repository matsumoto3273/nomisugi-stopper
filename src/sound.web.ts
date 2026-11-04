// Web版の効果音。src/soundSpec.json の設計図からその場で音を作る（音声ファイル不要）。
// iPhoneでは Web Audio の音は「環境音（ambient）」扱いになり、消音スイッチがオンだと鳴らない。
import spec from './soundSpec.json';
import type { SoundName } from './sound';

export type { SoundName };

type Tone = { t: number; d: number; f: number; to?: number; v: number; w: OscillatorType };

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    // Safari 16.4+：音声の種類を「環境音」にして、消音スイッチに従わせる
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) {
      try { nav.audioSession.type = 'ambient'; } catch {}
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function playSound(name: SoundName) {
  try {
    const c = getContext();
    if (!c) return;
    const tones = (spec as unknown as Record<string, Tone[]>)[name];
    if (!tones) return;
    const now = c.currentTime + 0.01;
    for (const t of tones) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = t.w;
      osc.frequency.setValueAtTime(t.f, now + t.t);
      if (t.to) osc.frequency.exponentialRampToValueAtTime(t.to, now + t.t + t.d);
      gain.gain.setValueAtTime(0.0001, now + t.t);
      gain.gain.exponentialRampToValueAtTime(t.v, now + t.t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.t + t.d);
      osc.connect(gain).connect(c.destination);
      osc.start(now + t.t);
      osc.stop(now + t.t + t.d + 0.02);
    }
  } catch {}
}
