import { TILE, VIEW_TILES, CLASSIC_VIEW_TILES } from '../config.js';
import { renderMapCanvas } from './tiles.js';
import { playerSprite, npcSprite, monsterSprite, monsterScale, MONSTER_LOOK } from './sprites.js';
import { mobSprite, mobStep, mobHover } from './mobs.js';
import { drawEffect } from './effects.js';
import { Ambient } from './ambient.js';
import { treeSprite } from './trees.js';
import { smoothMap } from './smooth.js';
import { isClassic, isNinja, dotify } from './artmode.js';
import { ninjaReady, renderNinjaMap, ninjaTree } from './ninja.js';
import { playerLook, npcLook, drawPerson, walkStep } from './people.js';
import { drawHazards, drawEnemyShots, drawFoeCasting, drawStrikeTell } from './foes.js';
import { lerpPos } from '../world/dirs.js';
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

// 스프라이트는 고해상도로 만들어 두고 원래 크기(lw×lh)로 그린다
function drawSprite(ctx, img, x, y, flip) {
  const w = img.lw ?? img.width;
  const h = img.lh ?? img.height;
  if (!flip) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }
  ctx.save();
  ctx.translate(x + w, y);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();
}

// 말 탄 도트 사람: 몸을 이만큼 올리고 엉덩이 아래(다리)는 가린다. 말은 조금 키운다
const RIDER_LIFT = 13;
const RIDER_HIP = 8; // 칸 위쪽 기준 엉덩이 높이
const PERSON_HORSE_SCALE = 1.35;
// 도트 사람 머리 위 이름표 자리(칸 위쪽 기준)
const PERSON_LABEL = 22;

