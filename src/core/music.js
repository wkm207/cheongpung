// 배경음악 작곡기: 곡마다 정해진 씨앗(seed)에서 늘 같은 오리지널 곡을 만든다(외부 음원·기존 곡 없음).
// 귀에 붙는 짧은 후렴 가락(훅)을 화음에 맞춰 되풀이하고, 높은 음역의 소프라노풍 목소리가 부른다.
// 반주는 하프 아르페지오·은은한 화음 패드·베이스, 가벼운 박자(킥·하이햇·손뼉).
import { mulberry32 } from './rng.js';

// 7음계(반음 거리)
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

// 화음 진행(8마디, 음계 자리 0=Ⅰ … 6=Ⅶ). 앞 4마디와 뒤 4마디가 대구를 이룬다.
const PROGRESSIONS = {
  pop: [0, 4, 5, 3, 0, 4, 3, 4], // Ⅰ-Ⅴ-Ⅵ-Ⅳ
  sweet: [0, 5, 3, 4, 0, 5, 3, 4], // Ⅰ-Ⅵ-Ⅳ-Ⅴ
  dream: [3, 4, 2, 5, 3, 4, 0, 0], // Ⅳ-Ⅴ-Ⅲ-Ⅵ
  sad: [0, 5, 2, 6, 0, 5, 3, 4], // ⅰ-Ⅵ-Ⅲ-Ⅶ
  epic: [0, 5, 6, 4, 0, 5, 6, 6], // ⅰ-Ⅵ-Ⅶ-ⅴ
  // 사냥터: 같은 화음을 끌다가 확 넘어가는 긴장된 진행
  tense: [0, 0, 5, 6, 0, 0, 3, 4], // ⅰ-ⅰ-Ⅵ-Ⅶ-ⅰ-ⅰ-ⅳ-ⅴ
  stalk: [0, 6, 5, 6, 0, 6, 3, 4], // ⅰ-Ⅶ-Ⅵ-Ⅶ
  dread: [0, 1, 0, 4, 0, 1, 5, 4], // ⅰ-ⅱ°-ⅰ-ⅴ
};

// 한 마디 리듬(칸 길이 모음). 당김음이 있는 것일수록 귀에 잘 붙는다.
const HOOK_RHYTHMS = {
  8: [[2, 1, 1, 2, 2], [1, 1, 2, 1, 1, 2], [3, 1, 2, 2], [1, 2, 1, 2, 2], [2, 1, 2, 1, 2]],
  12: [[3, 1, 2, 3, 3], [2, 1, 3, 2, 1, 3], [3, 3, 2, 1, 3], [1, 2, 3, 1, 2, 3]],
};
// 박자 무늬: [칸, 소리] kick 낮은 북 · hat 하이햇 · snap 손뼉
const GROOVES = {
  none: { 8: [], 12: [] },
  light: { 8: [[0, 'kick'], [4, 'snap'], [2, 'hat'], [6, 'hat']], 12: [[0, 'kick'], [6, 'snap'], [3, 'hat'], [9, 'hat']] },
  bounce: { 8: [[0, 'kick'], [3, 'kick'], [4, 'snap'], [1, 'hat'], [2, 'hat'], [5, 'hat'], [6, 'hat'], [7, 'hat']], 12: [[0, 'kick'], [5, 'kick'], [6, 'snap'], [2, 'hat'], [4, 'hat'], [8, 'hat'], [10, 'hat']] },
  battle: { 8: [[0, 'kick'], [2, 'kick'], [4, 'snap'], [5, 'kick'], [6, 'kick'], [1, 'hat'], [3, 'hat'], [5, 'hat'], [7, 'hat']], 12: [] },
  // 사냥터: 쉬지 않고 몰아치는 북과 하이햇
  drive: { 8: [[0, 'kick'], [3, 'kick'], [4, 'snap'], [6, 'kick'], [0, 'hat'], [1, 'hat'], [2, 'hat'], [3, 'hat'], [4, 'hat'], [5, 'hat'], [6, 'hat'], [7, 'hat']], 12: [] },
};

