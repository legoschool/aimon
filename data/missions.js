/* ===========================================================
   AI몬스터 — 박사님 의뢰(미션)

   도감 6칸만 있으면 목표가 막연하다.
   의뢰가 있으면 "오늘 수업에서 어디까지" 가 분명해진다.

   goal(s)     : 달성했는지 (s = 그 학생의 저장본)
   progress(s) : 화면에 보여줄 진행 상황
   reward      : 달성하면 주는 것 (없으면 생략)

   선생님께 — 이 파일만 고치면 의뢰가 바뀝니다.
   수업 시간에 맞춰 개수를 줄이거나 순서를 바꿔 쓰세요.
   =========================================================== */

/* 어떤 속성을 몇 마리 정화했는지 */
function caughtOfType(s, typeId) {
  return MONSTERS.filter(function (m) {
    return m.type === typeId && s.caught.indexOf(m.id) !== -1;
  }).length;
}

/* 전체 정답률 */
function accuracyOf(s) {
  let r = 0;
  let a = 0;
  Object.keys(s.stats).forEach(function (k) {
    r += s.stats[k].right;
    a += s.stats[k].asked;
  });
  return a > 0 ? r / a : 0;
}

const MISSIONS = [
  {
    id: "m1",
    title: "첫 정화",
    desc: "풀숲 위의 그림자몬에게 다가가, 한 마리를 정화하세요.",
    goal: function (s) { return s.caught.length >= 1; },
    progress: function (s) { return Math.min(s.caught.length, 1) + " / 1"; },
    reward: { ball: "basic", count: 2, label: "기본판단볼 2개" },
  },
  {
    id: "m2",
    title: "만든 사람의 몫",
    desc: "저작권 그림자몬 2마리를 모두 정화하세요. (복붙몬 · 슬쩍몬)",
    goal: function (s) { return caughtOfType(s, "copyright") >= 2; },
    progress: function (s) { return caughtOfType(s, "copyright") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "m3",
    title: "친구를 지키는 법",
    desc: "개인정보 그림자몬 2마리를 모두 정화하세요. (막올림몬 · 술술몬)",
    goal: function (s) { return caughtOfType(s, "privacy") >= 2; },
    progress: function (s) { return caughtOfType(s, "privacy") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "m4",
    title: "진짜를 가려내는 눈",
    desc: "허위정보 그림자몬 2마리를 모두 정화하세요. (그럴싸몬 · 가짜몬)",
    goal: function (s) { return caughtOfType(s, "disinfo") >= 2; },
    progress: function (s) { return caughtOfType(s, "disinfo") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "m5",
    title: "확실한 판단",
    desc: "3마리 넘게 정화하면서, 전체 정답률을 80% 이상으로 지키세요.",
    goal: function (s) { return s.caught.length >= 3 && accuracyOf(s) >= 0.8; },
    progress: function (s) {
      return s.caught.length + " / 3마리 · 정답률 " + Math.round(accuracyOf(s) * 100) + "%";
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "m6",
    title: "그림자를 모두 걷어내기",
    desc: "그림자몬 6마리를 모두 정화해 도감을 채우세요.",
    goal: function (s) {
      return regularMonsters().every(function (m) {
        return s.caught.indexOf(m.id) !== -1;
      });
    },
    progress: function (s) {
      const n = regularMonsters().filter(function (m) {
        return s.caught.indexOf(m.id) !== -1;
      }).length;
      return n + " / " + regularMonsters().length;
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "m7",
    title: "마지막 관문",
    desc: "지도 한복판에 나타난 생각멈춤몬을 정화하세요. 네 가지 판단 도구를 번갈아 써야 해요.",
    goal: function (s) {
      const last = finalBossMonster();
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
    progress: function (s) {
      const last = finalBossMonster();
      if (!last) return "-";
      if (s.caught.indexOf(last.id) !== -1) return "1 / 1";
      return allRegularCaught() ? "지금 열렸어요!" : "0 / 1";
    },
  },
];
