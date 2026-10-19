import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeId, checkPassword, idToEmail, isConfigured, authErrorMessage, savedAtOf, decideSlot, newerSide } from '../src/core/account.js';
import { createCloud } from '../src/core/cloud.js';
import { CloudSync, CLOUD_PUSH_MS } from '../src/core/sync.js';
import { readSlotText, writeSlotText, loadSave, deleteSave } from '../src/core/save.js';
import { FIREBASE_CONFIG } from '../src/firebase-config.js';

const CONFIG = { apiKey: 'k', authDomain: 'x.firebaseapp.com', projectId: 'x', appId: '1:2:web:3' };

const memoryStorage = () => {
  const map = new Map();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
};

const player = (name, level = 1) => ({
  name, cls: 'warrior', level, exp: 0, gold: 0, hp: 10, mp: 5,
  inv: [], equip: {}, mapId: 'village', x: 19, y: 17, dir: 'down', playMs: 0, gm: { god: false, speed: 1 },
});
// 저장 시각을 정해서 저장 글자를 만든다(같은 밀리초에 두 번 저장해도 구별되게)
const saveText = (name, savedAt, level = 1) => JSON.stringify({ format: 'cheongpung-save', version: 1, savedAt, player: player(name, level) });
const T1 = '2026-10-01T10:00:00.000Z';
const T2 = '2026-10-02T10:00:00.000Z';
const T3 = '2026-10-03T10:00:00.000Z';

/** 메모리 위의 가짜 서버(createCloud 와 같은 모양) */
function fakeCloud({ online = true } = {}) {
  const db = new Map();   // `${uid}/${n}` → { text, savedAt }
  const users = new Map(); // email → { uid, password }
  const cloud = {
    enabled: true,
    online,
    db,
    writes: 0,
    async ready() { return cloud.online; },
    async restoreUser() { return cloud.user ?? null; },
    async signUp(email, password) {
      if (!cloud.online) throw Object.assign(new Error('x'), { code: 'offline' });
      if (users.has(email)) throw Object.assign(new Error('x'), { code: 'auth/email-already-in-use' });
      const user = { uid: `uid-${users.size + 1}`, password };
      users.set(email, user);
      cloud.user = { uid: user.uid };
      return cloud.user;
    },
    async signIn(email, password) {
      if (!cloud.online) throw Object.assign(new Error('x'), { code: 'offline' });
      const user = users.get(email);
      if (!user || user.password !== password) throw Object.assign(new Error('x'), { code: 'auth/invalid-credential' });
      cloud.user = { uid: user.uid };
      return cloud.user;
    },
    async signOut() { cloud.user = null; },
    async readSlots(uid) {
      if (!cloud.online) throw Object.assign(new Error('x'), { code: 'offline' });
      const out = {};
      for (const [key, v] of db) if (key.startsWith(`${uid}/`)) out[key.split('/')[1]] = v;
      return out;
    },
    async writeSlotIf(uid, n, entry, expected) {
      if (!cloud.online) throw Object.assign(new Error('x'), { code: 'offline' });
      const current = db.get(`${uid}/${n}`) ?? null;
      if ((current?.savedAt ?? null) !== expected) return { ok: false, current };
      cloud.writes++;
      if (entry) db.set(`${uid}/${n}`, entry);
      else db.delete(`${uid}/${n}`);
      return { ok: true };
    },
  };
  return cloud;
}

// ---------- 아이디·비밀번호 ----------

test('아이디는 영문·숫자 4~16자만 되고 소문자로 맞춘다', () => {
  assert.equal(normalizeId('Kangmin7'), 'kangmin7');
  assert.equal(normalizeId('  abcd  '), 'abcd');
  assert.equal(normalizeId('a'.repeat(16)), 'a'.repeat(16));
  for (const bad of ['abc', 'a'.repeat(17), '강민아이디', 'ab cd', 'ab_cd', 'ab@cd', 'abc!']) {
    assert.throws(() => normalizeId(bad), /영문·숫자 4~16자/, bad);
  }
  assert.throws(() => normalizeId(''), /아이디를 입력/);
  assert.throws(() => normalizeId(undefined), /아이디를 입력/);
});