// meter: 한 마디 칸 수(12 = 12/8, 8 = 4/4), bpm: 1분당 박 수
export const TRACKS = {
  title: { seed: 3, scale: 'major', root: 62, bpm: 78, meter: 8, prog: 'dream', groove: 'none', pad: true },
  village: { seed: 11, scale: 'major', root: 60, bpm: 104, meter: 8, prog: 'pop', groove: 'bounce', pad: false },
  // 사냥터: 단조·빠른 박자·몰아치는 베이스(drive)로 긴장감 있게
  field: { seed: 21, scale: 'minor', root: 62, bpm: 122, meter: 8, prog: 'tense', groove: 'drive', pad: true, drive: true },
  forest: { seed: 31, scale: 'minor', root: 57, bpm: 118, meter: 8, prog: 'stalk', groove: 'drive', pad: true, drive: true },
  hill: { seed: 41, scale: 'minor', root: 59, bpm: 130, meter: 8, prog: 'epic', groove: 'drive', pad: false, drive: true },
  cave: { seed: 51, scale: 'minor', root: 52, bpm: 104, meter: 8, prog: 'dread', groove: 'drive', pad: true, drive: true },
  swamp: { seed: 61, scale: 'minor', root: 55, bpm: 110, meter: 8, prog: 'dread', groove: 'drive', pad: true, drive: true },
  snow: { seed: 71, scale: 'minor', root: 64, bpm: 116, meter: 8, prog: 'stalk', groove: 'drive', pad: true, drive: true },
  boss: { seed: 81, scale: 'minor', root: 57, bpm: 144, meter: 8, prog: 'epic', groove: 'battle', pad: true },
  indoor: { seed: 91, scale: 'major', root: 65, bpm: 92, meter: 12, prog: 'sweet', groove: 'light', pad: false },
  castle: { seed: 101, scale: 'major', root: 60, bpm: 90, meter: 8, prog: 'pop', groove: 'light', pad: true },
};

export const MAP_TRACK = {
  village: 'village', field1: 'field', forest: 'forest', deepMountain: 'forest', wolfHill: 'hill',
  goblinCave: 'cave', bossLair: 'cave', dragonCave: 'cave', imugiSwamp: 'swamp', snowPass: 'snow',
  smithy: 'indoor', tailorShop: 'indoor', pharmacy: 'indoor', chiefHouse: 'indoor', tavern: 'indoor',
  castle: 'castle', palace: 'castle',
  trainingBlue: 'cave', trainingRed: 'cave', zodiacTemple: 'cave', dragonPalace: 'swamp', northFortress: 'snow', eastIsland: 'forest', fireIsland: 'boss',
  ratDen1: 'cave', ratDen2: 'cave', ratDen3: 'cave', ratDen4: 'cave',
  snakeDen1: 'cave', snakeDen2: 'cave', snakeDen3: 'cave',
  pigDen1: 'cave', pigDen2: 'cave', pigDen3: 'cave',
  skullDen1: 'cave', skullDen2: 'cave', skullDen3: 'cave', skullDen4: 'cave',
  haunted1: 'swamp', haunted2: 'swamp', haunted3: 'swamp',
};

const LOW = 7; // 노래 음역: 으뜸음 한 옥타브 위부터
const HIGH = 16;

