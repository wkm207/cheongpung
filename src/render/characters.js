// 사람 캐릭터 그림: 16×24 도트(2px 단위 → 32×48), 3등신의 날씬한 체형. 이 프로젝트의 오리지널 디자인.
// pose: 'stand' | 'walk' | 'cast'(손을 가슴 앞에 모으고 눈을 감음) | 'attack'(무기를 앞으로 내지름)
const PX = 2;
export const CHAR_W = 32;
export const CHAR_H = 48;

// 팔레트 글자: k 외곽선, h 머리카락, s 피부, e 눈, m 입, b 옷, d 띠·소매 끝, w 깃, l 바지, f 신발
export const BODY = {
  down: [
    '......kkkk......',
    '.....khhhhk.....',
    '....khhhhhhk....',
    '....khhhhhhk....',
    '....khshhshk....',
    '....kssssssk....',
    '....ksessesk....',
    '....kssssssk....',
    '.....kssmsk.....',
    '......kssk......',
    '.....kbwwbk.....',
    '....kbbwwbbk....',
    '...ksbbbbbbsk...',
    '...ksbbbbbbsk...',
    '....kddddddk....',
    '....kbbbbbbk....',
    '....kbbbbbbk....',
    '.....kbbbbk.....',
  ],
  up: [
    '......kkkk......',
    '.....khhhhk.....',
    '....khhhhhhk....',
    '....khhhhhhk....',
    '....khhhhhhk....',
    '....khhhhhhk....',
    '....khhhhhhk....',
    '....khhhhhhk....',
    '.....khhhhk.....',
    '......kssk......',
    '.....kbbbbk.....',
    '....kbbbbbbk....',
    '...ksbbbbbbsk...',
    '...ksbbbbbbsk...',
    '....kddddddk....',
    '....kbbbbbbk....',
    '....kbbbbbbk....',
    '.....kbbbbk.....',
  ],
  side: [
    '......kkkk......',
    '.....khhhhk.....',
    '....khhhhhhk....',
    '....khhhhhhk....',
    '....kshhhhhk....',
    '....ksshhhhk....',
    '....ksehhhhk....',
    '....ksshhhhk....',
    '.....kssshk.....',
    '......kssk......',
    '.....kbbbbk.....',
    '.....kbbbbk.....',
    '....ksbbbbk.....',
    '....ksbbbbk.....',
    '.....kddddk.....',
    '.....kbbbbk.....',
    '.....kbbbbk.....',
    '.....kbbbbk.....',
  ],
};

// 다리(6줄): 서 있기 / 걷기
export const LEGS = {
  front: [
    ['.....kllllk.....', '.....klkklk.....', '.....klk.klk....', '.....klk.klk....', '.....kfk.kfk....', '....kffk.kffk...'],
    ['.....kllllk.....', '....kllkklk.....', '....klk..klk....', '...klk....klk...', '...kfk....kfk...', '..kffk....kffk..'],
  ],
  side: [
    ['.....kllllk.....', '......kllk......', '......kllk......', '......kllk......', '......kffk......', '.....kfffk......'],
    ['.....kllllk.....', '.....klkklk.....', '.....klk.klk....', '....klk...klk...', '....kfk...kfk...', '...kffk..kffk...'],
  ],
};

const EYE_ROW = 6;

/** 여자: 어깨까지 내려오는 머리, 비녀, 아래로 퍼지는 치마 */
function feminize(rows, dir) {
  const out = [...rows];
  const put = (y, x, ch) => { out[y] = out[y].slice(0, x) + ch + out[y].slice(x + 1); };
  if (dir === 'down') {
    for (let y = 4; y <= 11; y++) { put(y, 3, 'h'); put(y, 12, 'h'); }
    for (let y = 4; y <= 11; y++) { put(y, 2, 'k'); put(y, 13, 'k'); }
  } else if (dir === 'up') {
    for (let y = 8; y <= 13; y++) { put(y, 7, 'h'); put(y, 8, 'h'); }
  } else {
    for (let y = 4; y <= 11; y++) { put(y, 11, 'h'); put(y, 12, 'k'); }
  }
  put(1, dir === 'side' ? 10 : 11, 'y');
  out[16] = '...kbbbbbbbbk...';
  out[17] = '..kbbbbbbbbbbk..';
  return out;
}

/** 눈 감기: 눈 자리는 피부로 덮고, 한 줄 아래에 감은 눈썹 선을 긋는다. */
function closeEyes(rows) {
  const eyes = [...rows[EYE_ROW]].map((ch, x) => (ch === 'e' ? x : -1)).filter((x) => x >= 0);
  return rows.map((row, y) => {
    if (y === EYE_ROW) return row.replaceAll('e', 's');
    if (y === EYE_ROW + 1) return [...row].map((ch, x) => (eyes.includes(x) ? 'k' : ch)).join('');
    return row;
  });
}

/** 시전 자세: 두 손을 가슴 앞에 모은다(정면·옆모습) */
function castArms(rows, dir) {
  const out = [...rows];
  if (dir === 'down') {
    out[11] = '....kbbssbbk....';
    out[12] = '....kbbbbbbk....';
    out[13] = '....kbbbbbbk....';
  } else if (dir === 'side') {
    out[11] = '....kssbbbk.....';
    out[12] = '.....kbbbbk.....';
    out[13] = '.....kbbbbk.....';
  }
  return out;
}

export function charPalette(look, trim) {
  return {
    k: '#1a1110', h: look.hair, s: look.skin ?? '#f5cba7', e: '#1a1110', m: '#c0715a', y: '#f4d03f',
    b: look.body, d: trim?.d ?? look.dark, w: trim?.w ?? '#ecf0f1', l: '#3e2723', f: '#1b1b1b',
  };
}

