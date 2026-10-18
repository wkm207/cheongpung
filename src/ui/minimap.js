import { SOLID } from '../world/mapgen.js';
import { MONSTERS } from '../data/monsters.js';

const REFRESH_MS = 200;
const TILE_COLORS = {
  '~': '#2f6db5', '=': '#b8955e', S: '#9a958a', c: '#5a4a3c', '*': '#e6edf3', ':': '#8f8f4c', ';': '#2f5528', u: '#c08a52', d: '#c98a4b', M: '#5a2e1c', g: '#3a2c22', N: '#1a1418',
};

/** 오른쪽 위 작은 지도: 지형은 맵이 바뀔 때만 그리고, 사람·몬스터 점은 자주 다시 찍는다. */
export class Minimap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mapId = null;
    this.base = null;
    this.nextAt = 0;
    this.visible = true;
  }

  buildBase(game) {
    const { w, h, tiles } = game.map;
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.scale = Math.min(W / w, H / h);
    this.ox = (W - w * this.scale) / 2;
    this.oy = (H - h * this.scale) / 2;
    const base = Object.assign(document.createElement('canvas'), { width: W, height: H });
    const ctx = base.getContext('2d');
    ctx.fillStyle = '#0f0905';
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = tiles[y][x];
        ctx.fillStyle = TILE_COLORS[t] ?? (SOLID.has(t) ? '#1e2a16' : '#4e8a3a');
        if (t === 'T' || t === 'O') ctx.fillStyle = '#1e3a1a';
        if (['W', 'R', 'Y', 'D', 'Q', 'G', 'J', 'K', 'X', 'w', 'F'].includes(t)) ctx.fillStyle = t === 'X' ? '#241c17' : '#5a4632';
        ctx.fillRect(this.ox + x * this.scale, this.oy + y * this.scale, Math.ceil(this.scale), Math.ceil(this.scale));
      }
    }
    for (const p of game.mapDef.portals) {
      ctx.fillStyle = '#7fe3ff';
      ctx.fillRect(this.ox + p.x * this.scale - 1, this.oy + p.y * this.scale - 1, p.w * this.scale + 2, p.h * this.scale + 2);
    }
    this.base = base;
    this.mapId = game.mapId;
  }

  dot(x, y, color, size) {
    const s = this.scale;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.ox + (x + 0.5) * s - size / 2, this.oy + (y + 0.5) * s - size / 2, size, size);
  }

  update(game, ts) {
    if (!this.visible || ts < this.nextAt) return;
    this.nextAt = ts + REFRESH_MS;
    if (game.mapId !== this.mapId) this.buildBase(game);
    this.ctx.drawImage(this.base, 0, 0);
    for (const n of game.npcs) this.dot(n.x, n.y, '#ffd84d', 3);
    for (const m of game.monsters) this.dot(m.x, m.y, MONSTERS[m.type].boss ? '#ff4fd8' : '#ff4d4d', MONSTERS[m.type].boss ? 5 : 3);
    const blink = Math.floor(ts / 300) % 2 === 0;
    this.dot(game.pe.x, game.pe.y, blink ? '#ffffff' : '#7dff9b', 4);
  }
}
