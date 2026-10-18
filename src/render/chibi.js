// 큰 머리 한복 도트 캐릭터(약 2.5등신). 글자 그림(템플릿)을 조립해 한 칸(32×40)을 픽셀로 만든다.
// 캔버스 없이 RGBA 배열을 돌려주므로 브라우저(ImageData)와 노드(미리보기 PNG) 둘 다에서 쓴다.
export const CW = 32;
export const CH = 40;
/** 발바닥 줄(이 줄이 게임 칸 아래쪽에 닿는다) */
export const FOOT_ROW = 37;

const HEX = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (rgb, k) => rgb.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));

// 글자: k 외곽선, h 머리카락, H 머리 윤기, s 살, S 살 그늘, e 눈, r 볼, m 입,
//       c 옷, C 옷 그늘, w 동정(흰 깃), g 고름·대님 색, p 바지, P 바지 그늘, q 치마, Q 치마 그늘, f 신, y 비녀

// ── 머리(14×13) ──
const HEAD = {
  down: [
    '....kkkkkk....',
    '..kkhhhhhhkk..',
    '.khhHHhhhhhhk.',
    'khhHhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'khhhhsssshhhhk',
    'khhsssssssshhk',
    'khsssssssssshk',
    'khssessssesshk',
    'khssessssesshk',
    'kSsrssssssrsSk',
    '.kSssssmssssk.',
    '..kkkkkkkkkk..',
  ],
  up: [
    '....kkkkkk....',
    '..kkhhhhhhkk..',
    '.khhHHhhhhhhk.',
    'khhHhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'kShhhhhhhhhhSk',
    '.khhhhhhhhhhk.',
    '..kkkkkkkkkk..',
  ],
  left: [
    '....kkkkkk....',
    '..kkhhhhhhkk..',
    '.khhHHhhhhhhk.',
    'khhHhhhhhhhhhk',
    'khhhhhhhhhhhhk',
    'kssshhhhhhhhhk',
    'ksssshhhhhhhhk',
    'ksssssShhhhhhk',
    'kssessSShhhhhk',
    'kssessSkShhhhk',
    'ksrssssSShhhhk',
    '.kmssssSShhhk.',
    '..kkkkkkkkkk..',
  ],
};
// 여자 앞머리: 가운데 가르마와 양옆으로 내린 머리
const HEAD_F_DOWN = [
  '....kkkkkk....',
  '..kkhhhhhhkk..',
  '.khhHHhhhhhhk.',
  'khhHhhhkhhhhhk',
  'khhhhhkshhhhhk',
  'khhhhsssshhhhk',
  'khhsssssssshhk',
  'khhssssssssshk',
  'khhsessssesshk',
  'khhsessssesshk',
  'khsrssssssrshk',
  'khkSssmsssSkhk',
  '.kk.kkkkkk.kk.',
];
// 상투(남) — 머리 위 가운데, 쪽머리(여) — 뒤통수에 쪽과 비녀
const TOPKNOT = ['.kkkk.', 'khHhhk', 'khhhhk', '.kkkk.'];
const BUN = ['.kkkk.', 'khHhhk', 'kyyyyy', 'khhhhk', '.kkkk.'];

// ── 몸(12×10): 저고리·소매·손 ──
const BODY = {
  down: [
    '...kkwwkk...',
    '..kccwwcck..',
    '.kcccwwccck.',
    'kCkccwwcckCk',
    'kCkcwggwckCk',
    'kCkccggcckCk',
    'kCkcccgcckCk',
    'kSkcccccckSk',
    'kskCCCCCCksk',
    '.k.kkkkkk.k.',
  ],
  up: [
    '...kkkkkk...',
    '..kccccccK..',
    '.kcccccccck.',
    'kCkcccccckCk',
    'kCkcccccckCk',
    'kCkcccccckCk',
    'kCkcccccckCk',
    'kSkcccccckSk',
    'kskCCCCCCksk',
    '.k.kkkkkk.k.',
  ],
  left: [
    '...kkkkk....',
    '..kwccccck..',
    '.kwwcccccck.',
    '.kwgcccccck.',
    '.kcggkCCcck.',
    '.kccckCCcck.',
    '.kccckCCcck.',
    '.kcccksScck.',
    '.kCCCksskCk.',
    '..kkk.kk.k..',
  ],
};

