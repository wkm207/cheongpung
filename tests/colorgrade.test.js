import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeColor } from '../src/render/colorgrade.js';

test('바닥 초록은 누런 올리브빛으로, 덤불 초록은 더 어둡게, 다른 색은 그대로', () => {
  const [r, g, b] = gradeColor(92, 160, 74, 'ground');
  assert.ok(r > 92 && b < g, '노란 쪽으로');
  const leaf = gradeColor(92, 160, 74, 'foliage');
  assert.ok(leaf[0] + leaf[1] + leaf[2] < 92 + 160 + 74, '어둡게');
  assert.deepEqual(gradeColor(200, 120, 60), [200, 120, 60]); // 흙(주황)
  assert.deepEqual(gradeColor(128, 128, 128), [128, 128, 128]); // 회색
});
