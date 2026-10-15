import { TILE, VIEW_TILES } from '../config.js';
import { renderMapCanvas } from './tiles.js';
import { playerSprite, npcSprite, monsterSprite, monsterScale } from './sprites.js';
import { drawEffect } from './effects.js';
import { Ambient } from './ambient.js';
import { treeSprite } from './trees.js';
import { lerpPos } from '../world/dirs.js';
import { DEFAULT_WINDUP_MS } from '../world/monsters.js';
import { MONSTERS } from '../data/monsters.js';
import { ITEMS } from '../data/items.js';
import { MAP_DEFS } from '../data/maps.js';

const GOLD_ID = '__gold'; // game.js 의 바닥 돈 표시

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// 하루 = 20분(게임 시간). 0~0.5 낮, 0.5~0.6 저녁, 0.6~0.9 밤, 0.9~1 새벽
export const DAY_MS = 20 * 60 * 1000;
const CAVES = new Set(['goblinCave', 'bossLair', 'dragonCave', 'trainingBlue', 'trainingRed', 'zodiacTemple']);

function darknessFor(game) {
  if (game.mapDef.indoor) return 0;
  if (CAVES.has(game.mapId)) return 0.42;
  const t = ((game.now + DAY_MS * 0.25) % DAY_MS) / DAY_MS;
  if (t < 0.5) return 0;
  if (t < 0.6) return ((t - 0.5) / 0.1) * 0.5;
  if (t < 0.9) return 0.5;
  return (1 - (t - 0.9) / 0.1) * 0.5;
}
const FONT = "-apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

function label(ctx, text, x, y, color, size = 8) {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** 머리 위 말풍선 */
function bubble(ctx, text, x, y, { bg = '#fffdf5', fg = '#3b2a1a', size = 8 } = {}) {
  ctx.font = `bold ${size}px ${FONT}`;
  const w = ctx.measureText(text).width + 8;
  const h = size + 6;
  const bx = x - w / 2;
  const by = y - h - 4;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(bx + 1, by + 1, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(bx, by, w, h);
  ctx.fillRect(x - 2, by + h, 4, 3);
  ctx.strokeStyle = '#3b2a1a';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, h - 1);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + h / 2 + 0.5);
}

