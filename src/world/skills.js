import { SKILLS } from '../data/skills.js';
import { CLASSES } from '../data/classes.js';
import { MONSTERS } from '../data/monsters.js';
import { DIRS, dirTowards, chebyshev, manhattan } from './dirs.js';

const PROJECTILE_STEP_MS = 55;

const strikeOpts = (sk) => ({ power: sk.power, stat: sk.stat, magic: !!sk.magic, forceCrit: !!sk.crit });

/** 기술의 부가 효과(기절·중독·화상·저주)를 몬스터에 건다. */
function applyStatus(game, m, sk) {
  if (m.hp <= 0) return;
  // 보스는 기절·빙결·마비를 40%만 받는다(계속 묶어 두고 잡지 못하게)
  if (sk.stun) m.stunUntil = Math.max(m.stunUntil, game.now + sk.stun * (MONSTERS[m.type].boss ? 0.4 : 1));
  if (sk.curse) m.curseUntil = game.now + sk.curse;
  const dot = sk.poison ?? sk.burn;
  if (dot) {
    const per = Math.max(1, Math.round(game.stats()[sk.stat] * dot.power));
    const color = sk.poison ? '#8be36b' : '#ffa25e';
    m.dots = [...(m.dots ?? []).filter((d) => d.color !== color), { dmg: per, until: game.now + dot.duration, nextAt: game.now + 1000, color }];
  }
}

function hit(game, m, sk, power = sk.power) {
  if (m.hp <= 0) return;
  const dealt = game.strike(m, { ...strikeOpts(sk), power });
  if (sk.lifesteal && dealt > 0) game.restore({ hp: Math.round(dealt * sk.lifesteal) });
  applyStatus(game, m, sk);
}

/** 이동 중인 몬스터는 출발 칸에 있어도 맞은 것으로 본다(마주 오며 칸을 바꿀 때 빗나가지 않게). */
function monsterTouching(game, x, y) {
  return game.monsters.find((m) => (m.x === x && m.y === y) || (m.moving && m.fromX === x && m.fromY === y)) ?? null;
}

function nearestMonster(game, from, range, exclude = []) {
  let best = null;
  for (const m of game.monsters) {
    if (exclude.includes(m)) continue;
    const d = manhattan(m, from);
    if (d <= range && (!best || d < best.d)) best = { m, d };
  }
  return best?.m ?? null;
}

/** 몬스터 주변에서 순간이동해 설 수 있는 칸(등 뒤 우선) */
function freeTileAround(game, target, from) {
  const back = DIRS[dirTowards(from.x, from.y, target.x, target.y)];
  const candidates = [[back[0], back[1]], ...Object.values(DIRS)]
    .map(([dx, dy]) => ({ x: target.x + dx, y: target.y + dy }))
    .filter((t) => game.isFree(t.x, t.y) && !game.portalAt(t.x, t.y));
  return candidates[0] ?? null;
}

function teleportPlayer(game, tile, faceTo) {
  const pe = game.pe;
  game.addEffect({ type: 'smoke', x: pe.x, y: pe.y, dur: 450 });
  pe.x = tile.x;
  pe.y = tile.y;
  pe.fromX = tile.x;
  pe.fromY = tile.y;
  pe.stepT = 1;
  pe.moving = false;
  if (faceTo) pe.dir = dirTowards(tile.x, tile.y, faceTo.x, faceTo.y);
  game.addEffect({ type: 'smoke', x: tile.x, y: tile.y, dur: 450 });
  game.pickUp();
}