test('비밀번호는 6자 이상, 아이디는 가짜 이메일로 바뀐다', () => {
  assert.throws(() => checkPassword(''), /비밀번호를 입력/);
  assert.throws(() => checkPassword('12345'), /6자 이상/);
  assert.equal(checkPassword('123456'), '123456');
  assert.equal(idToEmail('Wind01'), 'wind01@cheongpung.local');
});

test('Firebase 오류는 한국어로 바뀐다', () => {
  assert.match(authErrorMessage({ code: 'auth/email-already-in-use' }), /이미 있는 아이디/);
  assert.match(authErrorMessage({ code: 'auth/invalid-credential' }), /아이디 또는 비밀번호가 맞지 않/);
  assert.match(authErrorMessage({ code: 'auth/network-request-failed' }), /인터넷/);
  assert.match(authErrorMessage({ code: 'offline' }), /인터넷/);
  assert.match(authErrorMessage({ code: 'auth/something-new' }), /처리하지 못했습니다.*something-new/);
  assert.equal(authErrorMessage(new Error('비밀번호 확인이 맞지 않습니다.')), '비밀번호 확인이 맞지 않습니다.');
});

test('설정값이 비어 있으면 로그인을 쓰지 않는다', () => {
  assert.equal(isConfigured(FIREBASE_CONFIG), false);
  assert.equal(isConfigured({}), false);
  assert.equal(isConfigured({ ...CONFIG, apiKey: ' ' }), false);
  assert.equal(isConfigured(CONFIG), true);
});

// ---------- 최근 저장 고르기 ----------

test('저장 맞추기 판단: 한쪽만 바뀌면 그쪽, 둘 다 바뀌면 묻는다', () => {
  // 처음 맞추는 기기(base 없음)
  assert.equal(decideSlot(null, null, undefined), 'same');
  assert.equal(decideSlot(T1, T1, undefined), 'same');
  assert.equal(decideSlot(T1, null, undefined), 'upload');
  assert.equal(decideSlot(null, T1, undefined), 'download');
  assert.equal(decideSlot(T1, T2, undefined), 'conflict');
  // 마지막으로 T1 에서 맞췄을 때
  assert.equal(decideSlot(T2, T1, T1), 'upload');       // 이 기기에서 더 했다
  assert.equal(decideSlot(T1, T2, T1), 'download');     // 다른 기기에서 더 했다
  assert.equal(decideSlot(null, T1, T1), 'deleteRemote'); // 이 기기에서 지웠다
  assert.equal(decideSlot(T1, null, T1), 'deleteLocal');  // 다른 기기에서 지웠다
  assert.equal(decideSlot(T2, T3, T1), 'conflict');     // 둘 다 따로 진행했다
  assert.equal(decideSlot(null, T3, T1), 'download');   // 지운 것보다 진행한 쪽을 살린다
  assert.equal(decideSlot(T3, null, T1), 'upload');
  // 빈 칸으로 맞춘 뒤 한쪽에 새로 생김
  assert.equal(decideSlot(T2, null, null), 'upload');
  assert.equal(decideSlot(null, T2, null), 'download');
});

test('더 최근 저장 쪽을 알려 준다', () => {
  assert.equal(newerSide(T1, T2), 'remote');
  assert.equal(newerSide(T3, T2), 'local');
  assert.equal(newerSide(T1, T1), 'local');
  assert.equal(newerSide(null, T1), 'remote');
  assert.equal(savedAtOf(saveText('가', T2)), T2);
  assert.equal(savedAtOf('망가진 글자'), null);
});

test('처음 로그인: 이 기기에만 있는 칸은 올리고, 서버에만 있는 칸은 받는다', async () => {
  const storage = memoryStorage();
  const cloud = fakeCloud();
  writeSlotText(0, saveText('기기캐릭', T1), storage);
  await new CloudSync(cloud, { storage }).signUp('kangmin', '123456', '123456');
  cloud.db.set('uid-1/1', { text: saveText('서버캐릭', T2), savedAt: T2 });

  const sync = new CloudSync(cloud, { storage });
  await sync.reconnect();
  assert.equal(sync.status, 'synced');
  assert.equal(cloud.db.get('uid-1/0').savedAt, T1);
  assert.equal(loadSave(1, storage).name, '서버캐릭');
  assert.deepEqual(sync.conflicts, {});
});

