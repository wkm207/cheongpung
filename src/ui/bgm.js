// 배경음악 연주기: music.js가 만든 곡을 Web Audio로 합성해 끝없이 되풀이한다.
// 소프라노풍 목소리(voice)·하프(harp)·화음 패드(pad)·베이스, 가벼운 박자(킥·하이햇·손뼉).
// 잔향(리버브)과 메아리(딜레이)를 걸어 넓은 공간에서 부르는 느낌을 낸다.
import { getAudioContext } from './sfx.js';
import { getSettings } from './settings.js';
import { TRACKS, makeSong } from '../core/music.js';

const LOOKAHEAD_S = 0.3;
const TICK_MS = 80;
const VOLUME = 0.5;
const FADE_S = 0.7;
const REVERB_S = 2.4;

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
    if (!this.master) this.build(ctx);
    return ctx;
  }

  /** 소리 길: 악기 → bus → (그대로 + 잔향 + 메아리) → master → 스피커 */
  build(ctx) {
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.bus = ctx.createGain();
    this.bus.connect(this.master);
    // 잔향: 잦아드는 잡음으로 만든 공간 울림
    const reverb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * REVERB_S);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    }
    reverb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.38;
    this.bus.connect(reverb).connect(wet).connect(this.master);
    // 메아리: 노래에만 살짝
    this.echo = ctx.createDelay(1.5);
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const echoOut = ctx.createGain();
    echoOut.gain.value = 0.22;
    this.echo.connect(feedback).connect(this.echo);
    this.echo.connect(echoOut).connect(this.bus);
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
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
    // 메아리 간격: 점4분음표
    this.echo.delayTime.value = Math.min(1.4, this.song.stepDur * 3);
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

  osc(ctx, type, freq, t, out) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain).connect(out ?? this.bus);
    return { osc, gain };
  }

  note(ctx, n, t) {
    const freq = midiToFreq(n.midi);
    const len = n.len * this.song.stepDur;
    if (n.inst === 'voice') this.voice(ctx, freq, t, len, n.vol);
    else if (n.inst === 'harp') this.harp(ctx, freq, t, len, n.vol);
    else if (n.inst === 'pad') this.pad(ctx, freq, t, len);
    else if (n.inst === 'bass') this.bass(ctx, freq, t, len, n.vol);
  }

  /** 소프라노풍 목소리: 사인+삼각파에 '아' 모음 공명, 살짝 늦게 들어오는 떨림 */
  voice(ctx, freq, t, len, vol) {
    const out = ctx.createGain();
    const formant = ctx.createBiquadFilter();
    formant.type = 'peaking';
    formant.frequency.value = 1100;
    formant.Q.value = 1.4;
    formant.gain.value = 6;
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 3600;
    formant.connect(soft).connect(out);
    out.connect(this.bus);
    out.connect(this.echo);
    const a = this.osc(ctx, 'sine', freq, t, formant);
    const b = this.osc(ctx, 'triangle', freq * 1.003, t, formant);
    b.gain.gain.value = 0.45;
    // 떨림(비브라토): 소리가 자리 잡은 뒤에 서서히
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 5.6;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(0.35, len));
    lfo.connect(depth);
    depth.connect(a.osc.frequency);
    depth.connect(b.osc.frequency);
    // 살짝 아래에서 미끄러져 올라가는 첫소리
    a.osc.frequency.setValueAtTime(freq * 0.985, t);
    a.osc.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
    const peak = 0.12 * vol;
    const end = t + len + 0.18;
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(peak, t + 0.05);
    out.gain.setValueAtTime(peak * 0.85, t + Math.max(0.06, len - 0.05));
    out.gain.linearRampToValueAtTime(0.0001, end);
    for (const o of [a.osc, b.osc, lfo]) {
      o.start(t);
      o.stop(end + 0.02);
    }
  }

  /** 하프: 맑게 튕기고 길게 사그라드는 소리 */
  harp(ctx, freq, t, len, vol) {
    const { osc, gain } = this.osc(ctx, 'triangle', freq, t);
    const ring = Math.max(0.6, len * 2.2);
    gain.gain.setValueAtTime(0.07 * vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + ring);
    osc.start(t);
    osc.stop(t + ring + 0.02);
    const shine = this.osc(ctx, 'sine', freq * 2, t);
    shine.gain.gain.setValueAtTime(0.025 * vol, t);
    shine.gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.25);
    shine.osc.start(t);
    shine.osc.stop(t + 0.27);
  }

  /** 화음 패드: 천천히 부풀었다 가라앉는 현악 같은 바탕 */
  pad(ctx, freq, t, len) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;
    const out = ctx.createGain();
    filter.connect(out).connect(this.bus);
    const a = this.osc(ctx, 'sawtooth', freq * 0.997, t, filter);
    const b = this.osc(ctx, 'sawtooth', freq * 1.003, t, filter);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(0.018, t + Math.min(0.6, len / 2));
    out.gain.linearRampToValueAtTime(0.0001, t + len + 0.3);
    for (const o of [a.osc, b.osc]) {
      o.start(t);
      o.stop(t + len + 0.35);
    }
  }

  bass(ctx, freq, t, len, vol) {
    const { osc, gain } = this.osc(ctx, 'sine', freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.2 * vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + Math.min(len, 0.7));
    osc.start(t);
    osc.stop(t + Math.min(len, 0.7) + 0.02);
  }

  drum(ctx, kind, t) {
    if (kind === 'kick') {
      const { osc, gain } = this.osc(ctx, 'sine', 120, t, this.master);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.22);
      return;
    }
    // 하이햇·손뼉: 걸러낸 잡음
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = kind === 'hat' ? 'highpass' : 'bandpass';
    filter.frequency.value = kind === 'hat' ? 7000 : 1500;
    const gain = ctx.createGain();
    const vol = kind === 'hat' ? 0.025 : 0.08;
    const dur = kind === 'hat' ? 0.04 : 0.12;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(this.bus);
    src.start(t);
    src.stop(t + dur + 0.01);
  }
}

export const bgm = new Bgm();