const AOE_VISUALS = {
  quake(game, sk) {
    game.shake(350);
    game.addEffect({ type: 'ring', x: game.pe.x, y: game.pe.y, radius: sk.radius, color: sk.color, dur: 500 });
    game.addEffect({ type: 'cracks', x: game.pe.x, y: game.pe.y, radius: sk.radius, dur: 700 });
  },
  meteor(game, sk) {
    game.shake(600);
    for (let i = 0; i < 9; i++) {
      game.addEffect({
        type: 'meteor', dur: 650, delay: i * 70,
        x: game.pe.x + Math.round((Math.random() * 2 - 1) * sk.radius),
        y: game.pe.y + Math.round((Math.random() * 2 - 1) * sk.radius),
      });
    }
    game.addEffect({ type: 'ring', x: game.pe.x, y: game.pe.y, radius: sk.radius, color: sk.color, dur: 700 });
  },
  storm(game, sk) {
    for (let i = 0; i < 7; i++) {
      game.addEffect({
        type: 'bolt', color: sk.color, dur: 350, delay: i * 60,
        x: game.pe.x + Math.round((Math.random() * 2 - 1) * sk.radius),
        y: game.pe.y + Math.round((Math.random() * 2 - 1) * sk.radius),
      });
    }
    game.addEffect({ type: 'ring', x: game.pe.x, y: game.pe.y, radius: sk.radius, color: sk.color, dur: 500 });
    game.shake(300);
  },
  holy(game, sk) {
    game.addEffect({ type: 'pillar', x: game.pe.x, y: game.pe.y, color: sk.color, dur: 600 });
    game.addEffect({ type: 'ring', x: game.pe.x, y: game.pe.y, radius: sk.radius, color: sk.color, dur: 500 });
  },
  ice(game, sk) {
    game.addEffect({ type: 'ring', x: game.pe.x, y: game.pe.y, radius: sk.radius, color: sk.color, dur: 500 });
    game.addEffect({ type: 'frost', x: game.pe.x, y: game.pe.y, radius: sk.radius, dur: 700 });
  },
};

