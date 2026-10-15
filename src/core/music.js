// 배경음악 작곡기: 한국 전통 5음계와 장단을 바탕으로, 곡마다 정해진 씨앗(seed)에서
// 같은 오리지널 선율을 늘 똑같이 만들어 낸다(외부 음원·기존 곡 없음).
import { mulberry32 } from './rng.js';

// 평조(밝은 느낌)·계면조(구슬픈 느낌) 5음계 — 으뜸음에서의 반음 거리
export const SCALES = { pyeong: [0, 2, 5, 7, 9], gyemyeon: [0, 3, 5, 7, 10] };

// 장단(한 마디 안의 [칸, 소리]): deong 덩(북+채) · kung 쿵(북) · ki 기(채) · deok 덕(테)
const RHYTHMS = {
  gutgeori: [[0, 'deong'], [4, 'ki'], [5, 'deok'], [6, 'kung'], [9, 'ki'], [10, 'deok']],
  semachi: [[0, 'deong'], [3, 'kung'], [6, 'ki'], [7, 'deok'], [9, 'kung']],
  soft: [[0, 'kung'], [6, 'ki']],
  softEven: [[0, 'kung'], [4, 'ki']],
  beat: [[0, 'kung'], [2, 'ki'], [4, 'kung'], [6, 'ki'], [7, 'deok']],
  heavy: [[0, 'kung'], [4, 'kung'], [6, 'deok']],
  battle: [[0, 'deong'], [1, 'ki'], [2, 'deok'], [3, 'ki'], [4, 'kung'], [5, 'ki'], [6, 'deong'], [7, 'ki']],
};

// meter: 한 마디의 칸 수(12 = 12/8 박, 8 = 4/4 박), bpm: 1분당 박 수
export const TRACKS = {
  title: { seed: 3, scale: 'pyeong', root: 62, bpm: 60, meter: 12, lead: 'flute', drum: 'soft', density: 0.55 },
  village: { seed: 11, scale: 'pyeong', root: 60, bpm: 70, meter: 12, lead: 'pluck', drum: 'gutgeori', density: 0.7 },
  field: { seed: 21, scale: 'pyeong', root: 62, bpm: 92, meter: 12, lead: 'pluck', drum: 'semachi', density: 0.75 },
  forest: { seed: 31, scale: 'gyemyeon', root: 57, bpm: 76, meter: 8, lead: 'flute', drum: 'softEven', density: 0.55 },
  hill: { seed: 41, scale: 'gyemyeon', root: 59, bpm: 100, meter: 8, lead: 'pluck', drum: 'beat', density: 0.7 },
  cave: { seed: 51, scale: 'gyemyeon', root: 52, bpm: 62, meter: 8, lead: 'flute', drum: 'heavy', density: 0.45, drone: true },
  swamp: { seed: 61, scale: 'gyemyeon', root: 55, bpm: 64, meter: 12, lead: 'flute', drum: 'soft', density: 0.5, drone: true },
  snow: { seed: 71, scale: 'pyeong', root: 64, bpm: 66, meter: 12, lead: 'flute', drum: 'soft', density: 0.5 },
  boss: { seed: 81, scale: 'gyemyeon', root: 57, bpm: 138, meter: 8, lead: 'pluck', drum: 'battle', density: 0.85 },
  indoor: { seed: 91, scale: 'pyeong', root: 65, bpm: 58, meter: 12, lead: 'pluck', drum: 'soft', density: 0.45 },
  castle: { seed: 101, scale: 'pyeong', root: 60, bpm: 64, meter: 8, lead: 'flute', drum: 'heavy', density: 0.6, drone: true },
};

export const MAP_TRACK = {
  village: 'village', field1: 'field', forest: 'forest', deepMountain: 'forest', wolfHill: 'hill',
  goblinCave: 'cave', bossLair: 'cave', dragonCave: 'cave', imugiSwamp: 'swamp', snowPass: 'snow',
  smithy: 'indoor', tailorShop: 'indoor', pharmacy: 'indoor', chiefHouse: 'indoor', tavern: 'indoor',
  castle: 'castle', palace: 'castle',
  trainingBlue: 'cave', trainingRed: 'cave', zodiacTemple: 'cave', dragonPalace: 'swamp', northFortress: 'snow', eastIsland: 'forest', fireIsland: 'boss',
};

const BAR_ROOTS = [0, 0, 3, 0, 1, 3, 0, 0]; // 마디마다 베이스가 짚는 음계 자리
const BEAT_PATTERNS = {
  12: [[3], [2, 1], [1, 1, 1], [1, 2]],
  8: [[2], [1, 1]],
};

/** 음계 자리(0,1,2… 두 옥타브 이상 이어짐)를 MIDI 음 높이로 */
export function degreeToMidi(def, degree) {
  const scale = SCALES[def.scale];
  const octave = Math.floor(degree / scale.length);
  return def.root + 12 * octave + scale[((degree % scale.length) + scale.length) % scale.length];
}

/** 두 마디짜리 가락(동기)을 만든다: 주로 이웃한 음으로 움직이는 선율 */
function makeMotif(rng, def, startDegree) {
  const beatSteps = def.meter === 12 ? 3 : 2;
  const beats = (def.meter / beatSteps) * 2;
  const notes = [];
  let degree = startDegree;
  let step = 0;
  for (let b = 0; b < beats; b++) {
    const patterns = BEAT_PATTERNS[def.meter];
    const pattern = patterns[Math.floor(rng() * patterns.length)];
    for (const len of pattern) {
      if (rng() < def.density || b === 0) {
        const move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(rng() * 7)];
        degree = Math.max(4, Math.min(13, degree + move));
        notes.push({ step, degree, len });
      }
      step += len;
    }
  }
  return notes;
}

/** 곡 하나: 가 가' 나 가'' (각 두 마디) = 8마디가 되풀이된다. */
export function makeSong(def) {
  const rng = mulberry32(def.seed);
  const bar = def.meter;
  const phrase = bar * 2;
  const a = makeMotif(rng, def, 8);
  const b = makeMotif(rng, def, 10);
  const endOn = (motif, degree) => motif.map((n, i) => (i === motif.length - 1 ? { ...n, degree } : n));
  const sections = [a, endOn(a, a[a.length - 1].degree + 1), b, endOn(a, 5)];
  const notes = [];
  sections.forEach((motif, si) => {
    for (const n of motif) {
      notes.push({ step: si * phrase + n.step, midi: degreeToMidi(def, n.degree), len: n.len, inst: def.lead, vol: 1 });
    }
  });
  for (let m = 0; m < 8; m++) {
    const root = degreeToMidi(def, BAR_ROOTS[m]) - 12;
    notes.push({ step: m * bar, midi: root, len: bar / 2, inst: 'bass', vol: 1 });
    notes.push({ step: m * bar + bar / 2, midi: root + 7, len: bar / 2, inst: 'bass', vol: 0.7 });
    if (def.drone && m % 2 === 0) notes.push({ step: m * bar, midi: def.root - 24, len: bar * 2, inst: 'drone', vol: 1 });
  }
  const drums = [];
  for (let m = 0; m < 8; m++) for (const [s, kind] of RHYTHMS[def.drum]) drums.push({ step: m * bar + s, kind });
  const beatSteps = bar === 12 ? 3 : 2;
  return {
    stepDur: 60 / def.bpm / beatSteps,
    steps: bar * 8,
    notes: notes.sort((x, y) => x.step - y.step),
    drums,
  };
}
