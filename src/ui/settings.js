// 기기별 설정(조작 방식·효과음). 저장소를 못 쓰면 기본값으로 동작한다.
const KEY = 'cheongpung-settings';
const DEFAULTS = { control: 'dpad', sound: true, music: true, minimap: true, graphics: 'photo' };

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      control: ['dpad', 'joystick'].includes(raw.control) ? raw.control : DEFAULTS.control,
      sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULTS.sound,
      minimap: typeof raw.minimap === 'boolean' ? raw.minimap : DEFAULTS.minimap,
      music: typeof raw.music === 'boolean' ? raw.music : DEFAULTS.music,
      // 그래픽은 손그림 하나만 쓴다(예전 도트·매끈한 그림은 고르지 않는다)
      graphics: 'photo',
    };
  } catch {
    return { ...DEFAULTS };
  }
}

let current = read();

export const getSettings = () => current;

export function updateSettings(patch) {
  current = { ...current, ...patch, gv: 2 };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // 저장 못 해도 이번 실행 동안은 적용된다
  }
  return current;
}
