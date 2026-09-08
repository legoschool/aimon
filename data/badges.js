/* ===========================================================
   AI몬스터 — 증표(아이템)

   판단볼은 쓰면 사라진다. 증표는 사라지지 않는다.
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

/* --- 증표 목록 ---
   goal(s) 가 참이 되는 순간 얻는다. 한 번 얻으면 그대로 남는다. */
const BADGES = [
  {
    id: "b_first", name: "첫걸음 증표", color: "#7a9c3f", sprite: BADGE_STAR,
    desc: "처음으로 그림자몬을 정화했어요.",
    goal: function (s) { return s.caught.length >= 1; },
  },
  {
    id: "b_copyright", name: "저작권 증표", color: "#3a6ea5", sprite: BADGE_SHIELD,
    desc: "남이 만든 것에는 주인이 있다는 걸 알아요.",
    goal: function (s) { return caughtOfType(s, "copyright") >= 2; },
  },
  {
    id: "b_privacy", name: "개인정보 증표", color: "#c9642a", sprite: BADGE_SHIELD,
    desc: "친구의 정보를 함부로 쓰지 않아요.",
    goal: function (s) { return caughtOfType(s, "privacy") >= 2; },
  },
  {
    id: "b_disinfo", name: "허위정보 증표", color: "#6b4a9e", sprite: BADGE_SHIELD,
    desc: "그대로 믿지 않고 한 번 더 확인해요.",
    goal: function (s) { return caughtOfType(s, "disinfo") >= 2; },
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
  {
    id: "b_dex", name: "도감 완성 증표", color: "#5a6b7d", sprite: BADGE_BOOK,
    desc: "그림자몬 여섯 마리를 모두 정화했어요.",
    goal: function (s) {
      return regularMonsters().every(function (m) {
        return s.caught.indexOf(m.id) !== -1;
      });
    },
  },
  {
    id: "b_thinker", name: "생각지기 증표", color: "#c9a227", sprite: BADGE_CROWN,
    top: true, // 최고 등급
    desc: "생각멈춤몬을 정화했어요. 그대로 믿지 않고 한 번 더 생각하는 사람이에요.",
    goal: function (s) {
      const last = finalBossMonster();
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
  },
];

/* 증표 하나를 그릴 때 쓸 팔레트 */
function badgePalette(badge) {
  return { ".": "transparent", k: "#23211c", w: "#f8f8f0", a: badge.color };
}
