// 자동 플레이 시뮬레이션: 4개 직업이 처음부터 사냥·퀘스트·상점·기술·승급을 스스로 해 나가며
// 오류·끼임·저장 불일치·진행 막힘을 찾는다.  사용법: node tools/simulate.mjs [직업] [최대 게임시간(시간)]
import { Game, createPlayer } from '../src/game.js';
import { MAP_DEFS } from '../src/data/maps.js';
import { CLASSES } from '../src/data/classes.js';
import { SKILLS } from '../src/data/skills.js';
import { ITEMS, isEquipment } from '../src/data/items.js';
import { MONSTERS } from '../src/data/monsters.js';
import { QUEST_CHAINS } from '../src/data/quests.js';
import { ADVANCEMENTS } from '../src/data/tiers.js';
import { DIRS, manhattan, chebyshev } from '../src/world/dirs.js';
import { upgradeGain } from '../src/core/equip.js';
import { countOf } from '../src/core/inventory.js';
import { validatePlayer, importText, exportText } from '../src/core/save.js';

const DT = 33;
const onlyClass = process.argv[2];
const MAX_HOURS = Number(process.argv[3] ?? 30);

// ── 어디서 사냥할지(레벨 기준) ──
const HUNT = [
  [1, 'field1'], [5, 'forest'], [9, 'wolfHill'], [13, 'goblinCave'], [17, 'deepMountain'],
  [25, 'imugiSwamp'], [33, 'snowPass'], [43, 'dragonCave'],
];
const BOSS_FOR_LEVEL = { gumiho: 21, imugi: 33, blackDragon: 50 };
const BOSS_MAP = { gumiho: 'bossLair', imugi: 'imugiSwamp', blackDragon: 'dragonCave' };
// 퀘스트·승급에 필요한 재료는 팔지 않는다
const KEEP = new Set(['foxTail', 'goblinHorn', 'whiteFur', 'imugiScale', 'dueokHorn', 'rabbitFur', 'acorn', 'wolfFang', 'boarTusk', 'snowPel', 'snowPelt', 'ghostBead', 'foxBead']);
const SHOP_NPCS = ['smith', 'tailor', 'herbalist', 'peddler'];

function mapRoute(from, to) {
  const prev = { [from]: null };
  const queue = [from];
  while (queue.length) {
    const m = queue.shift();
    if (m === to) break;
    for (const p of MAP_DEFS[m].portals) {
      if (p.to in prev) continue;
      prev[p.to] = { map: m, portal: p };
      queue.push(p.to);
    }
  }
  const steps = [];
  for (let m = to; prev[m]; m = prev[m].map) steps.unshift(prev[m].portal);
  return steps;
}

/** 격자 BFS: goals(타일 목록) 중 하나에 닿는 첫 걸음 방향. 몬스터·NPC는 막힌 칸으로 본다. */
function firstStep(game, goals, maxNodes = 6000, throughMonsters = false) {
  const key = (x, y) => x * 1000 + y;
  const goalSet = new Set(goals.map((g) => key(g.x, g.y)));
  const start = { x: game.pe.x, y: game.pe.y };
  if (goalSet.has(key(start.x, start.y))) return 'here';
  const seen = new Map([[key(start.x, start.y), null]]);
  const queue = [start];
  let n = 0;
  while (queue.length && n++ < maxNodes) {
    const c = queue.shift();
    for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      const k = key(nx, ny);
      if (seen.has(k)) continue;
      const isGoal = goalSet.has(k);
      const blockedByMonster = throughMonsters && game.monsterAt(nx, ny) && !game.isSolid(nx, ny);
      if (!game.isFree(nx, ny) && !blockedByMonster) continue;
      if (!isGoal && game.portalAt(nx, ny)) continue;
      seen.set(k, { from: c, dir });
      if (isGoal) {
        let node = { x: nx, y: ny };
        let step = seen.get(k);
        while (step.from.x !== start.x || step.from.y !== start.y) {
          node = step.from;
          step = seen.get(key(node.x, node.y));
        }
        return step.dir;
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

const neighbors = (t) => Object.values(DIRS).map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy }));

