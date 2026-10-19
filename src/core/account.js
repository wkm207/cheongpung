// 아이디·비밀번호 계정과 기기↔서버 저장 맞추기에 쓰는 순수 함수들(Firebase 없이도 돈다)

export const ID_DOMAIN = 'cheongpung.local';
const ID_RULE = /^[A-Za-z0-9]{4,16}$/;
export const PASSWORD_MIN = 6;

/** 설정값이 다 채워져 있어야 로그인을 보여 준다 */
export function isConfigured(config) {
  return ['apiKey', 'authDomain', 'projectId', 'appId'].every((k) => typeof config?.[k] === 'string' && config[k].trim() !== '');
}

/** 아이디 검사: 통과하면 소문자로 바꾼 아이디, 아니면 한국어 오류를 던진다 */
export function normalizeId(raw) {
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (!id) throw new Error('아이디를 입력해 주세요.');
  if (!ID_RULE.test(id)) throw new Error('아이디는 영문·숫자 4~16자로 입력해 주세요.');
  return id.toLowerCase();
}

export function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length === 0) throw new Error('비밀번호를 입력해 주세요.');
  if (pw.length < PASSWORD_MIN) throw new Error(`비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다.`);
  return pw;
}

/** 사용자는 이메일을 몰라도 되게, 아이디를 가짜 이메일로 바꿔 Firebase 에 넘긴다 */
export const idToEmail = (id) => `${normalizeId(id)}@${ID_DOMAIN}`;

const AUTH_MESSAGES = {
  'auth/email-already-in-use': '이미 있는 아이디입니다. 다른 아이디를 고르거나 로그인해 주세요.',
  'auth/invalid-credential': '아이디 또는 비밀번호가 맞지 않습니다.',
  'auth/invalid-login-credentials': '아이디 또는 비밀번호가 맞지 않습니다.',
  'auth/wrong-password': '아이디 또는 비밀번호가 맞지 않습니다.',
  'auth/user-not-found': '아이디 또는 비밀번호가 맞지 않습니다.',
  'auth/invalid-email': '아이디는 영문·숫자 4~16자로 입력해 주세요.',
  'auth/weak-password': `비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다.`,
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/too-many-requests': '시도가 너무 많습니다. 잠시 뒤에 다시 해 주세요.',
  'auth/network-request-failed': '인터넷에 연결되어 있지 않습니다. 연결한 뒤 다시 해 주세요.',
  'auth/user-disabled': '사용이 멈춘 아이디입니다.',
  'auth/operation-not-allowed': '아직 아이디 로그인이 켜져 있지 않습니다. (Firebase 콘솔에서 이메일/비밀번호를 사용 설정해 주세요)',
  'auth/configuration-not-found': '아직 아이디 로그인이 켜져 있지 않습니다. (Firebase 콘솔에서 Authentication 을 시작해 주세요)',
  'auth/invalid-api-key': 'Firebase 설정값(apiKey)이 올바르지 않습니다.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Firebase 설정값(apiKey)이 올바르지 않습니다.',
  'permission-denied': '서버 저장에 접근할 권한이 없습니다. (Firestore 보안 규칙을 확인해 주세요)',
  unavailable: '서버에 연결할 수 없습니다. 연결되면 다시 맞춥니다.',
  offline: '인터넷에 연결되어 있지 않아 로그인할 수 없습니다. 연결한 뒤 다시 해 주세요.',
};

/** Firebase 오류(또는 우리 오류)를 사용자에게 보여 줄 한국어 문장으로 */
export function authErrorMessage(err) {
  const code = err?.code ?? '';
  if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
  if (!code && err?.message) return err.message;
  return `처리하지 못했습니다. 잠시 뒤 다시 해 주세요. (${code || '알 수 없는 오류'})`;
}

/** 저장 글자(exportText 결과)에서 저장 시각을 꺼낸다. 읽을 수 없으면 null */
export function savedAtOf(text) {
  try {
    const at = JSON.parse(text)?.savedAt;
    return typeof at === 'string' && at ? at : null;
  } catch {
    return null;
  }
}

/**
 * 한 슬롯을 어떻게 맞출지 정한다.
 * local / remote: 그쪽 저장의 savedAt(없으면 null)
 * base: 이 기기가 마지막으로 서버와 맞췄을 때의 savedAt(빈 칸으로 맞췄으면 null),
 *       이 계정으로 한 번도 맞춘 적이 없으면 undefined
 * 결과: 'same' | 'upload' | 'download' | 'deleteRemote' | 'deleteLocal' | 'conflict'
 */
export function decideSlot(local, remote, base) {
  if (local === remote) return 'same';
  if (base === undefined) {
    // 처음 맞추는 기기: 한쪽만 있으면 그쪽을 쓰고, 둘 다 다르면 사용자에게 묻는다
    if (local === null) return 'download';
    if (remote === null) return 'upload';
    return 'conflict';
  }
  const localChanged = local !== base;
  const remoteChanged = remote !== base;
  if (!localChanged) return remote === null ? 'deleteLocal' : 'download';
  if (!remoteChanged) return local === null ? 'deleteRemote' : 'upload';
  // 양쪽 다 바뀌었으면: 한쪽이 지워진 것보다는 남은 쪽을 살리고, 둘 다 있으면 묻는다
  if (local === null) return 'download';
  if (remote === null) return 'upload';
  return 'conflict';
}

/** 둘 중 더 최근 저장 쪽('local' | 'remote'). 같거나 모르면 'local' */
export function newerSide(localAt, remoteAt) {
  const l = Date.parse(localAt ?? '') || 0;
  const r = Date.parse(remoteAt ?? '') || 0;
  return r > l ? 'remote' : 'local';
}
