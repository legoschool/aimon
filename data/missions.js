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

/* 그 마을에서 몇 마리를 정화했는지 */
function caughtInStage(s, stage) {
  return monstersOfStage(stage).filter(function (mm) {
    return s.caught.indexOf(mm.id) !== -1;
  }).length;
}

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
    stage: 1,
    title: "첫 정화",
    desc: "풀숲 위의 그림자몬에게 다가가, 한 마리를 정화하세요.",
    goal: function (s) { return s.caught.length >= 1; },
    progress: function (s) { return Math.min(s.caught.length, 1) + " / 1"; },
    reward: { ball: "basic", count: 2, label: "가치볼 2개" },
  },
  {
    id: "m2",
    stage: 1,
    title: "만든 사람의 몫",
    desc: "저작권 그림자몬 2마리를 모두 정화하세요. (복붙몬 · 슬쩍몬)",
    goal: function (s) { return caughtOfType(s, "copyright") >= 2; },
    progress: function (s) { return caughtOfType(s, "copyright") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "m3",
    stage: 1,
    title: "친구를 지키는 법",
    desc: "개인정보 그림자몬 2마리를 모두 정화하세요. (막올림몬 · 술술몬)",
    goal: function (s) { return caughtOfType(s, "privacy") >= 2; },
    progress: function (s) { return caughtOfType(s, "privacy") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "m4",
    stage: 1,
    title: "진짜를 가려내는 눈",
    desc: "허위정보 그림자몬 2마리를 모두 정화하세요. (그럴싸몬 · 가짜몬)",
    goal: function (s) { return caughtOfType(s, "disinfo") >= 2; },
    progress: function (s) { return caughtOfType(s, "disinfo") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "m5",
    stage: 1,
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
    stage: 1,
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
    stage: 1,
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
  /* ========== 🏙 데이터 도시 ========== */
  {
    id: "c1",
    stage: 2,
    title: "도시의 첫 정화",
    desc: "구역 위의 그림자몬에게 다가가, 한 마리를 정화하세요.",
    goal: function (s) { return caughtInStage(s, 2) >= 1; },
    progress: function (s) { return Math.min(caughtInStage(s, 2), 1) + " / 1"; },
    reward: { ball: "reason", count: 2, label: "근거볼 2개" },
  },
  {
    id: "c2",
    stage: 2,
    title: "빠진 사람 찾기",
    desc: "편향 그림자몬 2마리를 정화하세요. (끼리끼리몬 · 싸잡아몬)",
    goal: function (s) { return caughtOfType(s, "bias") >= 2; },
    progress: function (s) { return caughtOfType(s, "bias") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "c3",
    stage: 2,
    title: "판단은 넘기지 않기",
    desc: "의존 그림자몬 2마리를 정화하세요. (시킨대로몬 · 떠넘김몬)",
    goal: function (s) { return caughtOfType(s, "depend") >= 2; },
    progress: function (s) { return caughtOfType(s, "depend") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "c4",
    stage: 2,
    title: "멈출 자리는 내가",
    desc: "조작 그림자몬 2마리를 정화하세요. (한번만더몬 · 흔들어몬)",
    goal: function (s) { return caughtOfType(s, "manipul") >= 2; },
    progress: function (s) { return caughtOfType(s, "manipul") + " / 2"; },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "c5",
    stage: 2,
    title: "다섯 번째 질문 쓰기",
    desc: "🎯 '이건 누구를 위한 걸까?' 로 5문제를 맞히세요.",
    goal: function (s) { return (s.toolStats.purpose || { right: 0 }).right >= 5; },
    progress: function (s) {
      return Math.min((s.toolStats.purpose || { right: 0 }).right, 5) + " / 5";
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "c6",
    stage: 2,
    title: "도시의 그림자를 모두 걷어내기",
    desc: "그림자몬 6마리를 모두 정화해 도시 도감을 채우세요.",
    goal: function (s) {
      return regularMonsters(2).every(function (mm) {
        return s.caught.indexOf(mm.id) !== -1;
      });
    },
    progress: function (s) {
      const n = regularMonsters(2).filter(function (mm) {
        return s.caught.indexOf(mm.id) !== -1;
      }).length;
      return n + " / " + regularMonsters(2).length;
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "c7",
    stage: 2,
    title: "다들 그래도",
    desc: "도시 한복판의 다들그래몬을 정화하세요. 다섯 질문을 번갈아 써야 해요.",
    goal: function (s) {
      const last = finalBossMonster(2);
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
    progress: function (s) {
      const last = finalBossMonster(2);
      if (!last) return "-";
      if (s.caught.indexOf(last.id) !== -1) return "1 / 1";
      return allRegularCaught(2) ? "지금 열렸어요!" : "0 / 1";
    },
  },
];

/* 지금 마을의 의뢰만 — 도시에 있는 아이에게 마을 의뢰를 보여 줄 이유가 없다 */
function missionsOfStage(stage) {
  return MISSIONS.filter(function (mm) {
    return (mm.stage || 1) === (stage || currentStage());
  });
}