// ── 바지(10×8): 대님(g)으로 묶은 바지와 신. 걷기 0(선 자세)·1·2 ──
const PANTS_FRONT = [
  ['.kppkkppk.', '.kppkkppk.', '.kpPkkPpk.', '.kpPkkPpk.', '.kggkkggk.', '.kffkkffk.', '.kffkkffk.', '..kk..kk..'],
  ['.kppkkppk.', '.kppkkppk.', '.kpPkkPpk.', '.kpPkkggk.', '.kggkkffk.', '.kffkkffk.', '.kffk.kk..', '..kk......'],
  ['.kppkkppk.', '.kppkkppk.', '.kpPkkPpk.', '.kggkkPpk.', '.kffkkggk.', '.kffkkffk.', '..kk.kffk.', '......kk..'],
];
const PANTS = {
  down: PANTS_FRONT,
  up: PANTS_FRONT,
  left: [
    ['..kppppk..', '..kpppPk..', '..kppPPk..', '..kpPPPk..', '..kggggk..', '.kffffk...', '.kfffffk..', '..kkkkk...'],
    ['.kpppppk..', '.kppkpPPk.', 'kppk.kPPk.', 'kpPk.kPPk.', 'kggk..kggk', 'kffk..kffk', 'kfffk.kffk', '.kkk...kk.'],
    ['..kpppppk.', '.kPPkkppk.', '.kPPk.kppk', '.kPPk.kpPk', '.kggk..kgk', '.kffk..kfk', 'kfffk..kfk', '.kkk...kk.'],
  ],
};
// ── 치마(12×8): 발끝만 보인다 ──
const SKIRT = {
  down: [
    ['..kqqqqqqk..', '..kqqqqqqk..', '.kqqQqqQqqk.', '.kqQqqqqQqk.', 'kqqQqqqqQqqk', 'kqQqqqqqqQqk', 'kkkkkkkkkkkk', '..kfk..kfk..'],
    ['..kqqqqqqk..', '..kqqqqqqk..', '.kqqQqqQqqk.', '.kqQqqqqQqk.', 'kqqQqqqqQqqk', 'kqQqqqqqqQqk', 'kkkkkkkkkkkk', '.kfk....kk..'],
    ['..kqqqqqqk..', '..kqqqqqqk..', '.kqqQqqQqqk.', '.kqQqqqqQqk.', 'kqqQqqqqQqqk', 'kqQqqqqqqQqk', 'kkkkkkkkkkkk', '..kk....kfk.'],
  ],
  left: [
    ['..kqqqqqk...', '..kqqqqQk...', '.kqqqqQQqk..', '.kqqqQQqqk..', 'kqqqQQqqqqk.', 'kqqQQqqqqqk.', 'kkkkkkkkkkk.', '.kfffk......'],
    ['..kqqqqqk...', '..kqqqqQk...', '.kqqqqQQqk..', '.kqqqQQqqk..', 'kqqqQQqqqqk.', 'kqqQQqqqqqk.', 'kkkkkkkkkkk.', 'kfffk..kfk..'],
    ['..kqqqqqk...', '..kqqqqQk...', '.kqqqqQQqk..', '.kqqqQQqqk..', 'kqqqQQqqqqk.', 'kqqQQqqqqqk.', 'kkkkkkkkkkk.', '..kfk.kfffk.'],
  ],
};
SKIRT.up = SKIRT.down;

// ── 마법 쓸 때 위로 든 팔(3×11)과 앞으로 뻗은 팔(옆모습, 7×3) ──
const ARM_UP = ['.k.', 'ksk', 'ksk', 'kCk', 'kck', 'kck', 'kck', 'kck', 'kck', 'kCk', '.k.'];
const ARM_FWD = ['kkkkkk.', 'scccCk.', 'kkkkkk.'];

// ── 쓰개(a 바탕, A 그늘): 갓(삿갓·흑립·전립), 투구, 관, 두건 ──
const HATS = {
  gat: { rows: ['.....kkkkkk.....', '....kaaaaaak....', '....kaaaaaak....', '....kaAAAAak....', 'kkkkkaaaaaakkkkk', 'kaaaaaaaaaaaaaak', '.kkkkkkkkkkkkkk.'], dx: -1, dy: -4 },
  helm: { rows: ['......kk......', '.....kaak.....', '...kkaaaakk...', '..kaaaaaaaak..', '.kaAaaaaaaAak.', 'kaAaaaaaaaaAak', 'kkkkkkkkkkkkkk', 'kAk........kAk', 'kAk........kAk', '.k..........k.'], dx: 0, dy: -2 },
  crown: { rows: ['.k.kk.k.', 'kakaakak', 'kaaaaaak', 'kAAAAAAk', '.kkkkkk.'], dx: 3, dy: -3 },
  band: { rows: ['.kkkkkkkkkkkk.', 'kaaaaaaaaaaaak', '.kkkkkkkkkkkk.'], dx: 0, dy: 3 },
};