class Bot {
  constructor(cls) {
    this.cls = cls;
    this.game = new Game(createPlayer(`봇${CLASSES[cls].name}`, cls));
    this.report = { cls, milestones: [], deaths: 0, stuck: [], errors: [], invariants: [], bossFights: [], notes: [] };
    this.seen = new Set();
    this.lastPos = null;
    this.stillMs = 0;
    this.nextThink = 0;
    this.nextCheck = 0;
    this.game.on((type) => { if (type === 'death') this.report.deaths += 1; });
  }

  mark(text) {
    if (this.seen.has(text)) return;
    this.seen.add(text);
    this.report.milestones.push({ h: +(this.game.now / 3600000).toFixed(2), lv: this.game.player.level, text });
  }

  // ── 목표 정하기 ──
  goal() {
    const g = this.game;
    const p = g.player;
    const s = g.stats();
    const needVillage = this.villageReasons();
    if (needVillage.length || this.villageTasks) {
      this.villageTasks = true;
      return { type: 'village', reasons: needVillage };
    }
    for (const [boss, lv] of Object.entries(BOSS_FOR_LEVEL)) {
      const want = Object.entries(g.player.quests).some(([npc, qs]) => {
        const q = QUEST_CHAINS[npc].find((x) => x.id === qs.id);
        return qs.accepted && q?.goal.target === boss && g.questInfo(npc).state === 'active';
      }) || (boss === 'imugi' && p.tier >= 2 && p.tier < 3 && countOf(p.inv, 'imugiScale') < 1);
      if (want && p.level >= lv && s.maxHp > 0) return { type: 'boss', map: BOSS_MAP[boss], boss };
    }
    let map = 'field1';
    for (const [lv, m] of HUNT) if (p.level >= lv) map = m;
    // 승급 재료가 모자라면 그 재료가 나오는 곳에서 사냥
    const adv = ADVANCEMENTS.find((a) => a.tier === p.tier + 1);
    if (adv && p.level >= adv.level - 2) {
      const lacking = adv.items.find(([id, qty]) => countOf(p.inv, id) < qty);
      const source = lacking && { foxTail: 'forest', goblinHorn: 'goblinCave', whiteFur: 'deepMountain', dueokHorn: 'snowPass' }[lacking[0]];
      if (source) map = source;
    }
    // 수집 퀘스트 재료
    for (const info of g.allQuests()) {
      if (info.state !== 'active' || info.quest.goal.type !== 'collect') continue;
      const src = { acorn: 'field1', rabbitFur: 'field1', foxTail: 'forest', wolfFang: 'wolfHill', goblinHorn: 'goblinCave', boarTusk: 'deepMountain', whiteFur: 'deepMountain', ghostBead: 'imugiSwamp', snowPelt: 'snowPass', foxBead: 'bossLair' }[info.quest.goal.target];
      const huntIdx = HUNT.findIndex(([, m]) => m === src);
      const curIdx = HUNT.findIndex(([, m]) => m === map);
      if (info.quest.repeat || !src || src === 'bossLair' || huntIdx < 0) continue;
      if (p.level >= HUNT[huntIdx][0] && huntIdx >= curIdx - 1) { map = src; break; }
    }
    return { type: 'hunt', map };
  }

  villageReasons() {
    const g = this.game;
    const p = g.player;
    const r = [];
    if (g.allQuests().some((q) => q.state === 'ready')) r.push('퀘스트 보고');
    if (g.allQuests().some((q) => q.state === 'offer' && p.level >= 1) && !this.offersChecked) r.push('퀘스트 받기');
    const potionPrice = ITEMS[p.level >= 15 ? 'bigHerb' : 'herb'].price;
    if (g.quickCount('hp') < 3 && p.gold > potionPrice * 12) r.push('물약');
    if (p.inv.length >= 22) r.push('가방 정리');
    if (g.advanceInfo().ok) r.push('승급');
    return r;
  }

