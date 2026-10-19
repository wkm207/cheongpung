// 창 내용을 HTML 문자열로 그리는 함수들(동작은 panels.js가 맡는다)
import { esc, formatPlayTime } from './dom.js';
import { josa } from '../core/josa.js';
import { CLASSES } from '../data/classes.js';
import { SKILLS, KIND_LABELS, learnCost, SPELL_LETTERS, hotkeyLabel } from '../data/skills.js';
import { ITEMS, EQUIP_SLOTS, SLOT_LABELS, isEquipment, isStackable, itemStatText, sellPrice } from '../data/items.js';
import { itemIcon, slotIcon } from '../render/itemicons.js';
import { MONSTERS } from '../data/monsters.js';
import { MAP_DEFS } from '../data/maps.js';
import { QUEST_CHAINS, QUEST_GIVERS, rewardItems } from '../data/quests.js';
import { TIER_TITLES } from '../data/tiers.js';
import { MAX_LEVEL, GAME_VERSION } from '../config.js';
import { ROYAL_COUNT, ROYAL_EXP_MULT, royalReward } from '../core/royal.js';
import { sourcesText } from '../data/sources.js';
import { expToNext, slotMult } from '../core/stats.js';
import { canEquip, compareEquip, compareUnequip, isUpgrade, formatStat } from '../core/equip.js';
import { enhanceInfo, MAX_ENHANCE, ENHANCE_STEP } from '../core/enhance.js';
import { awakenInfo, awakenLabel, MAX_AWAKEN, AWAKEN_STEP } from '../core/dragon.js';
import { countOf } from '../core/inventory.js';
import { exportText } from '../core/save.js';
import { KEY_PANELS } from './input.js';
import { looksFor, photoLook, photoSrc } from '../render/photos.js';
import { isPhoto } from '../render/artmode.js';

const KEY_OF = Object.fromEntries(Object.entries(KEY_PANELS).filter(([k]) => k !== 'Backquote').map(([k, v]) => [v, k.replace('Key', '')]));

export const header = (title, kind, extra = '') => `
  <header><h2>${title}${kind && KEY_OF[kind] ? ` <kbd>${KEY_OF[kind]}</kbd>` : ''}</h2>${extra}<button class="close" data-act="close" aria-label="닫기">✕</button></header>`;

export const goldTag = (game) => `<span class="gold-tag">💰 ${game.player.gold.toLocaleString()}전</span>`;

const signed = (r) => `${r.diff > 0 ? '▲' : '▼'}${formatStat(r.key, Math.abs(r.diff))}`;

/** 능력치 비교 표: 공격 12 → 19 ▲7 */
export function compareHtml(rows, emptyText = '능력치 변화 없음') {
  if (!rows.length) return `<p class="hint">${emptyText}</p>`;
  return `<div class="cmp">${rows.map((r) => `<div>${r.label} ${formatStat(r.key, r.before)} → <b>${formatStat(r.key, r.after)}</b> <span class="${r.diff > 0 ? 'up' : 'down'}">${signed(r)}</span></div>`).join('')}</div>`;
}

const shortCompare = (rows) => rows.slice(0, 3).map((r) => `<span class="${r.diff > 0 ? 'good' : 'warn'}">${r.label}${signed(r)}</span>`).join(' ');

// ── 가방 ──────────────────────────────────────────────
const INV_GROUPS = [['consume', '🍙 소모품'], ['weapon', '⚔️ 무기'], ['helmet', '🎩 투구'], ['armor', '👘 옷'], ['shield', '🛡️ 방패'], ['necklace', '📿 목걸이'], ['ring', '💍 반지'], ['aux', '🧧 보조'], ['loot', '📦 기타']];
const INV_FILTER = { consume: ['consume'], gear: ['weapon', 'helmet', 'armor', 'shield', 'necklace', 'ring', 'aux'], loot: ['loot'] };
const INV_FILTER_LABELS = { all: '전체', consume: '소모품', gear: '장비', loot: '기타' };
export function inventoryView(game, state) {
  const p = game.player;
  const s = game.stats();
  const equipRow = EQUIP_SLOTS.map((slot) => {
    const id = p.equip[slot];
    const sel = state.selEquip === slot ? ' sel' : '';
    return `<button class="eq-slot${id ? '' : ' empty'}${sel}" data-act="selEquip" data-slot="${slot}">
      <span class="eq-icon">${id ? itemIcon(id) : slotIcon(slot)}</span><small>${id ? esc(ITEMS[id].name) : SLOT_LABELS[slot]}${p.enhance?.[slot] ? ` +${p.enhance[slot]}` : ''}${awakenLabel(p, slot) ? ` ${awakenLabel(p, slot)}` : ''}</small></button>`;
  }).join('');
  const recent = game.lastDiff && game.now - game.lastDiff.at < 8000
    ? `<div class="banner">✨ ${esc(game.lastDiff.title)} ${shortCompare(game.lastDiff.rows) || ''}</div>` : '';
  const ups = game.upgradeCount();
  const auto = ups ? `<button class="green auto-equip" data-act="autoEquip">✨ 더 좋은 장비 한 번에 착용 (${ups}칸)</button>` : '';
  const strip = `<div class="stat-strip">공격 <b>${s.atk}</b> · 방어 <b>${s.def}</b> · 술력 <b>${s.mag}</b> · 체력 <b>${s.maxHp}</b> · 마력 <b>${s.maxMp}</b> · 치명 <b>${formatStat('crit', s.crit)}</b></div>`;
  const equipDetail = state.selEquip ? equippedDetail(game, state.selEquip) : '';
  // 분류: 소모품 → 무기·투구·옷·목걸이·반지 → 기타(전리품). 줄의 번호(i)는 가방 순서 그대로 둔다.
  const filter = state.invFilter ?? 'all';
  const shown = (type) => filter === 'all' || INV_FILTER[filter].includes(type);
  const groups = INV_GROUPS.map(([type, label]) => {
    if (!shown(type)) return '';
    const items = p.inv.map((slot, i) => [slot, i]).filter(([slot]) => ITEMS[slot.id].type === type);
    if (!items.length) return '';
    return `<div class="inv-group">${label} <small class="muted">${items.length}</small></div>${items.map(([slot, i]) => inventoryRow(game, slot, i, state)).join('')}`;
  }).join('');
  const chips = Object.entries(INV_FILTER_LABELS).map(([key, label]) => `<button class="chip${filter === key ? ' on' : ''}" data-act="invFilter" data-f="${key}">${label}</button>`).join('');
  const rows = p.inv.length ? (groups || '<p class="hint">이 분류에는 물건이 없습니다.</p>') : '<p class="hint">가방이 비어 있습니다.</p>';
  return `${header('가방', 'inventory', goldTag(game))}
    <div class="body">
      ${recent}
      <div class="equip-row">${equipRow}</div>
      ${equipDetail}
      ${auto}
      ${strip}
      <h3>소지품 (${p.inv.length}/24) <small class="muted">· 장비는 한 번 눌러 비교, 한 번 더 누르면 착용</small></h3>
      <div class="chips">${chips}</div>
      ${rows}
    </div>`;
}

