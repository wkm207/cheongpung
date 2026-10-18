// 몬스터 기술: 고르기 → 예고(windup) → 발동. 날아가는 탄(enemyShots)과 바닥 장판(hazards)도 여기서 처리한다.
// 모든 공격은 예고가 있어서, 장판 밖으로 나가거나 탄의 줄에서 비키거나 구르기(무적)로 피할 수 있다.
import { MONSTERS } from '../data/monsters.js';
import { kitOf } from '../data/monsterSkills.js';
import { monsterDamage } from '../core/combat.js';
import { MONSTER_ATK_MULT } from '../config.js';
import { DIRS, dirTowards, manhattan, chebyshev, beginStep, lerpPos } from './dirs.js';
import { spawnMonster } from './monsters.js';

const SKILL_GAP_MS = 1400; // 기술과 기술 사이 최소 간격(그 사이엔 평범하게 싸운다)
const FIRST_SKILL_MS = 1500; // 싸움이 붙고 첫 기술까지
const ZONE_REACH = 7;
const MAX_MINIONS = 6;

const kits = new Map();
export function kitFor(type) {
  if (!kits.has(type)) kits.set(type, kitOf(type, MONSTERS[type].special));
  return kits.get(type);
}

export const monsterAtk = (type) => MONSTERS[type].atk * MONSTER_ATK_MULT;
const hitPower = (game, type, power) => monsterDamage(monsterAtk(type), game.stats().def, power);

const inMap = (game, x, y) => x >= 0 && y >= 0 && x < game.map.w && y < game.map.h;
const open = (game, x, y) => inMap(game, x, y) && !game.isSolid(x, y);

/** (x,y)에서 (dx,dy) 방향으로 len칸, 벽 앞에서 멈춘다 */
function lineTiles(game, x, y, dx, dy, len) {
  const out = [];
  for (let i = 1; i <= len; i++) {
    const tx = x + dx * i;
    const ty = y + dy * i;
    if (!open(game, tx, ty)) break;
    out.push({ x: tx, y: ty });
  }
  return out;
}

function clearLine(game, a, b) {
  const dir = dirTowards(a.x, a.y, b.x, b.y);
  const [dx, dy] = DIRS[dir];
  const n = manhattan(a, b);
  return lineTiles(game, a.x, a.y, dx, dy, n).length === n;
}

const aligned = (a, b) => a.x === b.x || a.y === b.y;

/** (cx,cy) 둘레 r칸 사각형. safe칸 안쪽은 비운다(도넛) */
function square(game, cx, cy, r, safe = 0) {
  const out = [];
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) <= safe) continue;
      if (open(game, x, y)) out.push({ x, y });
    }
  }
  return out;
}

function diamond(game, cx, cy) {
  return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: cx + dx, y: cy + dy })).filter((t) => open(game, t.x, t.y));
}