  // ── 매 프레임 ──
  step() {
    const g = this.game;
    try {
      g.inputDir = null;
      if (!g.dead && g.now >= this.nextThink && !g.pe.moving) this.think();
      g.update(DT);
      if (g.now >= this.nextCheck) {
        this.nextCheck = g.now + 1000;
        this.checkInvariants();
      }
    } catch (err) {
      this.report.errors.push(`${err.message} @ ${g.mapId} (${g.pe?.x},${g.pe?.y}) ${err.stack?.split('\n')[1]?.trim()}`);
      if (this.report.errors.length > 20) throw err;
    }
  }

  think() {
    const g = this.game;
    this.selfCare();
    if (this.queuedMove) {
      g.inputDir = this.queuedMove;
      this.queuedMove = null;
      return;
    }
    const goal = this.goal();
    if (goal.type === 'village') return this.doVillage(goal);
    if (g.mapId !== goal.map) return this.travel(goal.map);
    if (goal.type === 'boss' && !g.monsters.some((m) => m.type === goal.boss)) {
      // 보스 리젠 기다리는 동안 주변 잡몹 정리
      if (!this.waitBossNoted) { this.report.notes.push(`${goal.boss} 리젠 대기`); this.waitBossNoted = true; }
    }
    this.fight(goal.type === 'boss' ? goal.boss : null);
  }

  selfCare() {
    const g = this.game;
    const s = g.stats();
    const p = g.player;
    if (p.hp < s.maxHp * 0.55) {
      const heal = ['greatheal', 'undying', 'heal'].find((id) => p.skillSlots.includes(id) && g.now >= (g.cooldowns[id] ?? 0) && p.mp >= SKILLS[id].mp);
      if (heal) g.castSkillById(heal);
      else if (g.quickCount('hp')) g.useQuick('hp');
    }
    if (p.mp < s.maxMp * 0.2 && g.quickCount('mp')) g.useQuick('mp');
  }

  walkTo(goals) {
    const g = this.game;
    let dir = firstStep(g, goals);
    if (!dir) {
      // 길을 몬스터가 막고 있으면 그 몬스터를 처치하며 나아간다
      dir = firstStep(g, goals, 6000, true);
      if (dir && dir !== 'here') {
        const [dx, dy] = DIRS[dir];
        const blocker = g.monsterAt(g.pe.x + dx, g.pe.y + dy);
        if (blocker) {
          g.pe.dir = dir;
          g.attack();
          this.trackStuck(false);
          return dir;
        }
      }
    }
    if (dir && dir !== 'here') g.inputDir = dir;
    this.trackStuck(!!dir);
    return dir;
  }

  trackStuck(wantMove) {
    const g = this.game;
    const pos = `${g.mapId}:${g.pe.x},${g.pe.y}`;
    if (pos === this.lastPos && wantMove) this.stillMs += 150;
    else this.stillMs = 0;
    this.lastPos = pos;
    if (this.stillMs > 20000) {
      const near = g.monsters.filter((m) => manhattan(m, g.pe) <= 2).map((m) => `${m.type}@${m.x},${m.y}`);
      const loot = g.groundItems.filter((it) => manhattan(it, g.pe) <= 2).map((it) => `${it.id}@${it.x},${it.y}`);
      this.report.stuck.push({ h: +(g.now / 3600000).toFixed(2), pos, goal: this.goal().type, dir: g.pe.dir, inv: g.player.inv.length, near, loot, last: g.messages.slice(-2).map((m) => m.text) });
      this.stillMs = 0;
      const dirs = Object.keys(DIRS);
      this.queuedMove = dirs[Math.floor(Math.random() * 4)];
    }
  }