function inventoryRow(game, slot, i, state) {
  const it = ITEMS[slot.id];
  const p = game.player;
  let badge = '';
  if (isEquipment(slot.id)) {
    if (!canEquip(p, slot.id).ok) badge = '<span class="badge no">착용불가</span>';
    else if (isUpgrade(p, slot.id)) badge = '<span class="badge up">▲ 더 좋음</span>';
  }
  const qty = isStackable(slot.id) ? ` <span class="muted">×${slot.qty}</span>` : '';
  const selected = state.selected === i;
  return `<div class="list-row clickable${selected ? ' sel' : ''}" data-act="select" data-i="${i}">
      <span class="tag">${itemIcon(slot.id)}</span>
      <span class="grow"><span class="line1"><b>${esc(it.name)}</b>${qty} ${badge}</span><span class="line2">${esc(itemStatText(slot.id))}</span></span>
      <span class="price">${sellPrice(slot.id).toLocaleString()}전</span>
    </div>${selected ? itemDetail(game, slot, i, state) : ''}`;
}

function itemDetail(game, slot, i, state) {
  const it = ITEMS[slot.id];
  const p = game.player;
  const discard = state.confirm
    ? '<button class="danger" data-act="discard">정말 버리기</button>'
    : '<button data-act="confirm">버리기</button>';
  if (isEquipment(slot.id)) {
    const check = canEquip(p, slot.id);
    const cmp = compareEquip(p, slot.id);
    const current = cmp.current ? `지금 착용: ${itemIcon(cmp.current, 'sm')} ${esc(ITEMS[cmp.current].name)}` : `지금 ${SLOT_LABELS[cmp.slot]} 칸은 비어 있음`;
    return `<div class="detail">
      <div class="muted">${current}</div>
      ${compareHtml(cmp.rows)}
      ${check.ok ? '' : `<p class="warn">${esc(check.reason)}</p>`}
      <div class="row"><button class="primary" data-act="use" ${check.ok ? '' : 'disabled'}>착용하기</button>${discard}</div>
    </div>`;
  }
  const use = it.type === 'consume' ? '<button class="primary" data-act="use">사용하기</button>' : '';
  return `<div class="detail"><p>${esc(it.desc ?? '')}</p>${it.type === 'loot' ? whereHint(slot.id) : ''}<div class="row">${use}${discard}</div></div>`;
}

/** 낀 장비 이름 옆 강화(+N)·각성 표시 */
function equipTags(p, slot) {
  const plus = p.enhance?.[slot] ? ` <span class="good">+${p.enhance[slot]}</span>` : '';
  const awaken = awakenLabel(p, slot);
  return `${plus}${awaken ? ` <span class="good">${awaken}</span>` : ''}`;
}

function equippedDetail(game, slot) {
  const id = game.player.equip[slot];
  if (!id) return `<div class="detail" style="margin-left:0"><p class="hint">${SLOT_LABELS[slot]} 칸이 비어 있습니다. 아래 소지품에서 장비를 눌러 착용하세요.</p></div>`;
  return `<div class="detail" style="margin-left:0">
    <b>${itemIcon(id, 'sm')} ${esc(ITEMS[id].name)}</b>${equipTags(game.player, slot)} <span class="muted">${esc(itemStatText(id, slotMult(game.player, slot)))}</span>
    <div class="muted" style="margin-top:4px">벗으면:</div>
    ${compareHtml(compareUnequip(game.player, slot))}
    <div class="row"><button data-act="unequip" data-slot="${slot}">벗기</button></div>
  </div>`;
}

// ── 기술창 ─────────────────────────────────────────────
const TIER_SECTION = ['기본 기술', '1차 승급 기술', '2차 승급 기술', '3차 승급 기술'];

