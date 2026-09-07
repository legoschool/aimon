/* ===========================================================
   AI몬스터 — 주인공 스프라이트

   16×16 격자. 몬스터와 같은 방식이지만 팔레트가 다르다.
     .  투명    k  윤곽/머리    l  얼굴
     g  옷      a  모자         w  흰색

   방향 3종 × 걷기 2컷.
   왼쪽은 오른쪽(side)을 좌우로 뒤집어 쓴다.
   =========================================================== */

const PLAYER_PALETTE = {
  ".": "transparent",
  k: "#181818", // 윤곽·머리카락
  l: "#e8c9a0", // 얼굴
  g: "#4a7ab5", // 옷
  a: "#d94f4f", // 모자
  w: "#f8f8f0",
};

const PLAYER_SPRITES = {
  down: [
    [
      "................",
      ".....kkkkkk.....",
      "....kaaaaaak....",
      "....kaaaaaak....",
      "....kkkkkkkk....",
      "....kllllllk....",
      "....klkllklk....",
      "....kllllllk....",
      ".....kllllk.....",
      "....kgggggggk...",
      "...kgggggggggk..",
      "...kglgggggglk..",
      "...kgggggggggk..",
      "....kgggggggk...",
      "....kkk..kkk....",
      "....kk....kk....",
    ],
    [
      "................",
      ".....kkkkkk.....",
      "....kaaaaaak....",
      "....kaaaaaak....",
      "....kkkkkkkk....",
      "....kllllllk....",
      "....klkllklk....",
      "....kllllllk....",
      ".....kllllk.....",
      "....kgggggggk...",
      "...kgggggggggk..",
      "...kglgggggglk..",
      "...kgggggggggk..",
      "....kgggggggk...",
      "....kkkk.kk.....",
      "...kkk....kk....",
    ],
  ],

  up: [
    [
      "................",
      ".....kkkkkk.....",
      "....kaaaaaak....",
      "....kaaaaaak....",
      "....kkkkkkkk....",
      "....kkkkkkkk....",
      "....kkkkkkkk....",
      "....kkkkkkkk....",
      ".....kkkkkk.....",
      "....kgggggggk...",
      "...kgggggggggk..",
      "...kglgggggglk..",
      "...kgggggggggk..",
      "....kgggggggk...",
      "....kkk..kkk....",
      "....kk....kk....",
    ],
    [
      "................",
      ".....kkkkkk.....",
      "....kaaaaaak....",
      "....kaaaaaak....",
      "....kkkkkkkk....",
      "....kkkkkkkk....",
      "....kkkkkkkk....",
      "....kkkkkkkk....",
      ".....kkkkkk.....",
      "....kgggggggk...",
      "...kgggggggggk..",
      "...kglgggggglk..",
      "...kgggggggggk..",
      "....kgggggggk...",
      "....kkkk.kk.....",
      "...kkk....kk....",
    ],
  ],

  side: [
    [
      "................",
      ".....kkkkk......",
      "....kaaaaak.....",
      "....kaaaaaak....",
      "....kkkkkkk.....",
      "....kllllkk.....",
      "....klkllk......",
      "....kllllk......",
      ".....kllkk......",
      "....kgggggk.....",
      "...kggggggk.....",
      "...kglggggk.....",
      "...kggggggk.....",
      "....kggggk......",
      "....kkk.kk......",
      "...kkk...kk.....",
    ],
    [
      "................",
      ".....kkkkk......",
      "....kaaaaak.....",
      "....kaaaaaak....",
      "....kkkkkkk.....",
      "....kllllkk.....",
      "....klkllk......",
      "....kllllk......",
      ".....kllkk......",
      "....kgggggk.....",
      "...kggggggk.....",
      "...kglggggk.....",
      "...kggggggk.....",
      "....kggggk......",
      "....kkkkkk......",
      "....kk..kk......",
    ],
  ],
};

/* 방향별로 쓸 스프라이트와 좌우반전 여부 */
function playerSprite(dir, frame) {
  const f = frame % 2;
  if (dir === "up") return { grid: PLAYER_SPRITES.up[f], flip: false };
  if (dir === "left") return { grid: PLAYER_SPRITES.side[f], flip: true };
  if (dir === "right") return { grid: PLAYER_SPRITES.side[f], flip: false };
  return { grid: PLAYER_SPRITES.down[f], flip: false };
}
