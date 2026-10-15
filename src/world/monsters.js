import { MONSTERS } from '../data/monsters.js';
import { MONSTER_ATTACK_MS, LEASH_DISTANCE, HOME_LEASH, SOCIAL_RADIUS, MONSTER_HP_MULT, SPAWN_MULT, STRIKE_TELL_MS, MONSTER_STEP_MULT } from '../config.js';
import { isRanged } from '../data/monsterSkills.js';
import { tryMonsterSkill, resolveCast, cancelCast, monsterAtk } from './foes.js';
import { DIRS, DIR_NAMES, dirTowards, manhattan, beginStep, advanceStep } from './dirs.js';
import { monsterDamage } from '../core/combat.js';
import { randInt } from '../core/rng.js';

const rng = Math.random;
const WANDER_RADIUS = 6;
// 옆에 붙은 뒤 첫 공격까지 뜸 들이는 시간(그 사이 물러나면 공격이 취소된다)
export const DEFAULT_WINDUP_MS = 750;
// 쫓아올 때 한 칸 움직인 뒤 쉬는 시간
const CHASE_PAUSE_MS = 280;
const RETURN_TIMEOUT_MS = 10000;

/** 몬스터가 플레이어에게 달려든다. 근처의 같은 종류도 함께 따라온다(몹몰이) */
export function provoke(game, m) {
  if (!m.aggro) m.emote = { text: '!', until: game.now + 900 };
  m.aggro = true;
  m.returningUntil = 0;
  for (const o of game.monsters) {
    if (o.aggro || o === m || o.type !== m.type || o.hp <= 0 || manhattan(o, m) > SOCIAL_RADIUS) continue;
    o.aggro = true;
    o.returningUntil = 0;
    o.emote = { text: '!', until: game.now + 900 };
  }
}

export function createMonster(game, type, x, y) {
  const d = MONSTERS[type];
  return {
    id: game.nextId(),
    kind: 'monster',
    type,
    x, y, fromX: x, fromY: y, stepT: 1, moving: false,
    dir: 'down',
    face: 'left',
    homeX: x, homeY: y,
    hp: Math.round(d.hp * MONSTER_HP_MULT), maxHp: Math.round(d.hp * MONSTER_HP_MULT),
    aggro: false,
    nextActAt: game.now + randInt(rng, 400, 2500),
    attackReadyAt: 0,
    stunUntil: 0,
    curseUntil: 0,
    dots: [],
    emote: null,
    returningUntil: 0,
    hitAt: -99999,
    engagedAt: 0,
    strikeAt: 0,
    casting: null,
  };
}

function findSpawnTile(game) {
  const { w, h } = game.map;
  for (let tries = 0; tries < 300; tries++) {
    const x = randInt(rng, 1, w - 2);
    const y = randInt(rng, 1, h - 2);
    if (!game.isFree(x, y)) continue;
    if (game.mapDef.portals.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) < 5)) continue;
    if (manhattan(game.pe, { x, y }) < 6) continue;
    return { x, y };
  }
  return null;
}

export function spawnMonster(game, type, near = null) {
  let pos = null;
  if (near) {
    for (let r = 1; r <= 4 && !pos; r++) {
      for (let tries = 0; tries < 12 && !pos; tries++) {
        const x = near.x + randInt(rng, -r, r);
        const y = near.y + randInt(rng, -r, r);
        if (game.isFree(x, y)) pos = { x, y };
      }
    }
  } else {
    pos = findSpawnTile(game);
  }
  if (!pos) return null;
  const m = createMonster(game, type, pos.x, pos.y);
  game.monsters.push(m);
  return m;
}

export function spawnInitialMonsters(game) {
  for (const [type, count] of game.mapDef.spawns) {
    // 잡은 보스는 맵을 나갔다 와도 리젠 시간이 지나야 다시 나온다
    const bossAt = game.bossTimers[type] ?? 0;
    const n = MONSTERS[type].boss ? count : Math.round(count * SPAWN_MULT);
    for (let i = 0; i < n; i++) {
      if (bossAt > game.now) game.respawnQueue.push({ type, at: bossAt });
      else spawnMonster(game, type);
    }
  }
}

export function updateRespawns(game) {
  const due = game.respawnQueue.filter((r) => r.at <= game.now);
  if (!due.length) return;
  game.respawnQueue = game.respawnQueue.filter((r) => r.at > game.now);
  for (const r of due) {
    if (!spawnMonster(game, r.type)) game.respawnQueue.push({ ...r, at: game.now + 3000 });
  }
}

function tryStep(game, m, dir) {
  const [dx, dy] = DIRS[dir];
  m.dir = dir;
  if (dx) m.face = dx < 0 ? 'left' : 'right';
  if (!game.isFree(m.x + dx, m.y + dy)) return false;
  beginStep(m, m.x + dx, m.y + dy);
  return true;
}

function stepToward(game, m, tx, ty) {
  const primary = dirTowards(m.x, m.y, tx, ty);
  if (tryStep(game, m, primary)) return;
  const dx = tx - m.x;
  const dy = ty - m.y;
  const secondary = ['left', 'right'].includes(primary)
    ? (dy < 0 ? 'up' : dy > 0 ? 'down' : DIR_NAMES[randInt(rng, 0, 1)])
    : (dx < 0 ? 'left' : dx > 0 ? 'right' : DIR_NAMES[randInt(rng, 2, 3)]);
  tryStep(game, m, secondary);
}

