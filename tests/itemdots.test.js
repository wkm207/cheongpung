import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itemFrame, itemLook, checkItemTemplates, ITEM_ART, ICON_SIZE } from '../src/render/itemdots.js';
import { ITEMS, EQUIP_SLOTS } from '../src/data/items.js';

const painted = (f) => f.data.filter((_, i) => i % 4 === 3 && f.data[i]).length;
const pixels = (f) => f.data.join();

test('아이템 도트 템플릿: 줄 길이가 고르고 16칸 안에 든다', () => {
  assert.deepEqual(checkItemTemplates(), []);
});

test('모든 아이템: 그림이 있고 16×16 도트가 나온다', () => {
  for (const id of [...Object.keys(ITEMS), '__gold', ...EQUIP_SLOTS.map((s) => `slot:${s}`)]) {
    const look = itemLook(id);
    assert.ok(ITEM_ART[look.art], `${id}: ${look.art}`);
    const f = itemFrame(id);
    assert.equal(f.w, ICON_SIZE);
    assert.equal(f.data.length, ICON_SIZE * ICON_SIZE * 4);
    assert.ok(painted(f) > 30, id);
  }
});

test('무기는 종류별 그림, 색은 날 색(tint)을 따른다', () => {
  for (const [id, it] of Object.entries(ITEMS)) if (it.type === 'weapon') assert.equal(itemLook(id).art, it.wtype, id);
  assert.notEqual(pixels(itemFrame('woodSword')), pixels(itemFrame('ironSword')));
});

test('바깥 테두리는 검은 외곽선', () => {
  const f = itemFrame('herb');
  const w = f.w;
  // 칠해진 칸 가운데 투명한 칸과 맞닿은 것은 모두 외곽선 색
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!f.data[i + 3]) continue;
      const empty = (nx, ny) => nx < 0 || ny < 0 || nx >= w || ny >= f.h || !f.data[(ny * w + nx) * 4 + 3];
      if (empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1)) assert.ok(f.data[i] < 40 && f.data[i + 1] < 40 && f.data[i + 2] < 40, `${x},${y}`);
    }
  }
});
