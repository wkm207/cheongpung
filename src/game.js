import {
  PLAYER_STEP_MS, GROUND_ITEM_TTL_MS, DEATH_DELAY_MS, REGEN_INTERVAL_MS, RESPAWN_POINT,
} from './config.js';
import { josa } from './core/josa.js';
import { MAP_DEFS, getTiles } from './data/maps.js';
import { CLASSES } from './data/classes.js';
import { ITEMS, isEquipment, sellPrice } from './data/items.js';
import { MONSTERS } from './data/monsters.js';
import { SKILLS, learnCost, SPELL_LETTERS, hotkeyLabel } from './data/skills.js';
import { titleOf, nextAdvancement } from './data/tiers.js';
import { QUEST_CHAINS, QUEST_GIVERS, questById, newQuestState, rewardItems } from './data/quests.js';
import { SOLID } from './world/mapgen.js';
import { DIRS, DIR_NAMES, dirTowards, manhattan, beginStep, advanceStep } from './world/dirs.js';
import { spawnInitialMonsters, spawnMonster, updateMonsters, updateRespawns } from './world/monsters.js';
import { castSkill, updateProjectiles } from './world/skills.js';
import { computeStats, gainExp, withLevel, withDeathPenalty } from './core/stats.js';
import { rollDamage, rollDrops, rollGold } from './core/combat.js';
import { addItem, removeAt, removeCount, countOf } from './core/inventory.js';
import { canEquip, statDiff, formatStat, equipFromInventory, autoEquip, isUpgrade, upgradeCount } from './core/equip.js';
import { defaultSlots, slotNewSkill, assignSlot, starterSkills } from './core/skillslots.js';
import { randInt } from './core/rng.js';
import { enhanceInfo, emptyEnhance } from './core/enhance.js';
import { awakenInfo, DRAGON_WEAPONS } from './core/dragon.js';

const QUICK_ITEMS = { hp: ['herb', 'tteok', 'bigHerb', 'gukbap', 'elixir'], mp: ['dew', 'makgeolli', 'bigDew', 'elixir'] };
export const GOLD_ID = '__gold';
export const STAT_POINTS_PER_LEVEL = 3;
const NPC_STEP_MS = 480;
const TURN_HOLD_MS = 110;

export function createPlayer(name, cls, gender = 'm') {
  const c = CLASSES[cls];
  let inv = [];
  for (const [id, qty] of [['herb', 5], ['dew', 3], ['returnScroll', 1]]) inv = addItem(inv, id, qty).inv;
  const player = {
    name, cls, gender, level: 1, exp: 0, gold: 100, hp: 1, mp: 0, inv,
    statPoints: 0, alloc: { str: 0, dex: 0, int: 0, con: 0 },
    equip: { weapon: c.startWeapon, helmet: null, armor: 'cottonRobe', necklace: null, ring: null },
    mapId: RESPAWN_POINT.mapId, x: RESPAWN_POINT.x, y: RESPAWN_POINT.y, dir: 'down',
    playMs: 0, gm: { god: false, speed: 1 },
    quests: newQuestState(),
    tier: 0,
    enhance: emptyEnhance(),
    learned: starterSkills(cls),
    skillSlots: defaultSlots(starterSkills(cls)),
  };
  const s = computeStats(player);
  return { ...player, hp: s.maxHp, mp: s.maxMp };
}

/** 다른 맵의 포탈이 이 맵으로 데려다 주는 첫 지점(순간이동 도착 위치) */
function entryPoint(mapId) {
  if (mapId === RESPAWN_POINT.mapId) return RESPAWN_POINT;
  for (const def of Object.values(MAP_DEFS)) {
    const p = def.portals.find((q) => q.to === mapId);
    if (p) return { x: p.tx, y: p.ty };
  }
  const def = MAP_DEFS[mapId];
  return { x: def.w >> 1, y: def.h >> 1 };
}

const signed = (key, diff) => `${diff > 0 ? '+' : '-'}${formatStat(key, Math.abs(diff))}`;

export class Game {
  constructor(player) {
    this.player = player;
    this.listeners = new Set();
    this.now = 0;
    this.idSeq = 1;
    this.playMs = player.playMs;
    this.buffs = [];
    this.hots = [];
    this.cooldowns = {};
    this.attackReadyAt = 0;
    this.stealthUntil = 0;
    this.guardianUntil = 0;
    this.shakeUntil = 0;
    this.speech = null;
    this.inputDir = null;
    this.messages = [];
    this.dead = false;
    this.reviveAt = 0;
    this.lastHitAt = -99999;
    this.nextRegenAt = REGEN_INTERVAL_MS;
    this.bossTimers = {};
    this.queued = null;
    this.turnedAt = 0;
    this.pe = null;
    this.loadMap(player.mapId, player.x, player.y, player.dir);
  }

