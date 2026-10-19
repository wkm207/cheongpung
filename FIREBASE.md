# 아이디 로그인·기기 간 저장 맞추기 (Firebase 설정 안내)

로그인하면 폰·아이패드·컴퓨터가 같은 캐릭터를 씁니다. 서버는 Google 의 무료 Firebase(Spark 요금제)를 씁니다.
아래 설정을 마치기 전까지는 로그인 버튼이 보이지 않고, 지금처럼 각 기기에만 저장됩니다.

> 모든 단계는 Google 계정으로 https://console.firebase.google.com 에서 직접 합니다. 카드 등록은 필요 없습니다.

## 1. 프로젝트 만들기
1. Firebase 콘솔 → **프로젝트 만들기**(또는 "Firebase 프로젝트 시작하기")
2. 프로젝트 이름: `cheongpung` (아무거나 괜찮음) → 계속
3. **Google 애널리틱스는 끄기** → 프로젝트 만들기 → 다 되면 계속

## 2. 웹 앱 추가 → 설정값 복사
1. 프로젝트 첫 화면(프로젝트 개요)에서 **웹 아이콘 `</>`** (앱 추가 → 웹)
2. 앱 닉네임: `Country of Wind` → "Firebase 호스팅 설정"은 **체크하지 않음** → **앱 등록**
3. 화면에 나오는 `const firebaseConfig = { ... }` 에서 아래 네 줄을 메모장에 복사해 둡니다.
   ```js
   apiKey: "AIza....",
   authDomain: "cheongpung-xxxx.firebaseapp.com",
   projectId: "cheongpung-xxxx",
   appId: "1:1234567890:web:abcd...",
   ```
   (`storageBucket`, `messagingSenderId` 는 안 써도 됩니다)
4. 나중에 다시 보려면: 왼쪽 위 **톱니바퀴 → 프로젝트 설정 → 일반 → 내 앱**

## 3. Authentication 에서 이메일/비밀번호 켜기
1. 왼쪽 메뉴 **빌드(Build) → Authentication → 시작하기**
2. **Sign-in method(로그인 방법)** 탭 → **이메일/비밀번호**
3. 첫 번째 스위치 **사용 설정** 켜기 (아래 "이메일 링크"는 끈 채로) → **저장**

> 게임은 아이디를 `아이디@cheongpung.local` 같은 가짜 이메일로 바꿔 쓰므로, 이메일 인증 메일은 가지 않습니다.

## 4. Firestore 만들기
1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**
2. 버전을 고르라고 하면 **Standard**
3. 위치: **asia-northeast3 (서울)** — 한 번 정하면 못 바꿉니다
4. **프로덕션 모드로 시작** → 만들기

## 5. 보안 규칙 붙여넣기
1. Firestore Database → **규칙(Rules)** 탭
2. 안에 있는 글을 **전부 지우고**, 저장소의 [`firestore.rules`](firestore.rules) 내용을 통째로 붙여넣기
3. **게시(Publish)**

이 규칙은 "로그인한 사람은 자기 저장(`users/자기uid/slots/0~3`)만 읽고 쓸 수 있고, 나머지는 전부 막기" 입니다.
설정값(apiKey)은 웹에 공개되는 값이라 저장소에 있어도 되고, 남의 저장을 못 보게 지키는 건 이 규칙입니다.

## 6. 승인된 도메인에 wkm207.github.io 추가
1. **Authentication → 설정(Settings) 탭 → 승인된 도메인**
2. **도메인 추가** → `wkm207.github.io` → 추가
   (`localhost` 는 처음부터 들어 있습니다)

## 7. 받은 설정값 넣기
[`src/firebase-config.js`](src/firebase-config.js) 의 빈 칸 네 개를 2단계에서 복사한 값으로 채웁니다.

```js
export const FIREBASE_CONFIG = {
  apiKey: 'AIza....',
  authDomain: 'cheongpung-xxxx.firebaseapp.com',
  projectId: 'cheongpung-xxxx',
  appId: '1:1234567890:web:abcd...',
};
```

방법은 둘 중 편한 쪽으로:
- **Claude 에게 맡기기**: 네 줄을 그대로 붙여넣어 주면 넣고 올려 드립니다.
- **직접 하기**: GitHub 의 `wkm207/cheongpung` → `src/firebase-config.js` → 연필(편집) → 네 칸 채우기 → **Commit changes**.
  1~2분 뒤 GitHub Pages 에 반영됩니다.

## 8. 써 보기
1. https://wkm207.github.io/cheongpung/ 접속(인터넷 연결 상태) → 로그인 화면이 나오면 성공
2. 원래 캐릭터가 있던 기기에서 먼저 **처음이에요(가입)** → 아이디(영문·숫자 4~16자)·비밀번호(6자 이상) → 그 기기의 캐릭터가 서버로 올라갑니다
3. 다른 기기에서 같은 아이디로 **로그인** → 캐릭터를 받아 옵니다
4. 같은 칸에 두 기기가 서로 다른 캐릭터(또는 따로 진행한 저장)를 갖고 있으면 **"어느 저장을 쓸까요?"** 화면이 나옵니다. 더 최근 쪽에 표시가 붙고, 고르지 않은 쪽은 사라집니다

## 이렇게 움직입니다
- 게임은 15초마다 기기에 저장하고, 로그인해 있으면 **45초에 한 번**, 그리고 **타이틀로 나가거나 앱을 닫을 때** 서버에도 올립니다.
- **비행기 모드**에서도 그대로 할 수 있습니다. 서버에 못 올린 저장은 인터넷이 다시 되면 올라갑니다.
- 하던 캐릭터를 다른 기기에서 따로 진행했다면, 덮어쓰지 않고 타이틀에서 고르게 합니다.
- "로그인 없이 이 기기에서만 하기"를 고르면 예전처럼 기기에만 저장합니다. 타이틀의 **로그인** 버튼으로 언제든 바꿀 수 있습니다.
- 로그아웃해도 그 기기의 저장은 남아 있습니다.

## 비밀번호를 잊었을 때
이메일이 없는 가짜 주소라 비밀번호 찾기 메일을 보낼 수 없습니다.
- 기기 저장은 남아 있으니, **새 아이디로 가입**하면 그 기기의 캐릭터가 새 아이디로 올라갑니다.
- 옛 아이디는 Firebase 콘솔 → Authentication → 사용자에서 `옛아이디@cheongpung.local` 을 삭제하면 됩니다.
- 그래서 가끔 `메뉴 → 백업 내보내기`도 해 두면 좋습니다.

## 개발 메모
- Firebase SDK 는 `https://www.gstatic.com/firebasejs/12.6.0/` 에서 로그인·저장할 때만 불러옵니다(`src/core/cloud.js`). 못 불러오면 게임은 오프라인으로 돕니다.
- 서비스 워커(`sw.js`)는 다른 주소(gstatic·googleapis) 요청에는 손대지 않습니다.
- 서버 문서: `users/{uid}/slots/{0~3}` = `{ text(저장 글자 그대로), savedAt, name, level, cls, updatedAt }`. 받을 때 `validatePlayer` 로 다시 검증합니다.
