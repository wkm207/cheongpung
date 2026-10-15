// 맵마다 화면에 떠다니는 작은 입자(꽃잎·나비·낙엽·눈·반딧불). 순수 장식이다.
const KIND_BY_MAP = {
  village: 'petal',
  field1: 'butterfly',
  forest: 'leaf',
  wolfHill: 'seed',
  deepMountain: 'leaf',
  imugiSwamp: 'firefly',
  snowPass: 'snow',
  goblinCave: 'firefly',
  bossLair: 'foxfire',
  dragonCave: 'ember',
};
const COUNT = { petal: 14, butterfly: 7, leaf: 12, seed: 10, firefly: 14, snow: 40, foxfire: 10, ember: 18 };
const COLORS = {
  petal: ['#ffc0d9', '#ffe0ec', '#ffd1e3'],
  butterfly: ['#fff59d', '#ffffff', '#f8bbd0', '#b3e5fc'],
  leaf: ['#7cb342', '#c0ca33', '#ef8c3b'],
  seed: ['#ffffff', '#f1f1e6'],
  firefly: ['#e6ff8a', '#c6ff6b'],
  snow: ['#ffffff', '#eef6ff'],
  foxfire: ['#ff8cc6', '#ffb3dc'],
  ember: ['#ff7b2e', '#ffb347', '#a64dff'],
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Ambient {
  constructor() {
    this.mapId = null;
    this.parts = [];
  }

  spawn(kind, view, anywhere) {
    const fromTop = ['petal', 'leaf', 'snow'].includes(kind);
    return {
      x: rand(view.x - 40, view.x + view.w + 40),
      y: anywhere || !fromTop ? rand(view.y, view.y + view.h) : view.y - rand(5, 40),
      vx: kind === 'seed' ? rand(10, 25) : rand(-8, 8),
      vy: { petal: rand(10, 18), leaf: rand(14, 24), snow: rand(18, 34), seed: rand(-3, 3), butterfly: 0, firefly: 0, foxfire: rand(-10, -4), ember: rand(-14, -6) }[kind],
      phase: Math.random() * Math.PI * 2,
      color: pick(COLORS[kind]),
      size: kind === 'snow' ? rand(1, 2.5) : 2,
    };
  }

  update(mapId, view, dt) {
    const kind = KIND_BY_MAP[mapId];
    if (mapId !== this.mapId) {
      this.mapId = mapId;
      this.kind = kind;
      this.parts = kind ? Array.from({ length: COUNT[kind] }, () => this.spawn(kind, view, true)) : [];
    }
    if (!kind) return;
    const s = dt / 1000;
    this.parts = this.parts.map((p) => {
      const t = (p.phase += s * 2);
      let { x, y } = p;
      if (kind === 'butterfly' || kind === 'firefly') {
        x += Math.cos(t * 0.7) * 14 * s + p.vx * s;
        y += Math.sin(t) * 10 * s;
      } else {
        x += (p.vx + Math.sin(t) * 10) * s;
        y += p.vy * s;
      }
      const out = x < view.x - 60 || x > view.x + view.w + 60 || y < view.y - 60 || y > view.y + view.h + 60;
      return out ? this.spawn(kind, view, false) : { ...p, x, y };
    });
  }

  draw(ctx, now) {
    const kind = this.kind;
    for (const p of this.parts) {
      ctx.fillStyle = p.color;
      if (kind === 'butterfly') {
        const flap = Math.abs(Math.sin(now / 90 + p.phase)) * 3 + 1;
        ctx.fillRect(p.x - flap, p.y, flap, 2);
        ctx.fillRect(p.x + 1, p.y, flap, 2);
        ctx.fillStyle = '#3b2a1a';
        ctx.fillRect(p.x, p.y, 1, 2);
      } else if (kind === 'firefly' || kind === 'foxfire' || kind === 'ember') {
        ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(now / 400 + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, kind === 'foxfire' ? 3 : 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (kind === 'snow') {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      } else {
        ctx.fillRect(p.x, p.y, 2, kind === 'leaf' ? 1 : 2);
      }
    }
  }
}
