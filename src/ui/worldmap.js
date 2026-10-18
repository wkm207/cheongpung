// 지도 창: [세계 지도] 지역 사이 길·뱃길·권장 레벨, [지금 있는 곳] 현재 맵을 크게(NPC·출구·몬스터).
import { MAP_DEFS } from '../data/maps.js';
import { MONSTERS } from '../data/monsters.js';
import { SOLID } from '../world/mapgen.js';
import { esc } from './dom.js';

// 세계 지도 위 칸 자리(열, 줄). 실제 출구 방향과 맞게 손으로 놓았다. 아래 두 줄은 바다 건너(뱃길).
const LAYOUT = {
  bossLair: [2, 0], goblinCave: [2, 1], forest: [2, 2],
  castle: [0, 3], village: [2, 3], field1: [3, 3], wolfHill: [4, 3], deepMountain: [5, 3],
  imugiSwamp: [5, 2], snowPass: [6, 2], dragonCave: [6, 1],
  skullDen1: [0, 2], haunted1: [0, 4], ratDen1: [2, 4], snakeDen1: [3, 4], pigDen1: [4, 4],
  trainingBlue: [0, 6], trainingRed: [1, 6], zodiacTemple: [2, 6], dragonPalace: [3, 6],
  northFortress: [4, 6], eastIsland: [5, 6], fireIsland: [6, 6],
};
const COLS = 7;
const ROWS = 7;
const SEA_ROW = 5.45;

/** 건물 안(실내)이면 바깥 맵으로, 굴 아래층이면 그 굴의 1층으로 */
function outdoorOf(id) {
  if (MAP_DEFS[id]?.denOf) return MAP_DEFS[id].denOf;
  let cur = id;
  for (let i = 0; i < 3 && MAP_DEFS[cur]?.indoor; i++) cur = MAP_DEFS[cur].portals[0]?.to ?? cur;
  return cur;
}

/** 굴이면 모든 층을, 아니면 그 맵의 출현 목록 */
function allSpawns(def) {
  if (!def.denOf) return def.spawns ?? [];
  return Object.values(MAP_DEFS).filter((d) => d.denOf === def.denOf).flatMap((d) => d.spawns);
}
const placeName = (def) => def.name.replace(/ 1층$/, '');

function levelRange(def) {
  const lv = allSpawns(def).map(([t]) => MONSTERS[t].level);
  return lv.length ? [Math.min(...lv), Math.max(...lv)] : null;
}

function ferries() {
  const out = [];
  for (const [from, def] of Object.entries(MAP_DEFS)) {
    for (const npc of def.npcs ?? []) for (const t of npc.travel ?? []) out.push({ from, npc: npc.name, ...t });
  }
  return out;
}

function sideOf(def, p) {
  if (p.door) return '건물 입구';
  if (p.x === 0) return '서쪽 출구';
  if (p.x + p.w >= def.w) return '동쪽 출구';
  if (p.y === 0) return '북쪽 출구';
  if (p.y + p.h >= def.h) return '남쪽 출구';
  return '출구';
}

/** 지역 색: 마을은 금색, 사냥터는 레벨이 높을수록 붉게 */
function nodeColor(def) {
  if (def.safe) return ['#f4d58a', '#8a6410'];
  const r = levelRange(def);
  const lv = r ? r[1] : 1;
  const t = Math.min(1, lv / 99);
  const hue = 120 - t * 120;
  return [`hsl(${hue}, 55%, 72%)`, `hsl(${hue}, 60%, 28%)`];
}

// ── HTML ────────────────────────────────────────────────
export function worldMapHtml(game, s) {
  const tab = s.wmTab ?? 'world';
  const sel = s.wmSel ?? outdoorOf(game.mapId);
  const tabs = `<div class="tabs">
    <button class="${tab === 'world' ? 'on' : ''}" data-act="wmTab" data-tab="world">세계 지도</button>
    <button class="${tab === 'here' ? 'on' : ''}" data-act="wmTab" data-tab="here">지금 있는 곳</button></div>`;
  const hint = tab === 'world'
    ? '<p class="hint">지역을 누르면 아래에 자세한 정보가 나옵니다. 점선은 청풍성 뱃사공의 뱃길입니다.</p>'
    : '<p class="hint">노란 점 NPC · 붉은 점 몬스터 · 분홍 큰 점 보스 · 하늘색 출구 · 흰 테두리가 나</p>';
  return `<header><h2>지도 <kbd>N</kbd></h2><button class="close" data-act="close" aria-label="닫기">✕</button></header>
    <div class="body">${tabs}${hint}
      <canvas class="wm-canvas" data-act="wmPick"></canvas>
      ${tab === 'world' ? placeInfo(game, sel) : placeInfo(game, game.mapId)}
    </div>`;
}

