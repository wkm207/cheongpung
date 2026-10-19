import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mobFrame, checkMobTemplates } from '../src/render/mobdots.js';
import { MONSTER_LOOK } from '../src/render/sprites.js';
import { MONSTERS } from '../src/data/monsters.js';

const painted = (f) => f.data.filter((_, i) => i % 4 === 3 && f.data[i]).length;

test('몬스터 도트 템플릿: 줄 길이가 모두 고르다', () => {
  assert.deepEqual(checkMobTemplates(), []);
});

test('모든 몬스터: 네 방향·걸음 세 칸 그림이 나온다', () => {
  for (const type of Object.keys(MONSTERS)) {
    const look = MONSTER_LOOK[type];
    assert.ok(look, type);
    for (const dir of ['down', 'up', 'left', 'right']) {
      for (const step of [0, 1, 2]) {
        const f = mobFrame(look, dir, step);
        assert.equal(f.data.length, f.w * f.h * 4);
        assert.ok(painted(f) > 40, `${type} ${dir} ${step}`);
      }
    }
  }
});

test('오른쪽은 왼쪽 그림을 좌우로 뒤집은 것', () => {
  const l = mobFrame(MONSTER_LOOK.fox, 'left', 0);
  const r = mobFrame(MONSTER_LOOK.fox, 'right', 0);
  const px = (f, x, y) => [...f.data.subarray((y * f.w + x) * 4, (y * f.w + x) * 4 + 4)].join();
  for (let y = 0; y < l.h; y++) for (let x = 0; x < l.w; x++) assert.equal(px(l, x, y), px(r, l.w - 1 - x, y));
});

test('걸으면 그림이 바뀐다', () => {
  assert.notEqual(mobFrame(MONSTER_LOOK.wolf, 'left', 0).data.join(), mobFrame(MONSTER_LOOK.wolf, 'left', 1).data.join());
});
