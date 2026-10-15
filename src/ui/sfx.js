// 코드로 합성하는 짧은 효과음(외부 소리 파일 없음). iOS는 첫 터치 뒤에야 소리가 난다.
import { getSettings } from './settings.js';

let ctx = null;

export const getAudioContext = () => ctx;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
    } catch {
      ctx = null;
      return;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function tone(freq, dur, { type = 'square', vol = 0.06, slide = 0, delay = 0 } = {}) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const arpeggio = (notes, step, opts) => notes.forEach((f, i) => tone(f, step * 1.6, { ...opts, delay: i * step }));

const SOUNDS = {
  swing: () => tone(500, 0.05, { type: 'triangle', vol: 0.025, slide: -200 }),
  hit: () => tone(220, 0.07, { vol: 0.045, slide: -90 }),
  crit: () => { tone(330, 0.08, { vol: 0.05 }); tone(660, 0.1, { delay: 0.05, vol: 0.045 }); },
  kill: () => arpeggio([523, 784], 0.06, { type: 'triangle', vol: 0.06 }),
  pickup: () => arpeggio([880, 1320], 0.05, { type: 'sine', vol: 0.06 }),
  coin: () => arpeggio([988, 1319], 0.045, { type: 'square', vol: 0.03 }),
  hurt: () => tone(160, 0.12, { type: 'sawtooth', vol: 0.045, slide: -60 }),
  drink: () => arpeggio([392, 523, 659], 0.05, { type: 'sine', vol: 0.05 }),
  levelup: () => arpeggio([523, 659, 784, 1047], 0.09, { type: 'triangle', vol: 0.07 }),
  quest: () => arpeggio([784, 988, 1175, 1568], 0.08, { type: 'triangle', vol: 0.06 }),
  learn: () => arpeggio([659, 880, 1175], 0.07, { type: 'sine', vol: 0.06 }),
  equip: () => arpeggio([660, 990], 0.06, { type: 'sine', vol: 0.06 }),
  unequip: () => arpeggio([660, 440], 0.06, { type: 'sine', vol: 0.05 }),
  skill: () => tone(330, 0.14, { type: 'triangle', slide: 260, vol: 0.05 }),
  magic: () => { tone(520, 0.18, { type: 'sine', slide: 500, vol: 0.05 }); tone(780, 0.18, { type: 'sine', slide: 400, vol: 0.03, delay: 0.04 }); },
  click: () => tone(1200, 0.03, { type: 'sine', vol: 0.025 }),
};

export function playSfx(name) {
  if (!getSettings().sound) return;
  SOUNDS[name]?.();
}