const CASTERS = {
  melee(game, sk) {
    const target = game.meleeTarget();
    if (!target) {
      game.log('앞에 대상이 없습니다.', '#bbb');
      return false;
    }
    game.addEffect({ type: 'slash', x: target.x, y: target.y, dir: game.pe.dir, dur: 220, big: true });
    for (let i = 0; i < (sk.hits ?? 1); i++) hit(game, target, sk);
    return true;
  },

  projectile(game, sk, id) {
    const pe = game.pe;
    game.projectiles.push({
      x: pe.x, y: pe.y, fromX: pe.x, fromY: pe.y, stepT: 1, moving: false,
      dir: pe.dir, remaining: sk.range, skillId: id, color: sk.color, visual: sk.visual,
    });
    return true;
  },

  aoe(game, sk) {
    (AOE_VISUALS[sk.visual] ?? ((g) => g.addEffect({ type: 'ring', x: g.pe.x, y: g.pe.y, radius: sk.radius, color: sk.color, dur: 450 })))(game, sk);
    const victims = game.monsters.filter((x) => chebyshev(x, game.pe) <= sk.radius);
    for (let i = 0; i < (sk.hits ?? 1); i++) for (const m of victims) hit(game, m, sk);
    return true;
  },

  zone(game, sk) {
    const target = nearestMonster(game, game.pe, sk.range);
    if (!target) {
      game.log('주변에 대상이 없습니다.', '#bbb');
      return false;
    }
    const center = { x: target.x, y: target.y };
    if (sk.visual === 'storm') {
      for (let i = 0; i < 5; i++) {
        game.addEffect({ type: 'bolt', color: sk.color, dur: 350, delay: i * 70, x: center.x + Math.round((Math.random() * 2 - 1) * sk.radius), y: center.y + Math.round((Math.random() * 2 - 1) * sk.radius) });
      }
    } else {
      game.addEffect({ type: 'pillar', x: center.x, y: center.y, color: sk.color, dur: 600 });
    }
    game.addEffect({ type: 'ring', x: center.x, y: center.y, radius: sk.radius, color: sk.color, dur: 500 });
    for (const m of game.monsters.filter((x) => chebyshev(x, center) <= sk.radius)) hit(game, m, sk);
    return true;
  },

  line(game, sk) {
    const [dx, dy] = DIRS[game.pe.dir];
    let end = { x: game.pe.x, y: game.pe.y };
    const victims = [];
    for (let i = 1; i <= sk.length; i++) {
      const t = { x: game.pe.x + dx * i, y: game.pe.y + dy * i };
      if (game.isSolid(t.x, t.y)) break;
      end = t;
      const m = game.monsterAt(t.x, t.y);
      if (m) victims.push(m);
    }
    if (end.x === game.pe.x && end.y === game.pe.y) {
      game.log('앞이 막혀 있습니다.', '#bbb');
      return false;
    }
    game.addEffect({ type: 'line', x: game.pe.x, y: game.pe.y, x2: end.x, y2: end.y, color: sk.color, dur: 350 });
    if (sk.visual === 'quake') game.shake(400);
    for (const m of victims) hit(game, m, sk);
    return true;
  },

  multitarget(game, sk) {
    const targets = game.monsters
      .filter((m) => manhattan(m, game.pe) <= sk.range)
      .sort((a, b) => manhattan(a, game.pe) - manhattan(b, game.pe))
      .slice(0, sk.count);
    if (!targets.length) {
      game.log('주변에 대상이 없습니다.', '#bbb');
      return false;
    }
    targets.forEach((m, i) => {
      game.addEffect({ type: sk.magic ? 'bolt' : 'burst', x: m.x, y: m.y, color: sk.color, dur: 350, delay: i * 60 });
      hit(game, m, sk);
    });
    return true;
  },

  sacrifice(game, sk) {
    const target = game.meleeTarget();
    if (!target) {
      game.log('앞에 대상이 없습니다.', '#bbb');
      return false;
    }
    const paid = Math.floor(game.player.hp * sk.hpPct);
    if (paid < 1 || game.player.hp - paid < 1) {
      game.log('바칠 체력이 모자랍니다.', '#bbb');
      return false;
    }
    game.setPlayer({ hp: game.player.hp - paid });
    game.addText(`-${paid}`, game.pe.x, game.pe.y, '#ff6b6b');
    game.addEffect({ type: 'pillar', x: target.x, y: target.y, color: '#ff3030', dur: 600 });
    game.shake(400);
    game.damageMonster(target, paid * sk.ratio, true);
    return true;
  },

  leap(game, sk) {
    const pe = game.pe;
    const [dx, dy] = DIRS[pe.dir];
    let tile = null;
    for (let i = sk.range; i >= 1; i--) {
      const t = { x: pe.x + dx * i, y: pe.y + dy * i };
      if (game.isFree(t.x, t.y) && !game.portalAt(t.x, t.y)) {
        tile = t;
        break;
      }
    }
    if (!tile) {
      game.log('내려설 곳이 없습니다.', '#bbb');
      return false;
    }
    game.addEffect({ type: 'line', x: pe.x, y: pe.y, x2: tile.x, y2: tile.y, color: '#d6f0ff', dur: 300 });
    teleportPlayer(game, tile, null);
    return true;
  },

  passive(game, sk) {
    game.log(`${sk.name}은(는) 따로 쓰지 않아도 저절로 발동하는 기술입니다.`, '#bbb');
    return false;
  },

  guardian(game, sk) {
    game.guardianUntil = game.now + sk.duration;
    game.addEffect({ type: 'pillar', x: game.pe.x, y: game.pe.y, color: '#fff6d5', dur: 700 });
    game.log(`수호령이 곁을 지킵니다. (${sk.duration / 1000}초)`, '#fff6d5');
    return true;
  },

  target(game, sk) {
    const target = nearestMonster(game, game.pe, sk.range);
    if (!target) {
      game.log('주변에 대상이 없습니다.', '#bbb');
      return false;
    }
    game.addEffect({ type: sk.visual === 'bolt' ? 'bolt' : 'orb', x: target.x, y: target.y, color: sk.color, dur: 400 });
    hit(game, target, sk);
    return true;
  },

  chain(game, sk) {
    const first = nearestMonster(game, game.pe, sk.range);
    if (!first) {
      game.log('주변에 대상이 없습니다.', '#bbb');
      return false;
    }
    const chain = [first];
    while (chain.length <= sk.jumps) {
      const next = nearestMonster(game, chain[chain.length - 1], sk.jumpRange, chain);
      if (!next) break;
      chain.push(next);
    }
    const points = [{ x: game.pe.x, y: game.pe.y }, ...chain.map((m) => ({ x: m.x, y: m.y }))];
    game.addEffect({ type: 'chain', x: game.pe.x, y: game.pe.y, points, color: sk.color, dur: 420 });
    chain.forEach((m, i) => hit(game, m, sk, sk.power * sk.falloff ** i));
    return true;
  },

  dash(game, sk) {
    const pe = game.pe;
    const [dx, dy] = DIRS[pe.dir];
    let dist = 0;
    let target = null;
    for (let i = 1; i <= sk.range; i++) {
      const tx = pe.x + dx * i;
      const ty = pe.y + dy * i;
      target = game.monsterAt(tx, ty);
      if (target || !game.isFree(tx, ty) || game.portalAt(tx, ty)) break;
      dist = i;
    }
    if (!dist && !target) {
      game.log('앞이 막혀 있습니다.', '#bbb');
      return false;
    }
    if (dist) {
      game.addEffect({ type: 'line', x: pe.x, y: pe.y, x2: pe.x + dx * dist, y2: pe.y + dy * dist, color: '#ffffff', dur: 250 });
      pe.fromX = pe.x;
      pe.fromY = pe.y;
      pe.x += dx * dist;
      pe.y += dy * dist;
      pe.stepT = 0;
      pe.moving = true;
      pe.stepMsOverride = 50 * dist + 40;
    }
    if (target) {
      game.addEffect({ type: 'slash', x: target.x, y: target.y, dir: pe.dir, dur: 220, big: true });
      hit(game, target, sk);
    }
    return true;
  },

  blink(game, sk) {
    const target = nearestMonster(game, game.pe, sk.range);
    const tile = target && freeTileAround(game, target, game.pe);
    if (!tile) {
      game.log(target ? '파고들 빈틈이 없습니다.' : '주변에 대상이 없습니다.', '#bbb');
      return false;
    }
    teleportPlayer(game, tile, target);
    game.addEffect({ type: 'slash', x: target.x, y: target.y, dir: game.pe.dir, dur: 220, big: true });
    hit(game, target, sk);
    return true;
  },

  multiblink(game, sk) {
    const targets = game.monsters
      .filter((m) => manhattan(m, game.pe) <= sk.range)
      .sort((a, b) => manhattan(a, game.pe) - manhattan(b, game.pe))
      .slice(0, sk.count);
    if (!targets.length) {
      game.log('주변에 대상이 없습니다.', '#bbb');
      return false;
    }
    const points = [{ x: game.pe.x, y: game.pe.y }];
    for (const m of targets) {
      const adjacent = manhattan(m, game.pe) === 1;
      const tile = adjacent ? null : freeTileAround(game, m, game.pe);
      if (!adjacent && !tile) continue;
      if (tile) {
        teleportPlayer(game, tile, m);
        points.push(tile);
      }
      game.addEffect({ type: 'slash', x: m.x, y: m.y, dir: game.pe.dir, dur: 220, big: true });
      hit(game, m, sk);
    }
    game.addEffect({ type: 'chain', x: points[0].x, y: points[0].y, points, color: '#8e7cc3', dur: 420 });
    return true;
  },

  buff(game, sk, id) {
    game.buffs = [...game.buffs.filter((b) => b.id !== id && b.until > game.now), { id, ...sk.buff, until: game.now + sk.duration }];
    game.addEffect({ type: 'aura', x: game.pe.x, y: game.pe.y, color: '#ffd166', dur: 600 });
    game.log(`${sk.name}! (${sk.duration / 1000}초)`, '#ffd166');
    return true;
  },

  heal(game, sk) {
    const s = game.stats();
    if (game.player.hp >= s.maxHp) {
      game.log('체력이 이미 가득합니다.', '#bbb');
      return false;
    }
    const amount = sk.pct ? Math.round(s.maxHp * sk.pct) : Math.round(s[sk.stat] * sk.power + sk.flat);
    game.restore({ hp: amount });
    game.addEffect({ type: 'heal', x: game.pe.x, y: game.pe.y, dur: 700 });
    return true;
  },

  hot(game, sk, id) {
    const perTick = Math.ceil(game.stats().maxHp * sk.pct);
    game.hots = [...game.hots.filter((h) => h.id !== id), { id, perTick, until: game.now + sk.duration, nextAt: game.now + 1000 }];
    game.addEffect({ type: 'heal', x: game.pe.x, y: game.pe.y, dur: 700 });
    game.log(`${sk.name}! (${sk.duration / 1000}초)`, '#9be7a1');
    return true;
  },

  stealth(game, sk) {
    game.stealthUntil = game.now + sk.duration;
    for (const m of game.monsters) m.aggro = false;
    game.addEffect({ type: 'smoke', x: game.pe.x, y: game.pe.y, dur: 500 });
    game.log('그림자 속으로 몸을 숨겼다.', '#b9a6e8');
    return true;
  },

  convert(game, sk) {
    const s = game.stats();
    if (game.player.mp >= s.maxMp) {
      game.log('마력이 이미 가득합니다.', '#bbb');
      return false;
    }
    const amount = Math.min(Math.floor(game.player.hp * sk.hpPct), s.maxMp - game.player.mp);
    if (amount < 1 || game.player.hp - amount < 1) {
      game.log('체력이 너무 적습니다.', '#bbb');
      return false;
    }
    game.setPlayer({ hp: game.player.hp - amount });
    game.restore({ mp: amount });
    game.addEffect({ type: 'aura', x: game.pe.x, y: game.pe.y, color: '#7fb3ff', dur: 600 });
    return true;
  },
};