  // ── 기본 도구 ───────────────────────────────────────────
  nextId() { return this.idSeq++; }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type, data) { for (const fn of this.listeners) fn(type, data); }
  log(text, color = '#f3ead2') {
    this.messages = [...this.messages.slice(-60), { text, color, at: this.now, id: this.nextId() }];
    this.emit('log');
  }
  stats() { return computeStats(this.player, this.buffs, this.now); }
  setPlayer(patch) { this.player = { ...this.player, ...patch }; }
  setGm(patch) { this.setPlayer({ gm: { ...this.player.gm, ...patch } }); }
  addEffect(e) { this.effects.push({ ...e, start: this.now + (e.delay ?? 0) }); }
  addText(text, x, y, color, size = 10) { this.texts.push({ text, x, y, color, size, start: this.now, dur: 900 }); }
  say(text) { this.speech = { text, until: this.now + 1100 }; }
  shake(ms) { this.shakeUntil = this.now + ms; }
  isStealthed() { return this.stealthUntil > this.now; }
  title() { return titleOf(this.player.cls, this.player.tier); }

  toSave() {
    const base = { ...this.player, playMs: Math.floor(this.playMs) };
    if (this.dead) {
      // 쓰러진 채 앱을 닫아도 마을에서 깨어난 상태로 이어지게
      const s = this.stats();
      return { ...base, mapId: RESPAWN_POINT.mapId, x: RESPAWN_POINT.x, y: RESPAWN_POINT.y, dir: 'down', hp: s.maxHp, mp: s.maxMp };
    }
    return { ...base, mapId: this.mapId, x: this.pe.x, y: this.pe.y, dir: this.pe.dir };
  }

  // ── 맵 ─────────────────────────────────────────────────
  loadMap(mapId, x, y, dir = 'down') {
    const def = MAP_DEFS[mapId];
    this.mapId = mapId;
    this.mapDef = def;
    this.map = { tiles: getTiles(mapId), w: def.w, h: def.h };
    this.npcs = (def.npcs ?? []).map((n) => ({
      ...n, kind: 'npc', dir: 'down', face: 'left', fromX: n.x, fromY: n.y, stepT: 1, moving: false,
      homeX: n.x, homeY: n.y, nextActAt: 2000,
    }));
    this.monsters = [];
    this.groundItems = [];
    this.projectiles = [];
    this.effects = [];
    this.texts = [];
    this.respawnQueue = [];
    this.queued = null;
    if (def.indoor) this.riding = false;
    this.pe = null;
    const start = this.nearestFree(x, y);
    this.pe = { kind: 'player', x: start.x, y: start.y, fromX: start.x, fromY: start.y, stepT: 1, moving: false, dir };
    spawnInitialMonsters(this);
    this.setPlayer({ mapId, x: start.x, y: start.y });
    this.emit('map', def);
    this.log(`${def.name}에 들어섰습니다.`, '#9fd3ff');
  }

  isSolid(x, y) {
    const row = this.map.tiles[y];
    return !row || row[x] === undefined || SOLID.has(row[x]);
  }
  monsterAt(x, y) { return this.monsters.find((m) => m.x === x && m.y === y) ?? null; }
  npcAt(x, y) { return this.npcs.find((n) => n.x === x && n.y === y) ?? null; }
  isFree(x, y) {
    if (this.isSolid(x, y)) return false;
    if (this.pe && this.pe.x === x && this.pe.y === y) return false;
    return !this.monsterAt(x, y) && !this.npcAt(x, y);
  }
  portalAt(x, y) {
    return this.mapDef.portals.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) ?? null;
  }
  nearestFree(x, y) {
    const { w, h } = this.map;
    const sx = Math.max(0, Math.min(w - 1, x));
    const sy = Math.max(0, Math.min(h - 1, y));
    const seen = new Set([`${sx},${sy}`]);
    const queue = [[sx, sy]];
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (this.isFree(cx, cy) && !this.portalAt(cx, cy)) return { x: cx, y: cy };
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(`${nx},${ny}`)) continue;
        seen.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }
    return { x: sx, y: sy };
  }
  frontTile() {
    const [dx, dy] = DIRS[this.pe.dir];
    return { x: this.pe.x + dx, y: this.pe.y + dy };
  }

  // ── 매 프레임 ──────────────────────────────────────────
  update(dt) {
    this.now += dt;
    this.playMs += dt;
    if (this.dead) {
      if (this.now >= this.reviveAt) this.revive();
    } else {
      this.updatePlayer(dt);
    }
    this.updateNpcs(dt);
    updateMonsters(this, dt);
    updateProjectiles(this, dt);
    updateRespawns(this);
    this.updateHots();
    this.updateRegen();
    this.cleanup();
  }

  updatePlayer(dt) {
    const pe = this.pe;
    const stepMs = pe.stepMsOverride ?? PLAYER_STEP_MS / this.player.gm.speed / (this.riding ? 1.8 : 1);
    const overflow = advanceStep(pe, dt, stepMs);
    if (overflow >= 0) {
      pe.stepMsOverride = undefined;
      if (this.onArrive()) return;
    }
    if (!pe.moving && this.queued) {
      const action = this.queued;
      this.queued = null;
      if (action.type === 'skill') castSkill(this, action.id);
      else this.attack();
      if (this.dead || this.pe !== pe || pe.moving) return;
    }
    if (pe.moving) return;
    if (!this.inputDir) {
      this.turnedAt = 0;
      return;
    }
    // 다른 방향을 짧게 누르면 제자리에서 돌아서기만 한다(계속 걷던 중이면 바로 꺾는다)
    if (this.inputDir !== pe.dir && overflow < 0) {
      pe.dir = this.inputDir;
      this.turnedAt = this.now;
      return;
    }
    if (this.turnedAt && this.now - this.turnedAt < TURN_HOLD_MS) return;
    this.turnedAt = 0;
    pe.dir = this.inputDir;
    const [dx, dy] = DIRS[pe.dir];
    if (!this.isFree(pe.x + dx, pe.y + dy)) return;
    beginStep(pe, pe.x + dx, pe.y + dy);
    if (overflow > 0) pe.stepT = Math.min(overflow, 0.9);
  }

  /** 한 칸 도착 처리. 맵이 바뀌었으면 true */
  onArrive() {
    const portal = this.portalAt(this.pe.x, this.pe.y);
    if (portal) {
      this.loadMap(portal.to, portal.tx, portal.ty, this.pe.dir);
      return true;
    }
    this.pickUp();
    return false;
  }

  updateNpcs(dt) {
    for (const n of this.npcs) {
      if (!n.wander) continue;
      advanceStep(n, dt, NPC_STEP_MS);
      if (n.moving || this.now < n.nextActAt) continue;
      n.nextActAt = this.now + randInt(Math.random, 1500, 4500);
      const dir = DIR_NAMES[randInt(Math.random, 0, 3)];
      const [dx, dy] = DIRS[dir];
      const nx = n.x + dx;
      const ny = n.y + dy;
      n.dir = dir;
      if (dx) n.face = dx < 0 ? 'left' : 'right';
      if (manhattan({ x: nx, y: ny }, { x: n.homeX, y: n.homeY }) > 5 || !this.isFree(nx, ny) || this.portalAt(nx, ny)) continue;
      beginStep(n, nx, ny);
    }
  }

  updateHots() {
    if (!this.hots.length || this.dead) return;
    for (const h of this.hots) {
      if (this.now < h.nextAt || h.nextAt > h.until) continue;
      h.nextAt += 1000;
      this.restore({ hp: h.perTick });
    }
    this.hots = this.hots.filter((h) => h.nextAt <= h.until);
  }

  updateRegen() {
    if (this.now < this.nextRegenAt) return;
    this.nextRegenAt = this.now + REGEN_INTERVAL_MS;
    if (this.dead) return;
    const s = this.stats();
    const calm = this.now - this.lastHitAt > 8000 ? 2 : 1;
    const safe = this.mapDef.safe ? 3 : 1;
    this.setPlayer({
      hp: Math.min(s.maxHp, this.player.hp + Math.ceil(s.maxHp * 0.02 * calm * safe)),
      mp: Math.min(s.maxMp, this.player.mp + Math.ceil(s.maxMp * 0.03 * calm * safe)),
    });
  }

  cleanup() {
    const now = this.now;
    this.effects = this.effects.filter((e) => now - e.start < e.dur);
    this.texts = this.texts.filter((t) => now - t.start < t.dur);
    if (this.groundItems.some((g) => g.expiresAt <= now)) this.groundItems = this.groundItems.filter((g) => g.expiresAt > now);
    if (this.buffs.some((b) => b.until <= now)) {
      this.buffs = this.buffs.filter((b) => b.until > now);
      this.clampVitals();
    }
    if (this.stealthUntil && this.stealthUntil <= now) this.breakStealth();
  }

  // ── 전투 ───────────────────────────────────────────────
  /** 바라보는 칸의 몬스터. 없으면 붙어 있는 몬스터 쪽으로 돌아선다. */
  meleeTarget() {
    const f = this.frontTile();
    const front = this.monsterAt(f.x, f.y);
    if (front) return front;
    for (const dir of DIR_NAMES) {
      const [dx, dy] = DIRS[dir];
      const adj = this.monsterAt(this.pe.x + dx, this.pe.y + dy);
      if (adj) {
        this.pe.dir = dir;
        return adj;
      }
    }
    return null;
  }

  attack() {
    if (this.dead || this.now < this.attackReadyAt) return;
    if (this.pe.moving) {
      this.queued = { type: 'attack' };
      return;
    }
    const f = this.frontTile();
    const npc = this.npcAt(f.x, f.y);
    if (npc) {
      this.attackReadyAt = this.now + 400;
      this.emit('talk', npc);
      return;
    }
    this.attackReadyAt = this.now + CLASSES[this.player.cls].attackMs;
    this.attackPoseUntil = this.now + 160;
    const target = this.meleeTarget();
    const at = target ?? this.frontTile();
    this.addEffect({ type: 'slash', x: at.x, y: at.y, dir: this.pe.dir, dur: 180 });
    if (target) this.strike(target);
    else this.emit('sfx', 'swing');
  }

  /** 슬롯 번호로 기술 사용. 빈 슬롯이면 기술창을 연다. */
  castSlot(index) {
    const id = this.player.skillSlots[index];
    if (!id) {
      this.emit('openPanel', 'skills');
      return;
    }
    this.castSkillById(id);
  }

  castSkillById(id) {
    if (this.dead) return;
    if (this.pe.moving) this.queued = { type: 'skill', id };
    else castSkill(this, id);
  }

  assignSkill(slotIndex, id) {
    this.setPlayer({ skillSlots: assignSlot(this.player.skillSlots, slotIndex, id) });
  }

  /** 화면을 눌렀을 때: 가까운 NPC면 대화 */
  tapTile(x, y) {
    const npc = this.npcAt(x, y);
    if (!npc || this.dead || manhattan(npc, this.pe) > 4) return false;
    this.pe.dir = dirTowards(this.pe.x, this.pe.y, npc.x, npc.y);
    this.emit('talk', npc);
    return true;
  }

  /** 플레이어가 몬스터를 때린다(일반 공격·기술 공통). 저주·은신 보너스를 반영한다. */
  strike(m, { power = 1, stat = 'atk', magic = false, forceCrit = false } = {}) {
    const s = this.stats();
    const cursed = m.curseUntil > this.now;
    const roll = rollDamage({
      power,
      attackStat: s[stat],
      defense: MONSTERS[m.type].def * (cursed ? 0.5 : 1),
      crit: forceCrit ? 1 : magic ? 0 : s.crit,
      magic,
    });
    let { dmg } = roll;
    let { isCrit } = roll;
    if (cursed) dmg = Math.round(dmg * 1.3);
    if (this.isStealthed()) {
      dmg *= 2;
      isCrit = true;
      this.breakStealth();
    }
    this.damageMonster(m, dmg, isCrit);
    return dmg;
  }

  breakStealth() {
    if (!this.stealthUntil) return;
    this.stealthUntil = 0;
    this.log('은신이 풀렸습니다.', '#b9a6e8');
  }

  damageMonster(m, dmg, isCrit, kind = 'hit') {
    if (m.hp <= 0) return;
    m.hp -= dmg;
    m.hitAt = this.now;
    const jitter = (Math.random() - 0.5) * 0.5;
    if (kind === 'dot') {
      this.addText(`${dmg}`, m.x + jitter, m.y, '#a8f58a', 9);
    } else {
      if (!m.aggro) m.emote = { text: '!', until: this.now + 800 };
      m.aggro = true;
      this.addText(isCrit ? `${dmg}!` : `${dmg}`, m.x + jitter, m.y, isCrit ? '#ffcf3f' : '#ffffff', isCrit ? 13 : 10);
      this.addEffect({ type: 'hit', x: m.x, y: m.y, dur: 200 });
      this.emit('sfx', isCrit ? 'crit' : 'hit');
    }
    if (m.hp <= 0) this.killMonster(m);
  }

  killMonster(m) {
    const d = MONSTERS[m.type];
    m.hp = 0;
    this.monsters = this.monsters.filter((x) => x !== m);
    if (!m.summoned) {
      this.respawnQueue = [...this.respawnQueue, { type: m.type, at: this.now + d.respawnMs }];
      if (d.boss) this.bossTimers = { ...this.bossTimers, [m.type]: this.now + d.respawnMs };
    }
    const gold = rollGold(d.gold);
    this.groundItems = [...this.groundItems, { id: GOLD_ID, qty: gold, x: m.x, y: m.y, spawnAt: this.now, expiresAt: this.now + GROUND_ITEM_TTL_MS }];
    for (const id of rollDrops(d.drops)) {
      this.groundItems = [...this.groundItems, { id, qty: 1, x: m.x, y: m.y, spawnAt: this.now, expiresAt: this.now + GROUND_ITEM_TTL_MS }];
    }
    this.addEffect({ type: 'poof', x: m.x, y: m.y, dur: 400 });
    this.addText(`+${d.exp} 경험치`, m.x, m.y - 0.95, '#d7b8ff', 8);
    this.emit('sfx', 'kill');
    if (d.boss) this.log(`${josa(d.name, '을/를')} 쓰러뜨렸습니다!`, '#ff9fd0');
    this.countQuestKill(m.type);
    this.grantExp(d.exp);
  }

  grantExp(amount) {
    const before = this.player.level;
    const { player, levelsGained } = gainExp(this.player, amount);
    this.player = player;
    if (!levelsGained) return;
    this.setPlayer({ statPoints: (this.player.statPoints ?? 0) + levelsGained * STAT_POINTS_PER_LEVEL });
    const s = this.stats();
    this.setPlayer({ hp: s.maxHp, mp: s.maxMp });
    this.addEffect({ type: 'levelup', x: this.pe.x, y: this.pe.y, dur: 1400 });
    this.log(`축하합니다! 레벨 ${josa(player.level, '이/가')} 되었습니다.`, '#ffd166');
    this.learnSkills(before, player.level);
    this.emit('sfx', 'levelup');
    this.emit('levelup');
  }

  learnSkills(from, to) {
    const fresh = CLASSES[this.player.cls].skills.filter((id) => {
      const sk = SKILLS[id];
      return sk.level > from && sk.level <= to && (sk.tier ?? 0) <= this.player.tier && !this.player.learned.includes(id);
    });
    for (const id of fresh) this.log(`새 기술 [${SKILLS[id].name}]${josa(SKILLS[id].name, '을/를').slice(SKILLS[id].name.length)} 배울 수 있습니다. 기술창(K)을 열어 보세요.`, '#9be7a1');
    if (fresh.length) this.emit('learnable');
  }

  /** 기술을 배울 수 있는지: { ok, reason, cost } */
  canLearn(id) {
    const sk = SKILLS[id];
    const cost = sk ? learnCost(sk) : 0;
    if (!sk || !CLASSES[this.player.cls].skills.includes(id)) return { ok: false, reason: '배울 수 없는 기술입니다.', cost };
    if (this.player.learned.includes(id)) return { ok: false, reason: '이미 배웠습니다.', cost };
    if ((sk.tier ?? 0) > this.player.tier) return { ok: false, reason: `${sk.tier}차 승급이 필요합니다.`, cost };
    if (this.player.level < sk.level) return { ok: false, reason: `레벨 ${sk.level}부터 배울 수 있습니다.`, cost };
    if (this.player.gold < cost) return { ok: false, reason: `금전 ${cost.toLocaleString()}전이 필요합니다.`, cost };
    return { ok: true, reason: '', cost };
  }

  learnSkill(id) {
    const check = this.canLearn(id);
    if (!check.ok) {
      this.log(check.reason, '#ff9f80');
      return false;
    }
    const learned = [...this.player.learned, id];
    this.setPlayer({ learned, gold: this.player.gold - check.cost, skillSlots: slotNewSkill(this.player.skillSlots, id) });
    const slot = this.player.skillSlots.indexOf(id);
    const where = slot >= 0 ? ` (마법창 ${SPELL_LETTERS[slot]}${hotkeyLabel(slot) ? ` · ${hotkeyLabel(slot)}번 키` : ''})` : '';
    this.log(`[${SKILLS[id].name}]${josa(SKILLS[id].name, '을/를').slice(SKILLS[id].name.length)} 배웠습니다!${where}`, '#9be7a1');
    this.addEffect({ type: 'aura', x: this.pe.x, y: this.pe.y, color: '#9be7a1', dur: 700 });
    this.emit('sfx', 'learn');
    this.emit('inventory');
    return true;
  }

  learnableCount() {
    return CLASSES[this.player.cls].skills.filter((id) => this.canLearn(id).ok || this.canLearn(id).reason.startsWith('금전')).length;
  }

  // ── 승급 ───────────────────────────────────────────────
  /** 다음 승급 정보: { next, title, checks: [{ label, ok }], ok } */
  advanceInfo() {
    const next = nextAdvancement(this.player.tier);
    if (!next) return { next: null, title: this.title(), checks: [], ok: false };
    const checks = [
      { label: `레벨 ${next.level} 이상 (지금 ${this.player.level})`, ok: this.player.level >= next.level },
      ...next.items.map(([id, qty]) => ({ label: `${ITEMS[id].name} ${qty}개 (가진 것 ${countOf(this.player.inv, id)})`, ok: countOf(this.player.inv, id) >= qty })),
      { label: `금전 ${next.gold.toLocaleString()}전`, ok: this.player.gold >= next.gold },
    ];
    return { next, title: titleOf(this.player.cls, next.tier), checks, ok: checks.every((c) => c.ok) };
  }

  advance() {
    const info = this.advanceInfo();
    if (!info.ok) return false;
    const { next } = info;
    let inv = this.player.inv;
    for (const [id, qty] of next.items) inv = removeCount(inv, id, qty);
    const reward = next.reward[this.player.cls];
    const added = addItem(inv, reward, 1);
    if (added.leftover) {
      this.log('가방에 자리가 부족합니다. 한 칸을 비우고 다시 오세요.', '#ff9f80');
      return false;
    }
    this.setPlayer({ inv: added.inv, gold: this.player.gold - next.gold, tier: next.tier });
    this.healFull();
    this.addEffect({ type: 'levelup', x: this.pe.x, y: this.pe.y, dur: 1800, text: `${info.title}!` });
    this.addEffect({ type: 'pillar', x: this.pe.x, y: this.pe.y, color: '#ffe066', dur: 1200 });
    this.log(`축하합니다! ${next.tier}차 승급하여 [${info.title}]${josa(info.title, '이/가').slice(info.title.length)} 되었습니다.`, '#ffd166');
    this.log(`승급 기념으로 ${josa(ITEMS[reward].name, '을/를')} 받았습니다.`, '#c8e6a0');
    this.learnSkills(0, this.player.level);
    this.emit('sfx', 'levelup');
    this.emit('inventory');
    return true;
  }

  damagePlayer(dmg) {
    if (this.dead) return;
    const pe = this.pe;
    if (this.player.gm.god) {
      this.addText('무적', pe.x, pe.y, '#aab7b8');
      return;
    }
    const hp = Math.max(0, this.player.hp - dmg);
    this.setPlayer({ hp });
    this.lastHitAt = this.now;
    this.addText(`${dmg}`, pe.x, pe.y, '#ff6b6b');
    this.emit('sfx', 'hurt');
    if (hp > 0) return;
    if (this.player.learned.includes('revival') && this.now >= (this.cooldowns.revival ?? 0)) {
      this.cooldowns = { ...this.cooldowns, revival: this.now + SKILLS.revival.cd };
      this.setPlayer({ hp: Math.ceil(this.stats().maxHp * 0.3), mp: Math.floor(this.player.mp / 2) });
      this.addEffect({ type: 'pillar', x: pe.x, y: pe.y, color: '#ffe9a8', dur: 900 });
      this.log('회생술! 쓰러진 자리에서 다시 일어났습니다.', '#ffe9a8');
      return;
    }
    if (this.guardianUntil > this.now) {
      this.guardianUntil = 0;
      this.setPlayer({ hp: Math.ceil(this.stats().maxHp * 0.5) });
      this.addEffect({ type: 'pillar', x: pe.x, y: pe.y, color: '#fff6d5', dur: 900 });
      this.log('수호령이 쓰러진 당신을 일으켜 세웠습니다!', '#fff6d5');
      return;
    }
    this.die();
  }

  die() {
    this.dead = true;
    this.reviveAt = this.now + DEATH_DELAY_MS;
    this.stealthUntil = 0;
    this.guardianUntil = 0;
    this.hots = [];
    const charm = this.player.inv.findIndex((s) => s.id === 'guardCharm');
    if (charm >= 0) {
      this.setPlayer({ inv: removeAt(this.player.inv, charm) });
      this.log('수호부적이 타오르며 경험치를 지켜 주었습니다.', '#ffe9a8');
    } else {
      this.player = withDeathPenalty(this.player);
    }
    this.log('쓰러졌습니다... 청풍촌에서 다시 깨어납니다.', '#ff8a80');
    this.emit('death');
  }

  revive() {
    this.dead = false;
    this.buffs = [];
    this.healFull();
    this.loadMap(RESPAWN_POINT.mapId, RESPAWN_POINT.x, RESPAWN_POINT.y, 'down');
  }

  restore({ hp = 0, mp = 0 }) {
    const s = this.stats();
    const nextHp = Math.min(s.maxHp, this.player.hp + hp);
    const nextMp = Math.min(s.maxMp, this.player.mp + mp);
    if (nextHp > this.player.hp) this.addText(`+${nextHp - this.player.hp}`, this.pe.x, this.pe.y, '#7dff9b');
    if (nextMp > this.player.mp) this.addText(`+${nextMp - this.player.mp}`, this.pe.x + 0.3, this.pe.y, '#7fb3ff');
    this.setPlayer({ hp: nextHp, mp: nextMp });
  }

  clampVitals() {
    const s = this.stats();
    this.setPlayer({ hp: Math.min(this.player.hp, s.maxHp), mp: Math.min(this.player.mp, s.maxMp) });
  }

  healFull() {
    const s = this.stats();
    this.setPlayer({ hp: s.maxHp, mp: s.maxMp });
  }

  // ── 아이템 ─────────────────────────────────────────────
  giveItem(id, qty) {
    const { inv, leftover } = addItem(this.player.inv, id, qty);
    this.setPlayer({ inv });
    this.emit('inventory');
    return qty - leftover;
  }

  pickUp() {
    const coins = this.groundItems.filter((g) => g.id === GOLD_ID && g.x === this.pe.x && g.y === this.pe.y);
    if (coins.length) {
      const total = coins.reduce((n, c) => n + c.qty, 0);
      this.setPlayer({ gold: this.player.gold + total });
      this.groundItems = this.groundItems.filter((g) => !coins.includes(g));
      this.addText(`+${total.toLocaleString()}전`, this.pe.x, this.pe.y - 0.4, '#ffd966', 9);
      this.emit('sfx', 'coin');
    }
    const here = this.groundItems.filter((g) => g.x === this.pe.x && g.y === this.pe.y);
    if (!here.length) return;
    const questBefore = this.allQuests().map((q) => q.state);
    let inv = this.player.inv;
    const left = [];
    const got = [];
    for (const g of here) {
      const r = addItem(inv, g.id, g.qty);
      inv = r.inv;
      if (r.leftover) left.push({ ...g, qty: r.leftover });
      else got.push(g.id);
    }
    this.groundItems = [...this.groundItems.filter((g) => !here.includes(g)), ...left];
    this.setPlayer({ inv });
    for (const id of got) {
      this.log(`${josa(ITEMS[id].name, '을/를')} 획득했습니다.`, '#c8e6a0');
      if (isEquipment(id) && isUpgrade(this.player, id)) this.log(`✨ 지금보다 좋은 장비입니다! 가방에서 ▲ 표시를 눌러 착용하세요.`, '#7dff9b');
    }
    if (got.length) this.emit('sfx', 'pickup');
    if (left.length) this.log('가방이 가득 찼습니다.', '#ff9f80');
    this.allQuests().forEach((q, i) => {
      if (questBefore[i] === 'active' && q.state === 'ready') this.log(`[퀘스트] ${q.quest.title} 목표 달성! ${QUEST_GIVERS[q.npc]}에게 돌아가세요.`, '#ffd166');
    });
    this.emit('inventory');
  }

  useItemAt(index) {
    const slot = this.player.inv[index];
    if (!slot || this.dead) return;
    if (isEquipment(slot.id)) {
      this.equipAt(index);
      return;
    }
    const it = ITEMS[slot.id];
    if (it.type !== 'consume') {
      this.log('사용할 수 없는 물건입니다.', '#bbb');
      return;
    }
    if (it.effect === 'return') {
      if (this.mapDef.safe) {
        this.log('이미 마을 안입니다.', '#bbb');
        return;
      }
      this.setPlayer({ inv: removeAt(this.player.inv, index) });
      this.emit('inventory');
      this.teleport(RESPAWN_POINT.mapId);
      return;
    }
    const s = this.stats();
    const hpFull = !it.restore.hp || this.player.hp >= s.maxHp;
    const mpFull = !it.restore.mp || this.player.mp >= s.maxMp;
    if (hpFull && mpFull) {
      this.log('이미 가득 차 있습니다.', '#bbb');
      return;
    }
    this.setPlayer({ inv: removeAt(this.player.inv, index) });
    this.restore(it.restore);
    this.emit('sfx', 'drink');
    this.emit('inventory');
  }

  useQuick(kind) {
    for (const id of QUICK_ITEMS[kind]) {
      const index = this.player.inv.findIndex((s) => s.id === id);
      if (index >= 0) {
        this.useItemAt(index);
        return;
      }
    }
    this.log(`${kind === 'hp' ? '체력' : '마력'} 회복약이 없습니다.`, '#bbb');
  }

  quickCount(kind) {
    return QUICK_ITEMS[kind].reduce((n, id) => n + countOf(this.player.inv, id), 0);
  }

  /** 능력치 변화를 대화창·머리 위 글자로 알린다. */
  announceDiff(title, rows) {
    const summary = rows.map((r) => `${r.label} ${formatStat(r.key, r.before)}→${formatStat(r.key, r.after)}`).join(', ');
    this.log(`${title}${summary ? ` (${summary})` : ''}`, '#c8e6a0');
    rows.slice(0, 4).forEach((r, i) => {
      this.addText(`${r.label} ${signed(r.key, r.diff)}`, this.pe.x, this.pe.y - 0.6 - i * 0.45, r.diff > 0 ? '#7dff9b' : '#ff8a80', 9);
    });
    this.lastDiff = { title, rows, at: this.now };
  }

  /** 가방 index의 장비를 낀다. 바뀐 능력치 목록을 돌려준다(실패하면 null). */
  equipAt(index) {
    const slot = this.player.inv[index];
    if (!slot || !isEquipment(slot.id)) return null;
    const check = canEquip(this.player, slot.id);
    if (!check.ok) {
      this.log(check.reason, '#ff9f80');
      return null;
    }
    const before = this.stats();
    this.player = equipFromInventory(this.player, index);
    this.clampVitals();
    const rows = statDiff(before, this.stats());
    this.announceDiff(`${josa(ITEMS[slot.id].name, '을/를')} 착용했습니다.`, rows);
    this.emit('sfx', 'equip');
    this.emit('inventory');
    return rows;
  }

  unequip(slotName) {
    const id = this.player.equip[slotName];
    if (!id) return null;
    const { inv, leftover } = addItem(this.player.inv, id, 1);
    if (leftover) {
      this.log('가방이 가득 찼습니다.', '#ff9f80');
      return null;
    }
    const before = this.stats();
    this.setPlayer({ inv, equip: { ...this.player.equip, [slotName]: null } });
    this.clampVitals();
    const rows = statDiff(before, this.stats());
    this.announceDiff(`${josa(ITEMS[id].name, '을/를')} 벗었습니다.`, rows);
    this.emit('sfx', 'unequip');
    this.emit('inventory');
    return rows;
  }

  /** 가방에서 더 좋은 장비를 모두 골라 낀다. */
  autoEquipAll() {
    const before = this.stats();
    const { player, equipped } = autoEquip(this.player);
    if (!equipped.length) {
      this.log('지금보다 좋은 장비가 없습니다.', '#bbb');
      return null;
    }
    this.player = player;
    this.clampVitals();
    const rows = statDiff(before, this.stats());
    this.announceDiff(`${equipped.map((id) => ITEMS[id].name).join(', ')} 착용`, rows);
    this.emit('sfx', 'equip');
    this.emit('inventory');
    return rows;
  }

  /** 장비 칸 강화. 성공하면 true, 실패(금전만 소모)·불가면 false */
  enhance(slot, rng = Math.random) {
    const info = enhanceInfo(this.player, slot);
    if (!info) return false;
    if (this.player.gold < info.cost) {
      this.log(`금전이 부족합니다. (${info.cost.toLocaleString()}전 필요)`, '#ff9f80');
      return false;
    }
    const before = this.stats();
    const name = ITEMS[this.player.equip[slot]].name;
    this.setPlayer({ gold: this.player.gold - info.cost });
    if (rng() >= info.rate) {
      this.log(`강화 실패... ${name} +${info.plus} 그대로입니다. (-${info.cost.toLocaleString()}전)`, '#ff8a80');
      this.emit('sfx', 'hurt');
      this.emit('inventory');
      return false;
    }
    this.setPlayer({ enhance: { ...this.player.enhance, [slot]: info.next } });
    this.announceDiff(`강화 성공! ${name} +${info.next}`, statDiff(before, this.stats()));
    this.addEffect({ type: 'pillar', x: this.pe.x, y: this.pe.y, color: '#ffe066', dur: 700 });
    this.emit('sfx', 'levelup');
    this.emit('inventory');
    return true;
  }

  /** 능력치 점수 하나를 찍는다(str 힘·dex 민첩·int 지력·con 체력). */
  allocate(stat, count = 1) {
    const n = Math.min(count, this.player.statPoints ?? 0);
    if (n <= 0 || !['str', 'dex', 'int', 'con'].includes(stat)) return false;
    this.setPlayer({ statPoints: this.player.statPoints - n, alloc: { ...this.player.alloc, [stat]: (this.player.alloc?.[stat] ?? 0) + n } });
    this.emit('inventory');
    return true;
  }

  /** 능력치 초기화(금전 필요): 찍은 점수를 모두 돌려받는다. */
  resetStatsCost() {
    return this.player.level * 300;
  }

  resetStats() {
    const cost = this.resetStatsCost();
    const used = Object.values(this.player.alloc ?? {}).reduce((a, b) => a + b, 0);
    if (!used) return false;
    if (this.player.gold < cost) {
      this.log(`금전이 부족합니다. (${cost.toLocaleString()}전 필요)`, '#ff9f80');
      return false;
    }
    this.setPlayer({ gold: this.player.gold - cost, statPoints: (this.player.statPoints ?? 0) + used, alloc: { str: 0, dex: 0, int: 0, con: 0 } });
    this.clampVitals();
    this.log('능력치를 초기화했습니다.', '#9be7a1');
    this.emit('inventory');
    return true;
  }

  /** 용 무기 받기(사범에게 1차 승급 후 한 번) */
  claimDragonWeapon() {
    if (this.player.dragonClaimed || (this.player.tier ?? 0) < 1) return false;
    const id = DRAGON_WEAPONS[this.player.cls];
    const r = addItem(this.player.inv, id, 1);
    if (r.leftover) {
      this.log('가방에 자리가 없습니다.', '#ff9f80');
      return false;
    }
    this.setPlayer({ inv: r.inv, dragonClaimed: true });
    this.log(`${ITEMS[id].name}을(를) 받았습니다! 용의 숨결로 각성시켜 키울 수 있습니다.`, '#7fe3c3');
    this.emit('sfx', 'quest');
    this.emit('inventory');
    return true;
  }

  /** 용 무기 각성: 용의 숨결과 금전을 써서 단계를 올린다(실패 없음). */
  awaken() {
    const info = awakenInfo(this.player);
    if (!info) return false;
    if (countOf(this.player.inv, 'dragonBreath') < info.breath || this.player.gold < info.gold) {
      this.log(`각성 재료가 모자랍니다. (용의 숨결 ${info.breath}개, 금전 ${info.gold.toLocaleString()}전)`, '#ff9f80');
      return false;
    }
    const before = this.stats();
    this.setPlayer({
      inv: removeCount(this.player.inv, 'dragonBreath', info.breath),
      gold: this.player.gold - info.gold,
      dragonStage: info.next,
    });
    this.announceDiff(`용 무기 각성 ${info.next}단계!`, statDiff(before, this.stats()));
    this.addEffect({ type: 'pillar', x: this.pe.x, y: this.pe.y, color: '#4fe0b0', dur: 900 });
    this.emit('sfx', 'levelup');
    this.emit('inventory');
    return true;
  }

  /** 뱃사공 이동: 레벨·뱃삯을 확인하고 그 지역 한가운데로 간다. */
  voyage(route) {
    if (this.player.level < route.level) {
      this.log(`레벨 ${route.level}부터 갈 수 있는 곳입니다.`, '#ff9f80');
      return false;
    }
    if (this.player.gold < route.cost) {
      this.log(`뱃삯이 모자랍니다. (${route.cost.toLocaleString()}전)`, '#ff9f80');
      return false;
    }
    this.setPlayer({ gold: this.player.gold - route.cost });
    this.teleport(route.to);
    this.emit('sfx', 'equip');
    return true;
  }

  /** 말 타기 켜고 끄기(말 증서가 있어야 함, 실내에서는 못 탄다) */
  toggleRide() {
    if (!this.player.inv.some((s) => s.id === 'horseTicket')) {
      this.log('말이 없습니다. 마구간에서 말을 사세요.', '#bbb');
      return;
    }
    if (!this.riding && this.mapDef.indoor) {
      this.log('실내에서는 말을 탈 수 없습니다.', '#bbb');
      return;
    }
    this.riding = !this.riding;
    this.log(this.riding ? '말에 올라탔습니다. 이랴!' : '말에서 내렸습니다.', '#c8e6a0');
    this.emit('sfx', 'equip');
  }

  /** 주막에서 쉬기: 금전을 내고 체력·마력을 모두 채운다. */
  restCost() {
    return 20 + this.player.level * 6;
  }

  rest() {
    const cost = this.restCost();
    if (this.player.gold < cost) {
      this.log(`금전이 부족합니다. (${cost.toLocaleString()}전 필요)`, '#ff9f80');
      return false;
    }
    this.setPlayer({ gold: this.player.gold - cost });
    this.healFull();
    this.addEffect({ type: 'heal', x: this.pe.x, y: this.pe.y, dur: 900 });
    this.log(`푹 쉬었더니 몸이 개운합니다. (-${cost.toLocaleString()}전)`, '#9be7a1');
    this.emit('sfx', 'drink');
    this.emit('inventory');
    return true;
  }

  npcSay(npc, text) {
    const live = this.npcs.find((n) => n.id === npc.id);
    if (live) live.speech = { text, until: this.now + 1800 };
  }

  upgradeCount() {
    return upgradeCount(this.player);
  }

  discardAt(index) {
    const slot = this.player.inv[index];
    if (!slot) return;
    this.setPlayer({ inv: removeAt(this.player.inv, index, slot.qty) });
    this.log(`${josa(ITEMS[slot.id].name, '을/를')} 버렸습니다.`, '#bbb');
    this.emit('inventory');
  }

  buy(id, qty = 1) {
    const cost = ITEMS[id].price * qty;
    if (this.player.gold < cost) {
      this.log('금전이 부족합니다.', '#ff9f80');
      return false;
    }
    const { inv, leftover } = addItem(this.player.inv, id, qty);
    if (leftover) {
      this.log('가방에 자리가 부족합니다.', '#ff9f80');
      return false;
    }
    this.setPlayer({ inv, gold: this.player.gold - cost });
    this.log(`${ITEMS[id].name} ${qty}개를 샀습니다. (-${cost.toLocaleString()}전)`, '#f7dc6f');
    this.emit('sfx', 'coin');
    this.emit('inventory');
    return true;
  }

  sellAt(index, qty = 1) {
    const slot = this.player.inv[index];
    if (!slot) return;
    const n = Math.min(qty, slot.qty);
    const gain = sellPrice(slot.id) * n;
    this.setPlayer({ inv: removeAt(this.player.inv, index, n), gold: this.player.gold + gain });
    this.log(`${ITEMS[slot.id].name} ${n}개를 팔았습니다. (+${gain.toLocaleString()}전)`, '#f7dc6f');
    this.emit('sfx', 'coin');
    this.emit('inventory');
  }

  // ── 퀘스트 ─────────────────────────────────────────────
  /** npc의 현재 퀘스트 상태: offer(받을 수 있음) | active(진행 중) | ready(보고 가능) | done(모두 끝) */
  questInfo(npc = 'chief') {
    const qs = this.player.quests[npc];
    const q = qs && questById(npc, qs.id);
    if (!q) return { npc, state: 'done', quest: null, progress: 0 };
    const raw = q.goal.type === 'kill' ? qs.kills : countOf(this.player.inv, q.goal.target);
    const progress = Math.min(raw, q.goal.count);
    let state = 'active';
    if (!qs.accepted) state = 'offer';
    else if (progress >= q.goal.count) state = 'ready';
    return { npc, state, quest: q, progress };
  }

  allQuests() {
    return Object.keys(QUEST_CHAINS).map((npc) => this.questInfo(npc));
  }

  setQuest(npc, patch) {
    this.setPlayer({ quests: { ...this.player.quests, [npc]: { ...this.player.quests[npc], ...patch } } });
  }

  acceptQuest(npc = 'chief') {
    const info = this.questInfo(npc);
    if (info.state !== 'offer') return;
    this.setQuest(npc, { accepted: true, kills: 0 });
    this.log(`[퀘스트] '${info.quest.title}'${josa(info.quest.title, '을/를').slice(info.quest.title.length)} 맡았습니다.`, '#ffd166');
    this.emit('quest');
  }

  countQuestKill(type) {
    for (const npc of Object.keys(QUEST_CHAINS)) {
      const qs = this.player.quests[npc];
      const q = questById(npc, qs.id);
      if (!q || !qs.accepted || q.goal.type !== 'kill' || q.goal.target !== type || qs.kills >= q.goal.count) continue;
      const kills = qs.kills + 1;
      this.setQuest(npc, { kills });
      if (kills === q.goal.count) this.log(`[퀘스트] ${q.title} 목표 달성! ${QUEST_GIVERS[npc]}에게 돌아가세요.`, '#ffd166');
      this.emit('quest');
    }
  }

  completeQuest(npc = 'chief') {
    const info = this.questInfo(npc);
    if (info.state !== 'ready') return false;
    const q = info.quest;
    const items = rewardItems(q, this.player.cls);
    let inv = q.goal.type === 'collect' ? removeCount(this.player.inv, q.goal.target, q.goal.count) : this.player.inv;
    for (const [id, qty] of items) {
      const r = addItem(inv, id, qty);
      if (r.leftover) {
        this.log('가방에 자리가 부족합니다. 가방을 비우고 다시 오세요.', '#ff9f80');
        return false;
      }
      inv = r.inv;
    }
    const chain = QUEST_CHAINS[npc];
    const next = q.repeat ? q.id : chain[chain.indexOf(q) + 1]?.id ?? null;
    this.setPlayer({
      inv,
      gold: this.player.gold + q.reward.gold,
      quests: { ...this.player.quests, [npc]: { id: next, accepted: false, kills: 0 } },
    });
    this.log(`[퀘스트 완료] ${q.title}! 금전 +${q.reward.gold.toLocaleString()} · 경험치 +${q.reward.exp.toLocaleString()}`, '#ffd166');
    for (const [id, qty] of items) this.log(`보상으로 ${qty > 1 ? `${ITEMS[id].name} ${qty}개를` : josa(ITEMS[id].name, '을/를')} 받았습니다.`, '#c8e6a0');
    this.addEffect({ type: 'levelup', x: this.pe.x, y: this.pe.y, dur: 900, text: '퀘스트 완료!' });
    this.emit('sfx', 'quest');
    this.grantExp(q.reward.exp);
    this.emit('inventory');
    this.emit('quest');
    return true;
  }

  // ── 운영자(GM) ─────────────────────────────────────────
  teleport(mapId) {
    const p = entryPoint(mapId);
    this.loadMap(mapId, p.x, p.y, 'down');
  }

  gmSetLevel(level) {
    const before = this.player.level;
    this.player = withLevel(this.player, level);
    if (this.player.level > before) this.learnSkills(before, this.player.level);
    this.healFull();
    this.emit('levelup');
  }

  gmSetTier(tier) {
    this.setPlayer({ tier: Math.max(0, Math.min(3, tier)) });
    this.healFull();
    this.emit('inventory');
  }

  /** 지금 레벨·차수로 배울 수 있는 기술을 모두 무료로 배운다. */
  gmLearnAll() {
    const ids = CLASSES[this.player.cls].skills.filter((id) => {
      const sk = SKILLS[id];
      return sk.level <= this.player.level && (sk.tier ?? 0) <= this.player.tier && !this.player.learned.includes(id);
    });
    let slots = this.player.skillSlots;
    for (const id of ids) slots = slotNewSkill(slots, id);
    this.setPlayer({ learned: [...this.player.learned, ...ids], skillSlots: slots });
    this.emit('inventory');
    return ids.length;
  }

  gmSpawn(type, count) {
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const m = spawnMonster(this, type, this.pe);
      if (!m) continue;
      m.summoned = true;
      spawned += 1;
    }
    return spawned;
  }

  killAll() {
    const list = [...this.monsters];
    for (const m of list) this.killMonster(m);
    return list.length;
  }

  gmSetClass(cls) {
    const weapon = this.player.equip.weapon;
    const keepWeapon = weapon && ITEMS[weapon].wtype === CLASSES[cls].weapon;
    const inv = weapon && !keepWeapon ? addItem(this.player.inv, weapon, 1).inv : this.player.inv;
    const learned = starterSkills(cls);
    this.setPlayer({
      cls, inv, learned,
      equip: { ...this.player.equip, weapon: keepWeapon ? weapon : null },
      skillSlots: defaultSlots(learned),
    });
    this.cooldowns = {};
    this.buffs = [];
    this.healFull();
    this.emit('inventory');
  }
}
