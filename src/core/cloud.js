// Firebase 연결: SDK 는 처음 쓸 때 gstatic CDN(고정 버전)에서 불러온다.
// 못 불러오면(비행기 모드 등) null 을 돌려주고, 게임은 이 기기 저장만으로 계속 돈다.
import { isConfigured } from './account.js';

export const FIREBASE_VERSION = '12.6.0';
const CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
const LOAD_TIMEOUT_MS = 10000;

const offlineError = () => Object.assign(new Error('offline'), { code: 'offline' });

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(offlineError()), ms);
    promise.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
  });
}

/**
 * Firebase 를 감싼 작은 창구. 슬롯 문서: users/{uid}/slots/{n} = { text, savedAt, name, level, cls, updatedAt }
 * importer 는 테스트에서 가짜 모듈을 넣으려고 바꿀 수 있다.
 */
export function createCloud(config, { importer = (url) => import(url), isOnline = () => globalThis.navigator?.onLine !== false } = {}) {
  const enabled = isConfigured(config);
  let loading = null;
  let api = null;

  /** SDK 를 불러와 준비되면 true, 못 하면 false (다음에 다시 시도할 수 있다) */
  async function ready() {
    if (api) return true;
    if (!enabled || !isOnline()) return false;
    loading ??= withTimeout(Promise.all([
      importer(`${CDN}/firebase-app.js`),
      importer(`${CDN}/firebase-auth.js`),
      importer(`${CDN}/firebase-firestore-lite.js`),
    ]), LOAD_TIMEOUT_MS).then(([appMod, authMod, fsMod]) => {
      const app = appMod.initializeApp(config);
      // 팝업·리디렉트 로그인은 안 쓰므로 initializeAuth 로 필요한 것만 켠다(로그인 상태는 기기에 남는다)
      const auth = authMod.initializeAuth(app, { persistence: [authMod.indexedDBLocalPersistence, authMod.browserLocalPersistence] });
      const firstUser = new Promise((resolve) => {
        const stop = authMod.onAuthStateChanged(auth, (user) => { stop(); resolve(user); });
      });
      api = { authMod, fsMod, auth, db: fsMod.getFirestore(app), firstUser };
      return true;
    }).catch(() => {
      loading = null;
      return false;
    });
    return loading;
  }

  async function need() {
    if (!(await ready())) throw offlineError();
    return api;
  }

  const slotRef = (a, uid, n) => a.fsMod.doc(a.db, 'users', uid, 'slots', String(n));
  const asEntry = (data) => (data && typeof data.text === 'string' ? { text: data.text, savedAt: typeof data.savedAt === 'string' ? data.savedAt : null } : null);

  return {
    enabled,
    ready,
    /** 기기에 남아 있던 로그인 상태(없으면 null) */
    async restoreUser() {
      const a = await need();
      const user = await a.firstUser;
      return user ? { uid: user.uid } : null;
    },
    async signUp(email, password) {
      const a = await need();
      const cred = await a.authMod.createUserWithEmailAndPassword(a.auth, email, password);
      return { uid: cred.user.uid };
    },
    async signIn(email, password) {
      const a = await need();
      const cred = await a.authMod.signInWithEmailAndPassword(a.auth, email, password);
      return { uid: cred.user.uid };
    },
    async signOut() {
      if (api) await api.authMod.signOut(api.auth);
    },
    /** 서버의 슬롯들: { [n]: { text, savedAt } } */
    async readSlots(uid) {
      const a = await need();
      const snap = await a.fsMod.getDocs(a.fsMod.collection(a.db, 'users', uid, 'slots'));
      const out = {};
      snap.forEach((d) => { out[d.id] = asEntry(d.data()); });
      return out;
    },
    /**
     * 서버 슬롯이 아직 expected(savedAt, 없으면 null)일 때만 바꾼다. entry 가 null 이면 지운다.
     * 그새 다른 기기가 바꿨으면 { ok: false, current } 를 돌려준다.
     */
    async writeSlotIf(uid, n, entry, expected, meta = {}) {
      const a = await need();
      const ref = slotRef(a, uid, n);
      return a.fsMod.runTransaction(a.db, async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists() ? asEntry(snap.data()) : null;
        if ((current?.savedAt ?? null) !== expected) return { ok: false, current };
        if (entry) tx.set(ref, { text: entry.text, savedAt: entry.savedAt, ...meta, updatedAt: a.fsMod.serverTimestamp() });
        else tx.delete(ref);
        return { ok: true };
      });
    },
  };
}
