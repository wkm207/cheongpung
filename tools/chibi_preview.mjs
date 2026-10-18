// 큰 머리 캐릭터 미리보기 PNG(4배): node tools/chibi_preview.mjs out.png
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { chibiFrame, CW, CH } from '../src/render/chibi.js';

const sword = (tint) => ({ wtype: 'sword', tint });
const LOOKS = [
  { cloth: '#a93226', trim: '#2b4f8a', weapon: sword('#e0e6ea') },
  { cloth: '#f2e6c8', skirt: '#c0392b', trim: '#c0392b', female: true, weapon: sword('#4fe0b0'), hat: { kind: 'crown', color: '#f4d03f' } },
  { cloth: '#34495e', pants: '#2c3e50', trim: '#7f8c8d', weapon: { wtype: 'dagger', tint: '#c9d6ff' }, hat: { kind: 'band', color: '#2c3e50' } },
  { cloth: '#f7d1dc', skirt: '#7d3c98', trim: '#7d3c98', female: true, weapon: { wtype: 'staff', tint: '#ff6b3d' } },
  { cloth: '#f4f1e8', trim: '#5dade2', weapon: { wtype: 'fan', tint: '#f9e79f' }, hat: { kind: 'gat', color: '#2a2a2a' } },
  { cloth: '#1f3a6b', pants: '#2c3e50', trim: '#c0392b', weapon: { wtype: 'spear', tint: '#d5dbdb' }, hat: { kind: 'helm', color: '#aab4bc' } },
];
const COLS = [
  ['down', {}], ['down', { step: 1 }], ['left', {}], ['left', { step: 1 }], ['right', {}], ['up', {}],
  ['down', { pose: 'attack', phase: 0 }], ['down', { pose: 'attack', phase: 2 }],
  ['left', { pose: 'attack', phase: 0 }], ['left', { pose: 'attack', phase: 2 }],
  ['down', { pose: 'cast' }], ['right', { pose: 'cast' }],
];
const S = 4;
const W = COLS.length * CW * S;
const H = LOOKS.length * CH * S;
const img = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++) img.set([96, 140, 72, 255], i * 4);
LOOKS.forEach((look, r) => COLS.forEach(([dir, opts], c) => {
  const f = chibiFrame(look, dir, opts);
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      const s = (y * CW + x) * 4;
      if (!f.data[s + 3]) continue;
      for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) img.set(f.data.subarray(s, s + 4), ((r * CH * S + y * S + a) * W + c * CW * S + x * S + b) * 4);
    }
  }
}));

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
writeFileSync(process.argv[2] ?? 'chibi_preview.png', Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
]));