/** (cx,cy)를 기준으로 k배 키워 그리기 */
function scaledAt(ctx, cx, cy, k, draw) {
  if (k === 1) return draw();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, k);
  ctx.translate(-cx, -cy);
  draw();
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
    // 원작풍은 더 멀리서 내려다본다(한 화면에 더 많은 칸)
    // 새 도트 모드는 원작처럼 가깝게: 짧은 변에 10~15칸(폰 세로 화면은 10~11칸), 옛 원작풍 도트는 멀리서
    const short = Math.min(this.cssW, this.cssH);
    const tiles = isClassic() && !isNinja() ? CLASSIC_VIEW_TILES : Math.max(10, Math.min(VIEW_TILES, Math.round(short / 34)));
    this.scale = short / (tiles * TILE);
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

    const ninja = isNinja() && ninjaReady();
    const mapKey = `${game.mapId}:${isClassic()}:${ninja}`;
    if (mapKey !== this.mapId) {
      // 새 타일 → 기존 그림 위에 덧그림, 원작풍 → 도트 그대로, 매끈 → 계단을 둥글리고 살짝 번지게
      if (ninja) this.mapCanvas = renderNinjaMap(game.map.tiles, renderMapCanvas(game.map.tiles));
      else this.mapCanvas = isClassic() ? renderMapCanvas(game.map.tiles) : smoothMap(renderMapCanvas(game.map.tiles));
      this.mapId = mapKey;
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

    ctx.imageSmoothingEnabled = !isClassic();
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);
    this.drawMap(ctx, viewW, viewH, mapW, mapH);
    this.drawWater(ctx, game, viewW, viewH);
    this.drawPortals(ctx, game);
    drawHazards(ctx, game);
    this.drawGroundItems(ctx, game);
    this.drawEntities(ctx, game);
    this.drawProjectiles(ctx, game);
    drawEnemyShots(ctx, game);
    for (const e of game.effects) drawEffect(ctx, e, game.now);
    this.ambient.update(game.mapId, { x: this.camX, y: this.camY, w: viewW, h: viewH }, dt);
    this.ambient.draw(ctx, ts);
    this.drawLight();
    this.drawScreenFlash(game);
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
        out.push({ x, y, look: kind, variant: (x * 13 + y * 7) % 11 === 0 ? 3 : (x * 7 + y * 3) % 3 });
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
  /** 화면 전체 기술: 화면이 그 기술 빛깔로 번쩍였다가 잦아든다 */
  drawScreenFlash(game) {
    const fl = game.screenFlash;
    if (!fl) return;
    const f = (game.now - fl.start) / fl.dur;
    if (f >= 1 || f < 0) return;
    const n = parseInt(fl.color.slice(1), 16);
    const a = f < 0.15 ? f / 0.15 : 1 - (f - 0.15) / 0.85;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a * 0.32})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** 햇빛과 가장자리 그늘: 왼쪽 위에서 따뜻한 빛이 들고 화면 가장자리는 살짝 어둡게 */
  drawLight() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (!this.light || this.light.width !== W || this.light.height !== H) {
      this.light = Object.assign(document.createElement('canvas'), { width: W, height: H });
      const l = this.light.getContext('2d');
      const sun = l.createLinearGradient(0, 0, W, H);
      sun.addColorStop(0, 'rgba(255, 236, 190, 0.16)');
      sun.addColorStop(0.5, 'rgba(255, 236, 190, 0)');
      sun.addColorStop(1, 'rgba(30, 20, 60, 0.12)');
      l.fillStyle = sun;
      l.fillRect(0, 0, W, H);
      const r = Math.hypot(W, H) / 2;
      const vig = l.createRadialGradient(W / 2, H / 2, r * 0.55, W / 2, H / 2, r);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(10, 6, 20, 0.32)');
      l.fillStyle = vig;
      l.fillRect(0, 0, W, H);
    }
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.drawImage(this.light, 0, 0);
  }

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
        const big = isNinja() ? ninjaTree(e.look, e.variant) : null;
        if (big) ctx.drawImage(big, x + 16 - big.lw / 2, y + 34 - big.lh, big.lw, big.lh);
        else ctx.drawImage(treeSprite(e.look, e.variant), x, y - 22, 32, 48);
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
    const riding = game.riding;
    // 말을 타면 늘 옆모습으로 걸터앉는다(위·아래로 갈 때는 마지막으로 본 좌우 방향 유지)
    if (pe.dir === 'left' || pe.dir === 'right') this.rideFace = pe.dir;
    const faceRight = riding ? this.rideFace === 'right' : pe.dir === 'right';
    // 말을 탈 때 위로 가면 뒷모습, 아래로 가면 앞모습, 옆으로 가면 옆모습
    const rideView = pe.dir === 'up' ? 'up' : pe.dir === 'down' ? 'down' : 'side';
    const img = playerSprite(game.player.cls, {
      gender: game.player.gender, dir: riding ? rideView : spriteDir(pe.dir), pose: riding && pose === 'walk' ? 'stand' : pose,
      equip: game.player.equip, blink: blinking(game.now, 1), seated: !!riding,
    });
    if (pose === 'cast') this.drawCastCircle(ctx, x + 16, y + 28, game.now);
    const gallop = pe.moving ? game.now : 0;
    const horseK = isNinja() ? PERSON_HORSE_SCALE : 1;
    if (riding && rideView === 'side') scaledAt(ctx, x + 16, y + 31, horseK, () => this.drawHorse(ctx, x, y, faceRight, gallop));
    else if (riding) scaledAt(ctx, x + 16, y + 31, horseK, () => this.drawHorseFacing(ctx, x, y, rideView, gallop, 'back'));
    ctx.globalAlpha = game.dead ? 0.35 : game.isStealthed() ? 0.4 : game.isDodging() ? 0.75 : 1;
    const rollT = (game.now - (game.rollStart ?? -1e9)) / 330;
    if (isNinja()) this.drawDotPlayer(ctx, game, pe, x, y, pose, rollT, riding, rideView, gallop);
    else if (rollT < 1) {
      // 구르기: 몸을 한 바퀴 돌린다
      const cx = x + 16;
      const cy = y + 6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((pe.dir === 'left' ? -1 : 1) * rollT * Math.PI * 2);
      ctx.scale(1, 0.85);
      drawSprite(ctx, img, -16, -24, pe.dir === 'right');
      ctx.restore();
    } else {
      const bounce = riding && pe.moving ? Math.abs(Math.sin(game.now / 90)) * 1.5 : 0;
      if (riding && rideView === 'side') drawSprite(ctx, img, x + (faceRight ? 1 : -1), y - 18 - bounce, faceRight);
      else if (riding) {
        drawSprite(ctx, img, x, y - 18 - bounce, false);
        this.drawHorseFacing(ctx, x, y, rideView, gallop, 'front');
      }
      else drawSprite(ctx, img, x + ldx * lunge, y - 18 + breathe + ldy * lunge, pe.dir === 'right');
    }
    ctx.globalAlpha = 1;
    if (game.buffs.length || game.guardianUntil > game.now) {
      ctx.strokeStyle = game.guardianUntil > game.now ? 'rgba(255, 246, 213, 0.8)' : `rgba(255, 209, 102, ${0.4 + 0.2 * Math.sin(game.now / 150)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x + 16, y + 29, 12, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const name = `Lv${game.player.level} ${game.player.tier ? `${game.title()} ` : ''}${game.player.name}`;
    const top = y - (isNinja() ? PERSON_LABEL + (riding ? RIDER_LIFT : 0) : riding ? 22 : 18);
    this.drawVitals(ctx, game, x + 16, top - 1);
    label(ctx, name, x + 16, top - 6, game.player.gm.god ? '#ffd166' : '#ffffff');
    if (game.speech && game.speech.until > game.now) bubble(ctx, game.speech.text, x + 16, top - 14);
  }

  /** 큰 머리 도트 사람으로 플레이어 그리기: 걷기·휘두르기·마법 자세·쓰러짐·구르기·말 타기 */
  drawDotPlayer(ctx, game, pe, x, y, pose, rollT, riding, rideView, gallop) {
    const look = playerLook(game.player);
    const dir = riding && rideView === 'side' ? this.rideFace : pe.dir;
    let opts = { step: riding ? 0 : walkStep(pe.moving, game.now) };
    if (pose === 'cast') opts = { pose: 'cast' };
    else if (pose === 'attack') opts = { pose: 'attack', phase: Math.max(0, Math.min(3, Math.floor(((200 - (game.attackPoseUntil - game.now)) / 200) * 4))) };
    if (game.dead || rollT < 1) {
      // 쓰러지면 옆으로 눕고, 구르면 한 바퀴
      ctx.save();
      ctx.translate(x + 16, y + 20);
      ctx.rotate(game.dead ? Math.PI / 2 : (pe.dir === 'left' ? -1 : 1) * rollT * Math.PI * 2);
      drawPerson(ctx, look, pe.dir, {}, -16, -20);
      ctx.restore();
      return;
    }
    if (!riding) {
      drawPerson(ctx, look, dir, opts, x, y);
      return;
    }
    // 말 위: 엉덩이 위쪽만 안장에 앉힌다
    const bounce = pe.moving ? Math.abs(Math.sin(game.now / 90)) * 1.5 : 0;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 40, y - 60, 112, 60 + RIDER_HIP - bounce);
    ctx.clip();
    drawPerson(ctx, look, dir, opts, x, y, RIDER_LIFT + bounce);
    ctx.restore();
    if (rideView !== 'side') scaledAt(ctx, x + 16, y + 31, PERSON_HORSE_SCALE, () => this.drawHorseFacing(ctx, x, y, rideView, gallop, 'front'));
  }

  /** 머리 위 체력(빨강)·마력(파랑) 막대 */
  drawVitals(ctx, game, cx, y) {
    const s = game.stats();
    const w = 26;
    const x = cx - w / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, game.player.hp / s.maxHp)), 2);
    ctx.fillStyle = '#3d7dff';
    ctx.fillRect(x, y + 2.5, w * Math.max(0, Math.min(1, game.player.mp / s.maxMp)), 2);
  }

  /** 말(옆모습, 왼쪽을 본다): 곡선으로 그린 갈색 말, 검은 갈기, 붉은 안장. t = 달리는 시각(멈추면 0) */
  drawHorse(ctx, x, y, flip, t) {
    this.drawHorseImage(ctx, x, y, `s:${flip ? 1 : 0}`, t, (c, tt) => this.paintHorse(c, flip, tt));
  }

  paintHorse(ctx, flip, t) {
    ctx.save();
    if (flip) {
      ctx.translate(32, 0);
      ctx.scale(-1, 1);
    }
    ctx.lineJoin = 'round';
    const coat = '#8b5a2b';
    const ink = 'rgba(40, 22, 10, 0.9)';
    const fill = (draw, color, stroke = ink) => {
      ctx.beginPath();
      draw();
      ctx.fillStyle = color;
      ctx.fill();
      if (stroke) {
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    };
    const grad = (x0, y0, x1, y1, a, b) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      return g;
    };
    // 다리: 달릴 때 앞뒤로 흔든다
    const swing = (phase) => (t ? Math.sin(t / 80 + phase) * 3 : 0);
    const leg = (hx, phase, near) => {
      const s = swing(phase);
      const color = near ? '#7a4e25' : '#5e3b1c';
      fill(() => {
        ctx.moveTo(hx - 1.4, 20);
        ctx.lineTo(hx + 1.4, 20);
        ctx.lineTo(hx + s + 0.9, 29);
        ctx.lineTo(hx + s - 0.9, 29);
        ctx.closePath();
      }, color);
      fill(() => ctx.ellipse(hx + s, 29.6, 1.4, 0.9, 0, 0, Math.PI * 2), '#1a1110', null);
    };
    leg(9.5, 0, false);
    leg(24.5, Math.PI, false);
    // 꼬리
    fill(() => {
      ctx.moveTo(27.5, 14);
      ctx.quadraticCurveTo(35 + swing(1), 16, 33 + swing(2), 26);
      ctx.quadraticCurveTo(30, 20, 27, 17);
      ctx.closePath();
    }, '#2a1a10');
    // 몸통
    fill(() => ctx.ellipse(17.5, 17.5, 11.5, 6, 0, 0, Math.PI * 2), grad(8, 11, 26, 24, '#b07a45', '#5e3b1c'));
    // 목과 머리
    fill(() => {
      ctx.moveTo(8.5, 15);
      ctx.quadraticCurveTo(5, 9, 5.5, 5);
      ctx.lineTo(9.5, 4.5);
      ctx.quadraticCurveTo(11.5, 9, 14, 13.5);
      ctx.closePath();
    }, grad(5, 4, 14, 15, '#a8743f', coat));
    fill(() => {
      ctx.save();
      ctx.translate(3.6, 7);
      ctx.rotate(0.55);
      ctx.ellipse(0, 0, 4.6, 2.5, 0, 0, Math.PI * 2);
      ctx.restore();
    }, grad(0, 4, 7, 10, '#b07a45', '#7a4e25'));
    fill(() => ctx.ellipse(1.2, 9.6, 1.6, 1.3, 0.5, 0, Math.PI * 2), '#4a2e16', null); // 주둥이
    fill(() => {
      ctx.moveTo(6.5, 3.2);
      ctx.lineTo(7.4, 0.4);
      ctx.lineTo(8.6, 3.6);
      ctx.closePath();
    }, '#7a4e25');
    fill(() => ctx.arc(4.4, 5.8, 0.75, 0, Math.PI * 2), '#111', null);
    fill(() => ctx.arc(4.2, 5.5, 0.25, 0, Math.PI * 2), '#fff', null);
    // 갈기
    fill(() => {
      ctx.moveTo(7.5, 3.5);
      ctx.quadraticCurveTo(10, 4, 10.5, 7);
      ctx.lineTo(13, 9);
      ctx.lineTo(12, 10.5);
      ctx.lineTo(14.5, 13);
      ctx.quadraticCurveTo(10, 11, 8.5, 6);
      ctx.closePath();
    }, '#2a1a10');
    // 앞쪽 다리
    leg(12, Math.PI / 2, true);
    leg(22, Math.PI * 1.5, true);
    // 안장과 고삐
    fill(() => {
      ctx.moveTo(12.5, 11.5);
      ctx.quadraticCurveTo(17.5, 14.5, 22.5, 11.5);
      ctx.lineTo(23, 17.5);
      ctx.quadraticCurveTo(17.5, 19.5, 12, 17.5);
      ctx.closePath();
    }, grad(12, 11, 23, 18, '#d64a3a', '#8b1a1a'));
    ctx.strokeStyle = '#f4d03f';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(12.3, 16.8);
    ctx.quadraticCurveTo(17.5, 18.8, 22.8, 16.8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60, 30, 10, 0.9)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(2.2, 8.6);
    ctx.quadraticCurveTo(7, 12, 11, 12.5);
    ctx.stroke();
    // 등자
    ctx.strokeStyle = '#9aa0a6';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(15.5, 17.5);
    ctx.lineTo(15, 22);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 앞·뒤를 보는 말. 탄 사람 뒤에 깔 부분(layer 'back')과 앞을 덮는 부분('front')을 나눠 그린다.
   * view 'down': 말 머리가 나를 본다(머리·목이 사람 앞), 'up': 엉덩이와 꼬리가 보인다(엉덩이가 사람 앞)
   */
  drawHorseFacing(ctx, x, y, view, t, layer) {
    this.drawHorseImage(ctx, x, y, `f:${view}:${layer}`, t, (c, tt) => this.paintHorseFacing(c, view, tt, layer));
  }

  /**
   * 말 그림을 걸음 단계(8단계)별로 미리 그려 두고 쓴다. 원작풍이면 도트로.
   * 그림 범위는 칸 기준 (-4,-4)~(36,32)
   */
  drawHorseImage(ctx, x, y, key, t, paint) {
    const phase = t ? Math.floor((((t / 80) % (Math.PI * 2)) / (Math.PI * 2)) * 8) : -1;
    const tt = phase < 0 ? 0 : ((phase + 0.5) / 8) * Math.PI * 2 * 80;
    const full = `${isClassic() ? 'px' : 'hd'}:${key}:${phase}`;
    this.horseCache ??= new Map();
    if (!this.horseCache.has(full)) {
      const draw = (c) => {
        c.translate(4, 4);
        paint(c, tt);
      };
      let img;
      if (isClassic()) img = dotify(40, 36, draw);
      else {
        img = Object.assign(document.createElement('canvas'), { width: 80, height: 72 });
        const c = img.getContext('2d');
        c.scale(2, 2);
        draw(c);
      }
      this.horseCache.set(full, img);
    }
    ctx.drawImage(this.horseCache.get(full), x - 4, y - 4, 40, 36);
  }

  paintHorseFacing(ctx, view, t, layer) {
    ctx.save();
    // 앞·뒷모습은 사람에 가려 작아 보이므로 조금 키운다
    ctx.translate(16, 31);
    ctx.scale(1.3, 1.25);
    ctx.translate(-16, -31);
    ctx.lineJoin = 'round';
    const ink = 'rgba(40, 22, 10, 0.9)';
    const fill = (draw, color, stroke = ink) => {
      ctx.beginPath();
      draw();
      ctx.fillStyle = color;
      ctx.fill();
      if (stroke) {
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
    };
    const grad = (x0, y0, x1, y1, a, b) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      return g;
    };
    const step = (phase) => (t ? Math.max(0, Math.sin(t / 80 + phase)) * 2.5 : 0);
    const leg = (lx, top, phase, color) => {
      const lift = step(phase);
      fill(() => {
        ctx.moveTo(lx - 1.5, top);
        ctx.lineTo(lx + 1.5, top);
        ctx.lineTo(lx + 1, 29.5 - lift);
        ctx.lineTo(lx - 1, 29.5 - lift);
        ctx.closePath();
      }, color);
      fill(() => ctx.ellipse(lx, 30 - lift, 1.5, 0.9, 0, 0, Math.PI * 2), '#1a1110', null);
    };
    const saddle = () => fill(() => {
      ctx.moveTo(9, 12.5);
      ctx.quadraticCurveTo(16, 10, 23, 12.5);
      ctx.lineTo(22.5, 18);
      ctx.quadraticCurveTo(16, 20, 9.5, 18);
      ctx.closePath();
    }, grad(9, 11, 23, 19, '#d64a3a', '#8b1a1a'));
    if (layer === 'back') {
      if (view === 'down') {
        // 몸통(앞에서 본 넓은 가슴)과 뒷다리
        leg(11, 20, Math.PI, '#5e3b1c');
        leg(21, 20, 0, '#5e3b1c');
        fill(() => ctx.ellipse(16, 16.5, 9.5, 7, 0, 0, Math.PI * 2), grad(7, 10, 25, 24, '#b07a45', '#5e3b1c'));
        saddle();
      } else {
        // 머리와 귀가 사람 너머로 보인다, 앞다리
        leg(12, 20, Math.PI / 2, '#5e3b1c');
        leg(20, 20, Math.PI * 1.5, '#5e3b1c');
        fill(() => ctx.ellipse(16, 4.5, 3.6, 4.5, 0, 0, Math.PI * 2), grad(12, 0, 20, 9, '#a8743f', '#7a4e25'));
        fill(() => { ctx.moveTo(12.6, 1.8); ctx.lineTo(13.4, -1.5); ctx.lineTo(14.8, 1.4); ctx.closePath(); }, '#7a4e25');
        fill(() => { ctx.moveTo(19.4, 1.8); ctx.lineTo(18.6, -1.5); ctx.lineTo(17.2, 1.4); ctx.closePath(); }, '#7a4e25');
        fill(() => ctx.ellipse(16, 4, 1.4, 4, 0, 0, Math.PI * 2), '#2a1a10', null); // 갈기
        fill(() => ctx.ellipse(16, 15.5, 9, 7, 0, 0, Math.PI * 2), grad(7, 9, 25, 23, '#b07a45', '#5e3b1c'));
        saddle();
      }
    } else if (view === 'down') {
      // 앞을 보는 목과 긴 얼굴
      fill(() => ctx.ellipse(16, 18, 4.5, 5, 0, 0, Math.PI * 2), grad(11, 13, 21, 23, '#a8743f', '#7a4e25'));
      fill(() => ctx.ellipse(16, 23, 3.4, 5.6, 0, 0, Math.PI * 2), grad(12, 17, 20, 29, '#b8824a', '#7a4e25'));
      fill(() => ctx.ellipse(16, 27.5, 2.6, 1.8, 0, 0, Math.PI * 2), '#4a2e16', null); // 주둥이
      fill(() => ctx.arc(14.3, 21.5, 0.7, 0, Math.PI * 2), '#111', null);
      fill(() => ctx.arc(17.7, 21.5, 0.7, 0, Math.PI * 2), '#111', null);
      fill(() => { ctx.moveTo(12.8, 17.5); ctx.lineTo(12, 14); ctx.lineTo(14.4, 16.6); ctx.closePath(); }, '#7a4e25');
      fill(() => { ctx.moveTo(19.2, 17.5); ctx.lineTo(20, 14); ctx.lineTo(17.6, 16.6); ctx.closePath(); }, '#7a4e25');
      fill(() => ctx.ellipse(16, 18, 1.3, 2.4, 0, 0, Math.PI * 2), '#2a1a10', null); // 앞갈기
      leg(12.5, 22, 0, '#7a4e25');
      leg(19.5, 22, Math.PI, '#7a4e25');
    } else {
      // 뒷모습: 둥근 엉덩이와 흔들리는 꼬리, 뒷다리
      leg(12, 22, 0, '#7a4e25');
      leg(20, 22, Math.PI, '#7a4e25');
      fill(() => ctx.ellipse(16, 21.5, 8, 5.5, 0, 0, Math.PI * 2), grad(8, 16, 24, 27, '#b07a45', '#5e3b1c'));
      ctx.beginPath();
      ctx.moveTo(16, 17);
      ctx.lineTo(16, 25);
      ctx.strokeStyle = 'rgba(40,22,10,0.5)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      const sw = t ? Math.sin(t / 90) * 2 : 0;
      fill(() => {
        ctx.moveTo(14.8, 19);
        ctx.quadraticCurveTo(16 + sw, 25, 15 + sw * 1.5, 29);
        ctx.lineTo(17.5 + sw * 1.5, 29);
        ctx.quadraticCurveTo(17.5 + sw, 24, 17.2, 19);
        ctx.closePath();
      }, '#2a1a10');
    }
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
    const dot = isNinja() && npcLook(n.look);
    const tall = dot || (img.lh ?? img.height) > 32;
    const top = dot ? PERSON_LABEL : tall ? 18 : 2;
    if (dot) drawPerson(ctx, dot, n.dir ?? 'down', { step: walkStep(n.moving, game.now, 160) }, x, y);
    else drawSprite(ctx, img, x, y - top, flip);
    label(ctx, n.name, x + 16, y - top, '#ffe08a');
    if (n.speech && n.speech.until > game.now) bubble(ctx, n.speech.text, x + 16, y - top - 8);
    const mark = this.npcMark(game, n);
    if (mark) {
      const hop = Math.abs(Math.sin(game.now / 250)) * 3;
      label(ctx, mark.text, x + 16, y - (tall ? top + 9 : 11) - hop, mark.color, 13);
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
    // 새 도트 모드: 네 방향·걸음이 있는 도트(바라보는 쪽은 그림에 들어 있다)
    const dot = isNinja();
    const stunned = game.now < m.stunUntil;
    const img = dot ? mobSprite(m.type, m.dir ?? 'down', stunned ? 0 : mobStep(m, game.now)) : monsterSprite(m.type);
    const size = Math.round(32 * scale);
    const w = dot ? img.lw : size;
    const h = dot ? img.lh : size;
    const telegraph = m.strikeAt > game.now;
    let bob = 0;
    if (m.moving) bob = dot ? 0 : m.stepT < 0.5 ? -1 : 0;
    else if (!stunned) bob = Math.sin((game.now + m.id * 300) / 260) > 0.7 ? -1.5 : 0;
    const jitter = telegraph ? (Math.random() - 0.5) * 2 : 0;
    const dx = Math.round(x + 16 - w / 2 + jitter);
    const dy = Math.round(y + 32 - h + bob - (dot ? mobHover(m, game.now) : 0));
    shadow(ctx, x + 16, y + 29, dot ? Math.min(w * 0.36, 9 * scale) : 9 * scale);
    drawFoeCasting(ctx, game, m, x + 16, y + 28, scale);
    if (telegraph) drawStrikeTell(ctx, x + 16, dy + h / 2, Math.max(w, h), game.now);
    const flashing = game.now - m.hitAt < 120;
    ctx.globalAlpha = (flashing ? 0.55 : 1) * (dot ? MONSTER_LOOK[m.type].alpha ?? 1 : 1);
    if (dot) {
      const smooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      drawSprite(ctx, img, dx, dy, false);
      ctx.imageSmoothingEnabled = smooth;
    } else drawSprite(ctx, img, dx, dy, m.face === 'right');
    ctx.globalAlpha = 1;
    if (stunned) {
      ctx.fillStyle = 'rgba(133, 193, 233, 0.3)';
      ctx.fillRect(dx, dy, w, h);
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
