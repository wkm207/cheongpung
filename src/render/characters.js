// 사람 캐릭터 그림(32×48 논리 크기): 도트 대신 곡선·그라데이션으로 그린 고해상도 오리지널 디자인.
// 빛은 왼쪽 위에서 들어온다. 원작풍 4등신 체형, 한복풍 옷.
// pose: 'stand' | 'walk' | 'cast'(손을 가슴 앞에 모으고 눈을 감음) | 'attack'(무기를 앞으로 내지름)
// dir: 'down'(정면) | 'up'(뒷모습) | 'side'(왼쪽을 보는 옆모습, 오른쪽은 좌우 뒤집어 씀)
export const CHAR_W = 32;
export const CHAR_H = 48;

const OUTLINE = 'rgba(40, 22, 14, 0.85)';

// ── 색 계산 ──────────────────────────────────────────────
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** amt > 0 이면 밝게, < 0 이면 어둡게 */
export function tone(hex, amt) {
  const [r, g, b] = rgb(hex);
  const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

export function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

export function ellipse(ctx, x, y, rx, ry, fill, stroke = OUTLINE, lw = 0.7) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function shape(ctx, points, fill, stroke = OUTLINE, lw = 0.7) {
  ctx.beginPath();
  points.forEach(([x, y, cx, cy], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else if (cx !== undefined) ctx.quadraticCurveTo(cx, cy, x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function line(ctx, x0, y0, x1, y1, color, w) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// ── 몸의 각 부분 ─────────────────────────────────────────
function legs(ctx, dir, pose, c, seated) {
  const walk = pose === 'walk';
  if (seated && dir !== 'side') {
    // 앞·뒷모습으로 말을 탈 때: 두 다리를 말 양옆으로 걸친다
    const pants = lin(ctx, 8, 34, 24, 42, [[0, tone(c.pants, 0.25)], [1, c.pants]]);
    for (const s of [-1, 1]) {
      const x = (v) => 16 + s * v;
      shape(ctx, [[x(2), 33.5], [x(5.5), 33.5], [x(8.2), 37.5], [x(6), 38.5]], pants);
      shape(ctx, [[x(6), 37.5], [x(8.4), 37.5], [x(8.6), 42], [x(6.4), 42]], pants);
      ellipse(ctx, x(7.5), 42.6, 1.8, 1.1, lin(ctx, 0, 41, 0, 44, [[0, '#4a4a4a'], [1, '#141414']]));
    }
    return;
  }
  if (seated) {
    // 말 위에 걸터앉은 다리: 허벅지는 앞으로, 정강이는 아래로(옆모습)
    const pants = lin(ctx, 10, 34, 18, 42, [[0, tone(c.pants, 0.25)], [1, c.pants]]);
    shape(ctx, [[18, 33.5], [17.5, 37], [13.6, 38.6], [12.2, 36.2]], pants);
    shape(ctx, [[12.2, 36.2], [14.8, 37.6], [14.6, 42.5], [12, 42.5]], pants);
    ellipse(ctx, 12.6, 43.2, 2.3, 1.2, lin(ctx, 0, 42, 0, 45, [[0, '#4a4a4a'], [1, '#141414']]));
    return;
  }
  const pants = lin(ctx, 12, 0, 20, 0, [[0, tone(c.pants, 0.25)], [1, c.pants]]);
  const leg = (x, top, bottom, shoeDx = 0) => {
    shape(ctx, [[x - 1.6, top], [x + 1.6, top], [x + 1.4, bottom], [x - 1.4, bottom]], pants);
    ellipse(ctx, x + shoeDx, bottom + 0.6, 2.2, 1.3, lin(ctx, 0, bottom - 1, 0, bottom + 2, [[0, '#4a4a4a'], [1, '#141414']]));
  };
  if (dir === 'side') {
    if (walk) {
      leg(13, 35, 44.5, -0.8);
      leg(19, 35, 44.5, -0.8);
    } else leg(16, 35, 45, -0.8);
    return;
  }
  leg(13.6, 35, walk ? 43.5 : 45);
  leg(18.4, 35, walk ? 45.5 : 45);
}

/** 옷 몸통. 여자는 저고리+치마, 남자는 도포 */
function body(ctx, dir, c, female, seated = false) {
  const side = dir === 'side';
  const L = side ? 11 : 9.6;
  const R = side ? 21 : 22.4;
  const robe = lin(ctx, L, 21, R, 30, [[0, tone(c.body, 0.3)], [0.5, c.body], [1, tone(c.body, -0.3)]]);
  if (female) {
    // 치마: 아래로 넓게 퍼진다
    const skirt = lin(ctx, 6, 28, 26, 44, [[0, tone(c.trim, 0.25)], [0.55, c.trim], [1, tone(c.trim, -0.35)]]);
    if (seated) {
      // 말 등에 늘어뜨린 치마
      shape(ctx, [[11, 27.5], [21, 27.5], [22, 37, 23, 32], [9, 39], [11, 27.5, 8.5, 33]], skirt);
      shape(ctx, [[L + 1.2, 21], [R - 1.2, 21], [R + 0.3, 29], [L - 0.3, 29]], robe);
      return finishBody(ctx, dir, c, female, L, R);
    }
    shape(ctx, [[side ? 11 : 10, 27.5], [side ? 21 : 22, 27.5], [side ? 24.5 : 26, 44.5, side ? 23 : 25.5, 36], [side ? 7.5 : 6, 44.5], [side ? 11 : 10, 27.5, side ? 9 : 6.5, 36]], skirt);
    // 치마 주름
    for (const fx of side ? [12, 16, 20] : [11, 14, 18, 21]) line(ctx, fx + 0.5, 30, fx + (fx - 16) * 0.35, 44, 'rgba(0,0,0,0.15)', 0.5);
    // 저고리
    shape(ctx, [[L + 1.2, 21], [R - 1.2, 21], [R + 0.3, 29], [L - 0.3, 29]], robe);
  } else {
    shape(ctx, [[L + 1, 21], [R - 1, 21], [R + 0.6, 37], [L - 0.6, 37]], robe);
    // 옷자락 겹침선과 밑단
    if (dir === 'down') line(ctx, 13.5, 21.5, 19.5, 36.5, 'rgba(0,0,0,0.22)', 0.6);
    shape(ctx, [[L - 0.6, 35.5], [R + 0.6, 35.5], [R + 0.6, 37], [L - 0.6, 37]], tone(c.trim, -0.1), null);
  }
  finishBody(ctx, dir, c, female, L, R);
}

/** 깃·허리띠(고름)·어깨 장식 */
function finishBody(ctx, dir, c, female, L, R) {
  const side = dir === 'side';
  if (dir === 'down') {
    // 흰 깃(V자)과 동정
    shape(ctx, [[13.2, 20.8], [16, 25.5], [18.8, 20.8], [17.6, 20.8], [16, 23.6], [14.4, 20.8]], c.collar, 'rgba(0,0,0,0.35)', 0.4);
  }
  // 허리띠(여자는 가슴 고름)
  if (female) {
    if (dir !== 'up') {
      ellipse(ctx, side ? 13 : 17.5, 25.5, 1.3, 0.9, c.trim, 'rgba(0,0,0,0.3)', 0.4);
      line(ctx, side ? 13 : 17.5, 26, side ? 12 : 18.5, 31, c.trim, 1);
    }
  } else {
    shape(ctx, [[L - 0.3, 28.3], [R + 0.3, 28.3], [R + 0.3, 30.4], [L - 0.3, 30.4]], lin(ctx, 0, 28, 0, 31, [[0, tone(c.trim, 0.2)], [1, tone(c.trim, -0.25)]]), 'rgba(0,0,0,0.4)', 0.4);
    if (dir === 'down') line(ctx, 19.5, 30, 20.2, 34, c.trim, 0.9);
  }
  if (c.shoulder && !side) {
    ellipse(ctx, L + 1, 22.2, 2.4, 1.6, lin(ctx, 0, 20.5, 0, 24, [[0, tone(c.shoulder, 0.35)], [1, tone(c.shoulder, -0.3)]]), OUTLINE, 0.5);
    ellipse(ctx, R - 1, 22.2, 2.4, 1.6, lin(ctx, 0, 20.5, 0, 24, [[0, tone(c.shoulder, 0.35)], [1, tone(c.shoulder, -0.3)]]), OUTLINE, 0.5);
  }
}

/** 한 팔: 어깨(sx,sy)에서 손(hx,hy)까지 넓은 소매 */
function arm(ctx, sx, sy, hx, hy, c) {
  const dx = hx - sx;
  const dy = hy - sy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 2;
  const ny = (dx / len) * 2;
  const sleeve = lin(ctx, sx, sy, hx, hy, [[0, tone(c.body, 0.15)], [1, tone(c.body, -0.2)]]);
  shape(ctx, [[sx + nx, sy + ny], [hx + nx * 1.1, hy + ny * 1.1], [hx - nx * 1.1, hy - ny * 1.1], [sx - nx, sy - ny]], sleeve);
  // 소매 끝동
  const ex = hx - (dx / len) * 1.4;
  const ey = hy - (dy / len) * 1.4;
  line(ctx, ex + nx * 1.1, ey + ny * 1.1, ex - nx * 1.1, ey - ny * 1.1, c.trim, 1.3);
  ellipse(ctx, hx + (dx / len) * 0.6, hy + (dy / len) * 0.6, 1.5, 1.5, c.skin, OUTLINE, 0.5);
}

function arms(ctx, dir, pose, c, seated = false) {
  const side = dir === 'side';
  if (seated && side && pose !== 'cast' && pose !== 'attack') {
    arm(ctx, 15.5, 22.5, 10.5, 29, c); // 고삐를 쥔 손
    return;
  }
  if (pose === 'cast' && dir !== 'up') {
    if (side) arm(ctx, 15, 22.5, 11.5, 26.5, c);
    else {
      arm(ctx, 10.5, 22.5, 15, 27, c);
      arm(ctx, 21.5, 22.5, 17, 27, c);
    }
    return;
  }
  if (side) {
    const fwd = pose === 'attack' ? [9, 25] : pose === 'walk' ? [13, 32] : [15, 33];
    arm(ctx, 15.5, 22.5, fwd[0], fwd[1], c);
    return;
  }
  const swing = pose === 'walk' ? 1.2 : 0;
  arm(ctx, 10.6, 22.5, 8.2, 32.5 - swing, c);
  if (pose === 'attack' && dir === 'down') arm(ctx, 21.4, 22.5, 25.5, 28, c);
  else arm(ctx, 21.4, 22.5, 23.8, 32.5 + swing, c);
}

/** 얼굴과 머리카락 */
function head(ctx, dir, c, female, eyesClosed) {
  const hair = c.hair;
  const hairFill = lin(ctx, 8, 4, 24, 20, [[0, tone(hair, 0.35)], [0.45, hair], [1, tone(hair, -0.35)]]);
  const skin = (cx, cy, rx, ry) => {
    const g = ctx.createRadialGradient(cx - 2, cy - 2.5, 1, cx, cy, ry + 1);
    g.addColorStop(0, tone(c.skin, 0.25));
    g.addColorStop(0.7, c.skin);
    g.addColorStop(1, tone(c.skin, -0.15));
    ellipse(ctx, cx, cy, rx, ry, g);
  };
  // 목
  shape(ctx, [[14.6, 18.5], [17.4, 18.5], [17.4, 21.5], [14.6, 21.5]], tone(c.skin, -0.12), null);
  if (dir === 'up') {
    ellipse(ctx, 16, 12.5, 7.8, 7.6, hairFill);
    if (female) {
      ellipse(ctx, 16, 17.5, 3, 2.4, hairFill);
      line(ctx, 11, 17.4, 21, 17.4, '#f4d03f', 1);
    } else ellipse(ctx, 16, 4.5, 2.4, 2, hairFill);
    hairShine(ctx, 13, 8);
    return;
  }
  if (dir === 'side') {
    ellipse(ctx, 17, 12, 7.6, 7.3, hairFill);
    skin(14.6, 14.4, 5.8, 6.1);
    // 옆머리가 뺨 뒤를 덮는다
    shape(ctx, [[16.5, 6.5], [23.5, 9], [22.5, 18, 24, 15], [18.5, 19.5], [17.5, 12, 16, 15]], hairFill);
    ellipse(ctx, 18.2, 14.8, 1.2, 1.6, tone(c.skin, -0.05), OUTLINE, 0.5); // 귀
    shape(ctx, [[9.5, 10.5], [17, 6.5], [19, 9.5], [12, 12, 14, 9.5]], hairFill, null); // 앞머리
    if (eyesClosed) line(ctx, 10.6, 15, 12.6, 15.3, '#2a1a12', 0.7);
    else eye(ctx, 11.6, 14.8);
    ellipse(ctx, 12.5, 17.3, 1.2, 0.7, 'rgba(255, 120, 120, 0.3)', null);
    line(ctx, 9.6, 18.3, 10.8, 18.4, '#a5554a', 0.6);
    if (female) {
      ellipse(ctx, 22.5, 9.5, 2.6, 2.4, hairFill);
      line(ctx, 19.5, 8.5, 26, 10, '#f4d03f', 0.9);
    } else ellipse(ctx, 18, 4.5, 2.3, 2, hairFill);
    hairShine(ctx, 15, 7.5);
    return;
  }
  // 정면
  if (female) {
    // 옆으로 늘어진 머리
    shape(ctx, [[8.6, 11], [10.5, 21.5, 8, 18], [12, 21.5], [12, 12]], hairFill);
    shape(ctx, [[23.4, 11], [21.5, 21.5, 24, 18], [20, 21.5], [20, 12]], hairFill);
  }
  ellipse(ctx, 16, 11.8, 7.9, 7.3, hairFill);
  skin(16, 14.4, 6.5, 6.2);
  // 앞머리: 이마를 덮는 물결
  shape(ctx, [[9.2, 13], [9.8, 8.5, 9, 10], [16, 5.6, 12, 5.6], [22.2, 8.5, 20, 5.6], [22.8, 13, 23, 10], [20.5, 10.8], [18.5, 12.2], [16, 10.2], [13.5, 12.2], [11.5, 10.8]], hairFill, null);
  ellipse(ctx, 9.3, 15, 1.1, 1.6, tone(c.skin, -0.05), OUTLINE, 0.5);
  ellipse(ctx, 22.7, 15, 1.1, 1.6, tone(c.skin, -0.05), OUTLINE, 0.5);
  if (eyesClosed) {
    for (const ex of [12.9, 19.1]) {
      ctx.beginPath();
      ctx.arc(ex, 14.6, 1.2, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.strokeStyle = '#2a1a12';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  } else {
    eye(ctx, 12.9, 14.8);
    eye(ctx, 19.1, 14.8);
  }
  ellipse(ctx, 11.6, 17.2, 1.4, 0.8, 'rgba(255, 120, 120, 0.3)', null);
  ellipse(ctx, 20.4, 17.2, 1.4, 0.8, 'rgba(255, 120, 120, 0.3)', null);
  ctx.beginPath();
  ctx.arc(16, 17.6, 1, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.strokeStyle = '#a5554a';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  if (female) {
    ellipse(ctx, 16, 4.6, 3, 2.2, hairFill);
    line(ctx, 11.5, 4.4, 20.5, 4.4, '#f4d03f', 0.9);
    ellipse(ctx, 20.8, 4.4, 0.8, 0.8, '#ff6b6b', null);
  } else {
    ellipse(ctx, 16, 4, 2.3, 2, hairFill);
    line(ctx, 14, 5.3, 18, 5.3, tone(hair, -0.5), 0.6);
  }
  hairShine(ctx, 13, 8);
}

function eye(ctx, x, y) {
  ellipse(ctx, x, y, 1.15, 1.55, '#2a1a12', null);
  ellipse(ctx, x, y + 0.5, 0.7, 0.7, '#5a3a2a', null);
  ellipse(ctx, x - 0.4, y - 0.6, 0.45, 0.45, '#ffffff', null);
}

function hairShine(ctx, x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 3.2, 1.3, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fill();
}

// ── 모자·투구 ────────────────────────────────────────────
const HATS = {
  gat(ctx) {
    ellipse(ctx, 16, 7.6, 12.5, 2.6, 'rgba(26, 26, 26, 0.82)', 'rgba(0,0,0,0.9)', 0.5);
    shape(ctx, [[11.8, 7.5], [12.4, 0.8], [19.6, 0.8], [20.2, 7.5]], lin(ctx, 12, 0, 20, 0, [[0, 'rgba(70,70,70,0.85)'], [1, 'rgba(15,15,15,0.9)']]), 'rgba(0,0,0,0.9)', 0.5);
    line(ctx, 9, 8.5, 9.5, 19, 'rgba(20,20,20,0.6)', 0.4);
    line(ctx, 23, 8.5, 22.5, 19, 'rgba(20,20,20,0.6)', 0.4);
  },
  strawHat(ctx) {
    shape(ctx, [[16, 0.2], [29, 8.2], [3, 8.2]], lin(ctx, 3, 0, 29, 8, [[0, '#f2d58f'], [0.6, '#d9b56a'], [1, '#9c7a35']]));
    ellipse(ctx, 16, 8.3, 13.2, 1.6, '#b8913f');
    for (let i = 1; i < 4; i++) line(ctx, 16, 0.5, 4 + i * 6, 8, 'rgba(120, 90, 30, 0.35)', 0.4);
  },
  leatherCap(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(16, 9.5, 8.4, 7.2, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = lin(ctx, 8, 2, 24, 10, [[0, '#b07a45'], [1, '#5b3a1e']]);
    ctx.fill();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.restore();
    line(ctx, 7.8, 9.4, 24.2, 9.4, '#4a2e16', 1.4);
  },
  ironHelm(ctx) {
    dome(ctx, '#d5dbdb', '#5d6d7e');
    line(ctx, 16, 2.5, 16, 9, 'rgba(255,255,255,0.6)', 1);
    shape(ctx, [[15, 2.6], [17, 2.6], [18.5, -0.5, 18, 1], [15.5, 0.5]], '#e74c3c', null);
  },
  dragonHelm(ctx) {
    dome(ctx, '#3fa37a', '#124535');
    shape(ctx, [[9.5, 6], [6.5, 0.5, 7, 3], [11, 4.5]], '#f4d03f');
    shape(ctx, [[22.5, 6], [25.5, 0.5, 25, 3], [21, 4.5]], '#f4d03f');
    ellipse(ctx, 16, 6.5, 1.3, 1.3, '#f4d03f');
  },
  guard(ctx) {
    ellipse(ctx, 16, 8.4, 10.5, 2, '#1a1a1a');
    dome(ctx, '#3a3a3a', '#111111', 6.2, 8.2);
    ellipse(ctx, 16, 2.4, 1.6, 1.6, '#c0392b');
    line(ctx, 16, 3.5, 18.5, 8, '#c0392b', 0.8);
  },
};

function dome(ctx, light, dark, rx = 8.4, cy = 9.6) {
  ctx.beginPath();
  ctx.ellipse(16, cy, rx, 7.4, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = lin(ctx, 16 - rx, 2, 16 + rx, cy, [[0, light], [1, dark]]);
  ctx.fill();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  line(ctx, 16 - rx - 0.2, cy, 16 + rx + 0.2, cy, dark, 1.3);
}

/** 관(왕관풍): 금테에 보석 */
function crown(ctx, gem) {
  shape(ctx, [[8.5, 8.5], [8.5, 3.5], [11.2, 5.5], [13.6, 1.5], [16, 4.5], [18.4, 1.5], [20.8, 5.5], [23.5, 3.5], [23.5, 8.5]],
    lin(ctx, 8, 1, 24, 9, [[0, '#fff1a8'], [0.5, '#f4d03f'], [1, '#a87d12']]));
  ellipse(ctx, 16, 6.4, 1.5, 1.5, gem, 'rgba(0,0,0,0.4)', 0.4);
  ellipse(ctx, 15.5, 5.9, 0.5, 0.5, 'rgba(255,255,255,0.8)', null);
}

function hat(ctx, id, items) {
  if (!id) return;
  if (HATS[id]) {
    HATS[id](ctx);
    return;
  }
  const it = items?.[id];
  if (it?.type === 'helmet') crown(ctx, it.gem ?? (it.level >= 75 ? '#c77dff' : it.level >= 55 ? '#4fc3f7' : '#ff4d4d'));
}

// ── 무기 ─────────────────────────────────────────────────
/** 무기 둘레의 은은한 빛(승급 무기) */
function aura(ctx, x, y, r, tint, strength) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, tone(tint, 0.4).replace('rgb', 'rgba').replace(')', `, ${0.45 * strength})`));
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function sparkle(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

/** 감개를 감은 손잡이(y0→y1) */
function grip(ctx, y0, y1, w, color) {
  shape(ctx, [[-w, y0], [w, y0], [w, y1], [-w, y1]], lin(ctx, -w, 0, w, 0, [[0, tone(color, 0.3)], [1, tone(color, -0.35)]]), 'rgba(20,10,5,0.8)', 0.3);
  for (let y = y0 + 0.6; y < y1; y += 1.1) line(ctx, -w, y, w, y + 0.6, 'rgba(0,0,0,0.35)', 0.3);
}

/** 매듭 술 장식 */
function tassel(ctx, x, y, color) {
  line(ctx, x, y, x - 0.6, y + 2, '#c9a23a', 0.35);
  shape(ctx, [[x - 0.6, y + 2], [x - 1.6, y + 5.2], [x + 0.4, y + 5.2]], lin(ctx, 0, y + 2, 0, y + 5.5, [[0, color], [1, tone(color, -0.35)]]), null);
  ellipse(ctx, x - 0.6, y + 2, 0.55, 0.55, '#f4d03f', null);
}

/** 손(hx,hy)에 쥔 무기. ang = 칼끝이 향하는 각도(라디안, 위쪽이 -π/2). tier가 높을수록 빛난다. */
function weapon(ctx, wtype, tint, hx, hy, ang, tier = 0) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ang + Math.PI / 2);
  // 이 좌표계에서 무기는 위(-y)를 향하고, 손은 (0,0)
  const steel = (w, len) => lin(ctx, -w, 0, w, 0, [[0, '#ffffff'], [0.35, tone(tint, 0.35)], [0.55, tint], [1, tone(tint, -0.45)]]);
  if (wtype === 'sword') {
    const len = 19;
    if (tier) aura(ctx, 0, -len * 0.55, 7, tint, tier / 3);
    shape(ctx, [[-1.15, -2], [1.15, -2], [1, -len + 3], [0, -len], [-1, -len + 3]], steel(1.2, len), 'rgba(15,15,25,0.85)', 0.35);
    line(ctx, 0, -3, 0, -len + 3.5, 'rgba(40, 40, 60, 0.45)', 0.45); // 피홈
    line(ctx, -0.7, -2.5, -0.55, -len + 3, 'rgba(255,255,255,0.7)', 0.25); // 날 빛
    // 코등이: 휘어진 가로대와 가운데 보석
    shape(ctx, [[-3.6, -2.6], [-1, -1.6], [1, -1.6], [3.6, -2.6], [3, -0.6], [-3, -0.6]], lin(ctx, -3.6, 0, 3.6, 0, [[0, '#fff1a8'], [0.5, '#d4a72c'], [1, '#8a6410']]), 'rgba(40,25,5,0.8)', 0.3);
    ellipse(ctx, 0, -1.5, 0.75, 0.75, tone(tint, -0.2), 'rgba(0,0,0,0.5)', 0.2);
    grip(ctx, -0.6, 3.6, 0.7, '#6b2a1a');
    ellipse(ctx, 0, 4.3, 1, 0.9, lin(ctx, -1, 0, 1, 0, [[0, '#fff1a8'], [1, '#8a6410']]), 'rgba(40,25,5,0.8)', 0.3);
    tassel(ctx, 0, 4.8, '#c0392b');
    if (tier >= 3) sparkle(ctx, 0.6, -len + 4, 1.4);
  } else if (wtype === 'dagger') {
    const len = 10;
    if (tier) aura(ctx, 0, -len * 0.5, 5, tint, tier / 3);
    // 살짝 휜 외날
    ctx.beginPath();
    ctx.moveTo(-1, -1.6);
    ctx.quadraticCurveTo(-1.6, -len * 0.6, 0.8, -len);
    ctx.quadraticCurveTo(1.4, -len * 0.5, 1, -1.6);
    ctx.closePath();
    ctx.fillStyle = steel(1.4, len);
    ctx.fill();
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = 'rgba(15,15,25,0.85)';
    ctx.stroke();
    line(ctx, -0.6, -2.4, 0.3, -len + 1.5, 'rgba(255,255,255,0.7)', 0.25);
    ellipse(ctx, 0, -1.4, 2, 0.7, lin(ctx, -2, 0, 2, 0, [[0, '#d5dbdb'], [1, '#4a4a4a']]), 'rgba(20,20,20,0.8)', 0.3);
    grip(ctx, -0.8, 2.6, 0.65, '#2b2b2b');
    ellipse(ctx, 0, 3.4, 0.9, 0.9, 'rgba(0,0,0,0)', '#c9a23a', 0.45); // 고리
    tassel(ctx, 0, 4.2, tone(tint, -0.2));
    if (tier >= 3) sparkle(ctx, 1, -len + 2, 1.1);
  } else if (wtype === 'staff') {
    // 꼬인 나무 자루
    line(ctx, 0, 12, 0, -14, '#5b3a1e', 1.7);
    line(ctx, 0, 12, 0, -14, lin(ctx, -1, 0, 1, 0, [[0, '#c48a52'], [1, '#6b4423']]), 1.2);
    for (let y = 10; y > -13; y -= 2.2) line(ctx, -0.65, y, 0.65, y - 1.1, 'rgba(60, 30, 10, 0.55)', 0.35);
    // 머리 장식: 구슬을 감싸는 초승달 고리
    ctx.beginPath();
    ctx.arc(0, -17.5, 3.6, Math.PI * 0.1, Math.PI * 0.9, true);
    ctx.strokeStyle = '#c9a23a';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -17.5, 3.6, Math.PI * 0.1, Math.PI * 0.9, true);
    ctx.strokeStyle = 'rgba(255, 245, 190, 0.7)';
    ctx.lineWidth = 0.3;
    ctx.stroke();
    aura(ctx, 0, -17.5, 6 + tier, tint, 0.6 + tier * 0.15);
    const g = ctx.createRadialGradient(-0.8, -18.4, 0.2, 0, -17.5, 2.8);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, tone(tint, 0.3));
    g.addColorStop(1, tone(tint, -0.45));
    ellipse(ctx, 0, -17.5, 2.4, 2.4, g, 'rgba(0,0,0,0.5)', 0.35);
    ellipse(ctx, -0.7, -18.3, 0.6, 0.45, 'rgba(255,255,255,0.9)', null);
    // 매단 끈
    line(ctx, 0.5, -13.5, 2.6, -9, tone(tint, -0.1), 0.5);
    line(ctx, -0.5, -13.5, -1.8, -8.5, tone(tint, 0.1), 0.5);
    if (tier >= 2) sparkle(ctx, 2.6, -20.5, 1.2);
  } else if (wtype === 'fan') {
    if (tier) aura(ctx, 0, -3.5, 7, tint, tier / 3);
    const r = 7.2;
    const a0 = -Math.PI * 0.88;
    const a1 = -Math.PI * 0.12;
    // 부채 종이: 안쪽은 비우고 바깥 띠에 무늬
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a1);
    ctx.arc(0, 0, 2.2, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = lin(ctx, -r, -r, r, 0, [[0, '#fffdf5'], [0.5, tone(tint, 0.45)], [1, tone(tint, 0)]]);
    ctx.fill();
    ctx.lineWidth = 0.4;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    // 무늬: 구름 같은 둥근 점과 바깥 띠
    ctx.beginPath();
    ctx.arc(0, 0, r - 0.9, a0, a1);
    ctx.strokeStyle = tone(tint, -0.35);
    ctx.lineWidth = 0.6;
    ctx.stroke();
    for (const a of [-0.7, -0.5, -0.3]) ellipse(ctx, Math.cos(a * Math.PI) * 4.6, Math.sin(a * Math.PI) * 4.6, 0.8, 0.8, tone(tint, -0.25), null);
    for (let i = 0; i <= 8; i++) {
      const a = a0 + (i / 8) * (a1 - a0);
      line(ctx, Math.cos(a) * 1, Math.sin(a) * 1, Math.cos(a) * (r - 0.3), Math.sin(a) * (r - 0.3), 'rgba(110, 70, 30, 0.45)', 0.25);
    }
    // 겉살과 사북(못)
    line(ctx, 0, 0, Math.cos(a0) * r, Math.sin(a0) * r, '#5b3a1e', 0.7);
    line(ctx, 0, 0, Math.cos(a1) * r, Math.sin(a1) * r, '#5b3a1e', 0.7);
    line(ctx, 0, 0, 0, 2.8, '#5b3a1e', 1.1);
    ellipse(ctx, 0, 0.3, 0.6, 0.6, '#f4d03f', 'rgba(0,0,0,0.5)', 0.2);
    tassel(ctx, 0, 2.8, tone(tint, -0.15));
    if (tier >= 3) sparkle(ctx, -4, -6, 1.2);
  }
  ctx.restore();
}

function weaponPose(dir, pose, wtype) {
  const attack = pose === 'attack';
  if (dir === 'side') {
    if (attack) return [8.6, 25.4, wtype === 'staff' ? -Math.PI * 0.75 : -Math.PI];
    return [pose === 'walk' ? 12.6 : 14.6, pose === 'walk' ? 32.5 : 33.4, wtype === 'staff' ? -Math.PI / 2 : -Math.PI * 0.62];
  }
  if (attack) return [26, 28, wtype === 'staff' ? -Math.PI * 0.4 : -Math.PI * 0.15];
  return [24.2, 33, wtype === 'staff' ? -Math.PI / 2 : -Math.PI * 0.38];
}

/** 캐릭터 한 장을 그린다. ctx는 32×48 논리 좌표(배율은 호출하는 쪽에서 미리 걸어 둔다). */
// 원작풍 체형(약 4등신): 머리는 작게, 몸통은 위로, 다리는 길게. 각 부분을 그릴 때 좌표를 옮긴다.
const HEAD = { cx: 16, cy: 10.5, scale: 0.68, from: 13 };
const BODY_UP = 4;
const LEG_TOP = 31;
const LEG_STRETCH = 1.5;

function withHead(ctx, draw) {
  ctx.save();
  ctx.translate(HEAD.cx, HEAD.cy);
  ctx.scale(HEAD.scale, HEAD.scale);
  ctx.translate(-HEAD.cx, -HEAD.from);
  draw();
  ctx.restore();
}

function withBody(ctx, draw) {
  ctx.save();
  ctx.translate(0, -BODY_UP);
  draw();
  ctx.restore();
}

function withLegs(ctx, seated, draw) {
  ctx.save();
  if (seated) ctx.translate(0, -BODY_UP);
  else {
    ctx.translate(0, LEG_TOP);
    ctx.scale(1, LEG_STRETCH);
    ctx.translate(0, -(LEG_TOP + BODY_UP));
  }
  draw();
  ctx.restore();
}

/** 캐릭터 한 장을 그린다. ctx는 32×48 논리 좌표(배율은 호출하는 쪽에서 미리 걸어 둔다). */
export function drawCharacter(ctx, { look, gender = 'm', dir = 'down', pose = 'stand', blink = false, equip = {}, items, seated = false }) {
  const armor = equip.armor && items[equip.armor];
  const neck = equip.necklace && items[equip.necklace];
  const wpn = equip.weapon && items[equip.weapon];
  const female = gender === 'f';
  const c = {
    body: look.body, trim: armor?.trim?.d ?? look.dark, collar: armor?.trim?.w ?? '#f4f1ea',
    hair: look.hair, skin: look.skin ?? '#f5cba7', pants: '#3e2723', shoulder: armor?.shoulder,
  };
  ctx.lineJoin = 'round';
  const holdBehind = dir === 'up';
  const wp = wpn ? (seated && dir === 'side' && pose !== 'attack' && pose !== 'cast' ? [10.5, 29, wpn.wtype === 'staff' ? -Math.PI / 2 : -Math.PI * 0.62] : weaponPose(dir, pose, wpn.wtype)) : null;
  if (wpn && holdBehind) withBody(ctx, () => weapon(ctx, wpn.wtype, wpn.tint, 23.5, 31, -Math.PI * 0.6, wpn.tier));
  if (female && dir === 'down') {
    // 등 뒤로 늘어진 긴 머리
    withHead(ctx, () => shape(ctx, [[9, 12], [23, 12], [22.5, 30, 24.5, 24], [9.5, 30, 16, 32], [9, 12, 7.5, 24]], tone(c.hair, -0.15), null));
  }
  withLegs(ctx, seated, () => legs(ctx, dir, pose, c, seated));
  withBody(ctx, () => {
    body(ctx, dir, c, female, seated);
    if (neck && dir !== 'up') ellipse(ctx, dir === 'side' ? 13.5 : 16, 23.2, 1.1, 1.1, neck.gem ?? '#fdfefe', 'rgba(0,0,0,0.4)', 0.3);
  });
  withHead(ctx, () => {
    head(ctx, dir, c, female, (blink || pose === 'cast') && dir !== 'up');
    hat(ctx, equip.helmet ?? look.hat, items);
  });
  withBody(ctx, () => {
    arms(ctx, dir, pose, c, seated);
    if (wpn && !holdBehind && pose !== 'cast') weapon(ctx, wpn.wtype, wpn.tint, wp[0], wp[1], wp[2], wpn.tier);
    if (pose === 'cast' && dir !== 'up') {
      // 모은 손끝에 맺히는 빛
      const gx = dir === 'side' ? 11 : 16;
      const g = ctx.createRadialGradient(gx, 26.5, 0.2, gx, 26.5, 5);
      g.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
      g.addColorStop(0.35, 'rgba(255, 220, 120, 0.55)');
      g.addColorStop(1, 'rgba(255, 200, 80, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(gx - 5, 21.5, 10, 10);
    }
  });
}