export function canCast(game, id) {
  return !!SKILLS[id] && game.player.learned.includes(id);
}

/** 기술 사용. 실제로 시전되었으면 true */
export function castSkill(game, id) {
  const sk = SKILLS[id];
  if (!sk || game.dead || !CLASSES[game.player.cls].skills.includes(id)) return false;
  if (!game.player.learned.includes(id)) {
    game.log(`아직 배우지 않은 기술입니다. 기술창(K)에서 배우세요.`, '#bbb');
    return false;
  }
  if (game.now < (game.cooldowns[id] ?? 0)) return false;
  if (game.player.mp < sk.mp) {
    game.log('마력이 부족합니다.', '#7fb3ff');
    return false;
  }
  if (CASTERS[sk.kind](game, sk, id) === false) return false;
  game.cooldowns = { ...game.cooldowns, [id]: game.now + sk.cd };
  game.setPlayer({ mp: game.player.mp - sk.mp });
  game.say(`${sk.name}!`);
  if (sk.magic || ['heal', 'hot', 'buff', 'guardian', 'convert'].includes(sk.kind)) game.castPoseUntil = game.now + 420;
  else game.attackPoseUntil = game.now + 200;
  game.emit('sfx', sk.magic || sk.kind === 'heal' || sk.kind === 'hot' ? 'magic' : 'skill');
  return true;
}

