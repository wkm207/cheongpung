// 몬스터 그림(32×32 논리 크기, 대부분 왼쪽을 본다): 곡선·그라데이션으로 그린 오리지널 디자인.
// 그림 틀(art) 9가지에 몬스터마다 다른 색(pal)을 입혀 쓴다. 빛은 왼쪽 위에서.
import { tone, lin, ellipse, shape, line } from './characters.js';

/** 왼쪽 위가 밝고 오른쪽 아래가 어두운 둥근 몸통 */
function blob(ctx, x, y, rx, ry, color, k, lw = 0.8) {
  const g = ctx.createRadialGradient(x - rx * 0.4, y - ry * 0.5, 0.5, x, y, Math.max(rx, ry) * 1.15);
  g.addColorStop(0, tone(color, 0.35));
  g.addColorStop(0.6, color);
  g.addColorStop(1, tone(color, -0.3));
  ellipse(ctx, x, y, rx, ry, g, k, lw);
}

function eye(ctx, x, y, color, r = 1.3) {
  ellipse(ctx, x, y, r, r * 1.15, color, null);
  ellipse(ctx, x, y + 0.2, r * 0.55, r * 0.6, '#111111', null);
  ellipse(ctx, x - r * 0.35, y - r * 0.4, r * 0.35, r * 0.35, '#ffffff', null);
}

function leg(ctx, x, top, bottom, color, k, w = 2.4) {
  shape(ctx, [[x - w / 2, top], [x + w / 2, top], [x + w / 2 - 0.2, bottom], [x - w / 2 + 0.2, bottom]], lin(ctx, x - w, 0, x + w, 0, [[0, tone(color, 0.15)], [1, tone(color, -0.25)]]), k, 0.6);
  ellipse(ctx, x, bottom, w / 2 + 0.4, 0.9, tone(color, -0.35), k, 0.5);
}

