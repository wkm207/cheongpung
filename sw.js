// 오프라인 실행용 서비스 워커: 처음 접속할 때 모든 파일을 저장해 두고, 이후엔 저장본을 먼저 쓴다.
// 게임 파일을 고치면 VERSION을 올려야 기기에 새 버전이 받아진다.
const VERSION = 'cheongpung-v16';
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
  './src/data/tiers.js',
  './src/game.js',
  './src/main.js',
  './src/render/ambient.js',
  './src/render/beasts.js',
  './src/render/characters.js',
  './src/render/effects.js',
  './src/render/foes.js',
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