/** 음계 자리(0,1,2… 옥타브를 넘어 이어짐)를 MIDI 음 높이로 */
export function degreeToMidi(def, degree) {
  const scale = SCALES[def.scale];
  const n = scale.length;
  const octave = Math.floor(degree / n);
  return def.root + 12 * octave + scale[((degree % n) + n) % n];
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

/** 한 마디짜리 가락의 뼈대: 리듬과, 화음 근음에서 얼마나 떨어진 음인지(상대 음계 자리) */
function makeMotif(rng, meter) {
  const rhythm = pick(rng, HOOK_RHYTHMS[meter]);
  let rel = pick(rng, [0, 2, 4]);
  const rels = rhythm.map((_, i) => {
    if (i > 0) rel += pick(rng, [-2, -1, -1, 1, 1, 2, 3]);
    rel = Math.max(-2, Math.min(6, rel));
    return rel;
  });
  return { rhythm, rels };
}

/** 가락을 지금 화음 위로 옮겨 노래 음역 안에 앉힌다 */
function placeMotif(motif, chord, bar, meter) {
  const base = chord + LOW;
  const lift = base + Math.max(...motif.rels) > HIGH ? -7 : 0;
  let step = bar * meter;
  return motif.rhythm.map((len, i) => {
    const note = { step, degree: Math.max(LOW, Math.min(HIGH, base + lift + motif.rels[i])), len };
    step += len;
    return note;
  });
}

/** 마디를 맺는 긴 음(화음 구성음) */
function cadence(chord, bar, meter, high) {
  const degree = chord + LOW + (high ? 4 : 0);
  const half = meter / 2;
  return [
    { step: bar * meter, degree: Math.min(HIGH, degree + 2), len: half },
    { step: bar * meter + half, degree: Math.min(HIGH, degree), len: half },
  ];
}

/** 곡 하나: 훅 훅' 훅 맺음 | 대답 대답' 훅 끝맺음 (8마디)이 되풀이된다. */
export function makeSong(def) {
  const rng = mulberry32(def.seed);
  const bar = def.meter;
  const prog = PROGRESSIONS[def.prog];
  const hook = makeMotif(rng, bar);
  const answer = makeMotif(rng, bar);
  const plan = [hook, hook, hook, 'cad', answer, answer, hook, 'end'];
  const notes = [];
  plan.forEach((part, m) => {
    const phrase = part === 'cad' ? cadence(prog[m], m, bar, true)
      : part === 'end' ? cadence(prog[m], m, bar, false)
        : placeMotif(part, prog[m], m, bar);
    for (const n of phrase) notes.push({ step: n.step, midi: degreeToMidi(def, n.degree), len: n.len, inst: 'voice', vol: 1 });
  });
  // 반주: 하프 아르페지오(위아래로 굴림), 패드, 베이스(근음·5음)
  const arp = [0, 2, 4, 7, 4, 2];
  const every = bar === 12 ? 2 : 1;
  for (let m = 0; m < 8; m++) {
    const chord = prog[m];
    const bass = degreeToMidi(def, chord) - 12;
    if (def.drive) {
      // 몰아치는 베이스: 8분음표마다 근음, 박마다 옥타브를 섞는다
      for (let s = 0; s < bar; s++) notes.push({ step: m * bar + s, midi: s % 4 === 3 ? bass + 12 : bass, len: 1, inst: 'bass', vol: s % 2 ? 0.6 : 0.9 });
    } else {
      notes.push({ step: m * bar, midi: bass, len: bar / 2, inst: 'bass', vol: 1 });
      notes.push({ step: m * bar + bar / 2, midi: bass, len: bar / 2, inst: 'bass', vol: 0.75 });
    }
    if (def.pad) for (const d of [0, 2, 4]) notes.push({ step: m * bar, midi: degreeToMidi(def, chord + d), len: bar, inst: 'pad', vol: 1 });
    for (let s = 0, k = 0; s < bar; s += every, k++) {
      notes.push({ step: m * bar + s, midi: degreeToMidi(def, chord + arp[k % arp.length]), len: every * 2, inst: 'harp', vol: k % 2 ? 0.7 : 1 });
    }
  }
  const drums = [];
  const groove = GROOVES[def.groove][bar] ?? [];
  for (let m = 0; m < 8; m++) for (const [s, kind] of groove) drums.push({ step: m * bar + s, kind });
  const beatSteps = bar === 12 ? 3 : 2;
  return {
    stepDur: 60 / def.bpm / beatSteps,
    steps: bar * 8,
    notes: notes.sort((x, y) => x.step - y.step),
    drums: drums.sort((x, y) => x.step - y.step),
  };
}