function attackPlayer(game, m, d) {
  m.dir = dirTowards(m.x, m.y, game.pe.x, game.pe.y);
  if (m.dir === 'left' || m.dir === 'right') m.face = m.dir;
  if (!m.engagedAt) m.engagedAt = game.now;
  if (game.now - m.engagedAt < (d.windup ?? DEFAULT_WINDUP_MS) || game.now < m.attackReadyAt) return;
  // 바로 때리지 않고 잠깐 번쩍인다(그 사이 물러나거나 구르면 빗나간다)
  m.attackReadyAt = game.now + (d.attackMs ?? MONSTER_ATTACK_MS);
  m.strikeAt = game.now + STRIKE_TELL_MS;
}

/** 번쩍임이 끝나면 실제로 때린다: 아직 옆에 붙어 있어야 맞는다 */
function resolveStrike(game, m) {
  m.strikeAt = 0;
  if (game.dead || manhattan(m, game.pe) !== 1) {
    game.addText('빗나감', m.x, m.y, '#cfd8dc', 9);
    return;
  }
  game.addEffect({ type: 'claw', x: game.pe.x, y: game.pe.y, dir: dirTowards(m.x, m.y, game.pe.x, game.pe.y), dur: 280 });
  game.damagePlayer(monsterDamage(monsterAtk(m.type), game.stats().def));
}

/** 원거리 몬스터: 줄(가로·세로)을 맞추고, 너무 가까우면 물러난다 */
function rangedStep(game, m) {
  const p = game.pe;
  const dx = p.x - m.x;
  const dy = p.y - m.y;
  if ((dx === 0 || dy === 0) && manhattan(m, p) < 3) {
    const away = dirTowards(p.x, p.y, m.x, m.y);
    if (tryStep(game, m, away)) return;
  }
  if (dx !== 0 && (Math.abs(dx) <= Math.abs(dy) || dy === 0) && tryStep(game, m, dx < 0 ? 'left' : 'right')) return;
  if (dy !== 0 && tryStep(game, m, dy < 0 ? 'up' : 'down')) return;
  stepToward(game, m, p.x, p.y);
}

/** 중독·화상: 1초마다 피해 */
function tickDots(game, m) {
  if (!m.dots.length) return;
  for (const dot of m.dots) {
    if (game.now < dot.nextAt || dot.nextAt > dot.until || m.hp <= 0) continue;
    dot.nextAt += 1000;
    game.damageMonster(m, dot.dmg, false, 'dot');
  }
  m.dots = m.dots.filter((dot) => dot.nextAt <= dot.until);
}

export function updateMonsters(game, dt) {
  const stealthed = game.isStealthed();
  for (const m of game.monsters) {
    const d = MONSTERS[m.type];
    tickDots(game, m);
    if (m.hp <= 0) continue;
    advanceStep(m, dt, d.stepMs * MONSTER_STEP_MULT);
    if (game.now < m.stunUntil) {
      m.engagedAt = 0;
      m.strikeAt = 0;
      if (m.casting) cancelCast(game, m);
    }
    if (m.moving || game.now < m.stunUntil) continue;

    const dist = manhattan(m, game.pe);
    const returning = m.returningUntil > game.now;
    if (m.aggro && stealthed) m.aggro = false;
    if (!m.aggro && !returning && !stealthed && d.aggressive && !game.dead && !game.mapDef.safe && dist <= d.sight) {
      provoke(game, m);
    }

    if (m.aggro) {
      const strayed = manhattan(m, { x: m.homeX, y: m.homeY }) > HOME_LEASH;
      if (game.dead || dist > LEASH_DISTANCE || strayed) {
        m.aggro = false;
        m.returningUntil = game.now + RETURN_TIMEOUT_MS;
        m.emote = { text: '?', until: game.now + 900 };
        continue;
      }
      if (m.casting) {
        if (game.now >= m.casting.until) resolveCast(game, m);
        continue;
      }
      if (m.strikeAt) {
        if (game.now >= m.strikeAt) resolveStrike(game, m);
        continue;
      }
      if (tryMonsterSkill(game, m)) continue;
      // 거리는 플레이어가 '도착할 칸' 기준: 옆으로 비켜도 여전히 붙어 있으면 공격 준비가 이어지고,
      // 실제로 한 칸 떨어져야만 공격을 피할 수 있다.
      if (dist === 1) {
        attackPlayer(game, m, d);
      } else {
        m.engagedAt = 0;
        if (dist > 1 && game.now >= m.nextActAt) {
          if (isRanged(m.type) && dist <= 6) rangedStep(game, m);
          else stepToward(game, m, game.pe.x, game.pe.y);
          m.nextActAt = game.now + CHASE_PAUSE_MS;
        }
      }
      continue;
    }

    if (m.returningUntil > game.now) {
      if (manhattan(m, { x: m.homeX, y: m.homeY }) <= 2) m.returningUntil = 0;
      else stepToward(game, m, m.homeX, m.homeY);
      continue;
    }
    if (m.returningUntil) {
      // 길이 막혀 집에 못 돌아갔으면 지금 자리를 새 집으로 삼는다
      m.homeX = m.x;
      m.homeY = m.y;
      m.returningUntil = 0;
    }

    if (game.now < m.nextActAt) continue;
    m.nextActAt = game.now + randInt(rng, 1200, 3500);
    const dir = DIR_NAMES[randInt(rng, 0, 3)];
    const [dx, dy] = DIRS[dir];
    const home = { x: m.homeX, y: m.homeY };
    const nextDist = manhattan({ x: m.x + dx, y: m.y + dy }, home);
    if (nextDist <= WANDER_RADIUS || nextDist < manhattan(m, home)) tryStep(game, m, dir);
  }
}