function uniqueTiles(tiles) {
  const seen = new Set();
  return tiles.filter((t) => {
    const k = `${t.x},${t.y}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** 지금 이 기술을 쓸 수 있으면 계획({ tiles?, dir? })을, 아니면 null */
function plan(game, m, sk) {
  const p = game.pe;
  const dist = manhattan(m, p);
  switch (sk.kind) {
    case 'bolt':
      if (!aligned(m, p) || dist < 2 || dist > sk.range || !clearLine(game, m, p)) return null;
      return { dir: dirTowards(m.x, m.y, p.x, p.y) };
    case 'slam':
      if (chebyshev(m, p) > sk.radius || chebyshev(m, p) <= (sk.safe ?? 0)) return null;
      return { tiles: square(game, m.x, m.y, sk.radius, sk.safe ?? 0) };
    case 'zone': {
      if (dist > ZONE_REACH) return null;
      const centers = [{ x: p.x, y: p.y }];
      for (let i = 1; i < sk.count; i++) centers.push({ x: p.x + Math.round((Math.random() - 0.5) * 5), y: p.y + Math.round((Math.random() - 0.5) * 5) });
      return { tiles: uniqueTiles(centers.flatMap((c) => diamond(game, c.x, c.y))) };
    }
    case 'cross':
      if (!aligned(m, p) || dist > sk.length) return null;
      return { tiles: Object.values(DIRS).flatMap(([dx, dy]) => lineTiles(game, m.x, m.y, dx, dy, sk.length)) };
    case 'charge': {
      if (!aligned(m, p) || dist < 2 || dist > sk.range || !clearLine(game, m, p)) return null;
      const dir = dirTowards(m.x, m.y, p.x, p.y);
      const [dx, dy] = DIRS[dir];
      return { dir, tiles: lineTiles(game, m.x, m.y, dx, dy, sk.range) };
    }
    case 'heal':
      return m.hp < m.maxHp * 0.5 ? {} : null;
    case 'summon': {
      const minions = game.monsters.filter((o) => o.type === sk.minion).length;
      return minions < MAX_MINIONS && dist <= 8 ? {} : null;
    }
    default:
      return null;
  }
}

/** 기술을 하나 골라 예고를 시작한다. 시작했으면 true */
export function tryMonsterSkill(game, m) {
  const kit = kitFor(m.type);
  if (!kit.length) return false;
  m.nextSkillAt ??= game.now + FIRST_SKILL_MS;
  if (game.now < m.nextSkillAt) return false;
  m.skillReady ??= {};
  for (const sk of kit) {
    if (game.now < (m.skillReady[sk.id] ?? 0)) continue;
    const p = plan(game, m, sk);
    if (!p) continue;
    const until = game.now + sk.windup;
    m.skillReady[sk.id] = game.now + sk.cd;
    m.nextSkillAt = until + SKILL_GAP_MS;
    m.casting = { sk, until, start: game.now, ...p };
    m.engagedAt = 0;
    if (p.dir) {
      m.dir = p.dir;
      if (p.dir === 'left' || p.dir === 'right') m.face = p.dir;
    }
    if (p.tiles?.length) {
      game.hazards.push({ id: game.nextId(), owner: m.id, type: m.type, tiles: p.tiles, start: game.now, at: until, power: sk.power, color: sk.color, look: sk.look, name: sk.name });
    }
    m.emote = { text: `${sk.name}!`, until, color: sk.color };
    return true;
  }
  return false;
}

/** 예고가 끝난 기술을 발동한다(장판 피해는 updateFoes가 따로 처리) */
export function resolveCast(game, m) {
  const { sk } = m.casting;
  const c = m.casting;
  m.casting = null;
  if (sk.kind === 'bolt') {
    const [dx, dy] = DIRS[c.dir];
    game.enemyShots.push({
      id: game.nextId(), x: m.x, y: m.y, dx, dy, speed: sk.speed, left: sk.range + 0.5,
      dmg: hitPower(game, m.type, sk.power), look: sk.look, color: sk.color, start: game.now,
    });
    game.emit('sfx', 'skill');
  } else if (sk.kind === 'charge') {
    // 예고한 줄을 따라 플레이어나 벽 앞까지 내달린다
    const [dx, dy] = DIRS[c.dir];
    let n = 0;
    while (n < sk.range && game.isFree(m.x + dx * (n + 1), m.y + dy * (n + 1))) n++;
    if (n > 0) {
      game.addEffect({ type: 'dash', x: m.x, y: m.y, tx: m.x + dx * n, ty: m.y + dy * n, color: sk.color, dur: 350 });
      beginStep(m, m.x + dx * n, m.y + dy * n);
    }
  } else if (sk.kind === 'heal') {
    const amount = Math.round(m.maxHp * sk.pct);
    m.hp = Math.min(m.maxHp, m.hp + amount);
    game.addEffect({ type: 'heal', x: m.x, y: m.y, dur: 700 });
    game.addText(`+${amount}`, m.x, m.y, '#7dff9b', 10);
  } else if (sk.kind === 'summon') {
    for (let i = 0; i < sk.count; i++) {
      const s = spawnMonster(game, sk.minion, m);
      if (!s) continue;
      s.summoned = true; // 부른 졸개는 잡아도 다시 나오지 않는다
      s.aggro = true;
      game.addEffect({ type: 'poof', x: s.x, y: s.y, dur: 500 });
    }
    game.log(`${MONSTERS[m.type].name}의 부름에 졸개들이 나타났습니다!`, '#ffd166');
  }
}

/** 기절 등으로 예고가 끊기면 장판도 거둔다 */
export function cancelCast(game, m) {
  m.casting = null;
  game.hazards = game.hazards.filter((h) => h.owner !== m.id);
}

/** 플레이어가 지금 (x,y) 칸에 있는가: 걸어가는 중이면 도착할 칸 기준 */
const playerOn = (game, t) => game.pe.x === t.x && game.pe.y === t.y;

export function updateFoes(game, dt) {
  // 장판: 예고가 끝나면 터진다
  if (game.hazards.length) {
    const due = game.hazards.filter((h) => game.now >= h.at);
    if (due.length) {
      game.hazards = game.hazards.filter((h) => game.now < h.at);
      for (const h of due) {
        for (const t of h.tiles) game.addEffect({ type: 'blast', x: t.x, y: t.y, look: h.look, color: h.color, dur: 450, delay: Math.random() * 60 });
        if (!game.dead && h.tiles.some((t) => playerOn(game, t))) game.damagePlayer(hitPower(game, h.type, h.power));
        game.shake(h.tiles.length > 8 ? 160 : 90);
      }
    }
  }
  // 날아가는 탄
  if (!game.enemyShots.length) return;
  const pp = lerpPos(game.pe);
  game.enemyShots = game.enemyShots.filter((s) => {
    const step = (s.speed * dt) / 1000;
    s.x += s.dx * step;
    s.y += s.dy * step;
    s.left -= step;
    const tx = Math.round(s.x);
    const ty = Math.round(s.y);
    if (!open(game, tx, ty) || s.left <= 0) {
      game.addEffect({ type: 'blast', x: s.x, y: s.y, look: s.look, color: s.color, dur: 300 });
      return false;
    }
    if (!game.dead && Math.abs(s.x - pp.x) < 0.5 && Math.abs(s.y - pp.y) < 0.5) {
      if (game.isDodging()) {
        if (!s.dodged) game.addText('회피', game.pe.x, game.pe.y, '#bfe9ff', 10);
        s.dodged = true;
        return true;
      }
      game.addEffect({ type: 'blast', x: s.x, y: s.y, look: s.look, color: s.color, dur: 380 });
      game.damagePlayer(s.dmg);
      return false;
    }
    return true;
  });
}