export function skillsView(game) {
  const p = game.player;
  const ids = CLASSES[p.cls].skills;
  const sections = [0, 1, 2, 3].map((tier) => {
    const list = ids.filter((id) => (SKILLS[id].tier ?? 0) === tier);
    if (!list.length) return '';
    const title = `${TIER_SECTION[tier]}${tier ? ` · ${TIER_TITLES[p.cls][tier]}` : ''}`;
    return `<h3>${title}</h3>${list.map((id) => skillRow(game, id)).join('')}`;
  }).join('');
  return `${header('기술', 'skills', goldTag(game))}
    <div class="body">
      <p class="hint">레벨이 되면 [배우기]로 익히세요. 배운 기술은 마법창(<b>+</b>키)에 a, b, c… 순서로 들어가고, a~j는 숫자 키 1~0으로 바로 쓸 수 있습니다.</p>
      ${sections}
    </div>`;
}

function skillRow(game, id) {
  const sk = SKILLS[id];
  const p = game.player;
  const learned = p.learned.includes(id);
  const check = game.canLearn(id);
  const facts = [
    KIND_LABELS[sk.kind], `Lv.${sk.level}`, sk.tier ? `${sk.tier}차` : null,
    `마력 ${sk.mp}`, `재사용 ${sk.cd / 1000}초`,
  ].filter(Boolean).join(' · ');
  let right;
  if (learned) {
    const at = p.skillSlots.indexOf(id);
    const pos = at >= 0 ? `<span class="letter">${SPELL_LETTERS[at]}</span>${hotkeyLabel(at) ? `<small class="muted">${hotkeyLabel(at)}번 키</small>` : ''}` : '';
    right = `${pos}${at >= 0 ? `<button data-act="moveSpell" data-i="${at}">칸 바꾸기</button>` : ''}<button data-act="castNow" data-id="${id}">사용</button>`;
  } else if (check.ok) {
    const cost = learnCost(sk);
    right = `<button class="green" data-act="learn" data-id="${id}">배우기${cost ? ` ${cost.toLocaleString()}전` : ''}</button>`;
  } else {
    right = `<span class="muted" style="font-size:12px;text-align:right">${esc(check.reason)}</span>`;
  }
  const status = learned ? '<span class="badge eq">배움</span>' : check.ok ? '<span class="badge new">배울 수 있음</span>' : '';
  return `<div class="list-row${!learned && !check.ok && !check.reason.startsWith('금전') ? ' locked' : ''}">
    <span class="tag">${sk.icon}</span>
    <span class="grow"><span class="line1"><b>${esc(sk.name)}</b> ${status}</span>
      <span class="line2">${facts}</span><span class="line2" style="color:#3b2a1a">${esc(sk.desc)}</span></span>
    <span class="row acts">${right}</span>
  </div>`;
}

// ── 마법창(+키) ───────────────────────────────────────
/** 배운 마법을 a~n 칸에 늘어놓고, 고른 마법을 다른 알파벳 칸으로 옮겨 순서를 바꾼다. */
export function spellsView(game, state) {
  const p = game.player;
  const picked = state.pickedLetter ?? null;
  const rows = p.skillSlots.map((id, i) => {
    const letter = SPELL_LETTERS[i];
    const key = hotkeyLabel(i);
    const sel = picked === i ? ' sel' : '';
    if (!id) {
      return `<div class="list-row clickable spell-row empty${sel}" data-act="spellPick" data-i="${i}">
        <span class="letter">${letter}</span><span class="key-hint">${key ? `${key}번` : ''}</span><span class="grow muted">비어 있음</span></div>`;
    }
    const sk = SKILLS[id];
    const remain = Math.max(0, (game.cooldowns[id] ?? 0) - game.now);
    return `<div class="list-row clickable spell-row${sel}" data-act="spellPick" data-i="${i}">
      <span class="letter">${letter}</span><span class="key-hint">${key ? `${key}번` : ''}</span>
      <span class="tag">${sk.icon}</span>
      <span class="grow"><span class="line1"><b>${esc(sk.name)}</b> <small class="muted">${KIND_LABELS[sk.kind]} · 마력 ${sk.mp} · ${sk.cd / 1000}초${remain ? ` · <span class="warn">${(remain / 1000).toFixed(1)}초 남음</span>` : ''}</small></span>
        <span class="line2">${esc(sk.desc)}</span></span>
      <button data-act="castNow" data-id="${id}">사용</button>
    </div>`;
  }).join('');
  const help = picked === null
    ? '옮길 마법을 누르세요. (키보드: 알파벳 두 번, 예) <b>c</b> 다음 <b>a</b> → c의 마법이 a로)'
    : `<b>${SPELL_LETTERS[picked]}</b> 칸을 어디로 옮길까요? 아래 알파벳을 누르세요. (다시 누르면 취소)`;
  const letters = picked === null ? '' : `<div class="letter-pick">${[...SPELL_LETTERS].map((l, i) => `<button class="${i === picked ? 'on' : ''}" data-act="spellMove" data-i="${i}">${l}</button>`).join('')}</div>`;
  return `${header('마법', null)}
    <div class="body">
      <p class="hint">a~j 칸은 숫자 키 <b>1,2,…,9,0</b>과 아래 단축키 칸에 그대로 연결됩니다. ${help}</p>
      ${letters}
      ${rows}
    </div>`;
}

