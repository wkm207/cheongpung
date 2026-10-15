// 시뮬레이션이 정체되는 순간을 찾아, 그때 봇이 매 판단마다 무엇을 하는지 출력한다.
import { Bot } from './simulate.mjs';
const cls = process.argv[2] ?? 'warrior';
const bot = new Bot(cls);
const g = bot.game;
let lastLevelUp = 0; let level = 1;
while (g.now < 40 * 3600000) {
  bot.step();
  if (g.player.level !== level) { level = g.player.level; lastLevelUp = g.now; }
  if (g.now - lastLevelUp > 15 * 60000) break; // 15분 동안 레벨업이 없으면 정체로 본다
}
console.log('stall at', (g.now / 3600000).toFixed(2), 'h', g.mapId, g.pe.x, g.pe.y, 'Lv', g.player.level);
const think = bot.think.bind(bot);
let n = 0;
bot.think = () => {
  const before = `${g.pe.x},${g.pe.y} dir=${g.pe.dir}`;
  think();
  if (n++ < 40) console.log(before, '-> input', g.inputDir, 'goal', JSON.stringify(bot.goal()), 'monsters near', g.monsters.filter((m) => Math.abs(m.x - g.pe.x) + Math.abs(m.y - g.pe.y) <= 3).map((m) => `${m.type}@${m.x},${m.y}`).join(' '));
};
for (let i = 0; i < 600; i++) bot.step();