test('양쪽이 다르면 고르게 하고, 고른 쪽으로 맞춘다', async () => {
  const storage = memoryStorage();
  const cloud = fakeCloud();
  const sync = new CloudSync(cloud, { storage });
  await sync.signUp('kangmin', '123456', '123456');
  cloud.db.set('uid-1/0', { text: saveText('폰캐릭', T2, 5), savedAt: T2 });
  cloud.db.set('uid-1/1', { text: saveText('폰둘째', T2, 7), savedAt: T2 });
  writeSlotText(0, saveText('패드캐릭', T1, 3), storage);
  writeSlotText(1, saveText('패드둘째', T3, 9), storage);
  await sync.syncAll();
  assert.deepEqual(Object.keys(sync.conflicts).sort(), ['0', '1']);
  assert.match(sync.statusText(), /2개/);

  const info = sync.conflictInfo(0);
  assert.equal(info.local.name, '패드캐릭');
  assert.equal(info.remote.name, '폰캐릭');
  assert.equal(info.newer, 'remote');
  assert.equal(sync.conflictInfo(1).newer, 'local');

  await sync.resolve(0, 'remote');
  assert.equal(loadSave(0, storage).name, '폰캐릭');
  await sync.resolve(1, 'local');
  assert.equal(JSON.parse(cloud.db.get('uid-1/1').text).player.name, '패드둘째');
  assert.deepEqual(sync.conflicts, {});

  // 고른 뒤 다시 맞춰도 조용하다
  const writes = cloud.writes;
  await sync.syncAll();
  assert.deepEqual(sync.conflicts, {});
  assert.equal(cloud.writes, writes);
});

test('다른 기기에서 더 하면 받아 오고, 이 기기에서 지우면 서버에서도 지운다', async () => {
  const storage = memoryStorage();
  const cloud = fakeCloud();
  const sync = new CloudSync(cloud, { storage });
  writeSlotText(0, saveText('하나', T1), storage);
  writeSlotText(2, saveText('셋', T1), storage);
  await sync.signUp('kangmin', '123456', '123456');
  assert.equal(cloud.db.size, 2);

  cloud.db.set('uid-1/0', { text: saveText('하나', T2, 10), savedAt: T2 });   // 폰에서 진행
  deleteSave(2, storage);                                                      // 이 기기에서 지움
  await sync.syncAll();
  assert.equal(loadSave(0, storage).level, 10);
  assert.equal(cloud.db.has('uid-1/2'), false);
  assert.deepEqual(sync.conflicts, {});
});

test('게임 중 자동 저장은 너무 잦지 않게 올리고, 닫을 때는 바로 올린다', async () => {
  const storage = memoryStorage();
  const cloud = fakeCloud();
  let clock = 100000;
  const sync = new CloudSync(cloud, { storage, now: () => clock });
  writeSlotText(0, saveText('하나', T1), storage);
  await sync.signUp('kangmin', '123456', '123456');
  await sync.noteSaved(0);
  const writes = cloud.writes;

  writeSlotText(0, saveText('하나', T2), storage);
  clock += CLOUD_PUSH_MS - 1;
  await sync.noteSaved(0);
  assert.equal(cloud.writes, writes, '간격 전에는 올리지 않는다');
  clock += 1;
  await sync.noteSaved(0);
  assert.equal(cloud.db.get('uid-1/0').savedAt, T2);

  writeSlotText(0, saveText('하나', T3), storage);
  await sync.flush(0);
  assert.equal(cloud.db.get('uid-1/0').savedAt, T3);
});