// ── 정보 ───────────────────────────────────────────────
export function characterView(game) {
  const p = game.player;
  const s = game.stats();
  const need = p.level >= MAX_LEVEL ? '-' : expToNext(p.level).toLocaleString();
  const rows = [
    ['직업', `${game.title()}${p.tier ? ` (${p.tier}차)` : ''}`], ['레벨', p.level],
    ['체력', `${p.hp} / ${s.maxHp}`], ['마력', `${p.mp} / ${s.maxMp}`],
    ['공격', s.atk], ['방어', s.def], ['술력', s.mag], ['치명타', formatStat('crit', s.crit)],
    ...[['mcrit', '마법치명'], ['dmgPct', '피해증가'], ['pen', '방어무시'], ['cdr', '쿨타임 감소']]
      .filter(([k]) => s[k] > 0).map(([k, label]) => [label, formatStat(k, s[k])]),
    ...[['mcrit', '마법치명'], ['dmgPct', '피해증가'], ['pen', '방어무시'], ['cdr', '쿨타임 감소']]
      .filter(([k]) => s[k] > 0).map(([k, label]) => [label, formatStat(k, s[k])]),
    ['경험치', `${p.exp.toLocaleString()} / ${need}`], ['금전', `${p.gold.toLocaleString()}전`],
    ['배운 기술', `${p.learned.length} / ${CLASSES[p.cls].skills.length}`], ['플레이 시간', formatPlayTime(game.playMs)],
  ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  const equip = EQUIP_SLOTS.map((slot) => {
    const id = p.equip[slot];
    const body = id ? `${itemIcon(id, 'sm')} <b>${esc(ITEMS[id].name)}</b>${equipTags(p, slot)} <small class="muted">${esc(itemStatText(id, slotMult(p, slot)))}</small>` : '<span class="muted">없음</span>';
    return `<div class="list-row"><span class="badge eq">${SLOT_LABELS[slot]}</span><span class="grow">${body}</span></div>`;
  }).join('');
  const a = p.alloc ?? {};
  const pts = p.statPoints ?? 0;
  const statRow = (key, label, effect) => `<div class="list-row alloc-row"><b class="grow">${label} <span class="good">${a[key] ?? 0}</span> <small class="muted">${effect}</small></b>
    <button data-act="alloc" data-stat="${key}" data-n="1" ${pts ? '' : 'disabled'}>+1</button><button data-act="alloc" data-stat="${key}" data-n="5" ${pts >= 5 ? '' : 'disabled'}>+5</button></div>`;
  const used = Object.values(a).reduce((x, y) => x + y, 0);
  return `${header('정보', 'character')}
    <div class="body">
      <div class="char-head"><span class="lv-badge">Lv.${p.level}</span> <b>${esc(p.name)}</b> · ${game.title()}</div>
      <div class="side-bars char-bars">
        <div class="sbar hp"><i style="width:${Math.min(100, (p.hp / s.maxHp) * 100)}%"></i><span>체력 ${p.hp.toLocaleString()} / ${s.maxHp.toLocaleString()}</span></div>
        <div class="sbar mp"><i style="width:${Math.min(100, (p.mp / s.maxMp) * 100)}%"></i><span>마력 ${p.mp.toLocaleString()} / ${s.maxMp.toLocaleString()}</span></div>
        <div class="sbar xp"><i style="width:${p.level >= MAX_LEVEL ? 100 : Math.min(100, (p.exp / expToNext(p.level)) * 100)}%"></i><span>경험치 ${p.level >= MAX_LEVEL ? '최고 레벨' : `${((p.exp / expToNext(p.level)) * 100).toFixed(1)}%`}</span></div>
      </div>
      <div class="stat-grid">${rows}</div>
      <h3>능력치 분배 <small class="muted">남은 점수 <b class="${pts ? 'warn' : ''}">${pts}</b> · 레벨업마다 3점</small></h3>
      ${statRow('str', '힘', '공격 +2')}
      ${statRow('dex', '민첩', '치명 +0.4% · 방어 +1')}
      ${statRow('int', '지력', '술력 +2 · 마력 +4')}
      ${statRow('con', '체력', '체력 +14 · 방어 +0.5')}
      ${used ? `<div class="row" style="justify-content:flex-end;margin-top:4px"><button data-act="resetStats">능력치 초기화 (${game.resetStatsCost().toLocaleString()}전)</button></div>` : ''}
      <h3>착용 장비 <small class="muted">(바꾸려면 가방에서)</small></h3>${equip}
    </div>`;
}

// ── 퀘스트 목록 ────────────────────────────────────────
const goalText = (q) => (q.goal.type === 'kill'
  ? `${MONSTERS[q.goal.target].name} ${q.goal.count}마리 처치`
  : `${ITEMS[q.goal.target].name} ${q.goal.count}개 모아 오기`);

export function rewardHtml(q, cls) {
  const items = rewardItems(q, cls).map(([id, n]) => `<span>${itemIcon(id, 'sm')} ${esc(ITEMS[id].name)}${n > 1 ? ` ×${n}` : ''}</span>`).join('');
  return `<div class="reward-list"><span>💰 ${q.reward.gold.toLocaleString()}전</span><span>✨ 경험치 ${q.reward.exp.toLocaleString()}</span>${items}</div>`;
}

const STATE_LABEL = { offer: '<span class="badge new">새 부탁</span>', active: '<span class="badge eq">진행 중</span>', ready: '<span class="badge up">완료 보고</span>', done: '<span class="badge no">모두 끝</span>' };

export function questsView(game) {
  const rows = game.allQuests().map((info) => {
    const giver = QUEST_GIVERS[info.npc];
    if (info.state === 'done') return `<div class="list-row locked"><span class="tag">📜</span><span class="grow"><b>${esc(giver)}</b> ${STATE_LABEL.done}</span></div>`;
    const q = info.quest;
    const total = QUEST_CHAINS[info.npc].length;
    const step = QUEST_CHAINS[info.npc].indexOf(q) + 1;
    const progress = info.state === 'offer' ? '' : ` · <b>${info.progress}/${q.goal.count}</b>`;
    return `<div class="list-row">
      <span class="tag">📜</span>
      <span class="grow"><span class="line1"><b>${esc(q.title)}</b> ${STATE_LABEL[info.state]} <span class="muted">${esc(giver)} ${q.repeat ? '(반복)' : `(${step}/${total})`}</span></span>
        <span class="line2">${esc(goalText(q))}${progress} · 장소: ${esc(q.where)}</span>
        ${rewardHtml(q, game.player.cls)}</span>
    </div>`;
  }).join('');
  return `${header('퀘스트', 'quests')}
    <div class="body"><p class="hint">머리 위에 <b>!</b>가 뜬 사람은 부탁할 일이 있고, <b>?</b>는 완료 보고를 기다리는 중입니다.</p>${rows}</div>`;
}

// ── NPC 대화 ───────────────────────────────────────────
export function questPage(game, npc, info) {
  const q = info.quest;
  const progress = q.goal.type === 'kill' ? `처치 ${info.progress}/${q.goal.count}` : `가진 개수 ${info.progress}/${q.goal.count}`;
  let text = q.offer;
  let buttons = '<button class="primary" data-act="accept">맡겠습니다</button><button data-act="talk">이야기 듣기</button>';
  if (info.state === 'active') {
    text = q.goal.type === 'kill' ? `${q.where}에서 아직 할 일이 남았네. 부탁하네.` : `${q.where}에서 ${josa(ITEMS[q.goal.target].name, '을/를')} 더 모아 와 주게.`;
    buttons = '<button data-act="talk">이야기 듣기</button>';
  } else if (info.state === 'ready') {
    text = '오, 해냈구먼! 약속한 보상을 주지.';
    buttons = '<button class="primary" data-act="complete">보상 받기</button>';
  }
  return `<p class="dialog-text">${esc(text)}</p>
    <div class="quest-box">
      <div><b>📜 ${esc(q.title)}</b> ${STATE_LABEL[info.state]}</div>
      <div class="goal">${esc(goalText(q))} · 장소: ${esc(q.where)}${info.state === 'offer' ? '' : ` · ${progress}`}</div>
      <div class="muted" style="margin-top:4px">보상</div>${rewardHtml(q, game.player.cls)}
    </div>
    <div class="row end" style="margin:8px -10px -10px">${buttons}${npc.shop ? '<button data-act="openShop">물건 보기</button>' : ''}<button data-act="close">닫기</button></div>`;
}

export function advancePage(game, npc, state) {
  const info = game.advanceInfo();
  if (state.advanced) return `<p class="dialog-text">${esc(state.advanced)}</p><div class="row end" style="margin:8px -10px -10px"><button data-act="close">닫기</button></div>`;
  if (!info.next) return `<p class="dialog-text">그대는 이미 최고의 경지에 올랐다. 더 가르칠 것이 없구나.</p>${dragonBox(game)}<div class="row end" style="margin:8px -10px -10px"><button data-act="close">닫기</button></div>`;
  const checks = info.checks.map((c) => `<div class="check ${c.ok ? 'ok' : 'no'}">${c.ok ? '✔' : '✘'} ${esc(c.label)}</div>${!c.ok && c.item ? whereHint(c.item) : ''}`).join('');
  const reward = info.next.reward[game.player.cls];
  return `<p class="dialog-text">${esc(npc.lines[0])}</p>
    ${dragonBox(game)}
    <div class="quest-box">
      <div><b>⚜️ ${info.next.tier}차 승급: ${esc(game.title())} → ${esc(info.title)}</b></div>
      <div class="muted" style="margin:4px 0">기본 능력치가 크게 오르고, ${info.next.tier}차 기술을 배울 수 있으며, ${info.next.tier}차 장비를 착용할 수 있습니다.</div>
      ${checks}
      <div class="muted" style="margin-top:4px">승급 기념 선물: ${itemIcon(reward, 'sm')} ${esc(ITEMS[reward].name)}</div>
    </div>
    <div class="row end" style="margin:8px -10px -10px"><button class="primary" data-act="advance" ${info.ok ? '' : 'disabled'}>승급하기</button><button data-act="close">닫기</button></div>`;
}

/** 재료를 구하는 곳 한 줄 */
function whereHint(itemId) {
  const t = sourcesText(itemId);
  return t ? `<div class="where-hint">📍 구하는 곳: ${esc(t)}</div>` : '';
}

/** 사범의 용 무기 상자: 받기(1차 승급 후) · 각성 */
function dragonBox(game) {
  const p = game.player;
  if (!p.dragonClaimed) {
    return p.tier >= 1
      ? '<div class="quest-box"><b>🐲 용 무기</b><p class="muted">1차 승급을 마친 무사에게 용의 무기를 내린다. 용의 숨결로 각성시키면 끝없이 강해진다.</p><button class="green" data-act="claimDragon">용 무기 받기</button></div>'
      : '<div class="quest-box muted">🐲 1차 승급을 마치면 용 무기를 받을 수 있다.</div>';
  }
  const info = awakenInfo(p);
  const stage = p.dragonStage ?? 0;
  if (!info) {
    return `<div class="quest-box"><b>🐲 용 무기 각성 ${stage}단계</b><p class="muted">${stage >= MAX_AWAKEN ? '최고 단계에 이르렀다.' : '용 무기를 손에 들고 오면 각성시켜 주마.'}</p></div>`;
  }
  const have = countOf(p.inv, 'dragonBreath');
  return `<div class="quest-box"><b>🐲 용 무기 각성 ${stage} → ${info.next}단계</b> <span class="muted">(무기 능력치 +${Math.round(AWAKEN_STEP * 100)}%)</span>
    <div class="check ${have >= info.breath ? 'ok' : 'no'}">${have >= info.breath ? '✔' : '✘'} 용의 숨결 ${info.breath}개 (가진 것 ${have})</div>${have >= info.breath ? '' : whereHint('dragonBreath')}
    <div class="check ${p.gold >= info.gold ? 'ok' : 'no'}">${p.gold >= info.gold ? '✔' : '✘'} 금전 ${info.gold.toLocaleString()}전</div>
    <button class="primary" data-act="awaken">각성하기</button></div>`;
}

export function talkPage(npc, line, game) {
  const last = line >= npc.lines.length - 1;
  if (npc.travel && game) {
    const rows = npc.travel.map((r, i) => {
      const ok = game.player.level >= r.level;
      return `<div class="list-row${ok ? '' : ' locked'}"><span class="tag">⛵</span><span class="grow"><b>${esc(MAP_DEFS[r.to].name)}</b> <small class="muted">Lv.${r.level} 이상</small></span><span class="price">${r.cost.toLocaleString()}전</span><button class="primary" data-act="voyage" data-i="${i}" ${ok ? '' : 'disabled'}>타기</button></div>`;
    }).join('');
    return `<p class="dialog-text">${esc(npc.lines[0])}</p>${rows}<p class="hint">돌아올 때는 각 지역 아래쪽 나루(빛나는 출구)로 나오면 청풍성 마당입니다.</p><div class="row end" style="margin:8px -10px -10px"><button data-act="close">닫기</button></div>`;
  }
  const rest = npc.inn && game ? `<button class="green" data-act="rest">쉬어 가기 (${game.restCost().toLocaleString()}전)</button>` : '';
  const actions = last
    ? `${rest}${npc.shop ? '<button class="primary" data-act="openShop">물건 보기</button>' : ''}<button data-act="close">닫기</button>`
    : `${rest}<button class="primary" data-act="next">다음 ▶</button>`;
  return `<p class="dialog-text">${esc(npc.lines[line])}</p><div class="row end" style="margin:8px -10px -10px">${actions}</div>`;
}

// ── 상점 ───────────────────────────────────────────────
export function shopBuyList(game, npc) {
  const p = game.player;
  return npc.shop.map((id) => {
    const it = ITEMS[id];
    const check = isEquipment(id) ? canEquip(p, id) : { ok: true };
    const poor = p.gold < it.price;
    const cmp = isEquipment(id) && check.ok ? shortCompare(compareEquip(p, id).rows) : '';
    const note = isEquipment(id) && !check.ok ? `<span class="badge no">${esc(check.reason)}</span>` : cmp;
    const ten = isStackable(id) ? `<button data-act="buy" data-id="${id}" data-n="10">10개</button>` : '';
    return `<div class="list-row${it.wtype && it.wtype !== CLASSES[p.cls].weapon ? ' locked' : ''}">
      <span class="tag">${itemIcon(id)}</span>
      <span class="grow"><span class="line1"><b>${esc(it.name)}</b> ${note}</span><span class="line2">${esc(itemStatText(id))}</span></span>
      <span class="price${poor ? ' warn' : ''}">${it.price.toLocaleString()}전</span>
      <button class="primary" data-act="buy" data-id="${id}" data-n="1">사기</button>${ten}
    </div>`;
  }).join('');
}

export function shopSellList(game) {
  const inv = game.player.inv;
  if (!inv.length) return '<p class="hint">팔 물건이 없습니다.</p>';
  return inv.map((s, i) => {
    const it = ITEMS[s.id];
    const all = s.qty > 1 ? `<button data-act="sell" data-i="${i}" data-n="${s.qty}">전부</button>` : '';
    return `<div class="list-row">
      <span class="tag">${itemIcon(s.id)}</span>
      <span class="grow"><span class="line1"><b>${esc(it.name)}</b>${s.qty > 1 ? ` <span class="muted">×${s.qty}</span>` : ''}</span><span class="line2">${esc(itemStatText(s.id))}</span></span>
      <span class="price">${sellPrice(s.id).toLocaleString()}전</span>
      <button class="primary" data-act="sell" data-i="${i}" data-n="1">팔기</button>${all}
    </div>`;
  }).join('');
}

/** 명장의 강화 탭: 장비 칸마다 지금 강화 수치, 다음 단계 비용과 성공 확률 */
export function forgeList(game) {
  const p = game.player;
  const rows = EQUIP_SLOTS.map((slot) => {
    const id = p.equip[slot];
    const plus = p.enhance?.[slot] ?? 0;
    const info = enhanceInfo(p, slot);
    const name = id ? `${itemIcon(id, 'sm')} <b>${esc(ITEMS[id].name)}</b>${plus ? ` <span class="good">+${plus}</span>` : ''}` : '<span class="muted">장비 없음</span>';
    let right = '<span class="muted">-</span>';
    if (id && plus >= MAX_ENHANCE) right = '<span class="good">최대 강화</span>';
    else if (info) right = `<span class="price${p.gold < info.cost ? ' warn' : ''}">${info.cost.toLocaleString()}전 · 성공 ${Math.round(info.rate * 100)}%</span><button class="primary" data-act="enhance" data-slot="${slot}">+${info.next} 강화</button>`;
    return `<div class="list-row"><span class="badge eq">${SLOT_LABELS[slot]}</span><span class="grow">${name}</span>${right}</div>`;
  }).join('');
  return `<p class="hint">강화는 장비 칸에 붙습니다. 장비를 바꿔 껴도 강화 수치는 그대로이고, 한 단계마다 그 칸 장비의 능력치가 ${Math.round(ENHANCE_STEP * 100)}% 오릅니다. 실패해도 장비는 깨지지 않습니다(금전만 소모).</p>${rows}`;
}

// ── 메뉴 ───────────────────────────────────────────────
const KEY_HELP = [
  ['이동', '방향키 (짧게 누르면 제자리에서 돌기)'], ['공격 · NPC 대화', 'Space (누르고 있으면 계속)'], ['구르기(잠깐 무적)', 'Shift'],
  ['기술 슬롯', '1 ~ 5'], ['체력약 / 마력약', 'Q / E'], ['가방 · 기술 · 정보', 'I · K · C'],
  ['퀘스트 · 메뉴 · GM', 'L · M · G'], ['창 닫기', 'Esc'],
];

/** 메뉴의 생김새 바꾸기(실사 그림이 2개 이상일 때) */
function lookRow(p) {
  const list = isPhoto() ? looksFor(p.cls, p.gender) : [];
  if (list.length < 2) return '';
  const cur = photoLook(p.cls, p.gender, p.look);
  const btns = list.map((n) => `<button class="look-pick${n === cur ? ' sel' : ''}" data-act="setLook" data-look="${n}"><img src="${photoSrc(p.cls, p.gender, n)}" alt="${n}번 생김새"></button>`).join('');
  return `<h3>생김새</h3><div class="look-row">${btns}</div>`;
}

export function menuView(game, state, settings) {
  const noteHtml = state.note ? `<p class="note">${esc(state.note)}</p>` : '';
  if (state.view === 'export') {
    return `${header('백업 내보내기', null)}
      <div class="body">
        <p class="hint">아래 글자를 통째로 복사해 메모장 등에 보관하세요. 기기를 바꾸거나 데이터가 지워졌을 때 '백업 불러오기'로 되살릴 수 있습니다.</p>
        <textarea id="export-text" readonly>${esc(exportText(game.toSave()))}</textarea>
        ${noteHtml}
        <div class="row"><button class="primary" data-act="copy">복사하기</button><button data-act="download">파일로 저장</button><button data-act="view" data-view="main">뒤로</button></div>
      </div>`;
  }
  if (state.view === 'import') {
    return `${header('백업 불러오기', null)}
      <div class="body">
        <p class="hint">백업 글자를 붙여넣거나 백업 파일을 고르세요. 지금 슬롯의 캐릭터가 백업 내용으로 바뀝니다.</p>
        <textarea id="import-text" placeholder="여기에 붙여넣기"></textarea>
        <input type="file" id="import-file" accept=".json,application/json,text/plain">
        ${noteHtml}
        <div class="row"><button class="primary" data-act="import">불러오기</button><button data-act="view" data-view="main">뒤로</button></div>
      </div>`;
  }
  const keys = KEY_HELP.map(([a, b]) => `<tr><td>${a}</td><td><b>${b}</b></td></tr>`).join('');
  return `${header('메뉴', 'menu')}
    <div class="body menu-list">
      <p class="hint">게임 버전 <b>${GAME_VERSION}</b></p>
      <button class="primary" data-act="save">지금 저장하기</button>
      ${lookRow(game.player)}
      <h3>설정</h3>
      <div class="row">
        <span class="grow">터치 이동 방식</span>
        <button class="${settings.control === 'dpad' ? 'on' : ''}" data-act="setting" data-key="control" data-value="dpad">방향 버튼</button>
        <button class="${settings.control === 'joystick' ? 'on' : ''}" data-act="setting" data-key="control" data-value="joystick">조이스틱</button>
      </div>
      <div class="row">
        <span class="grow">그래픽</span>
        <button class="${settings.graphics === 'ninja' ? 'on' : ''}" data-act="setting" data-key="graphics" data-value="ninja">새 도트 타일</button>
        <button class="${settings.graphics === 'photo' ? 'on' : ''}" data-act="setting" data-key="graphics" data-value="photo">손그림</button>
        <button class="${settings.graphics === 'classic' ? 'on' : ''}" data-act="setting" data-key="graphics" data-value="classic">원작풍 도트</button>
        <button class="${settings.graphics === 'smooth' ? 'on' : ''}" data-act="setting" data-key="graphics" data-value="smooth">매끈한 그림</button>
      </div>
      <div class="row">
        <span class="grow">배경음악</span>
        <button class="${settings.music ? 'on' : ''}" data-act="setting" data-key="music" data-value="true">켜기</button>
        <button class="${settings.music ? '' : 'on'}" data-act="setting" data-key="music" data-value="false">끄기</button>
      </div>
      <div class="row">
        <span class="grow">효과음</span>
        <button class="${settings.sound ? 'on' : ''}" data-act="setting" data-key="sound" data-value="true">켜기</button>
        <button class="${settings.sound ? '' : 'on'}" data-act="setting" data-key="sound" data-value="false">끄기</button>
      </div>
      <h3>저장 · 백업</h3>
      <button data-act="view" data-view="export">백업 내보내기</button>
      <button data-act="view" data-view="import">백업 불러오기</button>
      <button data-act="title">타이틀 화면으로 (캐릭터 바꾸기)</button>
      ${noteHtml}
      <div class="help">
        <h3>조작법</h3>
        <p>터치: 왼쪽 아래 방향 버튼으로 한 칸씩 이동 · 공격 버튼을 누르고 있으면 계속 공격 · NPC 앞에서 공격 버튼(또는 NPC를 눌러) 대화 · 떨어진 물건은 밟으면 줍기</p>
        <p class="muted">몬스터는 옆에 붙은 뒤 잠시 몸을 움찔하고 공격합니다. 그 사이 한 칸 물러나면 공격을 피할 수 있어요.</p>
        <table>${keys}</table>
        <p class="muted">게임은 15초마다, 그리고 앱을 닫을 때 자동 저장됩니다.</p>
        <h3>그림 출처</h3>
        <p class="muted">맵 타일: Ninja Adventure (Pixel-Boy · AAA, CC0) · 글꼴: 갈무리11 (이민서, SIL OFL 1.1) · 사람 그림은 이 게임에서 직접 찍은 도트</p>
      </div>
    </div>`;
}

// ── 운영자(GM) ─────────────────────────────────────────
export function gmView(game, state) {
  const p = game.player;
  const btn = (cmd, text, cls = '') => `<button class="${cls}" data-act="cmd" data-cmd="${esc(cmd)}">${esc(text)}</button>`;
  const quick = [
    btn(`/레벨 ${p.level + 1}`, '레벨 +1'), btn(`/레벨 ${p.level + 10}`, '레벨 +10'),
    btn('/돈 100000', '금전 +10만'), btn('/회복', '전체 회복'), btn('/기술전부', '배울 수 있는 기술 모두 배우기'),
    btn('/무적', `무적 ${p.gm.god ? '켜짐' : '꺼짐'}`, p.gm.god ? 'on' : ''),
    btn(`/속도 ${p.gm.speed % 3 + 1}`, `이동 ${p.gm.speed}배`, p.gm.speed > 1 ? 'on' : ''),
    btn('/전체처치', '맵 몬스터 전체 처치'),
  ].join('');
  const tiers = [0, 1, 2, 3].map((t) => btn(`/승급 ${t}`, `${t}차 ${TIER_TITLES[p.cls][t]}`, p.tier === t ? 'on' : '')).join('');
  const maps = Object.entries(MAP_DEFS).map(([id, m]) => btn(`/이동 ${id}`, m.name, id === game.mapId ? 'on' : '')).join('');
  const mobs = Object.entries(MONSTERS).map(([id, m]) => btn(`/소환 ${id} 1`, `${m.name} Lv${m.level}${m.boss ? '(보스)' : ''}`)).join('');
  const classes = Object.entries(CLASSES).map(([id, c]) => btn(`/직업 ${id}`, c.name, id === p.cls ? 'on' : '')).join('');
  const groups = [['consume', '소모품'], ['weapon', '무기'], ['armor', '갑옷'], ['helmet', '투구'], ['shield', '방패'], ['necklace', '목걸이'], ['ring', '반지'], ['aux', '보조'], ['loot', '전리품']];
  const itemRow = ([id, it]) => {
    const ten = isStackable(id) ? btn(`/아이템 ${id} 10`, '+10') : '';
    return `<div class="list-row"><span class="tag">${itemIcon(id)}</span><span class="grow">${esc(it.name)} <small class="muted">${esc(itemStatText(id))}</small></span>${btn(`/아이템 ${id} 1`, '+1')}${ten}</div>`;
  };
  const byLevel = (a, b) => (a[1].level ?? 0) - (b[1].level ?? 0);
  const subGroup = (title, list) => (list.length ? `<div class="inv-group">${title}</div>${list.sort(byLevel).map(itemRow).join('')}` : '');
  const items = groups.map(([type, label]) => {
    const list = Object.entries(ITEMS).filter(([, it]) => it.type === type);
    let rows;
    if (type === 'weapon') {
      rows = Object.entries(CLASSES).map(([, c]) => subGroup(`${c.name} 무기`, list.filter(([, it]) => it.wtype === c.weapon))).join('');
    } else if (type === 'armor') {
      rows = [['공용', undefined], ['남성 전용', 'm'], ['여성 전용', 'f']].map(([t, g]) => subGroup(t, list.filter(([, it]) => it.gender === g))).join('');
    } else {
      rows = list.sort(byLevel).map(itemRow).join('');
    }
    return `<details><summary>${label}</summary>${rows}</details>`;
  }).join('');
  return `${header('운영자 도구', 'gm')}
    <div class="body">
      <div class="row gm-cmd"><input id="gm-input" placeholder="/도움  /레벨 30  /아이템 청룡검" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="primary" data-act="runGm">실행</button></div>
      ${state.gmOut ? `<pre class="gm-out">${esc(state.gmOut)}</pre>` : ''}
      <h3>빠른 명령</h3><div class="btn-wrap">${quick}</div>
      <h3>승급 차수</h3><div class="btn-wrap">${tiers}</div>
      <h3>순간이동</h3><div class="btn-wrap">${maps}</div>
      <h3>몬스터 소환 (내 주변)</h3><div class="btn-wrap">${mobs}</div>
      <h3>직업 변경</h3><div class="btn-wrap">${classes}</div>
      <h3>아이템 만들기</h3>${items}
    </div>`;
}

// ── 어명 사냥(성주) ─────────────────────────────────────
export function royalBox(game) {
  const r = game.player.royal;
  if (!r) {
    return `<div class="quest-box"><b>📜 어명 사냥</b><p class="muted">성주가 그대의 실력에 맞는 몬스터를 정해 준다. ${ROYAL_COUNT}마리를 잡아 오면 그 몬스터 경험치의 ${ROYAL_EXP_MULT}배를 내린다. 몇 번이고 다시 받을 수 있다.</p><button class="green" data-act="royalAccept">어명 받기</button></div>`;
  }
  const m = MONSTERS[r.type];
  const done = r.have >= r.need;
  return `<div class="quest-box"><b>📜 어명: ${esc(m.name)} <small class="muted">Lv${m.level}</small> ${r.have}/${r.need}</b>
    <p class="muted">보상: 경험치 ${royalReward(r).toLocaleString()} · ${Math.round(royalReward(r) / 20).toLocaleString()}전</p>
    <div class="row end"><button data-act="royalDrop">포기</button><button class="primary" data-act="royalDone" ${done ? '' : 'disabled'}>${done ? '어명 아뢰기' : '아직 다 못 잡음'}</button></div></div>`;
}
