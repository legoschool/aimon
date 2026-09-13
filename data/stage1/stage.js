/* ===========================================================
   1스테이지 · AI 마을 — 지도 · 이야기 · 의뢰 · 증표

   이 폴더만 보면 1스테이지를 고칠 수 있다.
     stage.js     지도, 엔딩 글, 의뢰, 증표   (이 파일)
     monsters.js  그림자몬 여섯과 마지막 보스 생각멈춤몬
     questions.js 상황 문제 30개

   처음 하는 학생에게 박사님이 거는 말은 src/tutorial.js 의 tutorialIntro 에 있다.

   지도 글자
     #  나무      .  땅      =  길      ~  물      L  연구소
     C  저작권 숲   P  개인정보 숲   D  허위정보 숲
   =========================================================== */

addStage({
  id: 1,
  name: "AI 마을",
  place: "마을",
  sub: "사람들이 무심코 저지르는 잘못이 그림자가 되어 떠도는 곳",
  side: "하는 쪽",
  theme: "AI를 쓰다 내가 남에게 끼치는 해",
  hardFromLevel: 8,

  map: [
    "####################",
    "#....CC....##...DD.#",
    "#...CCCC...##..DDDD#",
    "#...CCCC...=...DDDD#",
    "#....CC....=....DD.#",
    "#..........=.......#",
    "#==================#",
    "#..........=.......#",
    "#....PP....=.....~~#",
    "#...PPPP...=....~~~#",
    "#...PPPP...=.....~~#",
    "#....PP....=.......#",
    "#.........LLL......#",
    "####################",
  ],

  walkable: ".=CPD",
  encounter: { C: "copyright", P: "privacy", D: "disinfo" },

  zoneName: {
    C: "저작권 데이터숲",
    P: "개인정보 데이터숲",
    D: "허위정보 데이터숲",
    L: "AI 연구소",
    "~": "데이터 호수",
  },

  /* 어두울 때 (4색 그레이스케일 + 숲마다 속성색 한 방울) */
  tile: {
    "#": { base: "#3f4f3a", dot: "#2b381f", shape: "tree" },
    ".": { base: "#a8b89a", dot: "#98a98a", shape: "ground" },
    "=": { base: "#d8d4c0", dot: "#c9c4b0", shape: "road" },
    "~": { base: "#6f93b8", dot: "#5b7fa6", shape: "water" },
    L: { base: "#b0a898", dot: "#8a8272", shape: "house" },
    C: { base: "#7d9c7a", dot: "#3a6ea5", shape: "grass" },
    P: { base: "#7d9c7a", dot: "#c9642a", shape: "grass" },
    D: { base: "#7d9c7a", dot: "#6b4a9e", shape: "grass" },
  },

  /* 정화된 뒤 — 같은 지도, 같은 구조인데 빛이 든다 */
  pure: {
    "#": { base: "#4f7a45", dot: "#356030" },
    ".": { base: "#c6dbab", dot: "#b3cb98" },
    "=": { base: "#f2ecd6", dot: "#e2dbc0" },
    "~": { base: "#82c7ea", dot: "#5cabd8" },
    L: { base: "#dbd2bf", dot: "#b3a28b" },
    C: { base: "#a2cc92", dot: "#4f97d8" },
    P: { base: "#a2cc92", dot: "#f0873f" },
    D: { base: "#a2cc92", dot: "#9a72d6" },
  },

  start: { x: 11, y: 11 }, // 연구소 앞
  finalSpot: { x: 11, y: 6 }, // 두 길이 만나는 한복판
  bossSpot: { x: 17, y: 2 }, // 가짜몬 — 허위정보 숲 안쪽

  /* 엔딩에서 가치몬들이 서는 자리 — 자기가 지키던 숲으로 돌아간다 */
  homeSpots: {
    bokbut: { x: 5, y: 2 },
    seuljjeok: { x: 7, y: 3 },
    makollim: { x: 5, y: 9 },
    sulsul: { x: 7, y: 10 },
    geureolssa: { x: 16, y: 2 },
    gajja: { x: 18, y: 3 },
    meomchum: { x: 11, y: 6 },
  },

  /* 1스테이지는 처음 시작하는 곳이라 도착 안내 대신 tutorialIntro 가 말을 건다 */
  arrival: null,

  clear: {
    title: "AI 마을 정화 완료!",
    desc: "일곱 가치몬이 모두 돌아왔어요. 위의 엔딩 버튼으로 다시 볼 수 있어요.",
    report: "★ AI 마을 정화 완료. 일곱 AI몬스터를 모두 되돌렸어요",
  },

  ending: {
    done: "AI 마을이 깨끗해졌습니다",
    words:
      "<p>이 게임에서 이긴 방법은 답을 <b>빨리</b> 고르는 것이 아니었어요. " +
      "상황을 끝까지 읽고, 진짜인지 따지고, 누구의 것인지 묻고, 누가 다칠지 헤아리고, " +
      "내가 왜 이걸 하려는지 들여다본 것이었어요.</p>" +
      "<p>AI는 앞으로 더 똑똑해집니다. 그래서 더 귀해지는 사람은 " +
      "답을 외운 사람보다 <b>무엇이 옳은지 묻는 사람</b>이에요.</p>" +
      "<p>생각멈춤몬은 완전히 사라지지 않아요. 바쁠 때, 귀찮을 때, " +
      "남들이 다 그렇게 할 때 다시 찾아옵니다. " +
      "그때 <b>한 번 더 생각하는 것</b>, 그게 오늘 얻은 진짜 힘이에요.</p>",
  },
});

