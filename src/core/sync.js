// 로그인한 계정의 서버 저장과 이 기기 저장(슬롯 4칸)을 맞춘다.
// 서버에 못 닿으면(비행기 모드, SDK 를 못 불러옴) 조용히 기다렸다가 연결되면 다시 맞춘다.
import { SAVE_SLOTS, readSlotText, writeSlotText, importText } from './save.js';
import { normalizeId, checkPassword, idToEmail, authErrorMessage, savedAtOf, decideSlot, newerSide } from './account.js';

export const CLOUD_PUSH_MS = 45000;      // 게임 중 서버에 올리는 간격(자동 저장은 15초마다지만 서버는 덜 자주)
const ACCOUNT_KEY = 'cheongpung-account';
const baseKey = (uid) => `cheongpung-sync-${uid}`;

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readJson(storage, key) {
  try {
    const v = JSON.parse(storage?.getItem(key) ?? 'null');
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    if (value === null) storage?.removeItem(key);
    else storage?.setItem(key, JSON.stringify(value));
  } catch {
    // 저장소가 막혀 있으면 다음 실행 때 다시 맞춘다
  }
}

const tryImport = (text) => {
  try {
    return importText(text);
  } catch {
    return null;
  }
};

export class CloudSync {
  /**
   * @param cloud createCloud() 결과(테스트에서는 가짜)
   * @param storage localStorage 와 같은 모양(getItem/setItem/removeItem)
   */
  constructor(cloud, { storage = defaultStorage(), now = () => Date.now() } = {}) {
    this.cloud = cloud;
    this.storage = storage;
    this.now = now;
    const rec = readJson(storage, ACCOUNT_KEY);
    this.account = rec && ['local', 'cloud'].includes(rec.mode) ? rec : { mode: null };
    if (this.account.mode === 'cloud' && !(typeof this.account.uid === 'string' && this.account.uid)) this.account = { mode: null };
    this.status = this.account.mode === 'cloud' ? 'offline' : 'idle';
    this.message = '';
    this.conflicts = {};      // n → 서버 쪽 { text, savedAt }
    this.remote = null;       // 마지막으로 본 서버 슬롯들(모르면 null)
    this.verified = false;    // 이번 실행에서 서버 로그인 상태를 확인했는지
    this.lastPush = 0;
    this.queue = Promise.resolve();
    this.listeners = new Set();
  }

  get enabled() { return this.cloud.enabled; }
  get mode() { return this.account.mode; }
  get loggedIn() { return this.account.mode === 'cloud'; }
  get userId() { return this.loggedIn ? this.account.id : null; }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  emit() {
    for (const cb of this.listeners) cb(this);
  }

  setStatus(status, message = '') {
    this.status = status;
    this.message = message;
    this.emit();
  }

  /** 작업이 겹치지 않게 차례로 돌린다 */
  run(task) {
    const next = this.queue.then(task, task);
    this.queue = next.catch(() => {});
    return next;
  }

  setAccount(account) {
    this.account = account;
    writeJson(this.storage, ACCOUNT_KEY, account.mode ? account : null);
  }

  bases() {
    return readJson(this.storage, baseKey(this.account.uid)) ?? {};
  }

  setBase(n, savedAt) {
    writeJson(this.storage, baseKey(this.account.uid), { ...this.bases(), [n]: savedAt });
  }

  chooseLocal() {
    this.setAccount({ mode: 'local' });
    this.setStatus('idle');
  }

  /** 로그인 화면으로 돌아가기(이 기기 저장은 그대로) */
  async signOut() {
    try {
      await this.cloud.signOut();
    } catch {
      // 서버에 못 닿아도 이 기기에서는 로그아웃한다
    }
    this.setAccount({ mode: null });
    this.conflicts = {};
    this.remote = null;
    this.verified = false;
    this.setStatus('idle');
  }

  async signIn(rawId, password) {
    const id = normalizeId(rawId);
    checkPassword(password);
    return this.login(id, () => this.cloud.signIn(idToEmail(id), password));
  }