const flip = (rows) => rows.map((r) => [...r].reverse().join(''));

/** 생김새 → 색표 */
function palette(look) {
  const cloth = HEX(look.cloth);
  const pants = HEX(look.pants ?? '#e9e2cf');
  const trim = HEX(look.trim ?? '#c0392b');
  const skirt = HEX(look.skirt ?? look.trim ?? '#c0392b');
  const hair = HEX(look.hair ?? '#2b211d');
  return {
    k: [36, 22, 15], h: hair, H: shade(hair, 1.8),
    s: [247, 207, 164], S: [224, 168, 120], e: [36, 22, 15], m: [200, 112, 90], r: [246, 168, 150],
    c: cloth, C: shade(cloth, 0.72), K: shade(cloth, 0.5), w: [244, 239, 224], g: trim,
    p: pants, P: shade(pants, 0.8), q: skirt, Q: shade(skirt, 0.75), f: [74, 52, 38], y: HEX(look.pin ?? '#e8c060'),
    a: HEX(look.hat?.color ?? '#2a2a2a'), A: shade(HEX(look.hat?.color ?? '#2a2a2a'), 0.7),
  };
}

/** 프레임에 템플릿을 (ox,oy)에 찍는다 */
function stamp(px, rows, ox, oy, pal) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = pal[ch];
      if (!c) return;
      const X = ox + x;
      const Y = oy + y;
      if (X < 0 || Y < 0 || X >= CW || Y >= CH) return;
      const i = (Y * CW + X) * 4;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      px[i + 3] = 255;
    });
  });
}

/** 템플릿 줄 길이가 고른지(미리보기·테스트용) */
export function checkTemplates() {
  const bad = [];
  const each = (name, rows) => rows.some((r) => r.length !== rows[0].length) && bad.push(name);
  for (const [d, rows] of Object.entries(HEAD)) each(`HEAD.${d}`, rows);
  each('HEAD_F_DOWN', HEAD_F_DOWN);
  for (const [d, rows] of Object.entries(BODY)) each(`BODY.${d}`, rows);
  for (const [d, fs] of Object.entries(PANTS)) fs.forEach((rows, i) => each(`PANTS.${d}.${i}`, rows));
  for (const [d, fs] of Object.entries(SKIRT)) fs.forEach((rows, i) => each(`SKIRT.${d}.${i}`, rows));
  return bad;
}

// 무기를 쥔 손 자리(칸 좌표), 바라보는 각도, 무기 종류별 길이
const HAND = { down: [11, 29], up: [20, 29], left: [15, 29], right: [16, 29] };
const FACE = { down: 90, up: -90, left: 180, right: 0 };
const IDLE_ANGLE = { down: 105, up: -60, left: 135, right: 45 };
const WEAPON_LEN = { sword: 13, dagger: 8, staff: 17, fan: 6, spear: 19 };
const SWING = [-115, -55, 5, 45];
const OUTLINE = [36, 22, 15];
const WOOD = [110, 72, 38];
const GUARD = [230, 190, 80];

