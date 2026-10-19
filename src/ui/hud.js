import { $, $$, esc, setText, setStyle } from './dom.js';
import { SKILLS, HOTKEY_SLOTS, hotkeyLabel } from '../data/skills.js';
import { QUEST_GIVERS } from '../data/quests.js';
import { MONSTERS } from '../data/monsters.js';
import { ITEMS } from '../data/items.js';
import { expToNext } from '../core/stats.js';
import { MAX_LEVEL } from '../config.js';
import { portraitSprite } from '../render/sprites.js';

const LOG_LINES = 40;
const SLOW_UPDATE_MS = 400;

/** 체력·마력 구슬: 남은 양만큼 물이 차오른다 */
function setOrb(orb, num, value, max) {
  setStyle(orb.querySelector('i'), 'height', `${Math.max(0, Math.min(100, (value / max) * 100))}%`);
  setText(num, value >= 10000 ? `${Math.floor(value / 1000)}k` : String(value));
}

function setBar(bar, num, value, max, text) {
  setStyle(bar.querySelector('i'), 'width', `${Math.max(0, Math.min(100, (value / max) * 100))}%`);
  setText(num, text);
}

const targetName = (q) => (q.goal.type === 'kill' ? MONSTERS[q.goal.target].name : ITEMS[q.goal.target].name);

/** 화면 위·아래 막대와 기술 버튼을 매 프레임 갱신한다(바뀐 곳만 DOM을 건드린다). */
export class Hud {
  constructor() {
    this.name = $('#hud-name');
    this.level = $('#hud-level');
    this.gold = $('#hud-gold');
    this.map = $('#hud-map');
    this.coord = $('#hud-coord');
    this.hp = $('#console .bar.hp');
    this.mp = $('#console .bar.mp');
    this.exp = $('#console .bar.exp');
    this.hpNum = $('#hp-num');
    this.hpOrb = $('#console .orb.hp');
    this.mpOrb = $('#console .orb.mp');
    this.hpOrbNum = $('#hp-orb');
    this.mpOrbNum = $('#mp-orb');
    this.mpNum = $('#mp-num');
    this.expNum = $('#exp-num');
    this.portrait = $('#portrait');
    this.gmButton = $('.menu-grid .gm');
    this.badgeBag = $('#badge-bag');
    this.badgeSkill = $('#badge-skill');
    this.tracker = $('#quest-tracker');
    this.skills = $$('.hotbar [data-slot]');
    this.quick = { hp: $('.hotbar [data-quick="hp"] small'), mp: $('.hotbar [data-quick="mp"] small') };
    this.log = $('#log');
    this.renderedLogId = null;
    this.slotKey = '';
    this.portraitKey = '';
    this.nextSlowAt = 0;
  }

  update(game, ts) {
    const p = game.player;
    const s = game.stats();
    setText(this.name, p.name);
    setText(this.level, `Lv.${p.level} ${game.titleWithClass()}`);
    setText(this.gold, `${p.gold.toLocaleString()}전`);
    setText(this.map, game.mapDef.name);
    setText(this.coord, `${game.pe.x}, ${game.pe.y}`);
    setBar(this.hp, this.hpNum, p.hp, s.maxHp, `${p.hp}/${s.maxHp}`);
    setBar(this.mp, this.mpNum, p.mp, s.maxMp, `${p.mp}/${s.maxMp}`);
    setOrb(this.hpOrb, this.hpOrbNum, p.hp, s.maxHp);
    setOrb(this.mpOrb, this.mpOrbNum, p.mp, s.maxMp);
    if (p.level >= MAX_LEVEL) setBar(this.exp, this.expNum, 1, 1, '최고');
    else {
      const need = expToNext(p.level);
      setBar(this.exp, this.expNum, p.exp, need, `${((p.exp / need) * 100).toFixed(1)}%`);
    }
    this.gmButton.classList.toggle('on', p.gm.god || p.gm.speed > 1);
    this.updateSkills(game);
    setText(this.quick.hp, String(game.quickCount('hp')));
    setText(this.quick.mp, String(game.quickCount('mp')));

    const last = game.messages[game.messages.length - 1];
    if (last && last.id !== this.renderedLogId) this.renderLog(game);

    if (ts >= this.nextSlowAt) {
      this.nextSlowAt = ts + SLOW_UPDATE_MS;
      this.updateSlow(game);
    }
  }