export const BEAST_ART = {
  // 다람쥐: 크게 말린 꼬리
  squirrel(ctx, p) {
    shape(ctx, [[17, 25], [21, 12, 15, 17], [25, 3, 18, 5], [29, 9, 29, 3], [24, 14, 30, 13], [21, 25, 22, 21]], lin(ctx, 16, 3, 30, 25, [[0, tone(p.T, 0.35)], [1, tone(p.T, -0.25)]]), p.k);
    line(ctx, 19, 22, 24, 9, 'rgba(255,255,255,0.25)', 1);
    leg(ctx, 9.5, 24, 28, p.b, p.k, 2.2);
    leg(ctx, 15, 24, 28, p.b, p.k, 2.2);
    blob(ctx, 12.5, 20.5, 6.8, 6, p.b, p.k);
    ellipse(ctx, 10.5, 21.5, 3, 4, tone(p.w, 0.1), null);
    blob(ctx, 8, 13, 5.2, 4.6, p.b, p.k);
    shape(ctx, [[8.5, 9.5], [10.5, 5], [12, 10]], tone(p.b, -0.1), p.k, 0.6);
    eye(ctx, 6.4, 12.6, '#ffffff', 1.1);
    ellipse(ctx, 3.2, 14.2, 0.9, 0.8, p.p, null);
    ellipse(ctx, 6.5, 22, 1.6, 1.2, '#a8743f', p.k, 0.5); // 도토리
  },
  // 토끼: 긴 귀와 동그란 꼬리
  rabbit(ctx, p) {
    for (const [x, a] of [[8, -0.25], [11.5, 0.1]]) {
      ctx.save();
      ctx.translate(x, 9);
      ctx.rotate(a);
      ellipse(ctx, 0, -4.5, 1.9, 5, tone(p.w, -0.05), p.k, 0.7);
      ellipse(ctx, 0, -4.2, 0.9, 3.6, p.p, null);
      ctx.restore();
    }
    blob(ctx, 25.5, 19.5, 2.6, 2.4, p.w, p.k);
    leg(ctx, 12, 24, 28, p.w, p.k, 2.6);
    leg(ctx, 20, 24, 28, p.w, p.k, 3.2);
    blob(ctx, 17, 20.5, 9, 6.3, p.w, p.k);
    blob(ctx, 9, 13.5, 5.4, 4.8, p.w, p.k);
    eye(ctx, 6.6, 13, p.e, 1.2);
    ellipse(ctx, 4, 15.5, 0.8, 0.6, p.p, null);
    ellipse(ctx, 9, 16, 1.4, 0.8, 'rgba(255, 140, 160, 0.4)', null);
  },
  // 여우·늑대·호랑이 등 네발짐승
  canine(ctx, p) {
    shape(ctx, [[24, 18], [27, 9, 29, 15], [30, 5, 29, 7], [31, 10, 32, 6], [27, 20, 31, 17]], lin(ctx, 24, 5, 31, 20, [[0, p.t], [0.35, tone(p.o, 0.1)], [1, tone(p.o, -0.2)]]), p.k);
    leg(ctx, 11, 22, 28.5, tone(p.o, -0.1), p.k);
    leg(ctx, 21.5, 22, 28.5, tone(p.o, -0.1), p.k);
    blob(ctx, 17, 19.5, 9, 5.6, p.o, p.k);
    ellipse(ctx, 15, 22.3, 6, 2.4, tone(p.l, 0), null);
    leg(ctx, 14, 22, 29, p.o, p.k);
    leg(ctx, 24, 22, 29, p.o, p.k);
    shape(ctx, [[4.5, 10], [5.5, 3.5], [8.5, 8.5]], tone(p.o, -0.1), p.k, 0.6);
    shape(ctx, [[8.5, 9], [10.5, 3], [12, 9.5]], tone(p.o, -0.05), p.k, 0.6);
    ellipse(ctx, 9.7, 7.6, 0.7, 1.6, tone(p.l, -0.1), null);
    blob(ctx, 8.5, 13, 5.3, 4.6, p.o, p.k);
    shape(ctx, [[5, 12.5], [0.8, 15.5, 1.5, 13], [5.5, 17.5, 2, 17.5]], lin(ctx, 0, 13, 6, 18, [[0, p.l], [1, tone(p.l, -0.15)]]), p.k, 0.6);
    ellipse(ctx, 1.2, 15, 1, 0.8, p.n, null);
    eye(ctx, 6.6, 12, p.e, 1.1);
    ellipse(ctx, 9.5, 16.5, 3, 1.6, p.l, null);
  },
  // 도깨비·장수·물고기 병사 등 두발 인간형(정면)
  goblin(ctx, p) {
    // 몽둥이
    shape(ctx, [[25, 26], [26.5, 26], [29.5, 7], [26, 6, 27.5, 4], [24, 8]], lin(ctx, 24, 4, 30, 26, [[0, tone(p.c, 0.25)], [1, tone(p.c, -0.3)]]), p.k, 0.6);
    for (const [x, y] of [[26, 8], [28, 10], [26.5, 12]]) ellipse(ctx, x, y, 0.6, 0.6, '#d5dbdb', p.k, 0.3);
    leg(ctx, 12.5, 24, 30, p.g, p.k, 2.8);
    leg(ctx, 19.5, 24, 30, p.g, p.k, 2.8);
    blob(ctx, 16, 20, 7, 6.2, p.g, p.k);
    shape(ctx, [[9.5, 21], [22.5, 21], [21, 27], [11, 27]], lin(ctx, 10, 21, 22, 27, [[0, tone(p.f, 0.2)], [1, tone(p.f, -0.25)]]), p.k, 0.6);
    for (const x of [12.5, 16, 19.5]) ellipse(ctx, x, 24.5, 1, 1, p.s, null);
    shape(ctx, [[9.5, 16], [5, 23, 6, 19], [7, 24], [10.5, 19.5]], tone(p.g, -0.05), p.k, 0.6);
    shape(ctx, [[22.5, 16], [25.5, 24.5, 26, 19], [23.5, 25], [21.5, 19.5]], tone(p.g, -0.15), p.k, 0.6);
    shape(ctx, [[14.5, 4.5], [16, 0.5], [17.5, 4.5]], lin(ctx, 14, 0, 18, 5, [[0, tone(p.y, 0.3)], [1, tone(p.y, -0.2)]]), p.k, 0.6);
    blob(ctx, 16, 10, 6.2, 5.6, p.g, p.k);
    eye(ctx, 13.5, 9.5, p.e === '#fff' ? '#fffbe6' : p.e, 1.4);
    eye(ctx, 18.5, 9.5, p.e === '#fff' ? '#fffbe6' : p.e, 1.4);
    shape(ctx, [[13, 13], [19, 13], [16, 15.2, 18.5, 15]], '#3a1a1a', null);
    shape(ctx, [[13.8, 13], [14.6, 13], [14.2, 14.3]], p.w, null);
    shape(ctx, [[17.4, 13], [18.2, 13], [17.8, 14.3]], p.w, null);
  },
  // 멧돼지·소·거북 장수 등 덩치 큰 네발짐승
  boar(ctx, p) {
    leg(ctx, 10, 21, 28, tone(p.b, -0.15), p.k, 3);
    leg(ctx, 23, 21, 28, tone(p.b, -0.15), p.k, 3);
    blob(ctx, 18, 16.5, 11.5, 7.5, p.b, p.k);
    // 등 갈기
    shape(ctx, [[9, 10.5], [12, 7], [15, 9.5], [18, 6.5], [21, 9.5], [24, 7.5], [26, 11], [18, 11.5, 22, 12]], tone(p.b, -0.35), null);
    leg(ctx, 13.5, 21, 29, p.b, p.k, 3);
    leg(ctx, 26, 20, 29, p.b, p.k, 3);
    shape(ctx, [[9, 6.5], [11.5, 3.5], [12.5, 8]], tone(p.b, -0.2), p.k, 0.6);
    blob(ctx, 7, 16, 5.2, 5, p.b, p.k);
    ellipse(ctx, 2.6, 17.2, 2.5, 2.2, lin(ctx, 0, 15, 5, 19, [[0, tone(p.n, 0.2)], [1, tone(p.n, -0.2)]]), p.k, 0.6);
    ellipse(ctx, 1.9, 17, 0.5, 0.7, '#3a1a1a', null);
    ellipse(ctx, 3.3, 17, 0.5, 0.7, '#3a1a1a', null);
    shape(ctx, [[5, 19], [2, 15.5, 2.5, 19], [5.8, 18.2]], p.w, p.k, 0.5);
    eye(ctx, 6.2, 13.4, p.e, 1.1);
  },
  // 유령·정령: 아래가 물결치는 반투명 몸
  ghost(ctx, p) {
    const g = lin(ctx, 6, 4, 26, 30, [[0, tone(p.b, 0.4)], [0.6, p.b], [1, tone(p.b, -0.2)]]);
    shape(ctx, [[16, 3], [27, 15, 27, 4], [26, 28], [23, 26], [20.5, 29], [17.5, 26.5], [14.5, 29], [11.5, 26.5], [8.5, 29], [6, 26], [5, 15], [16, 3, 5, 4]], g, p.k, 0.8);
    shape(ctx, [[16, 3.5], [24.5, 12, 24.5, 4], [16, 9], [7.5, 12], [16, 3.5, 7.5, 4]], p.h, null);
    ellipse(ctx, 16, 13, 6.2, 5.6, lin(ctx, 10, 8, 22, 18, [[0, '#ffffff'], [1, p.w]]), p.k, 0.5);
    ellipse(ctx, 13.6, 12.6, 1.2, 1.6, p.e, null);
    ellipse(ctx, 18.4, 12.6, 1.2, 1.6, p.e, null);
    ellipse(ctx, 13.2, 12, 0.4, 0.4, '#ffffff', null);
    ellipse(ctx, 18, 12, 0.4, 0.4, '#ffffff', null);
    ellipse(ctx, 16, 16, 1.1, 0.8, p.m, null);
    ctx.globalAlpha = 0.3;
    ellipse(ctx, 11, 9, 2.5, 1.2, '#ffffff', null);
    ctx.globalAlpha = 1;
  },
  // 뱀·이무기·용: 똬리 튼 몸, 뿔과 수염
  serpent(ctx, p) {
    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(8, 9);
      ctx.bezierCurveTo(4, 18, 12, 28, 20, 25);
      ctx.bezierCurveTo(28, 22, 28, 12, 22, 12);
      ctx.bezierCurveTo(17, 12, 18, 20, 22.5, 19);
    };
    ctx.lineCap = 'round';
    bodyPath();
    ctx.strokeStyle = p.k;
    ctx.lineWidth = 7.4;
    ctx.stroke();
    bodyPath();
    ctx.strokeStyle = lin(ctx, 4, 9, 28, 28, [[0, tone(p.g, 0.3)], [1, tone(p.g, -0.25)]]);
    ctx.lineWidth = 5.8;
    ctx.stroke();
    bodyPath();
    ctx.strokeStyle = p.y;
    ctx.lineWidth = 2;
    ctx.setLineDash([1.6, 1.2]);
    ctx.stroke();
    ctx.setLineDash([]);
    // 등지느러미 가시
    for (const [x, y] of [[23, 9.5], [27, 13], [27.5, 19]]) shape(ctx, [[x - 1.2, y + 1], [x, y - 1.5], [x + 1.2, y + 1]], tone(p.g, -0.3), null);
    shape(ctx, [[6, 4.5], [4, 0.5], [7.5, 3.5]], tone(p.y, -0.1), p.k, 0.5);
    shape(ctx, [[9, 4], [10, 0], [10.5, 4]], tone(p.y, -0.1), p.k, 0.5);
    blob(ctx, 7, 7.5, 5, 3.8, p.g, p.k);
    shape(ctx, [[3, 7], [0.5, 9, 1, 7], [3.5, 10]], tone(p.g, -0.1), p.k, 0.5);
    line(ctx, 2, 9.5, -0.5, 13, tone(p.y, 0.2), 0.5);
    line(ctx, 3.5, 10, 2.5, 14, tone(p.y, 0.2), 0.5);
    eye(ctx, 6, 6.4, p.e, 1.1);
    line(ctx, 1.5, 9, 5, 9.5, p.n, 0.6);
  },
  // 불새: 날개를 활짝 편 정면 모습
  bird(ctx, p) {
    for (const s of [-1, 1]) {
      const x = (v) => 16 + s * v;
      shape(ctx, [[x(3), 10], [x(15.5), 3.5, x(10), 2], [x(15), 10], [x(13), 13.5], [x(11), 13], [x(8.5), 17], [x(3.5), 17]], lin(ctx, x(3), 8, x(15), 16, [[0, p.r], [0.6, tone(p.o, 0)], [1, tone(p.y, 0.1)]]), p.k, 0.6);
      line(ctx, x(5), 12, x(13), 6, 'rgba(255, 240, 180, 0.5)', 0.5);
    }
    shape(ctx, [[13, 22], [10, 31, 9, 27], [16, 27.5], [22, 31], [19, 22, 23, 27]], lin(ctx, 16, 22, 16, 31, [[0, p.r], [1, p.y]]), p.k, 0.6);
    line(ctx, 14.5, 26, 14, 30.5, p.y, 0.8);
    line(ctx, 17.5, 26, 18, 30.5, p.y, 0.8);
    blob(ctx, 16, 16, 4.8, 7, p.r, p.k);
    ellipse(ctx, 16, 18, 2.6, 4, tone(p.o, 0.2), null);
    shape(ctx, [[14.5, 4.5], [13.5, 0.5], [16, 3.5], [18, 0], [17.5, 4.5]], p.y, p.k, 0.5);
    blob(ctx, 16, 7, 3.4, 3.2, p.r, p.k);
    shape(ctx, [[15, 8.5], [17, 8.5], [16, 11]], p.y, p.k, 0.4);
    eye(ctx, 14.6, 6.8, '#fff3c0', 0.8);
    eye(ctx, 17.4, 6.8, '#fff3c0', 0.8);
  },
  // 쥐: 둥근 귀, 긴 맨꼬리. 쥐대왕은 작은 왕관(c)을 쓴다
  rat(ctx, p) {
    ctx.beginPath();
    ctx.moveTo(24, 22);
    ctx.bezierCurveTo(30, 22, 31, 14, 27, 12);
    ctx.strokeStyle = p.k;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = p.p;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    leg(ctx, 12, 24, 28, p.b, p.k, 2);
    leg(ctx, 20, 24, 28, p.b, p.k, 2);
    blob(ctx, 17, 20.5, 8.5, 6, p.b, p.k);
    ellipse(ctx, 15, 23, 5, 2.6, p.w, null);
    ellipse(ctx, 8.5, 11.5, 3, 3, p.b, p.k, 0.6);
    ellipse(ctx, 8.5, 11.5, 1.7, 1.7, p.p, null);
    blob(ctx, 8, 16.5, 5.2, 4.4, p.b, p.k);
    shape(ctx, [[4, 15], [0.6, 18.2, 1.5, 16], [4.5, 19.5]], p.b, p.k, 0.6);
    ellipse(ctx, 1.2, 18, 1, 0.8, p.p, null);
    eye(ctx, 6, 15.4, '#ffffff', 1);
    line(ctx, 2.5, 18.5, -0.5, 18, 'rgba(40,30,30,0.6)', 0.3);
    line(ctx, 2.5, 19.2, -0.5, 20, 'rgba(40,30,30,0.6)', 0.3);
    if (p.c) shape(ctx, [[5, 12.5], [5, 9.5], [6.6, 11], [8, 8.6], [9.4, 11], [11, 9.5], [11, 12.5]], p.c, p.k, 0.5);
  },
  // 박쥐: 날개를 펼친 정면 모습
  bat(ctx, p) {
    for (const s of [-1, 1]) {
      const x = (v) => 16 + s * v;
      shape(ctx, [[x(3), 12], [x(9), 6, x(5), 6], [x(15), 9, x(13), 5], [x(13), 13], [x(15.5), 17], [x(11), 16], [x(9), 19], [x(6), 17], [x(3), 18]], lin(ctx, x(2), 8, x(15), 18, [[0, p.b], [1, p.w]]), p.k, 0.6);
      line(ctx, x(4), 12.5, x(13), 7, 'rgba(0,0,0,0.3)', 0.4);
      line(ctx, x(4), 13.5, x(11), 15.5, 'rgba(0,0,0,0.3)', 0.4);
    }
    blob(ctx, 16, 15, 4, 5, p.b, p.k);
    shape(ctx, [[13.2, 11], [12.6, 6.5], [15, 9.5]], p.b, p.k, 0.5);
    shape(ctx, [[18.8, 11], [19.4, 6.5], [17, 9.5]], p.b, p.k, 0.5);
    eye(ctx, 14.5, 13.5, p.e, 0.9);
    eye(ctx, 17.5, 13.5, p.e, 0.9);
    shape(ctx, [[15, 16.5], [15.5, 18], [16, 16.5], [16.5, 18], [17, 16.5]], '#ffffff', null);
  },
  // 해골: 뼈만 남은 병사. w가 'sword'면 칼, 'bow'면 활, h가 있으면 투구
  skeleton(ctx, p) {
    const bone = (x0, y0, x1, y1, w = 1.6) => {
      line(ctx, x0, y0, x1, y1, p.k, w + 1);
      line(ctx, x0, y0, x1, y1, p.b, w);
    };
    bone(13, 22, 12, 29.5);
    bone(19, 22, 20, 29.5);
    ellipse(ctx, 11.6, 30, 2, 0.9, p.b, p.k, 0.5);
    ellipse(ctx, 20.4, 30, 2, 0.9, p.b, p.k, 0.5);
    ellipse(ctx, 16, 21.5, 4.5, 1.6, p.b, p.k, 0.6); // 골반
    bone(16, 12, 16, 21, 1.8); // 척추
    for (const y of [13.5, 15.5, 17.5]) {
      ctx.beginPath();
      ctx.ellipse(16, y, 5 - (y - 13.5) * 0.4, 1.3, 0, Math.PI * 0.05, Math.PI * 0.95);
      ctx.strokeStyle = p.k;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.strokeStyle = p.b;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    bone(11.5, 12.5, 9, 19);
    bone(20.5, 12.5, 23.5, 18.5);
    if (p.w === 'sword') {
      line(ctx, 24, 18.5, 28.5, 4.5, p.k, 2.2);
      line(ctx, 24, 18.5, 28.5, 4.5, p.c, 1.3);
      line(ctx, 22.2, 17, 25.8, 18.4, '#c9a23a', 1.2);
    } else if (p.w === 'bow') {
      ctx.beginPath();
      ctx.arc(23, 16, 7, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.strokeStyle = p.c;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      line(ctx, 23 + 7 * Math.cos(-Math.PI * 0.45), 16 + 7 * Math.sin(-Math.PI * 0.45), 23 + 7 * Math.cos(Math.PI * 0.45), 16 + 7 * Math.sin(Math.PI * 0.45), '#f4f1ea', 0.4);
    } else {
      line(ctx, 24, 19, 26, 9, p.c, 1.4);
    }
    blob(ctx, 16, 7.5, 5.4, 5.2, p.b, p.k);
    shape(ctx, [[12.5, 10.5], [19.5, 10.5], [18.5, 13.5], [13.5, 13.5]], tone(p.b, -0.05), p.k, 0.6);
    for (const x of [14.5, 16, 17.5]) line(ctx, x, 10.8, x, 13.2, p.k, 0.3);
    ellipse(ctx, 13.8, 7.6, 1.6, 1.8, '#1a1410', null);
    ellipse(ctx, 18.2, 7.6, 1.6, 1.8, '#1a1410', null);
    ellipse(ctx, 13.8, 7.8, 0.7, 0.7, p.e, null);
    ellipse(ctx, 18.2, 7.8, 0.7, 0.7, p.e, null);
    shape(ctx, [[15.4, 9.4], [16.6, 9.4], [16, 10.4]], '#1a1410', null);
    if (p.h) {
      ctx.beginPath();
      ctx.ellipse(16, 5.6, 6, 4.4, 0, Math.PI, Math.PI * 2);
      ctx.fillStyle = lin(ctx, 10, 1, 22, 6, [[0, tone(p.h, 0.3)], [1, tone(p.h, -0.3)]]);
      ctx.fill();
      ctx.strokeStyle = p.k;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      shape(ctx, [[15, 1.6], [16, -1.5], [17, 1.6]], p.c, p.k, 0.4);
    }
  },
  // 달걀귀신: 눈코입 없는 하얀 달걀 얼굴에 소복
  egg(ctx, p) {
    const g = lin(ctx, 8, 14, 24, 30, [[0, '#ffffff'], [1, '#d8dce4']]);
    shape(ctx, [[10, 16], [22, 16], [25, 29, 24, 22], [21, 27.5], [18.5, 30], [16, 27.5], [13.5, 30], [11, 27.5], [7, 29, 8, 22]], g, p.k, 0.7);
    line(ctx, 16, 17, 16, 27, 'rgba(120,120,140,0.3)', 0.5);
    blob(ctx, 16, 10, 6.4, 7.6, p.b, p.k);
    ellipse(ctx, 13.6, 7, 2, 2.8, 'rgba(255,255,255,0.7)', null);
    ellipse(ctx, 8.8, 18.5, 1.8, 2.4, '#fbfaf4', p.k, 0.5);
    ellipse(ctx, 23.2, 18.5, 1.8, 2.4, '#fbfaf4', p.k, 0.5);
  },
  // 고양이(마을 NPC): 앉아서 꼬리를 세운 모습
  cat(ctx, p) {
    shape(ctx, [[22, 22], [27, 12, 28, 18], [26, 6, 25, 8], [28.5, 6.5, 28, 5], [29.5, 14, 30, 9], [24, 24, 29, 22]], lin(ctx, 22, 5, 30, 24, [[0, tone(p.o, 0.25)], [1, tone(p.o, -0.2)]]), p.k);
    blob(ctx, 16, 21, 8.5, 6.5, p.o, p.k);
    ellipse(ctx, 13.5, 22.5, 3.5, 4, p.w, null);
    leg(ctx, 10, 24, 28.5, p.o, p.k, 2.4);
    leg(ctx, 15, 24, 28.5, p.o, p.k, 2.4);
    leg(ctx, 21, 24, 28.5, tone(p.o, -0.1), p.k, 2.4);
    shape(ctx, [[3.5, 10], [4, 3.5], [7.5, 7.5]], p.o, p.k, 0.6);
    shape(ctx, [[8.5, 7.5], [12, 4], [12, 10]], p.o, p.k, 0.6);
    ellipse(ctx, 5, 7.3, 0.7, 1.3, p.p, null);
    blob(ctx, 7.5, 12, 5.2, 4.6, p.o, p.k);
    eye(ctx, 5.4, 11.4, '#c8e86a', 1);
    eye(ctx, 9.4, 11.4, '#c8e86a', 1);
    ellipse(ctx, 7.3, 13.8, 0.7, 0.5, p.n, null);
    line(ctx, 3, 14, 0.5, 13.5, 'rgba(60,40,30,0.6)', 0.3);
    line(ctx, 3, 14.8, 0.5, 15.2, 'rgba(60,40,30,0.6)', 0.3);
  },
};
