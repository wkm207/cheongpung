// 배경음악 연주기: music.js가 만든 곡을 Web Audio로 합성해 끝없이 되풀이한다.
// 가야금처럼 튕기는 소리(pluck), 대금처럼 부는 소리(flute), 낮은 베이스·지속음, 장구 장단.
import { getAudioContext } from './sfx.js';
import { getSettings } from './settings.js';
import { TRACKS, makeSong } from '../core/music.js';

const LOOKAHEAD_S = 0.3;
const TICK_MS = 80;
const VOLUME = 0.5;
const FADE_S = 0.7;

const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);

class Bgm {
  constructor() {
    this.track = null;
    this.wanted = null;
    this.song = null;
    this.byStep = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.master = null;
    this.noise = null;
    this.songs = new Map();
  }

  ctx() {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return null;
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    return ctx;
  }

  /** 매 프레임 불러도 된다: 원하는 곡이 바뀌었을 때만 바꾼다. */
  play(name) {
    this.wanted = getSettings().music ? name : null;
    const ctx = this.ctx();
    if (!ctx) return;
    if (this.wanted === this.track) return;
    this.switchTo(ctx, this.wanted);
  }

  switchTo(ctx, name) {
    const now = ctx.currentTime;
    const g = this.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + FADE_S);
    this.track = name;
    clearTimeout(this.swapTimer);
    this.swapTimer = setTimeout(() => {
      if (this.track !== name) return;
      if (!name) {
        this.stop();
        return;
      }
      this.load(name);
      const t = ctx.currentTime;
      this.master.gain.setValueAtTime(0, t);
      this.master.gain.linearRampToValueAtTime(VOLUME, t + FADE_S);
      this.start(ctx);
    }, FADE_S * 1000);
  }

  load(name) {
    if (!this.songs.has(name)) this.songs.set(name, makeSong(TRACKS[name]));
    this.song = this.songs.get(name);
    this.byStep = Array.from({ length: this.song.steps }, () => ({ notes: [], drums: [] }));
    for (const n of this.song.notes) this.byStep[n.step].notes.push(n);
    for (const d of this.song.drums) this.byStep[d.step].drums.push(d);
    this.step = 0;
  }

  start(ctx) {
    this.stop();
    this.nextTime = ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }

  tick() {
    const ctx = this.ctx();
    if (!ctx || !this.song) return;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      const slot = this.byStep[this.step];
      for (const n of slot.notes) this.note(ctx, n, this.nextTime);
      for (const d of slot.drums) this.drum(ctx, d.kind, this.nextTime);
      this.nextTime += this.song.stepDur;
      this.step = (this.step + 1) % this.song.steps;
    }
  }

  voice(ctx, type, freq, t) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain).connect(this.master);
    return { osc, gain };
  }

  note(ctx, n, t) {
    const freq = midiToFreq(n.midi);
    const len = n.len * this.song.stepDur;
    if (n.inst === 'pluck') {
      // 가야금처럼: 살짝 높게 튕겼다가 제 음으로 내려앉고 빨리 사그라든다
      const { osc, gain } = this.voice(ctx, 'triangle', freq * 1.015, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
      gain.gain.setValueAtTime(0.22 * n.vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.4, len * 1.6));
      osc.start(t);
      osc.stop(t + Math.max(0.45, len * 1.7));
      const bite = this.voice(ctx, 'square', freq, t);
      bite.gain.gain.setValueAtTime(0.03 * n.vol, t);
      bite.gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      bite.osc.start(t);
      bite.osc.stop(t + 0.15);
    } else if (n.inst === 'flute') {
      // 대금처럼: 부드럽게 들어와 떨림(비브라토)을 얹고 숨을 거둔다
      const { osc, gain } = this.voice(ctx, 'sine', freq, t);
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 5.2;
      depth.gain.value = freq * 0.006;
      lfo.connect(depth).connect(osc.frequency);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.16 * n.vol, t + 0.07);
      gain.gain.setValueAtTime(0.16 * n.vol, t + Math.max(0.08, len - 0.08));
      gain.gain.linearRampToValueAtTime(0.0001, t + len + 0.12);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + len + 0.15);
      lfo.stop(t + len + 0.15);
    } else if (n.inst === 'bass') {
      const { osc, gain } = this.voice(ctx, 'triangle', freq, t);
      gain.gain.setValueAtTime(0.16 * n.vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + Math.min(len, 0.6));
      osc.start(t);
      osc.stop(t + Math.min(len, 0.6) + 0.02);
    } else if (n.inst === 'drone') {
      const { osc, gain } = this.voice(ctx, 'sine', freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.5);
      gain.gain.linearRampToValueAtTime(0.0001, t + len);
      osc.start(t);
      osc.stop(t + len + 0.05);
    }
  }

  drum(ctx, kind, t) {
    const low = kind === 'kung' || kind === 'deong';
    const high = kind === 'ki' || kind === 'deok' || kind === 'deong';
    if (low) {
      // 북: 낮게 울리는 둥
      const { osc, gain } = this.voice(ctx, 'sine', 110, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.15);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.27);
    }
    if (high) {
      // 채·테: 짧게 딱
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = kind === 'deok' ? 1800 : 3200;
      const gain = ctx.createGain();
      const vol = kind === 'deok' ? 0.09 : 0.06;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      src.connect(filter).connect(gain).connect(this.master);
      src.start(t);
      src.stop(t + 0.07);
    }
  }
}

export const bgm = new Bgm();
