// 새 도트 모드의 아이템 아이콘: itemdots.js 의 16×16 도트를 캔버스로 만들어 두고, 화면 글(HTML)에는 <img>로 넣는다.
// 다른 그래픽 모드에서는 지금까지처럼 이모지를 쓴다.
import { itemFrame } from './itemdots.js';
import { isNinja } from './artmode.js';
import { ITEMS, SLOT_ICONS } from '../data/items.js';

const canvases = new Map();
const urls = new Map();

/** 아이템 도트 캔버스(16×16). 바닥에 떨어진 아이템을 그릴 때 쓴다 */
export function itemCanvas(id) {
  let c = canvases.get(id);
  if (c) return c;
  const f = itemFrame(id);
  c = Object.assign(document.createElement('canvas'), { width: f.w, height: f.h });
  c.getContext('2d').putImageData(new ImageData(f.data, f.w, f.h), 0, 0);
  canvases.set(id, c);
  return c;
}

const dotImg = (key, cls) => {
  if (!urls.has(key)) urls.set(key, itemCanvas(key).toDataURL());
  return `<img class="idot${cls ? ` ${cls}` : ''}" src="${urls.get(key)}" alt="">`;
};

/** 아이템 아이콘 HTML. cls 'sm' 은 글 사이에 넣는 작은 아이콘 */
export function itemIcon(id, cls = '') {
  if (!isNinja() || !ITEMS[id]) return ITEMS[id]?.icon ?? '❔';
  return dotImg(id, cls);
}

/** 빈 장비 칸 아이콘 HTML */
export function slotIcon(slot, cls = '') {
  return isNinja() ? dotImg(`slot:${slot}`, cls) : SLOT_ICONS[slot];
}