export function updateProjectiles(game, dt) {
  const alive = [];
  for (const p of game.projectiles) {
    p.stepT += dt / PROJECTILE_STEP_MS;
    const here = p.moving ? monsterTouching(game, p.x, p.y) : null;
    if (here) {
      hit(game, here, SKILLS[p.skillId]);
      game.addEffect({ type: 'burst', x: here.x, y: here.y, color: p.color, dur: 250 });
      continue;
    }
    if (p.moving && p.stepT < 1) {
      alive.push(p);
      continue;
    }
    const [dx, dy] = DIRS[p.dir];
    const nx = p.x + dx;
    const ny = p.y + dy;
    const target = monsterTouching(game, nx, ny);
    if (target) {
      hit(game, target, SKILLS[p.skillId]);
      game.addEffect({ type: 'burst', x: nx, y: ny, color: p.color, dur: 250 });
      continue;
    }
    if (p.remaining <= 0 || game.isSolid(nx, ny)) {
      game.addEffect({ type: 'burst', x: p.x, y: p.y, color: p.color, dur: 200 });
      continue;
    }
    p.fromX = p.x;
    p.fromY = p.y;
    p.x = nx;
    p.y = ny;
    p.stepT = 0;
    p.moving = true;
    p.remaining -= 1;
    alive.push(p);
  }
  game.projectiles = alive;
}

