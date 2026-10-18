// 오프라인 실행용 서비스 워커: 처음 접속할 때 모든 파일을 저장해 두고, 이후엔 저장본을 먼저 쓴다.
// 게임 파일을 고치면 VERSION을 올려야 기기에 새 버전이 받아진다.
const VERSION = 'cheongpung-v24';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './src/config.js',
  './src/core/chatTrade.js',
  './src/core/combat.js',
  './src/core/dragon.js',
  './src/core/enhance.js',
  './src/core/equip.js',
  './src/core/gm.js',
  './src/core/inventory.js',
  './src/core/josa.js',
  './src/core/music.js',
  './src/core/rng.js',
  './src/core/royal.js',
  './src/core/save.js',
  './src/core/skillslots.js',
  './src/core/stats.js',
  './src/data/classes.js',
  './src/data/items.js',
  './src/data/maps.js',
  './src/data/monsterSkills.js',
  './src/data/monsters.js',
  './src/data/quests.js',
  './src/data/skills.js',
  './src/data/sources.js',
  './src/data/tiers.js',
  './src/game.js',
  './src/main.js',
  './src/render/ambient.js',
  './src/render/artmode.js',
  './src/render/beasts.js',
  './src/render/characters.js',
  './src/render/effects.js',
  './src/render/foes.js',
  './src/render/lpc.js',
  './src/render/ninja.js',
  './src/render/renderer.js',
  './src/render/smooth.js',
  './src/render/sprites.js',
  './src/render/tiles.js',
  './src/render/trees.js',
  './src/ui/bgm.js',
  './src/ui/dom.js',
  './src/ui/hud.js',
  './src/ui/input.js',
  './src/ui/minimap.js',
  './src/ui/panels.js',
  './src/ui/settings.js',
  './src/ui/sfx.js',
  './src/ui/sidebar.js',
  './src/ui/title.js',
  './src/ui/views.js',
  './src/ui/worldmap.js',
  './src/world/dirs.js',
  './src/world/foes.js',
  './src/world/mapgen.js',
  './src/world/monsters.js',
  './src/world/skills.js',
  './assets/ninja/Floor.png',
  './assets/ninja/House.png',
  './assets/ninja/Nature.png',
  './assets/ninja/Relief.png',
  './assets/ninja/Water.png',
  './assets/lpc/mage_f/hurt.png',
  './assets/lpc/mage_f/slash.png',
  './assets/lpc/mage_f/spellcast.png',
  './assets/lpc/mage_f/thrust.png',
  './assets/lpc/mage_f/walk.png',
  './assets/lpc/mage_m/hurt.png',
  './assets/lpc/mage_m/slash.png',
  './assets/lpc/mage_m/spellcast.png',
  './assets/lpc/mage_m/thrust.png',
  './assets/lpc/mage_m/walk.png',
  './assets/lpc/npc_elder/hurt.png',
  './assets/lpc/npc_elder/walk.png',
  './assets/lpc/npc_guard/hurt.png',
  './assets/lpc/npc_guard/walk.png',
  './assets/lpc/npc_lord/hurt.png',
  './assets/lpc/npc_lord/walk.png',
  './assets/lpc/npc_man/hurt.png',
  './assets/lpc/npc_man/walk.png',
  './assets/lpc/npc_merchant/hurt.png',
  './assets/lpc/npc_merchant/walk.png',
  './assets/lpc/npc_woman/hurt.png',
  './assets/lpc/npc_woman/walk.png',
  './assets/lpc/priest_f/hurt.png',
  './assets/lpc/priest_f/slash.png',
  './assets/lpc/priest_f/spellcast.png',
  './assets/lpc/priest_f/thrust.png',
  './assets/lpc/priest_f/walk.png',
  './assets/lpc/priest_m/hurt.png',
  './assets/lpc/priest_m/slash.png',
  './assets/lpc/priest_m/spellcast.png',
  './assets/lpc/priest_m/thrust.png',
  './assets/lpc/priest_m/walk.png',
  './assets/lpc/rogue_f/hurt.png',
  './assets/lpc/rogue_f/slash.png',
  './assets/lpc/rogue_f/spellcast.png',
  './assets/lpc/rogue_f/thrust.png',
  './assets/lpc/rogue_f/walk.png',
  './assets/lpc/rogue_m/hurt.png',
  './assets/lpc/rogue_m/slash.png',
  './assets/lpc/rogue_m/spellcast.png',
  './assets/lpc/rogue_m/thrust.png',
  './assets/lpc/rogue_m/walk.png',
  './assets/lpc/warrior_f/hurt.png',
  './assets/lpc/warrior_f/slash.png',
  './assets/lpc/warrior_f/spellcast.png',
  './assets/lpc/warrior_f/thrust.png',
  './assets/lpc/warrior_f/walk.png',
  './assets/lpc/warrior_m/hurt.png',
  './assets/lpc/warrior_m/slash.png',
  './assets/lpc/warrior_m/spellcast.png',
  './assets/lpc/warrior_m/thrust.png',
  './assets/lpc/warrior_m/walk.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 인터넷이 되면 늘 새 파일을 먼저 받아 쓰고(고친 내용이 바로 보인다), 저장본도 새로 바꿔 둔다.
// 인터넷이 없거나(비행기) 너무 느리면 저장본으로 바로 실행한다.
const NETWORK_WAIT_MS = 3500;

async function refresh(request) {
  const response = await fetch(new Request(request, { cache: 'no-cache' }));
  if (response.ok && new URL(request.url).origin === self.location.origin) {
    try {
      const cache = await caches.open(VERSION);
      await cache.put(request, response.clone());
    } catch {
      // 저장 공간이 부족해도 이번 응답은 그대로 쓴다
    }
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const cached = caches.match(event.request, { ignoreSearch: true });
  const fresh = refresh(event.request).catch(() => null);
  event.waitUntil(fresh);
  const slow = new Promise((resolve) => { setTimeout(() => resolve(null), NETWORK_WAIT_MS); });
  event.respondWith((async () => {
    const first = await Promise.race([fresh, slow]);
    if (first) return first;
    return (await cached) ?? (await fresh) ?? Response.error();
  })());
});
