// Firebase 설정값: Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹)의 firebaseConfig 를 그대로 옮겨 적는다.
// 이 값들은 웹 앱에 공개되는 키라 저장소에 있어도 괜찮다. 남의 저장을 못 보게 막는 것은 firestore.rules 의 보안 규칙이다.
// 값이 비어 있으면 로그인 버튼이 숨겨지고, 지금처럼 이 기기에만 저장한다. (설정 방법: FIREBASE.md)
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAoSEho72SMqBG5rr7glJVcdZgVj1kzjA8',
  authDomain: 'country-of-wind.firebaseapp.com',
  projectId: 'country-of-wind',
  appId: '1:10854125304:web:a1a2ae62fb866e4e18f50d',
};
