// 앱 아이콘(PNG)을 만든다: node tools/make-icons.mjs
// 외부 라이브러리 없이 32x32 도트 그림을 확대해 PNG로 인코딩한다.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const ART = [
  '................................',
  '................................',
  '................................',
  '..........yyyyyyyyyy............',
  '........yyyyyyyyyyyyyy..........',
  '.......yyy..........yyy.........',
  '......yy..............yy........',
  '.....yy.....wwwwww.....yy.......',
  '.....y....wwwwwwwwww....y.......',
  '....yy...ww........ww...yy......',
  '....y...ww...wwww...ww...y......',
  '....y...w...ww..ww...w...y......',
  '....y...w...w....w...w...y......',
  '....y...w...ww...w...w...y......',
  '....y...ww...www.....w...y......',
  '....yy...ww.........ww..yy......',
  '.....y....wwwwwwwwwww...y.......',
  '.....yy.................y.......',
  '......yy...............yy.......',
  '.......yyy...........yyy........',
  '........yyyyyyyyyyyyyyy.........',
  '..........yyyyyyyyyyy...........',
  '................................',
  '......gggggggggggggggggggg......',
  '.....gGGGGGGGGGGGGGGGGGGGGg.....',
  '....gGGGGGGGGGGGGGGGGGGGGGGg....',
  '....gggggggggggggggggggggggg....',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
];
const PALETTE = {
  '.': [20, 26, 46],
  y: [230, 184, 92],
  w: [191, 233, 255],
  g: [46, 106, 47],
  G: [78, 138, 58],
};

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (const b of buf) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const ch = ART[Math.floor((y / size) * 32)][Math.floor((x / size) * 32)];
      const [r, g, b] = PALETTE[ch];
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('icons', { recursive: true });
for (const size of [180, 192, 512]) writeFileSync(`icons/icon-${size}.png`, png(size));
console.log('icons/icon-180.png, icon-192.png, icon-512.png 생성 완료');
