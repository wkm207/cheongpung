// 지금 맵의 바닥 그림과 나무 자리를 기억해 둔다(지도 창의 [지금 있는 곳]에서 줄여 보여 준다)
let shot = null;

export function setMapShot(mapId, canvas, trees) {
  shot = { mapId, canvas, trees };
}

/** 이 맵의 그림(아직 안 그렸거나 다른 맵이면 null) */
export const mapShot = (mapId) => (shot?.mapId === mapId ? shot : null);