function shadow(ctx, cx, cy, w) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, w, w * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSprite(ctx, img, x, y, flip) {
  if (!flip) {
    ctx.drawImage(img, Math.round(x), Math.round(y));
    return;
  }
  ctx.save();
  ctx.translate(Math.round(x) + img.width, Math.round(y));
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

const spriteDir = (dir) => (dir === 'left' || dir === 'right' ? 'side' : dir);
// 사람마다 눈 깜빡이는 때가 조금씩 다르게
const blinking = (now, seed) => (now + seed * 977) % 3600 < 140;

const QUEST_MARK = { offer: { text: '!', color: '#ffd84d' }, ready: { text: '?', color: '#7dff9b' } };

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mapCanvas = null;
    this.mapId = null;
    this.camX = 0;
    this.camY = 0;
    this.lastTs = 0;
    this.bottomInset = 0; // 아래 상태 막대에 가려지는 높이(css px)
    this.rightInset = 0; // 오른쪽 상태창에 가려지는 폭(css px)
    this.ambient = new Ambient();
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.cssW = window.innerWidth;
    this.cssH = window.innerHeight;
    this.dpr = dpr;
    this.canvas.width = Math.round(this.cssW * dpr);
    this.canvas.height = Math.round(this.cssH * dpr);
    this.scale = Math.min(this.cssW, this.cssH) / (VIEW_TILES * TILE);
  }

  screenToTile(cssX, cssY) {
    return {
      x: Math.floor((cssX / this.scale + this.camX) / TILE),
      y: Math.floor((cssY / this.scale + this.camY) / TILE),
    };
  }

  render(game, ts = performance.now()) {
    const dt = Math.min(50, ts - (this.lastTs || ts));
    this.lastTs = ts;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0d14';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!game) return;

    if (game.mapId !== this.mapId) {
      this.mapCanvas = renderMapCanvas(game.map.tiles);
      this.mapId = game.mapId;
      this.trees = this.findTrees(game.map.tiles);
    }
    const k = this.scale * this.dpr;
    const viewW = this.cssW / this.scale;
    const viewH = this.cssH / this.scale;
    const mapW = game.map.w * TILE;
    const mapH = game.map.h * TILE;
    const pp = lerpPos(game.pe);
    // 아래 상태 막대를 뺀 영역의 가운데에 캐릭터가 오도록, 맵 끝도 막대 위로 보이게 한다
    const inset = this.bottomInset / this.scale;
    const visibleH = viewH - inset;
    const visibleW = viewW - this.rightInset / this.scale;
    let camX = mapW <= visibleW ? (mapW - visibleW) / 2 : clamp(pp.x * TILE + TILE / 2 - visibleW / 2, 0, mapW - visibleW);
    let camY = mapH <= visibleH ? (mapH - visibleH) / 2 : clamp(pp.y * TILE + TILE / 2 - visibleH / 2, 0, mapH - visibleH);
    if (game.shakeUntil > game.now) {
      camX += (Math.random() - 0.5) * 6;
      camY += (Math.random() - 0.5) * 6;
    }
    this.camX = Math.round(camX * k) / k;
    this.camY = Math.round(camY * k) / k;

    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
    this.drawMap(ctx, viewW, viewH, mapW, mapH);
    this.drawWater(ctx, game, viewW, viewH);
    this.drawPortals(ctx, game);
    this.drawGroundItems(ctx, game);
    this.drawEntities(ctx, game);
    this.drawProjectiles(ctx, game);
    for (const e of game.effects) drawEffect(ctx, e, game.now);
    this.ambient.update(game.mapId, { x: this.camX, y: this.camY, w: viewW, h: viewH }, dt);
    this.ambient.draw(ctx, ts);
    this.drawDarkness(game, pp, k);
    ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
    this.drawTexts(ctx, game);

    if (game.dead) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(40,0,0,0.45)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /** 나무 칸 목록(바닥 종류에 따라 활엽수·소나무·눈 덮인 소나무) */
  findTrees(tiles) {
    const out = [];
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        if (tiles[y][x] !== 'T') continue;
        const near = [tiles[y + 1]?.[x], tiles[y - 1]?.[x], tiles[y]?.[x + 1], tiles[y]?.[x - 1]];
        let kind = 'green';
        if (near.includes('*')) kind = 'snow';
        else if (near.includes(';')) kind = 'pine';
        else if (near.includes(':')) kind = 'dry';
        out.push({ x, y, look: kind, variant: (x * 7 + y * 3) % 3 });
      }
    }
    return out;
  }

  drawMap(ctx, viewW, viewH, mapW, mapH) {
    const sx = clamp(Math.floor(this.camX), 0, mapW);
    const sy = clamp(Math.floor(this.camY), 0, mapH);
    const sw = Math.min(mapW - sx, Math.ceil(viewW) + 2);
    const sh = Math.min(mapH - sy, Math.ceil(viewH) + 2);
    if (sw > 0 && sh > 0) ctx.drawImage(this.mapCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
  }

  /** 밤낮(바깥)과 동굴의 어둠: 캐릭터 둘레만 등불처럼 밝게 */
  drawDarkness(game, pp, k) {
    const darkness = darknessFor(game);
    if (darkness <= 0.01) return;
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (!this.dark || this.dark.width !== W || this.dark.height !== H) {
      this.dark = Object.assign(document.createElement('canvas'), { width: W, height: H });
    }
    const d = this.dark.getContext('2d');
    d.globalCompositeOperation = 'source-over';
    d.clearRect(0, 0, W, H);
    d.fillStyle = `rgba(8, 12, 34, ${darkness})`;
    d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    const cx = (pp.x * TILE + 16 - this.camX) * k;
    const cy = (pp.y * TILE + 8 - this.camY) * k;
    const radius = 120 * k;
    const grad = d.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = grad;
    d.fillRect(0, 0, W, H);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.drawImage(this.dark, 0, 0);
  }

  /** 물 위로 반짝이는 물결 */
  drawWater(ctx, game, viewW, viewH) {
    const x0 = Math.max(0, Math.floor(this.camX / TILE));
    const y0 = Math.max(0, Math.floor(this.camY / TILE));
    const x1 = Math.min(game.map.w - 1, Math.ceil((this.camX + viewW) / TILE));
    const y1 = Math.min(game.map.h - 1, Math.ceil((this.camY + viewH) / TILE));
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let y = y0; y <= y1; y++) {
      const row = game.map.tiles[y];
      for (let x = x0; x <= x1; x++) {
        if (row[x] !== '~' && row[x] !== 'L') continue;
        const phase = ((game.now / 45 + x * 37 + y * 53) % 40) - 6;
        if (phase > 0 && phase < 24) ctx.fillRect(x * TILE + phase, y * TILE + 8 + ((x + y) % 3) * 6, 5, 1);
      }
    }
  }

  drawPortals(ctx, game) {
    const pulse = 0.35 + 0.2 * Math.sin(game.now / 250);
    for (const p of game.mapDef.portals) {
      if (p.door) {
        const cx = (p.x + p.w / 2) * TILE;
        const bob = Math.sin(game.now / 300) * 2;
        label(ctx, `▼ ${MAP_DEFS[p.to].name}`, cx, p.y * TILE - 2 + bob, '#ffe9a8', 8);
        continue;
      }
      ctx.fillStyle = `rgba(140, 220, 255, ${pulse})`;
      for (let y = p.y; y < p.y + p.h; y++) {
        for (let x = p.x; x < p.x + p.w; x++) {
          ctx.beginPath();
          ctx.ellipse(x * TILE + 16, y * TILE + 16, 13, 13, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const cx = (p.x + p.w / 2) * TILE;
      const top = p.y === 0 ? (p.y + p.h) * TILE + 12 : p.y * TILE - 2;
      const lx = clamp(cx, 40, game.map.w * TILE - 40);
      label(ctx, `▶ ${MAP_DEFS[p.to].name}`, lx, top, '#bfe9ff', 8);
    }
  }

  drawGroundItems(ctx, game) {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const g of game.groundItems) {
      const cx = g.x * TILE + 16;
      const cy = g.y * TILE + 18;
      shadow(ctx, cx, cy + 6, 6);
      const blink = g.expiresAt - game.now < 10000 && Math.floor(game.now / 200) % 2 === 0;
      if (blink) continue;
      const age = game.now - (g.spawnAt ?? -1e9);
      const bounce = age < 450 ? -Math.sin((age / 450) * Math.PI) * 12 : Math.sin((game.now + g.x * 100) / 300);
      ctx.fillText(g.id === GOLD_ID ? '💰' : ITEMS[g.id]?.icon ?? '❔', cx, cy - 1 + bounce);
    }
  }

  drawEntities(ctx, game) {
    const list = [...game.npcs, ...game.monsters, game.pe].map((e) => ({ e, p: lerpPos(e) }));
    const x0 = this.camX / TILE - 2;
    const y0 = this.camY / TILE - 2;
    const x1 = x0 + this.cssW / this.scale / TILE + 4;
    const y1 = y0 + this.cssH / this.scale / TILE + 4;
    for (const t of this.trees ?? []) {
      if (t.x >= x0 && t.x <= x1 && t.y >= y0 && t.y <= y1) list.push({ e: { kind: 'tree', ...t }, p: { x: t.x, y: t.y + 0.01 } });
    }
    list.sort((a, b) => a.p.y - b.p.y);
    for (const { e, p } of list) {
      const x = p.x * TILE;
      const y = p.y * TILE;
      if (e.kind === 'tree') {
        // 플레이어가 나무 바로 뒤에 있으면 잎을 반투명하게
        const behind = game.pe.x === e.x && (game.pe.y === e.y - 1);
        ctx.globalAlpha = behind ? 0.55 : 1;
        ctx.drawImage(treeSprite(e.look, e.variant), x, y - 22);
        ctx.globalAlpha = 1;
        continue;
      }
      if (e.kind === 'player') this.drawPlayer(ctx, game, e, x, y);
      else if (e.kind === 'npc') this.drawNpc(ctx, game, e, x, y);
      else this.drawMonster(ctx, game, e, x, y);
    }
  }

  drawPlayer(ctx, game, pe, x, y) {
    shadow(ctx, x + 16, y + 30, 9);
    let pose = pe.moving && pe.stepT < 0.6 ? 'walk' : 'stand';
    if (game.castPoseUntil > game.now) pose = 'cast';
    else if (game.attackPoseUntil > game.now) pose = 'attack';
    const breathe = pose === 'stand' && Math.floor(game.now / 650) % 2 ? 1 : 0;
    const lunge = pose === 'attack' ? 3 : 0;
    const [ldx, ldy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[pe.dir];
    const img = playerSprite(game.player.cls, {
      gender: game.player.gender, dir: spriteDir(pe.dir), pose, equip: game.player.equip, blink: blinking(game.now, 1),
    });
    if (pose === 'cast') this.drawCastCircle(ctx, x + 16, y + 28, game.now);
    const riding = game.riding;
    if (riding) this.drawHorse(ctx, x, y, pe.dir === 'right', pe.moving ? Math.floor(game.now / 120) % 2 : 0);
    ctx.globalAlpha = game.dead ? 0.35 : game.isStealthed() ? 0.4 : 1;
    drawSprite(ctx, img, x + ldx * lunge, y - 18 + breathe + ldy * lunge - (riding ? 10 : 0), pe.dir === 'right');
    ctx.globalAlpha = 1;
    if (game.buffs.length || game.guardianUntil > game.now) {
      ctx.strokeStyle = game.guardianUntil > game.now ? 'rgba(255, 246, 213, 0.8)' : `rgba(255, 209, 102, ${0.4 + 0.2 * Math.sin(game.now / 150)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 29, 12, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const name = game.player.tier ? `${game.title()} ${game.player.name}` : game.player.name;
    label(ctx, name, x + 16, y - 18, game.player.gm.god ? '#ffd166' : '#ffffff');
    if (game.speech && game.speech.until > game.now) bubble(ctx, game.speech.text, x + 16, y - 26);
  }

  /** 말(옆모습, 갈색 몸통·검은 갈기). 오리지널 도트 */
  drawHorse(ctx, x, y, flip, gallop) {
    ctx.save();
    if (flip) {
      ctx.translate(x * 2 + 32, 0);
      ctx.scale(-1, 1);
    }
    const r = (px, py, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x + px * 2, y + py * 2, w * 2, h * 2);
    };
    r(2, 7, 12, 5, '#1a1110');
    r(3, 8, 10, 3, '#8b5a2b');
    r(0, 4, 4, 5, '#1a1110');
    r(1, 5, 2, 3, '#8b5a2b');
    r(1, 5, 1, 1, '#111');
    r(3, 4, 3, 2, '#2b1d14');
    r(13, 7, 2, 4, '#2b1d14');
    const legs = gallop ? [[3, 1], [6, 0], [9, 1], [12, 0]] : [[3, 0], [6, 0], [10, 0], [12, 0]];
    for (const [lx, off] of legs) r(lx + off, 12, 1, 3, '#5a3a1e');
    r(5, 7, 5, 1, '#c0392b');
    ctx.restore();
  }

  /** 시전할 때 발밑에 도는 법진 */
  drawCastCircle(ctx, cx, cy, now) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.45);
    ctx.rotate(now / 300);
    ctx.strokeStyle = 'rgba(255, 230, 140, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5;
      ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  drawNpc(ctx, game, n, x, y) {
    shadow(ctx, x + 16, y + 30, n.look === 'cat' ? 7 : 9);
    const img = npcSprite(n.look, spriteDir(n.dir), blinking(game.now, n.x * 3 + n.y));
    const flip = n.look === 'cat' ? n.face === 'right' : n.dir === 'right';
    const top = img.height > 32 ? 18 : 2;
    drawSprite(ctx, img, x, y - top, flip);
    label(ctx, n.name, x + 16, y - top, '#ffe08a');
    if (n.speech && n.speech.until > game.now) bubble(ctx, n.speech.text, x + 16, y - top - 8);
    const mark = this.npcMark(game, n);
    if (mark) {
      const hop = Math.abs(Math.sin(game.now / 250)) * 3;
      label(ctx, mark.text, x + 16, y - (img.height > 32 ? 27 : 11) - hop, mark.color, 13);
    }
  }

  npcMark(game, n) {
    if (n.advance) return game.advanceInfo().ok ? { text: '★', color: '#ffd84d' } : null;
    if (!game.player.quests[n.id]) return null;
    return QUEST_MARK[game.questInfo(n.id).state] ?? null;
  }

  drawMonster(ctx, game, m, x, y) {
    const d = MONSTERS[m.type];
    const scale = monsterScale(m.type);
    const img = monsterSprite(m.type);
    const size = 32 * scale;
    const stunned = game.now < m.stunUntil;
    const windup = m.engagedAt ? game.now - m.engagedAt : 0;
    const telegraph = windup > (d.windup ?? DEFAULT_WINDUP_MS) - 350 && game.now >= m.attackReadyAt - 350;
    let bob = 0;
    if (m.moving) bob = m.stepT < 0.5 ? -1 : 0;
    else if (!stunned) bob = Math.sin((game.now + m.id * 300) / 260) > 0.7 ? -1.5 : 0;
    const jitter = telegraph ? (Math.random() - 0.5) * 2 : 0;
    const dx = x + 16 - size / 2 + jitter;
    const dy = y + 32 - size + bob;
    shadow(ctx, x + 16, y + 29, 9 * scale);
    const flashing = game.now - m.hitAt < 120;
    ctx.globalAlpha = flashing ? 0.55 : 1;
    drawSprite(ctx, img, dx, dy, m.face === 'right');
    ctx.globalAlpha = 1;
    if (telegraph) {
      ctx.fillStyle = 'rgba(255, 60, 60, 0.25)';
      ctx.fillRect(dx, dy, size, size);
    }
    if (stunned) {
      ctx.fillStyle = 'rgba(133, 193, 233, 0.3)';
      ctx.fillRect(dx, dy, size, size);
      for (let i = 0; i < 3; i++) {
        const a = game.now / 200 + (i * Math.PI * 2) / 3;
        ctx.fillStyle = '#fff27a';
        ctx.fillRect(x + 16 + Math.cos(a) * 9 - 1, dy - 2 + Math.sin(a) * 3, 2, 2);
      }
    }
    const statusIcons = [
      m.curseUntil > game.now && '💀',
      m.dots?.some((t) => t.color === '#8be36b') && '🧪',
      m.dots?.some((t) => t.color === '#ffa25e') && '🔥',
    ].filter(Boolean);
    if (statusIcons.length) {
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(statusIcons.join(''), x + 16, dy - 10);
    }
    if (m.hp < m.maxHp || d.boss) {
      const bw = 24 * scale;
      const bx = x + 16 - bw / 2;
      const by = dy - 4;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
      ctx.fillStyle = d.boss ? '#ff4f9a' : '#e74c3c';
      ctx.fillRect(bx, by, bw * Math.max(0, m.hp / m.maxHp), 2);
      label(ctx, d.boss ? `${d.name} (보스)` : d.name, x + 16, by - 1, d.boss ? '#ff9fd0' : '#f5b7b1', d.boss ? 9 : 7);
    }
    if (m.emote && m.emote.until > game.now) {
      bubble(ctx, m.emote.text, x + 16, dy - (m.hp < m.maxHp || d.boss ? 22 : 2), { bg: m.emote.text === '!' ? '#fff3b0' : '#e8f4ff', size: 9 });
    }
  }

  drawProjectiles(ctx, game) {
    for (const p of game.projectiles) {
      const pos = lerpPos(p);
      const cx = pos.x * TILE + 16;
      const cy = pos.y * TILE + 16;
      if (p.visual === 'star') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(game.now / 40);
        ctx.fillStyle = p.color;
        ctx.fillRect(-6, -1.5, 12, 3);
        ctx.fillRect(-1.5, -6, 3, 12);
        ctx.restore();
        continue;
      }
      if (p.visual === 'wave') {
        const a = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[p.dir];
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx - Math.cos(a) * 8, cy - Math.sin(a) * 8, 14, a - 1, a + 1);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTexts(ctx, game) {
    for (const t of game.texts) {
      const f = (game.now - t.start) / t.dur;
      const pop = f < 0.15 ? 1 + (0.15 - f) * 3 : 1;
      ctx.globalAlpha = f > 0.7 ? (1 - f) / 0.3 : 1;
      label(ctx, t.text, t.x * TILE + 16, t.y * TILE + 4 - f * 18, t.color, Math.round((t.size ?? 10) * pop));
    }
    ctx.globalAlpha = 1;
  }
}