function placeInfo(game, id) {
  const def = MAP_DEFS[id];
  if (!def) return '';
  const r = levelRange(def);
  const here = outdoorOf(game.mapId) === id || game.mapId === id;
  const mons = [...new Set(allSpawns(def).map(([t]) => t))].map((t) => MONSTERS[t]).sort((a, b) => a.level - b.level);
  const monRows = mons.length
    ? mons.map((m) => `<span class="wm-mon${m.boss ? ' boss' : ''}">${m.boss ? '👑 ' : ''}${esc(m.name)} <small>Lv${m.level}</small></span>`).join('')
    : '<span class="muted">몬스터가 나오지 않는 안전한 곳</span>';
  const ways = def.portals.map((p) => `<li>${sideOf(def, p)} → <b>${esc(MAP_DEFS[p.to]?.name ?? p.to)}</b></li>`);
  for (const f of ferries()) {
    if (f.to === id) ways.push(`<li>⛵ ${esc(MAP_DEFS[f.from].name)} ${esc(f.npc)}의 배 · Lv${f.level} 이상 · ${f.cost.toLocaleString()}전</li>`);
    if (f.from === id) ways.push(`<li>⛵ ${esc(f.npc)}의 배 → <b>${esc(MAP_DEFS[f.to].name)}</b> <small class="muted">(Lv${f.level} · ${f.cost.toLocaleString()}전)</small></li>`);
  }
  const npcs = (def.npcs ?? []).map((n) => esc(n.name));
  for (const p of def.portals.filter((q) => q.door)) for (const n of MAP_DEFS[p.to]?.npcs ?? []) npcs.push(`${esc(n.name)} <small class="muted">(${esc(MAP_DEFS[p.to].name)})</small>`);
  return `<div class="wm-info">
    <h3>${esc(placeName(def))} ${here ? '<span class="badge new">현재 위치</span>' : ''}</h3>
    <div class="wm-line"><b>권장 레벨</b> ${r ? `Lv ${r[0]} ~ ${r[1]}` : '누구나'}${def.safe ? ' · 안전 지역' : ''}${def.minLevel ? ` · <b class="warn">Lv${def.minLevel}부터 입장</b>` : ''}${def.maxLevel ? ` · Lv${def.maxLevel} 넘으면 못 들어감` : ''}</div>
    ${def.denOf ? `<div class="wm-line"><b>층</b> ${Object.values(MAP_DEFS).filter((d) => d.denOf === def.denOf).map((d, i) => `${i + 1}층: ${[...new Set(d.spawns.map(([t]) => MONSTERS[t].name))].join('·')}`).join(' / ')}</div>` : ''}
    <div class="wm-line"><b>몬스터</b><div class="wm-mons">${monRows}</div></div>
    <div class="wm-line"><b>가는 길</b><ul>${ways.join('')}</ul></div>
    ${npcs.length ? `<div class="wm-line"><b>사람</b> ${npcs.join(' · ')}</div>` : ''}
  </div>`;
}

