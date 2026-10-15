// 넓은 화면에서 오른쪽에 붙는 상태창: 캐릭터 그림과 장비 칸, 탭(상태·가방·마법·기술·퀘스트).
// 탭 내용은 가운데 창과 같은 화면을 그대로 쓰고(Panels), 열려 있어도 게임은 계속 흐른다.
import { $, $$, esc } from './dom.js';
import { ITEMS, SLOT_ICONS, SLOT_LABELS } from '../data/items.js';
import { portraitSprite } from '../render/sprites.js';
import { Panels } from './panels.js';

export const SIDE_TABS = new Set(['character', 'inventory', 'spells', 'skills', 'quests']);
const MIN_W = 1000;
const MIN_H = 560;

export class Sidebar {
  constructor(hooks) {
    this.el = $('#sidebar');
    this.panels = new Panels($('#side-layer'), $('#side-panel'), { ...hooks, onOpen: undefined });
    this.panels.docked = true;
    this.name = $('#side-name');
    this.title = $('#side-title');
    this.doll = $('#doll-canvas');
    this.hpBar = $('#side-hp');
    this.mpBar = $('#side-mp');
    this.hpText = $('#side-hp-text');
    this.mpText = $('#side-mp-text');
    this.barKey = '';
    this.slots = $$('.doll-slot');
    this.tabs = $$('[data-side]');
    this.sig = '';
    this.dollKey = '';
    this.active = false;
    for (const t of this.tabs) t.addEventListener('click', () => this.open(t.dataset.side));
    for (const s of this.slots) {
      s.addEventListener('click', () => {
        this.open('inventory');
        this.panels.state.selEquip = s.dataset.doll;
        this.panels.render();
      });
    }
  }

  /** 화면이 넓으면 오른쪽 고정 창을 쓴다. */
  fits() {
    return window.innerWidth >= MIN_W && window.innerHeight >= MIN_H;
  }

  setActive(on, game) {
    this.active = on && !!game;
    this.el.hidden = !this.active;
    document.body.classList.toggle('docked', this.active);
    if (this.active && !this.panels.kind) this.open('character');
  }

  open(kind) {
    if (!this.active) return false;
    this.panels.open(kind);
    for (const t of this.tabs) t.classList.toggle('on', t.dataset.side === kind);
    return true;
  }

  refresh() {
    if (this.active) this.panels.refresh();
  }

  /** 자주 바뀌는 값(체력·경험치 등)이 달라졌을 때만 탭을 다시 그린다. */
  update(game) {
    if (!this.active || !game) return;
    const p = game.player;
    this.name.textContent = p.name;
    this.title.textContent = `Lv.${p.level} ${game.title()}`;
    const s = game.stats();
    const bk = `${p.hp}/${s.maxHp}/${p.mp}/${s.maxMp}`;
    if (bk !== this.barKey) {
      this.barKey = bk;
      this.hpBar.style.width = `${Math.min(100, (p.hp / s.maxHp) * 100)}%`;
      this.mpBar.style.width = `${Math.min(100, (p.mp / s.maxMp) * 100)}%`;
      this.hpText.textContent = `체력 ${p.hp.toLocaleString()} / ${s.maxHp.toLocaleString()}`;
      this.mpText.textContent = `마력 ${p.mp.toLocaleString()} / ${s.maxMp.toLocaleString()}`;
    }
    const sig = this.panels.kind === 'character' ? `${p.hp}|${p.mp}|${p.exp}|${p.gold}|${p.level}|${p.statPoints}` : '';
    if (sig !== this.sig) {
      this.sig = sig;
      if (sig) this.panels.render();
    }
    const dk = `${p.cls}:${p.gender}:${Object.values(p.equip).join(',')}:${Object.values(p.enhance ?? {}).join(',')}`;
    if (dk === this.dollKey) return;
    this.dollKey = dk;
    const ctx = this.doll.getContext('2d');
    const img = portraitSprite(p.cls, p.equip, p.gender);
    this.doll.width = img.width;
    this.doll.height = img.height;
    ctx.drawImage(img, 0, 0);
    for (const s of this.slots) {
      const slot = s.dataset.doll;
      const id = p.equip[slot];
      const plus = p.enhance?.[slot] ? `<small class="plus">+${p.enhance[slot]}</small>` : '';
      s.classList.toggle('empty', !id);
      s.title = id ? ITEMS[id].name : SLOT_LABELS[slot];
      s.innerHTML = `${id ? ITEMS[id].icon : SLOT_ICONS[slot]}${plus}<span>${esc(id ? ITEMS[id].name : SLOT_LABELS[slot])}</span>`;
    }
  }
}
