import { shareOrDownload, copyText, readFileText } from './dom.js';
import { josa } from '../core/josa.js';
import { ITEMS, isEquipment } from '../data/items.js';
import { runCommand } from '../core/gm.js';
import { exportText, importText } from '../core/save.js';
import {
  header, goldTag, inventoryView, skillsView, spellsView, characterView, questsView,
  questPage, advancePage, talkPage, shopBuyList, shopSellList, menuView, gmView,
} from './views.js';

/** 가방·기술·정보·퀘스트·상점·대화·메뉴·GM 창. 열려 있는 동안 게임은 멈춘다. */
export class Panels {
  constructor(layer, panel, hooks) {
    this.layer = layer;
    this.panel = panel;
    this.hooks = hooks; // { getGame, getSettings, onOpen, onSave, onLoadPlayer, onTitle, onSetting, onCast }
    this.kind = null;
    this.state = {};
    // 창 안 버튼도 마찬가지: 창이 열리기 전에 시작된 터치의 클릭(유령 클릭)은 무시한다.
    // 키보드로 누른 클릭(e.detail === 0)은 그대로 받는다.
    this.panelDown = false;
    panel.addEventListener('pointerdown', () => { this.panelDown = true; });
    panel.addEventListener('click', (e) => {
      if (!this.panelDown && e.detail !== 0) return;
      this.onClick(e);
    });
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'gm-input') this.runGm(e.target.value);
    });
    panel.addEventListener('change', (e) => {
      if (e.target.id === 'import-file') this.importFile(e.target.files?.[0]);
    });
    // 바깥 배경을 눌러 닫기: 창이 열린 뒤에 배경에서 '누르기'가 시작된 경우만 인정한다.
    // (폰에서는 NPC를 누른 터치의 '클릭'이 막 열린 창의 배경에 떨어져 창이 바로 닫히는 문제가 있었다)
    this.backdropDown = false;
    layer.addEventListener('pointerdown', (e) => {
      this.backdropDown = e.target === layer && performance.now() - this.openedAt > 350;
    });
    layer.addEventListener('click', (e) => {
      if (e.target === layer && this.backdropDown) this.close();
      this.backdropDown = false;
    });
  }

  get isOpen() { return this.kind !== null; }
  get game() { return this.hooks.getGame(); }

  open(kind, data = null) {
    if (!this.game) return;
    this.kind = kind;
    this.state = { data, selected: null, selEquip: null, confirm: false, tab: 'buy', line: 0, view: 'main', note: '', gmOut: '', advanced: '' };
    this.openedAt = performance.now();
    this.backdropDown = false;
    this.panelDown = false;
    this.layer.hidden = false;
    this.hooks.onOpen();
    this.render();
  }

  close() {
    this.kind = null;
    this.layer.hidden = true;
  }

  refresh() {
    if (this.isOpen) this.render();
  }

  render() {
    const game = this.game;
    if (!game || !this.kind) return;
    const scrollTop = this.panel.querySelector('.body')?.scrollTop ?? 0;
    this.panel.className = `panel panel-${this.kind}`;
    this.panel.innerHTML = this.html(game);
    const body = this.panel.querySelector('.body');
    if (body) body.scrollTop = scrollTop;
  }

  html(game) {
    const s = this.state;
    switch (this.kind) {
      case 'inventory': return inventoryView(game, s);
      case 'skills': return skillsView(game);
      case 'spells': return spellsView(game, s);
      case 'character': return characterView(game);
      case 'quests': return questsView(game);
      case 'menu': return menuView(game, s, this.hooks.getSettings());
      case 'gm': return gmView(game, s);
      case 'shop': return this.shopHtml(game);
      case 'dialog': return this.dialogHtml(game);
      default: return '';
    }
  }

  shopHtml(game) {
    const npc = this.state.data;
    const tabs = `<div class="tabs">
      <button class="${this.state.tab === 'buy' ? 'on' : ''}" data-act="tab" data-tab="buy">사기</button>
      <button class="${this.state.tab === 'sell' ? 'on' : ''}" data-act="tab" data-tab="sell">팔기</button></div>`;
    const list = this.state.tab === 'buy' ? shopBuyList(game, npc) : shopSellList(game);
    return `${header(npc.name, null, goldTag(game))}${tabs}<div class="body">${list}</div>`;
  }

  /** NPC 대화: 승급 사범 → 승급 창, 퀘스트가 걸린 NPC → 퀘스트 창, 그 밖에는 대사 */
  dialogHtml(game) {
    const npc = this.state.data;
    const s = this.state;
    let body;
    if (s.doneText) {
      body = `<p class="dialog-text">${s.doneText}</p><div class="row end" style="margin:8px -10px -10px"><button class="primary" data-act="afterDone">계속</button></div>`;
    } else if (npc.advance && s.view === 'main') {
      body = advancePage(game, npc, s);
    } else if (game.player.quests[npc.id] && s.view === 'main' && game.questInfo(npc.id).state !== 'done') {
      body = questPage(game, npc, game.questInfo(npc.id));
    } else {
      body = talkPage(npc, s.line);
    }
    return `${header(npc.name, null)}<div class="body">${body}</div>`;
  }

  runGm(text) {
    const game = this.game;
    this.state.gmOut = runCommand(game, text);
    game.log(`[GM] ${this.state.gmOut.split('\n')[0]}`, '#ffd166');
    this.render();
  }

  // ── 클릭 처리 ─────────────────────────────────────────
  async onClick(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const game = this.game;
    const s = this.state;
    const { act } = el.dataset;
    const i = Number(el.dataset.i);
    const n = Number(el.dataset.n);
    this.hooks.onClick?.();
    switch (act) {
      case 'close': this.close(); return;
      case 'select': this.selectItem(game, i); break;
      case 'selEquip': s.selEquip = s.selEquip === el.dataset.slot ? null : el.dataset.slot; s.selected = null; break;
      case 'use': game.useItemAt(s.selected); this.fixSelection(game); if (!this.isOpen) return; break;
      case 'autoEquip': game.autoEquipAll(); s.selected = null; break;
      case 'confirm': s.confirm = true; break;
      case 'discard': game.discardAt(s.selected); s.selected = null; s.confirm = false; break;
      case 'unequip': game.unequip(el.dataset.slot); s.selEquip = null; break;
      case 'learn': game.learnSkill(el.dataset.id); break;
      case 'slot': game.assignSkill(i, el.dataset.id); break;
      case 'spellPick': this.spellLetter(i); return;
      case 'spellMove': this.moveSpell(i); return;
      case 'castNow': this.close(); this.hooks.onCast(el.dataset.id); return;
      case 'tab': s.tab = el.dataset.tab; break;
      case 'buy': game.buy(el.dataset.id, n); break;
      case 'sell': game.sellAt(i, n); break;
      case 'next': s.line += 1; break;
      case 'talk': s.view = 'talk'; s.line = 0; break;
      case 'accept': game.acceptQuest(s.data.id); break;
      case 'complete': this.completeQuest(game); break;
      case 'afterDone': s.doneText = ''; break;
      case 'advance': this.advance(game); break;
      case 'openShop': this.open('shop', s.data); return;
      case 'view': s.view = el.dataset.view; s.note = ''; break;
      case 'setting': this.hooks.onSetting(el.dataset.key, el.dataset.value); break;
      case 'save': s.note = this.hooks.onSave() ? `저장했습니다. (${new Date().toLocaleTimeString()})` : '저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.'; break;
      case 'copy': {
        const area = this.panel.querySelector('#export-text');
        s.note = (await copyText(area.value, area)) ? '복사했습니다. 메모장 등에 붙여넣어 보관하세요.' : '자동 복사가 안 됩니다. 글자를 길게 눌러 직접 복사해 주세요.';
        break;
      }
      case 'download': {
        const ok = await shareOrDownload(`cheongpung-${Date.now()}.json`, exportText(game.toSave()));
        if (!ok) s.note = '이 화면에서는 파일 저장이 안 됩니다. "복사하기"로 백업해 주세요.';
        break;
      }
      case 'import': this.importFromText(this.panel.querySelector('#import-text').value); return;
      case 'title': this.close(); this.hooks.onTitle(); return;
      case 'cmd': this.runGm(el.dataset.cmd); return;
      case 'runGm': this.runGm(this.panel.querySelector('#gm-input').value); return;
      default: return;
    }
    this.render();
  }

  /** 마법창: 첫 번째로 고른 칸을 두 번째로 고른 칸과 맞바꾼다. 처리했으면 true */
  spellLetter(index) {
    if (this.kind !== 'spells') return false;
    const s = this.state;
    if (s.pickedLetter === undefined || s.pickedLetter === null) {
      s.pickedLetter = index;
      this.render();
      return true;
    }
    this.moveSpell(index);
    return true;
  }

  moveSpell(target) {
    const game = this.game;
    const from = this.state.pickedLetter;
    this.state.pickedLetter = null;
    if (from !== null && from !== undefined && from !== target) {
      const slots = [...game.player.skillSlots];
      [slots[from], slots[target]] = [slots[target], slots[from]];
      game.setPlayer({ skillSlots: slots });
      game.emit('sfx', 'equip');
    }
    this.render();
  }

  /** 소지품 줄 선택. 이미 고른 장비를 한 번 더 누르면 바로 착용한다. */
  selectItem(game, i) {
    const s = this.state;
    const slot = game.player.inv[i];
    if (s.selected === i && slot && isEquipment(slot.id)) {
      if (game.equipAt(i)) s.selected = null;
      return;
    }
    s.selected = s.selected === i ? null : i;
    s.selEquip = null;
    s.confirm = false;
  }

  completeQuest(game) {
    const info = game.questInfo(this.state.data.id);
    if (game.completeQuest(this.state.data.id)) this.state.doneText = info.quest.done;
  }

  advance(game) {
    const next = game.advanceInfo().next;
    if (!next || !game.advance()) return;
    const reward = ITEMS[next.reward[game.player.cls]].name;
    this.state.advanced = `${next.speech} 이제 그대는 [${game.title()}]이다. 승급 선물로 ${josa(reward, '을/를')} 주마. 기술창(K)에서 새 기술도 익히거라.`;
  }

  /** 아이템을 쓰고 나서 선택 칸이 비었으면 선택을 푼다. */
  fixSelection(game) {
    if (this.state.selected !== null && !game.player.inv[this.state.selected]) this.state.selected = null;
  }

  importFromText(text) {
    try {
      const player = importText(text);
      this.close();
      this.hooks.onLoadPlayer(player);
    } catch (err) {
      this.state.note = err.message;
      this.render();
    }
  }

  async importFile(file) {
    if (!file) return;
    try {
      this.importFromText(await readFileText(file));
    } catch (err) {
      this.state.note = err.message;
      this.render();
    }
  }
}