  travel(map) {
    const g = this.game;
    // 쫓아와 붙은 적이 있으면 먼저 처치한다(좁은 통로에서 맴돌지 않도록)
    const adjacentFoe = g.monsters.find((m) => manhattan(m, g.pe) === 1 && m.aggro);
    if (adjacentFoe) return this.fightNearest([adjacentFoe]);
    if (map === 'village' && g.mapId !== 'village') {
      const scroll = g.player.inv.findIndex((s) => s.id === 'returnScroll');
      if (scroll >= 0) {
        g.useItemAt(scroll);
        return;
      }
    }
    const route = mapRoute(g.mapId, map);
    if (!route.length) {
      this.report.invariants.push(`길 없음 ${g.mapId}→${map}`);
      return;
    }
    const p = route[0];
    const tiles = [];
    for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) tiles.push({ x, y });
    const dir = this.walkTo(tiles);
    if (!dir) this.fightNearest();
  }

  /** 가까운 몬스터와 싸운다. boss가 있으면 그 몬스터를 우선. */
  fight(bossType) {
    const g = this.game;
    // 떨어진 물건 줍기
    const loot = g.groundItems.filter((it) => manhattan(it, g.pe) <= 7);
    if (loot.length && !g.monsters.some((m) => manhattan(m, g.pe) <= 1)) {
      if (this.walkTo(loot.map((it) => ({ x: it.x, y: it.y })))) return;
    }
    let targets = g.monsters;
    if (bossType && g.monsters.some((m) => m.type === bossType)) targets = g.monsters.filter((m) => m.type === bossType);
    if (!targets.length) return this.walkTo([{ x: g.map.w >> 1, y: g.map.h >> 1 }]);
    this.fightNearest(targets);
  }

  fightNearest(targets = this.game.monsters) {
    const g = this.game;
    if (!targets.length) return;
    const adjacent = g.monsters.find((m) => manhattan(m, g.pe) === 1);
    if (this.useSkills(adjacent)) return;
    if (adjacent) {
      g.attack();
      return;
    }
    const sorted = [...targets].sort((a, b) => manhattan(a, g.pe) - manhattan(b, g.pe)).slice(0, 4);
    const goals = sorted.flatMap((m) => neighbors(m));
    this.walkTo(goals);
  }

  /** 상황에 맞는 기술을 쓴다. 썼으면 true */
  useSkills(adjacent) {
    const g = this.game;
    const p = g.player;
    const near = (r) => g.monsters.filter((m) => manhattan(m, g.pe) <= r);
    for (const id of p.skillSlots) {
      if (!id) continue;
      const sk = SKILLS[id];
      if (g.now < (g.cooldowns[id] ?? 0) || p.mp < sk.mp) continue;
      let use = false;
      switch (sk.kind) {
        case 'melee': case 'dash': use = !!adjacent; break;
        case 'aoe': use = g.monsters.some((m) => chebyshev(m, g.pe) <= sk.radius); break;
        case 'target': case 'chain': case 'zone': case 'multitarget': case 'blink': case 'multiblink': use = near(sk.range).length > 0; break;
        case 'projectile': case 'line': use = !!adjacent; break;
        case 'buff': case 'guardian': case 'stealth': use = near(4).length > 0 && !g.buffs.some((b) => b.id === id); break;
        case 'hot': use = p.hp < g.stats().maxHp * 0.7 && near(5).length > 0; break;
        case 'convert': use = p.mp < g.stats().maxMp * 0.3 && p.hp > g.stats().maxHp * 0.7; break;
        default: use = false;
      }
      if (use && (sk.kind === 'projectile' || sk.kind === 'line') && adjacent) g.attack(); // 바라보는 쪽을 몬스터로
      if (use && g.castSkillById(id) !== false) {
        if (g.now < (g.cooldowns[id] ?? 0)) return true;
      }
    }
    return false;
  }

  // ── 마을 일 ──
  doVillage(goal) {
    const g = this.game;
    if (g.mapId !== 'village') return this.travel('village');
    const p = g.player;
    // 1) 퀘스트 보고·수락
    for (const info of g.allQuests()) {
      if (info.state !== 'ready' && info.state !== 'offer') continue;
      if (!this.reachNpc(info.npc)) return;
      if (info.state === 'ready') {
        const done = g.completeQuest(info.npc);
        if (done) this.mark(`퀘스트 완료 ${info.npc}:${info.quest.id} ${info.quest.title}`);
        else this.sellLoot(true);
      } else {
        g.acceptQuest(info.npc);
        this.mark(`퀘스트 수락 ${info.npc}:${info.quest.id}`);
      }
      return;
    }
    this.offersChecked = true;
    // 2) 승급
    if (g.advanceInfo().ok) {
      if (!this.reachNpc('master')) return;
      if (g.advance()) this.mark(`${g.player.tier}차 승급 [${g.title()}]`);
      return;
    }
    // 3) 정리·물약·장비
    if (!this.shopped) {
      if (!this.reachNpc('herbalist')) return;
      this.sellLoot(false);
      this.buyPotions();
      this.buyGear();
      this.learnAndSlot();
      g.autoEquipAll();
      this.shopped = true;
    }
    // 마을 일을 마쳤으면 사냥으로(다음 귀환 때 다시 장보기)
    this.shopped = false;
    this.offersChecked = false;
    this.villageTasks = false;
    const reasons = this.villageReasons();
    if (reasons.length) this.report.notes.push(`마을 일 남음: ${reasons.join(',')}`);
    this.travel(this.goalAfterVillage());
  }

  goalAfterVillage() {
    let map = 'field1';
    for (const [lv, m] of HUNT) if (this.game.player.level >= lv) map = m;
    return map;
  }

  reachNpc(id) {
    const g = this.game;
    const npc = g.npcs.find((n) => n.id === id);
    if (!npc) return false;
    if (manhattan(npc, g.pe) <= 1) return true;
    const dir = this.walkTo(neighbors(npc));
    if (dir === 'here') return true;
    if (!dir) this.report.notes.push(`NPC ${id}에게 갈 수 없음`);
    return false;
  }

  sellLoot(all) {
    const g = this.game;
    for (let i = g.player.inv.length - 1; i >= 0; i--) {
      const s = g.player.inv[i];
      const it = ITEMS[s.id];
      const sellLootItem = it.type === 'loot' && (all || !KEEP.has(s.id));
      const sellGear = isEquipment(s.id) && upgradeGain(g.player, s.id) <= 0;
      if (sellLootItem || sellGear) g.sellAt(i, s.qty);
    }
  }

  buyPotions() {
    const g = this.game;
    const lv = g.player.level;
    const hpId = lv >= 15 ? 'bigHerb' : 'herb';
    const mpId = lv >= 15 ? 'bigDew' : 'dew';
    const want = 20;
    const budget = Math.floor(g.player.gold * 0.35);
    const hpCost = ITEMS[hpId].price;
    const n = Math.max(0, Math.min(want - countOf(g.player.inv, hpId), Math.floor(budget / 2 / hpCost)));
    if (n) g.buy(hpId, n);
    const m = Math.max(0, Math.min(want - countOf(g.player.inv, mpId), Math.floor(budget / 2 / ITEMS[mpId].price)));
    if (m) g.buy(mpId, m);
    if (!countOf(g.player.inv, 'returnScroll') && g.player.gold > 200) g.buy('returnScroll', 2);
  }

  buyGear() {
    const g = this.game;
    for (const id of SHOP_NPCS.flatMap((n) => g.npcs.find((x) => x.id === n)?.shop ?? [])) {
      if (!isEquipment(id) || ITEMS[id].price > g.player.gold * 0.6) continue;
      if (upgradeGain(g.player, id) > 0 && g.buy(id, 1)) g.autoEquipAll();
    }
  }

  learnAndSlot() {
    const g = this.game;
    for (const id of CLASSES[g.player.cls].skills) {
      if (g.canLearn(id).ok && (SKILLS[id].level > 1)) {
        if (g.learnSkill(id)) this.mark(`기술 배움 ${SKILLS[id].name}`);
      }
    }
    // 가장 높은 레벨 기술 5개를 슬롯에(치유는 도사에게 꼭)
    const learned = [...g.player.learned].sort((a, b) => SKILLS[b].level - SKILLS[a].level);
    const must = learned.filter((id) => ['heal', 'greatheal'].includes(id));
    const pick = [...must, ...learned.filter((id) => !must.includes(id) && SKILLS[id].kind !== 'convert')].slice(0, 5);
    pick.forEach((id, i) => g.assignSkill(i, id));
  }

  // ── 감시 ──
  checkInvariants() {
    const g = this.game;
    const p = g.player;
    const s = g.stats();
    const bad = (msg) => {
      if (this.report.invariants.length < 30) this.report.invariants.push(`${(g.now / 3600000).toFixed(2)}h ${g.mapId} ${msg}`);
    };
    for (const [k, v] of Object.entries(s)) if (!Number.isFinite(v)) bad(`능력치 ${k}=${v}`);
    if (!(p.hp >= 0 && p.hp <= s.maxHp)) bad(`체력 ${p.hp}/${s.maxHp}`);
    if (!(p.mp >= 0 && p.mp <= s.maxMp)) bad(`마력 ${p.mp}/${s.maxMp}`);
    if (g.isSolid(g.pe.x, g.pe.y)) bad(`플레이어가 벽 안 (${g.pe.x},${g.pe.y})`);
    const occ = new Set([`${g.pe.x},${g.pe.y}`]);
    for (const e of [...g.monsters, ...g.npcs]) {
      const k = `${e.x},${e.y}`;
      if (occ.has(k)) bad(`겹침 ${e.type ?? e.id} ${k}`);
      occ.add(k);
      if (g.isSolid(e.x, e.y)) bad(`벽 안 ${e.type ?? e.id} ${k}`);
      if (e.hp !== undefined && !Number.isFinite(e.hp)) bad(`몬스터 체력 NaN ${e.type}`);
    }
    if (p.inv.length > 24 || p.inv.some((x) => x.qty < 1 || x.qty > 99)) bad('가방 개수 이상');
    if (p.skillSlots.some((id) => id && !p.learned.includes(id))) bad('안 배운 기술이 슬롯에');
    if (!Number.isFinite(p.gold) || p.gold < 0) bad(`금전 ${p.gold}`);
    if (Math.floor(g.now / 1000) % 60 === 0) {
      const back = validatePlayer(importText(exportText(g.toSave())));
      for (const k of ['level', 'exp', 'gold', 'tier', 'cls']) if (back[k] !== g.toSave()[k]) bad(`저장 왕복 불일치 ${k}`);
      if (JSON.stringify(back.equip) !== JSON.stringify(p.equip)) bad(`저장 왕복 장비 불일치 ${JSON.stringify(back.equip)}`);
      if (JSON.stringify(back.quests) !== JSON.stringify(p.quests)) bad('저장 왕복 퀘스트 불일치');
    }
    for (const t of [10, 20, 30, 40, 45, 50]) if (p.level >= t) this.mark(`Lv${t} 도달`);
    if (!this.nextTrace || g.now >= this.nextTrace) {
      this.nextTrace = g.now + 1800000;
      const goal = this.goal();
      this.report.trace = [...(this.report.trace ?? []), `${(g.now / 3600000).toFixed(1)}h ${g.mapId}(${g.pe.x},${g.pe.y}) 목표=${goal.type}:${goal.map ?? goal.reasons} Lv${p.level} exp${p.exp} 몹${g.monsters.length} 가방${p.inv.length} 금${p.gold} 승급가능=${g.advanceInfo().ok} ${g.advanceInfo().checks.map((c) => (c.ok ? 'O' : 'X') + c.label).join('|')}`].slice(-12);
    }
  }

  done() {
    const p = this.game.player;
    return p.tier >= 3 && Object.values(p.quests).every((q, i) => q.id === null || Object.keys(QUEST_CHAINS)[i] === 'herbalist');
  }
}

function run(cls) {
  const bot = new Bot(cls);
  const limit = MAX_HOURS * 3600000;
  const t0 = Date.now();
  while (bot.game.now < limit && !bot.done()) bot.step();
  const g = bot.game;
  const p = g.player;
  return {
    ...bot.report,
    final: {
      hours: +(g.now / 3600000).toFixed(2), level: p.level, tier: p.tier, title: g.title(), gold: p.gold,
      quests: Object.fromEntries(Object.entries(p.quests).map(([k, v]) => [k, v.id])),
      learned: p.learned.length, equip: p.equip, done: bot.done(), realSeconds: Math.round((Date.now() - t0) / 1000),
    },
  };
}

export { Bot, run, firstStep, mapRoute };

// 직접 실행했을 때만 시뮬레이션을 돌린다(다른 스크립트에서 import 하면 돌지 않음)
if (process.argv[1]?.endsWith('simulate.mjs')) {
  const classes = onlyClass ? [onlyClass] : Object.keys(CLASSES);
  for (const cls of classes) console.log(JSON.stringify(run(cls), null, 1));
}