/* -----------------------------------------------------------
   박사님 의뢰 (goal·progress 의 s 는 그 학생의 저장본)
   수업 시간에 맞춰 개수를 줄이거나 순서를 바꿔 쓰세요.
   ----------------------------------------------------------- */
MISSIONS.push(
  {
    id: "m1",
    stage: 1,
    title: "첫 정화",
    desc: "풀숲 위의 그림자몬에게 다가가, 한 마리를 정화하세요.",
    goal: function (s) { return caughtInStage(s, 1) >= 1; },
    progress: function (s) { return Math.min(caughtInStage(s, 1), 1) + " / 1"; },
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
    desc: "3마리 이상 정화하면서, 전체 정답률을 80% 이상으로 지키세요.",
    goal: function (s) { return caughtInStage(s, 1) >= 3 && accuracyOf(s) >= 0.8; },
    progress: function (s) {
      return caughtInStage(s, 1) + " / 3마리 · 정답률 " + Math.round(accuracyOf(s) * 100) + "%";
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "m6",
    stage: 1,
    title: "그림자를 모두 걷어내기",
    desc: "그림자몬 6마리를 모두 정화해 도감을 채우세요.",
    goal: function (s) {
      return regularMonsters(1).every(function (m) { return s.caught.indexOf(m.id) !== -1; });
    },
    progress: function (s) {
      const n = regularMonsters(1).filter(function (m) { return s.caught.indexOf(m.id) !== -1; }).length;
      return n + " / " + regularMonsters(1).length;
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "m7",
    stage: 1,
    title: "마지막 관문",
    desc: "지도 한복판에 나타난 생각멈춤몬을 정화하세요. 같은 질문은 두 번 연달아 쓸 수 없어요.",
    goal: function (s) {
      const last = finalBossMonster(1);
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
    progress: function (s) {
      const last = finalBossMonster(1);
      if (!last) return "-";
      if (s.caught.indexOf(last.id) !== -1) return "1 / 1";
      return allRegularCaught(1) ? "지금 열렸어요!" : "0 / 1";
    },
  }
);

/* -----------------------------------------------------------
   증표 (한 번 얻으면 기록과 인쇄에 남는다)
   어느 스테이지에서나 얻는 증표는 data/badges.js 에 있다.
   ----------------------------------------------------------- */
BADGES.push(
  {
    id: "b_copyright", stage: 1, name: "저작권 증표", color: "#3a6ea5", sprite: BADGE_SHIELD,
    desc: "남이 만든 것에는 주인이 있다는 걸 알아요.",
    goal: function (s) { return caughtOfType(s, "copyright") >= 2; },
  },
  {
    id: "b_privacy", stage: 1, name: "개인정보 증표", color: "#c9642a", sprite: BADGE_SHIELD,
    desc: "친구의 정보를 함부로 쓰지 않아요.",
    goal: function (s) { return caughtOfType(s, "privacy") >= 2; },
  },
  {
    id: "b_disinfo", stage: 1, name: "허위정보 증표", color: "#6b4a9e", sprite: BADGE_SHIELD,
    desc: "그대로 믿지 않고 한 번 더 확인해요.",
    goal: function (s) { return caughtOfType(s, "disinfo") >= 2; },
  },
  {
    id: "b_dex", stage: 1, name: "도감 완성 증표", color: "#5a6b7d", sprite: BADGE_BOOK,
    desc: "AI 마을의 그림자몬 여섯 마리를 모두 정화했어요.",
    goal: function (s) {
      return regularMonsters(1).every(function (m) { return s.caught.indexOf(m.id) !== -1; });
    },
  },
  {
    id: "b_thinker", stage: 1, name: "생각지기 증표", color: "#c9a227", sprite: BADGE_CROWN,
    top: true, // 최고 등급
    desc: "생각멈춤몬을 정화했어요. 그대로 믿지 않고 한 번 더 생각하는 사람이에요.",
    goal: function (s) {
      const last = finalBossMonster(1);
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
  }
);
