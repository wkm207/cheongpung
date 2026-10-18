import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chibiFrame, checkTemplates, CW, CH } from '../src/render/chibi.js';

const LOOK = { cloth: '#a93226', trim: '#2b4f8a', weapon: { wtype: 'sword', tint: '#e0e6ea' }, hat: { kind: 'gat', color: '#2a2a2a' } };
const painted = (f) => f.data.filter((_, i) => i % 4 === 3 && f.data[i]).length;

test('도트 사람 템플릿: 줄 길이가 모두 고르다', () => {
  assert.deepEqual(checkTemplates(), []);
});

test('도트 사람: 네 방향·걷기·공격·시전, 남녀 모두 그림이 나온다', () => {
  for (const female of [false, true]) {
    for (const dir of ['down', 'up', 'left', 'right']) {
      for (const opts of [{}, { step: 1 }, { step: 2 }, { pose: 'attack', phase: 2 }, { pose: 'cast' }]) {
        const f = chibiFrame({ ...LOOK, female }, dir, opts);
        assert.equal(f.data.length, CW * CH * 4);
        assert.ok(painted(f) > 250, `${female} ${dir} ${JSON.stringify(opts)}`);
      }
    }
  }
});

test('공격 단계마다 무기 자리가 바뀐다(휘두르기)', () => {
  const a = chibiFrame(LOOK, 'down', { pose: 'attack', phase: 0 }).data.join();
  const b = chibiFrame(LOOK, 'down', { pose: 'attack', phase: 3 }).data.join();
  assert.notEqual(a, b);
});