  async signUp(rawId, password, again) {
    const id = normalizeId(rawId);
    checkPassword(password);
    if (password !== again) throw new Error('비밀번호 확인이 맞지 않습니다.');
    return this.login(id, () => this.cloud.signUp(idToEmail(id), password));
  }

  async login(id, auth) {
    let user;
    try {
      user = await auth();
    } catch (err) {
      throw new Error(authErrorMessage(err));
    }
    this.setAccount({ mode: 'cloud', id, uid: user.uid });
    this.conflicts = {};
    this.remote = null;
    this.verified = true;
    await this.syncAll();
  }

  /** 앱을 켰을 때·인터넷이 다시 될 때: 로그인 상태를 확인하고 전부 맞춘다 */
  async reconnect(activeSlot = null) {
    if (!this.loggedIn) return;
    if (!(await this.cloud.ready())) {
      this.setStatus('offline');
      return;
    }
    if (!this.verified) {
      let user = null;
      try {
        user = await this.cloud.restoreUser();
      } catch {
        this.setStatus('offline');
        return;
      }
      if (user?.uid !== this.account.uid) {
        this.setAccount({ mode: null });
        this.setStatus('idle', '로그인이 풀렸습니다. 다시 로그인해 주세요.');
        return;
      }
      this.verified = true;
    }
    await this.syncAll(activeSlot);
  }

  /** 슬롯 4칸을 모두 서버와 맞춘다. activeSlot 은 지금 플레이 중이라 덮어쓰지 않는다. */
  syncAll(activeSlot = null) {
    return this.run(async () => {
      if (!this.loggedIn) return;
      this.setStatus('syncing');
      try {
        this.remote = await this.cloud.readSlots(this.account.uid);
        for (let n = 0; n < SAVE_SLOTS; n++) await this.syncSlot(n, this.remote[n] ?? null, n === activeSlot);
        this.setStatus('synced');
      } catch (err) {
        this.fail(err);
      }
    });
  }

  fail(err) {
    if (err?.code === 'offline' || err?.code === 'unavailable' || err?.code === 'auth/network-request-failed') this.setStatus('offline');
    else this.setStatus('error', authErrorMessage(err));
  }

  /** 한 슬롯 맞추기. remoteEntry: 서버 쪽 { text, savedAt } 또는 null */
  async syncSlot(n, remoteEntry, active, retry = true) {
    const localText = readSlotText(n, this.storage);
    const localPlayer = localText ? tryImport(localText) : null;
    const remotePlayer = remoteEntry ? tryImport(remoteEntry.text) : null;
    const localAt = localPlayer ? savedAtOf(localText) : null;
    const remoteAt = remotePlayer ? remoteEntry.savedAt ?? savedAtOf(remoteEntry.text) : null;
    delete this.conflicts[n];

    // 한쪽이 망가졌으면 성한 쪽으로 살린다(둘 다 망가졌으면 건드리지 않는다)
    if (localText && !localPlayer) {
      if (remotePlayer && !active) this.takeRemote(n, remoteEntry, remoteAt);
      return;
    }
    if (remoteEntry && !remotePlayer) {
      if (localPlayer) await this.push(n, localText, localAt, remoteEntry.savedAt ?? null, localPlayer, active, retry);
      return;
    }

    const action = decideSlot(localAt, remoteAt, this.bases()[n]);
    if (action === 'same') this.setBase(n, localAt);
    else if (action === 'upload') await this.push(n, localText, localAt, remoteAt, localPlayer, active, retry);
    else if (action === 'deleteRemote') await this.push(n, null, null, remoteAt, null, active, retry);
    else if (active) this.conflicts[n] = { text: remoteEntry?.text ?? null, savedAt: remoteAt };  // 플레이 중인 칸은 덮지 않고 묻는다
    else if (action === 'download') this.takeRemote(n, remoteEntry, remoteAt);
    else if (action === 'deleteLocal') this.takeRemote(n, null, null);
    else this.conflicts[n] = { text: remoteEntry.text, savedAt: remoteAt };
  }

