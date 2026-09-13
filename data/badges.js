/* ===========================================================
   AI몬스터 — 증표(아이템)

   가치볼은 쓰면 사라진다. 증표는 사라지지 않는다.
   한 번 얻으면 도감 옆에 남고, 기록에 실리고, 인쇄된다.

   그림은 몬스터와 같은 방식(글자 격자)이다.
   이모지는 컴퓨터마다 다르게 인쇄돼서 쓰지 않았다.
     .  투명   k  테두리   w  흰색   a  증표색
   =========================================================== */

/* --- 도형 (여러 증표가 나눠 쓴다) --- */

const BADGE_STAR = [
  ".....kk.....",
  "....kaak....",
  "....kaak....",
  "kkkkkaakkkkk",
  "kaaaaaaaaaak",
  ".kaaaaaaaak.",
  "..kaaaaaak..",
  "..kaaaaaak..",
  ".kaak..kaak.",
  ".kak....kak.",
  "kk........kk",
  "............",
];

const BADGE_SHIELD = [
  "kkkkkkkkkkkk",
  "kaaaaaaaaaak",
  "kaaaaaaaaaak",
  "kaawwwwwwaak",
  "kaawwwwwwaak",
  "kaawwwwwwaak",
  "kaaaaaaaaaak",
  ".kaaaaaaaak.",
  "..kaaaaaak..",
  "...kaaaak...",
  "....kaak....",
  ".....kk.....",
];

const BADGE_TARGET = [
  "...kkkkkk...",
  ".kkaaaaaakk.",
  ".kaaaaaaaak.",
  "kaakkkkkkaak",
  "kaakwwwwkaak",
  "kaakwaawkaak",
  "kaakwaawkaak",
  "kaakwwwwkaak",
  "kaakkkkkkaak",
  ".kaaaaaaaak.",
  ".kkaaaaaakk.",
  "...kkkkkk...",
];

const BADGE_BOOK = [
  "kkkkkkkkkkkk",
  "kwwwwkkwwwwk",
  "kwaawkkwaawk",
  "kwaawkkwaawk",
  "kwwwwkkwwwwk",
  "kwaawkkwaawk",
  "kwaawkkwaawk",
  "kwwwwkkwwwwk",
  "kwaawkkwaawk",
  "kwwwwkkwwwwk",
  "kkkkkkkkkkkk",
  "............",
];

const BADGE_CROWN = [
  "............",
  "k..........k",
  "kk...kk...kk",
  "kak..kk..kak",
  "kakk.kk.kkak",
  "kaakkkkkkaak",
  "kaaaaaaaaaak",
  "kaaaaaaaaaak",
  "kkkkkkkkkkkk",
  "kaaaaaaaaaak",
  "kkkkkkkkkkkk",
  "............",
];

const BADGE_SPROUT = [
  "............",
  ".....kk.....",
  "..kkkaakkk..",
  ".kaaakaaaak.",
  ".kaaakaaaak.",
  "..kkkaakkk..",
  ".....kk.....",
  ".....kk.....",
  "....kkkk....",
  "...kwwwwk...",
  "...kwwwwk...",
  "....kkkk....",
];

const BADGE_GEM = [
  "....kkkk....",
  "...kaaaak...",
  "..kaaaaaak..",
  ".kaaaaaaaak.",
  "kaaaaaaaaaak",
  ".kaaaaaaaak.",
  "..kaaaaaak..",
  "...kaaaak...",
  "....kaak....",
  ".....kk.....",
  "............",
  "............",
];

/* --- 어느 스테이지에서나 얻는 증표 ---
   goal(s) 가 참이 되는 순간 얻는다. 한 번 얻으면 그대로 남는다.
   스테이지마다 얻는 증표는 각 스테이지 파일(data/stageN/stage.js)이 BADGES.push 로 더한다.
   stage 가 있는 증표는 증표 화면에서 그 스테이지 아래에 묶여 나온다. */
const BADGES = [
  {
    id: "b_first", name: "첫걸음 증표", color: "#7a9c3f", sprite: BADGE_STAR,
    desc: "처음으로 그림자몬을 정화했어요.",
    goal: function (s) { return s.caught.length >= 1; },
  },
  {
    id: "b_accurate", name: "정확한 판단 증표", color: "#2f7d4f", sprite: BADGE_TARGET,
    desc: "정답률 80% 이상으로 세 마리를 정화했어요.",
    goal: function (s) { return s.caught.length >= 3 && accuracyOf(s) >= 0.8; },
  },
  {
    id: "b_perfect", name: "무결점 증표", color: "#2f6fb2", sprite: BADGE_GEM,
    desc: "한 문제도 틀리지 않고 그림자몬을 정화했어요.",
    goal: function (s) { return !!s.perfectCatch; },
  },
  {
    id: "b_review", name: "복습왕 증표", color: "#97701c", sprite: BADGE_SPROUT,
    desc: "틀렸던 문제를 다시 풀어 세 개 이상 지웠어요.",
    goal: function (s) { return (s.reviewCleared || 0) >= 3; },
  },
];

/* 증표 하나를 그릴 때 쓸 팔레트 */
function badgePalette(badge) {
  return { ".": "transparent", k: "#23211c", w: "#f8f8f0", a: badge.color };
}
