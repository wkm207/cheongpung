// 몬스터 도트 미리보기 PNG(3배): node tools/mob_preview.mjs out.png
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { mobFrame } from '../src/render/mobdots.js';
import { MONSTER_LOOK } from '../src/render/sprites.js';

const COLS = [['down', 0], ['down', 1], ['down', 2], ['left', 0], ['left', 1], ['left', 2], ['right', 0], ['up', 0], ['up', 1]];
const S = Number(process.env.S ?? 3);
const CELL = Number(process.env.CELL ?? 70);
const types = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(MONSTER_LOOK);
const PER = Number(process.env.PER ?? 3); // 한 줄에 몬스터 수
const W = PER * COLS.length * CELL * S;
const H = Math.ceil(types.length / PER) * CELL * S;
const img = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) img.set([96, 140, 72, 255], i * 4);
types.forEach((t, n) => {
  const look = MONSTER_LOOK[t];
  COLS.forEach(([dir, step], c) => {
    const f = mobFrame(look, dir, step);
    const ox = ((n % PER) * COLS.length + c) * CELL + Math.floor((CELL - f.w) / 2);
    const oy = Math.floor(n / PER) * CELL + Math.max(0, CELL - 2 - f.h);
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        const s = (y * f.w + x) * 4;
        if (!f.data[s + 3] || ox + x < 0 || oy + y < 0) continue;
        for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) img.set(f.data.subarray(s, s + 4), (((oy + y) * S + a) * W + (ox + x) * S + b) * 4);
      }
    }
  });
});

const TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = ~0;
  for (const b of buf) c = TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) Buffer.from(img.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 6;
writeFileSync(process.argv[2] ?? 'mob_preview.png', Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
]));