  takeRemote(n, entry, savedAt) {
    if (writeSlotText(n, entry?.text ?? null, this.storage)) this.setBase(n, savedAt);
    if (this.remote) this.remote[n] = entry;
  }

  async push(n, text, savedAt, expected, player, active, retry) {
    const entry = text ? { text, savedAt } : null;
    const meta = player ? { name: player.name, level: player.level, cls: player.cls } : {};
    const res = await this.cloud.writeSlotIf(this.account.uid, n, entry, expected, meta);
    if (res.ok) {
      this.setBase(n, savedAt);
      if (this.remote) this.remote[n] = entry;
      return;
    }
    // 그새 다른 기기가 서버를 바꿨다: 새 서버 내용으로 한 번 더 판단한다
    if (this.remote) this.remote[n] = res.current;
    if (retry) await this.syncSlot(n, res.current, active, false);
  }

  /** 자동 저장 직후: 마지막으로 올린 지 CLOUD_PUSH_MS 가 지났으면 이 슬롯을 올린다 */
  noteSaved(slot) {
    if (!this.loggedIn || this.now() - this.lastPush < CLOUD_PUSH_MS) return Promise.resolve();
    return this.pushSlot(slot);
  }

  /** 앱을 닫거나 타이틀로 나갈 때: 기다리지 않고 바로 올린다 */
  flush(slot) {
    if (!this.loggedIn) return Promise.resolve();
    return this.pushSlot(slot);
  }

  pushSlot(slot) {
    this.lastPush = this.now();
    if (this.conflicts[slot]) return Promise.resolve();
    if (!this.remote || !this.verified) return this.reconnect(slot);
    return this.run(async () => {
      if (!this.loggedIn || !(await this.cloud.ready())) {
        if (this.loggedIn) this.setStatus('offline');
        return;
      }
      this.setStatus('syncing');
      try {
        await this.syncSlot(slot, this.remote[slot] ?? null, true);
        this.setStatus('synced');
      } catch (err) {
        this.fail(err);
      }
    });
  }

  /** 기기·서버 저장이 갈린 칸의 두 쪽 정보(타이틀에서 보여 주기) */
  conflictInfo(n) {
    const c = this.conflicts[n];
    if (!c) return null;
    const localText = readSlotText(n, this.storage);
    const local = localText ? tryImport(localText) : null;
    const localAt = local ? savedAtOf(localText) : null;
    return { local, localAt, remote: c.text ? tryImport(c.text) : null, remoteAt: c.savedAt, newer: newerSide(localAt, c.savedAt) };
  }

  /** 사용자가 고른 쪽으로 맞춘다. side: 'local' | 'remote'. 오프라인이어도 고를 수 있고 올리기는 나중에 한다. */
  resolve(n, side) {
    return this.run(async () => {
      const c = this.conflicts[n];
      if (!c) return;
      delete this.conflicts[n];
      if (side === 'remote') {
        this.takeRemote(n, c.text ? c : null, c.savedAt);
        this.emit();
        return;
      }
      // 서버 쪽을 '본 것'으로 기록하면 이 기기 쪽이 바뀐 것으로 보여 올라간다
      this.setBase(n, c.savedAt);
      this.emit();
      if (!this.verified || !(await this.cloud.ready())) {
        this.setStatus('offline');
        return;
      }
      try {
        await this.syncSlot(n, c.text ? c : null, false);
        this.setStatus('synced');
      } catch (err) {
        this.fail(err);
      }
    });
  }

  /** 지금 상태를 한 줄로 */
  statusText() {
    const pending = Object.keys(this.conflicts).length;
    if (pending) return `기기와 서버 저장이 다른 칸 ${pending}개 — 어느 쪽을 쓸지 골라 주세요`;
    switch (this.status) {
      case 'syncing': return '서버와 맞추는 중…';
      case 'synced': return '서버에 저장됨';
      case 'offline': return '오프라인 — 이 기기에 저장하고, 연결되면 올립니다';
      case 'error': return this.message;
      default: return this.message;
    }
  }
}