/** 무기를 픽셀로: 손잡이 → 날, 둘레에 외곽선 */
function drawWeapon(px, [hx, hy], angle, w) {
  const len = WEAPON_LEN[w.wtype] ?? 10;
  const tint = HEX(w.tint ?? '#d5dbdb');
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pts = new Map();
  const put = (x, y, c) => {
    const X = Math.round(x);
    const Y = Math.round(y);
    if (X >= 0 && Y >= 0 && X < CW && Y < CH) pts.set(Y * CW + X, c);
  };
  const pole = w.wtype === 'staff' || w.wtype === 'spear';
  const head = w.wtype === 'spear' ? 3 : 2;
  for (let t = -1; t <= len; t += 0.5) {
    const x = hx + cos * t;
    const y = hy + sin * t;
    put(x, y, (pole ? t < len - head : t < 2) ? WOOD : tint);
    // 칼날은 두 줄(밝은 날 + 그늘), 부채는 펼친 부채꼴
    if ((w.wtype === 'sword' && t >= 3) || (w.wtype === 'fan' && t >= 2)) {
      const wide = w.wtype === 'fan' ? Math.min(3, (t - 1) * 0.9) : 0.6;
      for (let k = -wide; k <= wide; k += 0.5) put(x - sin * k, y + cos * k, k > 0 ? shade(tint, 0.7) : tint);
    }
  }
  // 칼코등이(검·비수)와 지팡이 머리 구슬
  if (w.wtype === 'sword' || w.wtype === 'dagger') {
    for (let k = -1.5; k <= 1.5; k += 0.5) put(hx + cos * 2 - sin * k, hy + sin * 2 + cos * k, GUARD);
  }
  if (w.wtype === 'staff') {
    for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]]) put(hx + cos * (len + 1) + ox, hy + sin * (len + 1) + oy, tint);
  }
  for (const key of pts.keys()) {
    const x = key % CW;
    const y = Math.floor(key / CW);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const n = ny * CW + nx;
      if (nx < 0 || nx >= CW || ny < 0 || ny >= CH || pts.has(n) || px[n * 4 + 3]) continue;
      px.set([...OUTLINE, 255], n * 4);
    }
  }
  for (const [key, c] of pts) px.set([...c, 255], key * 4);
}

/**
 * 한 칸 만들기.
 * look: { cloth, pants?, skirt?, trim?, hair?, female?, hat?: {kind, color}, weapon?: {wtype, tint} }
 * dir: up|down|left|right
 * opts: { step: 0(서기)·1·2(걷기), pose: 'stand'|'attack'|'cast', phase: 0~3(공격 휘두르기 단계) }
 */
export function chibiFrame(look, dir, { step = 0, pose = 'stand', phase = 0 } = {}) {
  const px = new Uint8ClampedArray(CW * CH * 4);
  const pal = palette(look);
  const side = dir === 'left' || dir === 'right';
  const d = side ? 'left' : dir;
  const mirror = dir === 'right' ? flip : (r) => r;
  const bob = step ? 1 : 0; // 걸을 때 한 칸 들썩
  const hand = [HAND[dir][0], HAND[dir][1] - bob];
  const swing = dir === 'left' || dir === 'up' ? -1 : 1;
  const angle = pose === 'attack' ? FACE[dir] + swing * SWING[phase] : IDLE_ANGLE[dir];
  const weapon = look.weapon && pose !== 'cast';
  // 뒷모습이면 무기가 몸 뒤에
  if (weapon && dir === 'up') drawWeapon(px, hand, angle, look.weapon);
  if (look.female) stamp(px, mirror(SKIRT[d][step]), 10, 30, pal);
  else stamp(px, mirror(PANTS[d][step]), 11, 30, pal);
  const bodyY = 21 - bob;
  if (pose === 'cast' && !side) {
    // 두 팔을 머리 위로
    stamp(px, BODY[d].map((r) => `..${r.slice(2, 10)}..`), 10, bodyY, pal);
    stamp(px, ARM_UP, 7, bodyY - 10, pal);
    stamp(px, ARM_UP, 22, bodyY - 10, pal);
  } else {
    stamp(px, mirror(BODY[d]), 10, bodyY, pal);
    if (pose === 'cast') stamp(px, mirror(ARM_FWD), dir === 'left' ? 7 : 18, bodyY + 3, pal);
  }
  const headY = 9 - bob;
  const hat = look.hat && HATS[look.hat.kind];
  if (!look.female && !hat) stamp(px, TOPKNOT, 13, headY - 3, pal);
  stamp(px, mirror(look.female && d === 'down' ? HEAD_F_DOWN : HEAD[d]), 9, headY, pal);
  if (look.female && d !== 'down' && !hat) stamp(px, mirror(BUN), side ? (dir === 'left' ? 19 : 7) : 13, headY + (side ? 5 : 8), pal);
  if (hat) stamp(px, hat.rows, 9 + hat.dx, headY + hat.dy, pal);
  if (weapon && dir !== 'up') {
    drawWeapon(px, hand, angle, look.weapon);
    stamp(px, ['s'], hand[0], hand[1], pal); // 무기를 쥔 주먹
  }
  return { w: CW, h: CH, data: px };
}
