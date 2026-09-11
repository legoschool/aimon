/* ===========================================================
   AI몬스터 — 픽셀 렌더러

   글자 격자를 그대로 픽셀로 찍는다. 이미지 파일이 하나도 없으므로
   file:// 로 열어도 그림이 다 나온다 (교실 오프라인 환경 대응).

   확대는 반드시 정수배로만 한다. 소수배로 늘리면 픽셀이 뭉개진다.
   =========================================================== */

/* 캔버스를 픽셀 그림용으로 맞춘다.

   width/height 속성(그림을 그리는 실제 픽셀 수)만 정하고,
   화면에 몇 px 로 보일지는 CSS 에 맡긴다.
   여기서 style.width 를 박아 버리면 CSS 의 width:100% 를 덮어써서
   좁은 화면에서 캔버스가 줄어들지 않는다. */
function setupCanvas(canvas, logicalW, logicalH, scale) {
  canvas.width = logicalW * scale;
  canvas.height = logicalH * scale;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/* -----------------------------------------------------------
   스프라이트 한 장 그리기
     grid    : ["....k...", ...] 형태의 글자 격자
     palette : { k:"#181818", ... }  "transparent" 는 건너뛴다
     px, py  : 왼쪽 위 모서리 (실제 캔버스 좌표)
     scale   : 픽셀 하나를 몇 배로 그릴지 (정수)
     flip    : true 면 좌우 반전
   ----------------------------------------------------------- */
function drawSprite(ctx, grid, palette, px, py, scale, flip) {
  const h = grid.length;
  const w = grid[0].length;
  for (let row = 0; row < h; row++) {
    const line = grid[row];
    for (let col = 0; col < w; col++) {
      const ch = line[col];
      const color = palette[ch];
      if (!color || color === "transparent") continue;
      const cx = flip ? w - 1 - col : col;
      ctx.fillStyle = color;
      ctx.fillRect(px + cx * scale, py + row * scale, scale, scale);
    }
  }
}

/* 스프라이트를 통째로 한 색으로 칠한다 (포획될 때 하얗게 빨려 들어가는 연출) */
function drawSpriteSilhouette(ctx, grid, px, py, scale, color, flip) {
  const h = grid.length;
  const w = grid[0].length;
  ctx.fillStyle = color;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      if (grid[row][col] === ".") continue;
      const cx = flip ? w - 1 - col : col;
      ctx.fillRect(px + cx * scale, py + row * scale, scale, scale);
    }
  }
}

/* -----------------------------------------------------------
   색 섞기 — 어두운 색에서 밝은 색으로 서서히 넘어갈 때 쓴다
   t = 0 이면 첫 색, 1 이면 둘째 색.
   ----------------------------------------------------------- */
function mixHex(a, b, t) {
  if (t <= 0 || a === b) return a;
  if (t >= 1) return b;
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  return "rgb(" + Math.round(ar + (br - ar) * t) + "," +
                  Math.round(ag + (bg - ag) * t) + "," +
                  Math.round(ab + (bb - ab) * t) + ")";
}

/* -----------------------------------------------------------
   맵 타일 한 칸
   단색이면 심심하므로 칸마다 점무늬를 조금 얹는다.
   숲 타일은 점이 속성색이라, 어느 숲인지 색으로 구분된다.
   ----------------------------------------------------------- */
function drawTile(ctx, ch, px, py, size, scale, purity) {
  const dark = TILE_STYLE[ch] || TILE_STYLE["."];
  const pure = PURE_TILE_STYLE[ch] || dark;
  const t = purity || 0;
  const s = size * scale;
  ctx.fillStyle = mixHex(dark.base, pure.base, t);
  ctx.fillRect(px, py, s, s);

  ctx.fillStyle = mixHex(dark.dot, pure.dot, t);
  const p = scale; // 점 하나 크기

  if (ch === "#") {
    // 나무 — 둥근 덩어리
    ctx.fillRect(px + 3 * scale, py + 2 * scale, 10 * scale, 9 * scale);
    ctx.fillRect(px + 2 * scale, py + 4 * scale, 12 * scale, 5 * scale);
    ctx.fillRect(px + 6 * scale, py + 11 * scale, 4 * scale, 4 * scale);
  } else if (ch === "C" || ch === "P" || ch === "D") {
    // 데이터숲 — 풀포기가 속성색으로 돋아 있다
    ctx.fillRect(px + 2 * scale, py + 9 * scale, p, 4 * scale);
    ctx.fillRect(px + 3 * scale, py + 7 * scale, p, 6 * scale);
    ctx.fillRect(px + 4 * scale, py + 9 * scale, p, 4 * scale);
    ctx.fillRect(px + 9 * scale, py + 8 * scale, p, 5 * scale);
    ctx.fillRect(px + 10 * scale, py + 6 * scale, p, 7 * scale);
    ctx.fillRect(px + 11 * scale, py + 8 * scale, p, 5 * scale);
    ctx.fillRect(px + 6 * scale, py + 3 * scale, p, 4 * scale);
    ctx.fillRect(px + 13 * scale, py + 2 * scale, p, 4 * scale);
  } else if (ch === "~") {
    // 물결
    ctx.fillRect(px + 2 * scale, py + 4 * scale, 5 * scale, p);
    ctx.fillRect(px + 9 * scale, py + 8 * scale, 5 * scale, p);
    ctx.fillRect(px + 4 * scale, py + 12 * scale, 5 * scale, p);
  } else if (ch === "L") {
    // 연구소 벽돌
    ctx.fillRect(px, py + 5 * scale, s, p);
    ctx.fillRect(px, py + 11 * scale, s, p);
    ctx.fillRect(px + 7 * scale, py, p, 5 * scale);
    ctx.fillRect(px + 3 * scale, py + 6 * scale, p, 5 * scale);
    ctx.fillRect(px + 12 * scale, py + 6 * scale, p, 5 * scale);
  } else if (ch === "=") {
    // 길 — 자갈 몇 알
    ctx.fillRect(px + 3 * scale, py + 5 * scale, p, p);
    ctx.fillRect(px + 11 * scale, py + 3 * scale, p, p);
    ctx.fillRect(px + 7 * scale, py + 12 * scale, p, p);
  } else {
    // 땅 — 풀 한 포기
    ctx.fillRect(px + 5 * scale, py + 6 * scale, p, 2 * scale);
    ctx.fillRect(px + 12 * scale, py + 11 * scale, p, 2 * scale);
  }
}

/* 맵 전체 */
function drawMap(ctx, tileSize, scale, purityAt) {
  // purityAt(x, y) 가 없으면 마을 정화 여부를 보고 통째로 정한다.
  // 엔딩에서는 빛이 한복판에서부터 퍼지도록 칸마다 다른 값을 넘긴다.
  const whole = purityAt ? null : villageIsPure() ? 1 : 0;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = purityAt ? purityAt(x, y) : whole;
      drawTile(ctx, tileAt(x, y), x * tileSize * scale, y * tileSize * scale, tileSize, scale, t);
    }
  }
}

/* -----------------------------------------------------------
   스프라이트를 <img> 로 뽑아낸다 (도감 칸에 붙일 때 사용)
   ----------------------------------------------------------- */
function spriteToDataURL(grid, palette, scale) {
  const c = document.createElement("canvas");
  c.width = grid[0].length * scale;
  c.height = grid.length * scale;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  drawSprite(g, grid, palette, 0, 0, scale, false);
  return c.toDataURL();
}