  /** 기술 슬롯 버튼: 아이콘·이름·키 번호·남은 재사용 시간(초) */
  updateSkills(game) {
    const p = game.player;
    const key = p.skillSlots.slice(0, HOTKEY_SLOTS).join(',');
    if (key !== this.slotKey) {
      this.slotKey = key;
      this.skills.forEach((btn, i) => {
        const id = p.skillSlots[i];
        btn.classList.toggle('empty', !id);
        btn.innerHTML = id
          ? `<span class="key">${hotkeyLabel(i)}</span><span class="icon">${SKILLS[id].icon}</span><span class="name">${esc(SKILLS[id].name)}</span><span class="cd"></span>`
          : `<span class="key">${hotkeyLabel(i)}</span>+`;
      });
    }
    this.skills.forEach((btn, i) => {
      const id = p.skillSlots[i];
      if (!id) return;
      const sk = SKILLS[id];
      const remain = Math.max(0, (game.cooldowns[id] ?? 0) - game.now);
      setStyle(btn, '--cd', Math.min(1, remain / (game.cooldownLen?.[id] ?? sk.cd)).toFixed(3));
      btn.classList.toggle('cooling', remain > 0);
      btn.classList.toggle('nomp', p.mp < sk.mp);
      if (remain > 0) setText(btn.querySelector('.cd'), remain >= 10000 ? String(Math.ceil(remain / 1000)) : (remain / 1000).toFixed(1));
    });
  }

  /** 자주 바뀌지 않는 것(퀘스트 목록·알림 점·초상화)은 가끔만 갱신한다. */
  updateSlow(game) {
    const quests = game.allQuests().filter((q) => q.state === 'active' || q.state === 'ready');
    const offers = game.allQuests().filter((q) => q.state === 'offer').length;
    const lines = quests.slice(0, 3).map((q) => {
      if (q.state === 'ready') return `<div class="ready">✅ ${esc(q.quest.title)} → ${esc(QUEST_GIVERS[q.npc])}</div>`;
      return `<div>📜 ${esc(q.quest.title)} · ${esc(targetName(q.quest))} ${q.progress}/${q.quest.goal.count}</div>`;
    });
    const r = game.player.royal;
    if (r) lines.unshift(r.have >= r.need ? `<div class="ready">✅ 어명 완수 → 청풍성 성주</div>` : `<div>📜 어명 · ${esc(MONSTERS[r.type].name)} ${r.have}/${r.need}</div>`);
    if (!quests.length && offers) lines.push(`<div class="offer">❗ 마을에 부탁할 일이 있는 사람이 있습니다 (${offers})</div>`);
    const html = lines.join('');
    if (this.tracker._html !== html) {
      this.tracker._html = html;
      this.tracker.innerHTML = html;
    }
    this.badgeBag.classList.toggle('show', game.upgradeCount() > 0);
    this.badgeSkill.classList.toggle('show', game.learnableCount() > 0);

    const p = game.player;
    const img = portraitSprite(p.cls, p.equip, p.gender, p.look);
    const pk = `${p.cls}:${p.gender}:${p.look}:${img.width}:${Object.values(p.equip).join(',')}:${img.tag ?? ''}`;
    if (pk !== this.portraitKey) {
      this.portraitKey = pk;
      const ctx = this.portrait.getContext('2d');
      const hi = img.width / img.lw;
      this.portrait.width = 32 * hi;
      this.portrait.height = 32 * hi;
      ctx.drawImage(img, 0, 0, 32 * hi, 32 * hi, 0, 0, 32 * hi, 32 * hi);
    }
  }

  /** 대화창: 최근 메시지를 쌓아 두고, 맨 아래를 보고 있었으면 새 메시지로 따라 내려간다. */
  renderLog(game) {
    const atBottom = this.log.scrollHeight - this.log.scrollTop - this.log.clientHeight < 24;
    const lines = game.messages.slice(-LOG_LINES);
    this.renderedLogId = lines[lines.length - 1]?.id ?? null;
    this.log.innerHTML = lines.map((m) => `<div style="color:${m.color}">${esc(m.text)}</div>`).join('');
    if (atBottom || !this.logPinned) this.log.scrollTop = this.log.scrollHeight;
    this.logPinned = true;
  }
}