test('플레이 중인 칸을 다른 기기가 바꿨으면 덮어쓰지도 받지도 않고 묻는다', async () => {
  const storage = memoryStorage();
  const cloud = fakeCloud();
  const sync = new CloudSync(cloud, { storage });
  writeSlotText(0, saveText('하나', T1), storage);
  await sync.signUp('kangmin', '123456', '123456');

  cloud.db.set('uid-1/0', { text: saveText('하나', T2, 20), savedAt: T2 });  // 폰에서 진행
  writeSlotText(0, saveText('하나', T3, 2), storage);                         // 이 기기에서도 진행
  await sync.flush(0);
  assert.ok(sync.conflicts[0]);
  assert.equal(cloud.db.get('uid-1/0').savedAt, T2, '서버를 덮지 않는다');
  assert.equal(loadSave(0, storage).level, 2, '이 기기 저장도 그대로');
  const writes = cloud.writes;
  await sync.flush(0);
  assert.equal(cloud.writes, writes, '고르기 전에는 그 칸을 올리지 않는다');
});

test('잘못된 아이디·비밀번호는 한국어 오류로 알려 준다', async () => {
  const cloud = fakeCloud();
  const sync = new CloudSync(cloud, { storage: memoryStorage() });
  await assert.rejects(sync.signIn('ab', '123456'), /영문·숫자 4~16자/);
  await assert.rejects(sync.signUp('kangmin', '123456', '654321'), /비밀번호 확인/);
  await assert.rejects(sync.signIn('kangmin', '123456'), /아이디 또는 비밀번호가 맞지 않/);
  await sync.signUp('kangmin', '123456', '123456');
  await assert.rejects(new CloudSync(cloud, { storage: memoryStorage() }).signUp('KangMin', '123456', '123456'), /이미 있는 아이디/);
});

// ---------- Firebase 가 없을 때(오프라인) ----------

test('설정값이 없으면 SDK 를 아예 부르지 않는다', async () => {
  let calls = 0;
  const cloud = createCloud(FIREBASE_CONFIG, { importer: async () => { calls++; return {}; } });
  assert.equal(cloud.enabled, false);
  assert.equal(await cloud.ready(), false);
  assert.equal(calls, 0);
  const sync = new CloudSync(cloud, { storage: memoryStorage() });
  assert.equal(sync.enabled, false);
  await sync.reconnect();
  await sync.noteSaved(0);
});

test('SDK 를 못 불러오면(비행기 모드) 예외 없이 오프라인으로 돈다', async () => {
  let calls = 0;
  const failing = createCloud(CONFIG, { importer: async () => { calls++; throw new TypeError('Failed to fetch'); } });
  assert.equal(await failing.ready(), false);
  assert.equal(await failing.ready(), false, '다음에 다시 시도한다');
  assert.ok(calls >= 2);
  await assert.rejects(failing.readSlots('u'), (err) => err.code === 'offline');

  const airplane = createCloud(CONFIG, { importer: async () => { throw new Error('부르면 안 됨'); }, isOnline: () => false });
  assert.equal(await airplane.ready(), false);

  // 로그인해 둔 기기가 비행기 모드로 켜졌을 때: 이 기기 저장으로 계속 하고, 서버에 못 올려도 멈추지 않는다
  const storage = memoryStorage();
  storage.setItem('cheongpung-account', JSON.stringify({ mode: 'cloud', id: 'kangmin', uid: 'uid-1' }));
  writeSlotText(0, saveText('하나', T1), storage);
  const sync = new CloudSync(failing, { storage });
  assert.equal(sync.loggedIn, true);
  await sync.reconnect(0);
  assert.equal(sync.status, 'offline');
  assert.match(sync.statusText(), /오프라인/);
  await sync.noteSaved(0);
  await sync.flush(0);
  assert.equal(loadSave(0, storage).name, '하나');
  await assert.rejects(new CloudSync(failing, { storage: memoryStorage() }).signIn('kangmin', '123456'), /인터넷/);
});

test('오프라인에서 한 것은 연결되면 올라간다', async () => {
  const storage = memoryStorage();
  const cloud = fakeCloud();
  const sync = new CloudSync(cloud, { storage });
  writeSlotText(0, saveText('하나', T1), storage);
  await sync.signUp('kangmin', '123456', '123456');

  cloud.online = false;
  writeSlotText(0, saveText('하나', T2, 4), storage);
  await sync.flush(0);
  assert.equal(sync.status, 'offline');
  assert.equal(cloud.db.get('uid-1/0').savedAt, T1);

  cloud.online = true;
  await sync.reconnect(0);
  assert.equal(sync.status, 'synced');
  assert.equal(cloud.db.get('uid-1/0').savedAt, T2);
});