// 머리 장식·모자: 머리는 4~11열, 0~8줄
const HATS = {
  strawHat(r) {
    r(7, 0, 2, 1, '#b8913f');
    r(5, 1, 6, 1, '#d9b56a');
    r(3, 2, 10, 1, '#e6c47a');
    r(1, 3, 14, 1, '#b8913f');
    r(2, 4, 12, 1, '#7a5a20');
  },
  leatherCap(r) {
    r(5, 0, 6, 1, '#5b3a1e');
    r(4, 1, 8, 2, '#8b5a2b');
    r(4, 3, 8, 1, '#5b3a1e');
    r(6, 1, 2, 1, '#a8743f');
  },
  ironHelm(r) {
    r(7, 0, 2, 1, '#e74c3c');
    r(5, 1, 6, 1, '#7f8c8d');
    r(4, 2, 8, 2, '#aab7b8');
    r(7, 1, 2, 3, '#d5dbdb');
    r(4, 4, 8, 1, '#5d6d7e');
  },
  dragonHelm(r) {
    r(4, 0, 2, 1, '#f4d03f');
    r(10, 0, 2, 1, '#f4d03f');
    r(5, 1, 6, 1, '#1e6b52');
    r(4, 2, 8, 2, '#2e8b6b');
    r(7, 2, 2, 1, '#f4d03f');
    r(4, 4, 8, 1, '#124535');
  },
  gat(r) {
    r(5, 0, 6, 2, '#1a1a1a');
    r(2, 2, 12, 1, '#2b2b2b');
    r(1, 3, 14, 1, '#1a1a1a');
  },
  guard(r) {
    r(5, 0, 6, 1, '#1a1a1a');
    r(4, 1, 8, 2, '#2b2b2b');
    r(7, 0, 2, 1, '#c0392b');
    r(2, 3, 12, 1, '#1a1a1a');
  },
};

/** 무기: 정면은 오른손(12열), 옆모습은 앞손(3열). attack이면 앞으로 더 내민다. */
function drawWeapon(r, wtype, tint, dir, attack) {
  if (dir === 'up') return;
  const x = dir === 'down' ? 12 : 3;
  const lift = attack ? 3 : 0;
  if (wtype === 'sword') {
    r(x, 5 - lift, 1, 8, tint);
    r(x, 5 - lift, 1, 1, '#ffffff');
    r(x - 1, 13 - lift, 3, 1, '#8b5a2b');
    r(x, 14 - lift, 1, 2, '#5b3a1e');
  } else if (wtype === 'dagger') {
    r(x, 9 - lift, 1, 4, tint);
    r(x - 1, 13 - lift, 3, 1, '#5b3a1e');
    r(x, 14 - lift, 1, 1, '#3e2723');
  } else if (wtype === 'staff') {
    r(x, 4, 1, 19, '#8b5a2b');
    r(x - 1, 1, 3, 3, tint);
    r(x, 1, 1, 1, '#ffffff');
  } else if (wtype === 'fan') {
    r(x - 1, 10 - lift, 3, 1, tint);
    r(x - 2, 11 - lift, 4, 2, tint);
    r(x - 1, 11 - lift, 1, 2, '#c9b38a');
    r(x, 13 - lift, 1, 2, '#5b3a1e');
  }
}

/** 캐릭터 한 장을 그린다. ctx는 32×48 캔버스. */
export function drawCharacter(ctx, { look, gender = 'm', dir = 'down', pose = 'stand', blink = false, equip = {}, items }) {
  const r = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * PX, y * PX, w * PX, h * PX);
  };
  const weapon = equip.weapon && items[equip.weapon];
  const armor = equip.armor && items[equip.armor];
  const neck = equip.necklace && items[equip.necklace];
  let rows = BODY[dir];
  if (gender === 'f') rows = feminize(rows, dir);
  if (pose === 'cast') rows = castArms(rows, dir);
  if ((blink || pose === 'cast') && dir !== 'up') rows = closeEyes(rows);
  const legs = LEGS[dir === 'side' ? 'side' : 'front'][pose === 'walk' ? 1 : 0];
  const all = [...rows, ...legs];
  const pal = charPalette(look, armor?.trim);
  all.forEach((row, y) => {
    for (let x = 0; x < 16; x++) {
      const color = pal[row[x]];
      if (color) r(x, y, 1, 1, color);
    }
  });
  // 빛은 왼쪽 위에서: 오른쪽 옷자락에 그늘, 왼쪽 어깨에 밝은 테
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 10; y < 18; y++) {
    const row = all[y];
    const last = row.lastIndexOf('b');
    if (last > 0) ctx.fillRect(last * PX, y * PX, PX, PX);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let y = 10; y < 14; y++) {
    const first = all[y].indexOf('b');
    if (first > 0) ctx.fillRect(first * PX, y * PX, PX, PX);
  }
  if (armor?.shoulder && dir !== 'side') {
    r(3, 11, 2, 1, armor.shoulder);
    r(11, 11, 2, 1, armor.shoulder);
  }
  if (neck && dir === 'down') r(7, 10, 2, 1, neck.gem);
  if (neck && dir === 'side') r(6, 10, 1, 1, neck.gem);
  const hat = equip.helmet ?? look.hat;
  if (hat && HATS[hat]) HATS[hat](r);
  if (weapon) drawWeapon(r, weapon.wtype, weapon.tint, dir, pose === 'attack');
  if (pose === 'cast') {
    // 손끝에 모이는 빛
    ctx.fillStyle = 'rgba(255, 240, 170, 0.9)';
    ctx.fillRect((dir === 'side' ? 5 : 7.5) * PX, 10.5 * PX, PX, PX);
  }
}
