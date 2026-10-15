// 한국어 조사: 받침 유무에 따라 을/를, 이/가, 은/는, 과/와, (으)로를 골라 붙인다.
// 숫자를 읽었을 때의 받침: 영(ㅇ) 일(ㄹ) 이 삼(ㅁ) 사 오 육(ㄱ) 칠(ㄹ) 팔(ㄹ) 구
const DIGIT_FINAL = [21, 8, 0, 16, 0, 0, 1, 8, 8, 0];

function finalConsonant(word) {
  const text = String(word);
  const last = text[text.length - 1];
  if (last >= '0' && last <= '9') return DIGIT_FINAL[Number(last)];
  const code = text.charCodeAt(text.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return -1; // 한글·숫자가 아니면 받침 없음으로 본다
  return (code - 0xac00) % 28;
}

/** josa('약초', '을/를') → '약초를', josa('청풍촌', '으로/로') → '청풍촌으로' */
export function josa(word, pair) {
  const [withBatchim, without] = pair.split('/');
  const fc = finalConsonant(word);
  if (pair === '으로/로') return word + (fc > 0 && fc !== 8 ? withBatchim : without); // ㄹ 받침은 '로'
  return word + (fc > 0 ? withBatchim : without);
}