test('로그인 없이 하기를 고르면 기억하고, 로그아웃해도 기기 저장은 남는다', async () => {
  const storage = memoryStorage();
  const sync = new CloudSync(fakeCloud(), { storage });
  assert.equal(sync.mode, null);
  sync.chooseLocal();
  assert.equal(new CloudSync(fakeCloud(), { storage }).mode, 'local');

  writeSlotText(0, saveText('하나', T1), storage);
  await sync.signUp('kangmin', '123456', '123456');
  assert.equal(new CloudSync(fakeCloud(), { storage }).userId, 'kangmin');
  await sync.signOut();
  assert.equal(sync.mode, null);
  assert.equal(readSlotText(0, storage) !== null, true);
});

test('createCloud 는 Firebase 모듈을 이어 붙여 슬롯을 읽고 조건부로 쓴다', async () => {
  const docs = new Map();
  const urls = [];
  const fakeModules = {
    'firebase-app.js': { initializeApp: (cfg) => ({ cfg }) },
    'firebase-auth.js': {
      initializeAuth: () => ({}),
      indexedDBLocalPersistence: {},
      browserLocalPersistence: {},
      onAuthStateChanged: (auth, cb) => { setTimeout(() => cb({ uid: 'u1' })); return () => {}; },
      signInWithEmailAndPassword: async (auth, email) => ({ user: { uid: `u:${email}` } }),
      createUserWithEmailAndPassword: async () => ({ user: { uid: 'new' } }),
      signOut: async () => {},
    },
    'firebase-firestore-lite.js': {
      getFirestore: () => ({}),
      doc: (db, ...path) => path.join('/'),
      collection: (db, ...path) => path.join('/'),
      serverTimestamp: () => 'now',
      getDocs: async (col) => ({ forEach: (fn) => { for (const [k, v] of docs) if (k.startsWith(`${col}/`)) fn({ id: k.split('/').pop(), data: () => v }); } }),
      runTransaction: async (db, fn) => fn({
        get: async (ref) => ({ exists: () => docs.has(ref), data: () => docs.get(ref) }),
        set: (ref, v) => docs.set(ref, v),
        delete: (ref) => docs.delete(ref),
      }),
    },
  };
  const cloud = createCloud(CONFIG, { importer: async (url) => { urls.push(url); return fakeModules[url.split('/').pop()]; } });
  assert.equal(await cloud.ready(), true);
  assert.ok(urls.every((u) => u.startsWith('https://www.gstatic.com/firebasejs/12.6.0/')));
  assert.deepEqual(await cloud.restoreUser(), { uid: 'u1' });
  assert.deepEqual(await cloud.signIn('a@cheongpung.local', 'pw'), { uid: 'u:a@cheongpung.local' });

  assert.deepEqual(await cloud.writeSlotIf('u1', 0, { text: 't1', savedAt: T1 }, null, { name: '하나' }), { ok: true });
  assert.equal(docs.get('users/u1/slots/0').name, '하나');
  assert.deepEqual(await cloud.readSlots('u1'), { 0: { text: 't1', savedAt: T1 } });
  const stale = await cloud.writeSlotIf('u1', 0, { text: 't2', savedAt: T2 }, null);
  assert.equal(stale.ok, false);
  assert.equal(stale.current.savedAt, T1);
  assert.deepEqual(await cloud.writeSlotIf('u1', 0, null, T1), { ok: true });
  assert.equal(docs.size, 0);
});

test('새 파일은 오프라인 캐시 목록에 있고, 서비스 워커는 다른 주소 요청을 건드리지 않는다', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const f of ['src/firebase-config.js', 'src/core/account.js', 'src/core/cloud.js', 'src/core/sync.js', 'src/ui/accountView.js']) {
    assert.ok(sw.includes(`'./${f}'`), f);
  }
  assert.match(sw, /origin !== self\.location\.origin\) return;/);
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /request\.auth\.uid == uid/);
});
