// 직업별로 어디서(맵·상대·레벨) 쓰러지는지 모은다.
import { Bot } from './simulate.mjs';
const cls = process.argv[2] ?? 'priest';
const hours = Number(process.argv[3] ?? 4);
const bot = new Bot(cls);
const g = bot.game;
const deaths = {};
g.on((type) => {
  if (type !== 'death') return;
  const near = g.monsters.filter((m) => Math.abs(m.x - g.pe.x) + Math.abs(m.y - g.pe.y) <= 3).map((m) => m.type);
  const key = `${g.mapId} Lv${Math.floor(g.player.level / 5) * 5}~ tier${g.player.tier} vs ${[...new Set(near)].join('+')}`;
  deaths[key] = (deaths[key] ?? 0) + 1;
});
while (g.now < hours * 3600000 && !(g.player.tier >= 3 && g.player.quests.chief.id === null)) bot.step();
console.log(JSON.stringify({ hours: (g.now / 3600000).toFixed(2), level: g.player.level, tier: g.player.tier, deaths }, null, 1));
