// 새 도트 모드의 아이템 아이콘: itemdots.js 의 16×16 도트를 캔버스로 만들어 두고, 화면 글(HTML)에는 <img>로 넣는다.
// 다른 그래픽 모드에서는 지금까지처럼 이모지를 쓴다.
import { itemFrame } from './itemdots.js';
import { isNinja } from './artmode.js';
import { ITEMS, SLOT_ICONS } from '../data/items.js';
import { ITEM_ART } from '../data/itemart.js';
import { ICON_FILES } from '../data/looks.js';

// 실사 아이콘(AI 그림, assets/icons/)이 있으면 그것을 먼저 쓴다
const HAS_ICON = new Set(ICON_FILES);
const artOf = (id) => (HAS_ICON.has(ITEM_ART[id]) ? ITEM_ART[id] : null);
const photos = new Map();

/** 바닥에 그릴 실사 아이콘 그림(불러오는 중이거나 없으면 null) */
export function itemPhoto(id) {
  const art = artOf(id);
  if (!art || typeof Image === 'undefined') return null;
  if (!photos.has(art)) {
    const img = new Image();
    img.src = `assets/icons/${art}.png`;
    photos.set(art, img);
  }
  const img = photos.get(art);
  return img.complete && img.naturalWidth ? img : null;
}

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
  const art = artOf(id);
  if (art) return `<img class="idot photo${cls ? ` ${cls}` : ''}" src="assets/icons/${art}.png" alt="">`;
  return dotImg(id, cls);
}

/** 빈 장비 칸 아이콘 HTML */
export function slotIcon(slot, cls = '') {
  return isNinja() ? dotImg(`slot:${slot}`, cls) : SLOT_ICONS[slot];
}