// ── 그리기 ──────────────────────────────────────────────
function fitCanvas(canvas, aspect) {
  // 너비는 CSS(100%)가 정하고, 높이만 비율에 맞춘다
  const w = canvas.clientWidth || 320;
  const h = Math.round(w * aspect);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.height = `${h}px`;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

function worldGeometry(w, h) {
  const cw = w / COLS;
  const ch = h / ROWS;
  return { cw, ch, center: (id) => [(LAYOUT[id][0] + 0.5) * cw, (LAYOUT[id][1] + 0.5) * ch], boxW: cw * 0.86, boxH: ch * 0.62 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWorld(canvas, game, s) {
  const { ctx, w, h } = fitCanvas(canvas, 0.9);
  const g = worldGeometry(w, h);
  // 땅과 바다
  const land = ctx.createLinearGradient(0, 0, 0, h);
  land.addColorStop(0, '#d9c99a');
  land.addColorStop(1, '#c9b27a');
  ctx.fillStyle = land;
  ctx.fillRect(0, 0, w, h);
  const seaY = SEA_ROW * g.ch;
  const sea = ctx.createLinearGradient(0, seaY, 0, h);
  sea.addColorStop(0, '#7fb6d9');
  sea.addColorStop(1, '#3d7fb0');
  ctx.fillStyle = sea;
  ctx.beginPath();
  ctx.moveTo(0, seaY);
  for (let x = 0; x <= w; x += 12) ctx.lineTo(x, seaY + Math.sin(x / 18) * 3);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `bold ${Math.max(9, g.ch * 0.16)}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('바다 건너 (청풍성 뱃길)', w - 6, seaY + g.ch * 0.25);
  // 길(출구로 이어진 곳). 뱃길로 오가는 곳의 돌아오는 출구는 길로 그리지 않는다
  const sailed = new Set(ferries().map((f) => [f.from, f.to].sort().join('-')));
  const drawn = new Set(sailed);
  ctx.lineCap = 'round';
  for (const [id, def] of Object.entries(MAP_DEFS)) {
    if (!LAYOUT[id]) continue;
    for (const p of def.portals) {
      const to = outdoorOf(p.to);
      if (!LAYOUT[to] || to === id) continue;
      const key = [id, to].sort().join('-');
      if (drawn.has(key)) continue;
      drawn.add(key);
      const [x0, y0] = g.center(id);
      const [x1, y1] = g.center(to);
      ctx.strokeStyle = '#8a6a3a';
      ctx.lineWidth = Math.max(3, g.ch * 0.07);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = '#e8d6a8';
      ctx.lineWidth = Math.max(1, g.ch * 0.025);
      ctx.stroke();
    }
  }
  // 뱃길
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.4;
  for (const f of ferries()) {
    if (!LAYOUT[f.from] || !LAYOUT[f.to]) continue;
    const [x0, y0] = g.center(f.from);
    const [x1, y1] = g.center(f.to);
    ctx.beginPath();
    ctx.moveTo(x0, y0 + g.boxH / 2);
    ctx.quadraticCurveTo(x0, (y0 + y1) / 2 + g.ch * 0.4, x1, y1 - g.boxH / 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // 지역 상자
  const here = outdoorOf(game.mapId);
  const sel = s.wmSel ?? here;
  const fs = Math.max(8, Math.min(13, g.cw * 0.13));
  for (const [id, def] of Object.entries(MAP_DEFS)) {
    if (!LAYOUT[id]) continue;
    const [cx, cy] = g.center(id);
    const [fill, ink] = nodeColor(def);
    const x = cx - g.boxW / 2;
    const y = cy - g.boxH / 2;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    roundRect(ctx, x, y, g.boxW, g.boxH, 6);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = id === sel ? 2.5 : 1.2;
    ctx.strokeStyle = id === sel ? '#1b4fd8' : ink;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fs}px sans-serif`;
    const boss = allSpawns(def).some(([t]) => MONSTERS[t].boss);
    ctx.fillText(`${boss ? '👑' : ''}${placeName(def)}`, cx, cy - fs * 0.45, g.boxW - 4);
    const r = levelRange(def);
    ctx.font = `${fs * 0.82}px sans-serif`;
    ctx.fillText(r ? `Lv ${r[0]}~${r[1]}` : '마을', cx, cy + fs * 0.7, g.boxW - 4);
    if (id === here) {
      // 현재 위치 깃발
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 200);
      ctx.fillStyle = `rgba(220, 40, 40, ${pulse})`;
      ctx.beginPath();
      ctx.arc(x + g.boxW - 4, y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('나', x + g.boxW - 4, y + 4.5);
    }
  }
  canvas.pick = (px, py) => Object.keys(LAYOUT).find((id) => {
    const [cx, cy] = g.center(id);
    return Math.abs(px - cx) <= g.boxW / 2 && Math.abs(py - cy) <= g.boxH / 2;
  }) ?? null;
}

const TILE_COLORS = {
  '~': '#2f6db5', '=': '#b8955e', S: '#9a958a', c: '#5a4a3c', '*': '#e6edf3', ':': '#8f8f4c', ';': '#2f5528', u: '#c08a52', d: '#c98a4b', M: '#5a2e1c', g: '#3a2c22', N: '#1a1418', L: '#d4451f', a: '#3a2e2a',
};

function drawHere(canvas, game) {
  const { w: mw, h: mh, tiles } = game.map;
  const { ctx, w, h } = fitCanvas(canvas, Math.min(1.1, mh / mw));
  const sc = Math.min(w / mw, h / mh);
  const ox = (w - mw * sc) / 2;
  const oy = (h - mh * sc) / 2;
  ctx.fillStyle = '#0f0905';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const t = tiles[y][x];
      let c = TILE_COLORS[t] ?? (SOLID.has(t) ? '#1e2a16' : '#4e8a3a');
      if (t === 'T' || t === 'O') c = '#1e3a1a';
      if (['W', 'R', 'Y', 'D', 'Q', 'G', 'J', 'K', 'X', 'w', 'F'].includes(t)) c = t === 'X' ? '#241c17' : '#6b5238';
      ctx.fillStyle = c;
      ctx.fillRect(ox + x * sc, oy + y * sc, Math.ceil(sc), Math.ceil(sc));
    }
  }
  const at = (x, y) => [ox + (x + 0.5) * sc, oy + (y + 0.5) * sc];
  const tag = (text, x, y, color) => {
    ctx.font = `bold ${Math.max(9, sc * 1.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const tw = ctx.measureText(text).width + 6;
    const cx = Math.max(tw / 2 + 2, Math.min(w - tw / 2 - 2, x));
    const cy = Math.max(14, y);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - tw / 2, cy - 13, tw, 13);
    ctx.fillStyle = color;
    ctx.fillText(text, cx, cy - 1);
  };
  for (const m of game.monsters) {
    const boss = MONSTERS[m.type].boss;
    const [x, y] = at(m.x, m.y);
    ctx.fillStyle = boss ? '#ff4fd8' : '#ff4d4d';
    ctx.beginPath();
    ctx.arc(x, y, boss ? Math.max(3, sc * 0.9) : Math.max(1.6, sc * 0.4), 0, Math.PI * 2);
    ctx.fill();
    if (boss) tag(`👑 ${MONSTERS[m.type].name}`, x, y - sc, '#ffb3ec');
  }
  for (const p of game.mapDef.portals) {
    const [x, y] = at(p.x + (p.w - 1) / 2, p.y + (p.h - 1) / 2);
    ctx.fillStyle = '#7fe3ff';
    ctx.fillRect(ox + p.x * sc - 1, oy + p.y * sc - 1, p.w * sc + 2, p.h * sc + 2);
    tag(`▶ ${MAP_DEFS[p.to]?.name ?? p.to}`, x, y - sc * 0.6, '#bfeeff');
  }
  for (const n of game.npcs) {
    const [x, y] = at(n.x, n.y);
    ctx.fillStyle = '#ffd84d';
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2.5, sc * 0.55), 0, Math.PI * 2);
    ctx.fill();
    tag(n.name, x, y - sc * 0.6, '#ffe9a8');
  }
  const [px, py] = at(game.pe.x, game.pe.y);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1b4fd8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, Math.max(4, sc * 0.8), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  tag('나', px, py - sc, '#ffffff');
  canvas.pick = () => null;
}

/** 패널을 그린 뒤 캔버스를 채운다 */
export function drawWorldMap(panel, game, s) {
  const canvas = panel.querySelector('.wm-canvas');
  if (!canvas) return;
  if ((s.wmTab ?? 'world') === 'world') drawWorld(canvas, game, s);
  else drawHere(canvas, game);
}

/** 캔버스를 누른 곳의 지역 id */
export function pickWorldMap(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return canvas.pick?.(e.clientX - r.left, e.clientY - r.top) ?? null;
}
