/* ===========================================================
   2스테이지 · 데이터 도시 — 지도 · 이야기 · 의뢰 · 증표

   이 폴더만 보면 2스테이지를 고칠 수 있다.
     stage.js     지도, 박사님 안내, 엔딩 글, 의뢰, 증표   (이 파일)
     monsters.js  그림자몬 여섯과 마지막 보스 다들그래몬
     questions.js 상황 문제

   마을은 내가 남에게 하는 일이 보이는 크기다.
   도시는 거대한 장치가 나에게 하는 일이 안 보이는 크기다.
   그래서 길이 곧게 나뉜 격자다. 숲처럼 구불거리지 않는다.

   지도 글자
     #  건물      .  보도    =  큰길    ~  저수지   L  관제실
     X  추천의 거리(편향)  Y  자동응답 구역(의존)  Z  알림 광장(조작)
   =========================================================== */

addStage({
  id: 2,
  name: "데이터 도시",
  place: "도시",
  sub: "보이지 않는 장치가 사람을 조금씩 움직이는 곳",
  side: "당하는 쪽",
  theme: "나에게 보이지 않게 일어나는 일",
  hardFromLevel: 13, // 도시는 레벨이 통째로 높으므로 기준도 함께 올린다
  enterLabel: "🏙 데이터 도시로 떠나기",
  tutorialKey: "city", // 예전 저장본과 같은 이름을 쓴다 (다시 안내하지 않게)

  map: [
    "####################",
    "#XXXXX=.....=YYYYYY#",
    "#XXXXX=.....=YYYYYY#",
    "#XXXXX=.....=YYYYYY#",
    "#XXXXX=.....=YYYYYY#",
    "#==================#",
    "#ZZZZZ=.....=......#",
    "#ZZZZZ=.....=.~~~~.#",
    "#ZZZZZ=.....=.~~~~.#",
    "#ZZZZZ=.....=......#",
    "#==================#",
    "#.......LLLL.......#",
    "#..................#",
    "####################",
  ],

  walkable: ".=XYZ",
  encounter: { X: "bias", Y: "depend", Z: "manipul" },

  zoneName: {
    X: "추천의 거리",
    Y: "자동응답 구역",
    Z: "알림 광장",
    L: "데이터 관제실",
    "~": "데이터 저수지",
  },

  /* 어두울 때 — 콘크리트 회색에 구역마다 속성색 한 방울 */
  tile: {
    "#": { base: "#4a4a55", dot: "#33333d", shape: "building" },
    ".": { base: "#9a9aa5", dot: "#8a8a95", shape: "ground" },
    "=": { base: "#6a6a78", dot: "#5a5a66", shape: "road" },
    "~": { base: "#4a6f8f", dot: "#3a5c78", shape: "water" },
    L: { base: "#8a8296", dot: "#6a6276", shape: "house" },
    X: { base: "#7a7a88", dot: "#c2407a", shape: "signal" },
    Y: { base: "#7a7a88", dot: "#2f8f8f", shape: "signal" },
    Z: { base: "#7a7a88", dot: "#c0392b", shape: "signal" },
  },

  /* 정화된 뒤 — 잿빛이 걷히고 하늘색이 돈다 */
  pure: {
    "#": { base: "#6f7f8f", dot: "#54636f" },
    ".": { base: "#dcdfe6", dot: "#cacfd8" },
    "=": { base: "#eef1f6", dot: "#dde1e9" },
    "~": { base: "#82c7ea", dot: "#5cabd8" },
    L: { base: "#ded6e8", dot: "#b6aec2" },
    X: { base: "#ccd2de", dot: "#c2407a" },
    Y: { base: "#ccd2de", dot: "#2f8f8f" },
    Z: { base: "#ccd2de", dot: "#c0392b" },
  },

  start: { x: 9, y: 12 }, // 관제실 앞
  finalSpot: { x: 9, y: 7 }, // 도시 한복판 광장
  bossSpot: { x: 3, y: 8 }, // 흔들어몬 — 알림 광장 안쪽

  homeSpots: {
    kkirikkiri: { x: 2, y: 2 },
    ssajaba: { x: 4, y: 3 },
    sikindaero: { x: 14, y: 2 },
    tteoneomgim: { x: 16, y: 3 },
    hanbeonman: { x: 2, y: 7 },
    heundeuleo: { x: 4, y: 8 },
    dadeulgeurae: { x: 9, y: 7 },
  },

  /* ---- 처음 도착했을 때 박사님 안내 ----
     여기서 시점이 뒤집힌다는 것을 분명히 말해 준다.
     마을에서는 내가 하는 쪽이었고, 도시에서는 당하는 쪽이다.
     {name} {acc} {min} 은 별명과 잡는 조건 숫자로 바뀐다. */
  arrival: [
    {
      title: "데이터 도시에 도착했어요",
      text:
        "AI 마을을 깨끗하게 만들어 줘서 고마워요, <b>{name}</b> 탐험가.<br><br>" +
        "그런데 이 도시의 그림자는 <b>마을과 다릅니다.</b>",
    },
    {
      title: "이번엔 내가 당하는 쪽이에요",
      text:
        "마을의 그림자는 <b>내가 남에게 하는 잘못</b>이었어요.<br>" +
        "베끼고, 함부로 올리고, 안 알아보고 퍼뜨리는 것들이었죠.<br><br>" +
        "도시의 그림자는 달라요. <b>내가 아무것도 안 해도</b> " +
        "나에게 조용히 일어나는 일들입니다.",
    },
    {
      title: "세 구역이 있어요",
      text:
        "<span class='tut-chip x'>추천의 거리 · 편향</span> AI가 누구를 빼놓는지<br>" +
        "<span class='tut-chip y'>자동응답 구역 · 의존</span> 판단을 AI에게 넘기지 않는지<br>" +
        "<span class='tut-chip z'>알림 광장 · 조작</span> 나를 붙잡아 두려는 설계인지",
    },
    {
      title: "다섯 번째 질문이 열렸어요",
      text:
        "🎯 <b>이건 누구를 위한 걸까?</b><br><br>" +
        "네 가지 질문으로는 안 풀리는 것이 있어요. 추천 화면, 자동 재생, 끝없는 알림 같은 것들이요.<br><br>" +
        "<b>누가 다칠까?</b>는 내 행동의 피해자를 묻고, " +
        "<b>나는 왜 이걸 하려 하지?</b>는 내 마음을 묻지만, " +
        "여기서 따져야 할 건 <b>만든 사람의 속셈</b>이에요.",
    },
    {
      title: "여기는 더 어려워요",
      text:
        "주제가 <b>둘</b>인 몬스터가 있어요. 한 질문이 두 주제에 모두 잘 통하기는 어려워요.<br>" +
        "잡으려면 정답률 <b>{acc}% 이상</b>, 문제 <b>{min}개 이상</b>이 필요해요.<br><br>" +
        "천천히 읽으세요. 여기서는 <b>급하게 고르는 것</b>이 제일 위험합니다.",
      done: "가볼게요!",
    },
  ],
  arrivalFlash: "데이터 도시에 도착했어요. 다섯 번째 질문이 열렸습니다!",

  clear: {
    title: "데이터 도시 정화 완료!",
    desc: "일곱 가치몬이 모두 돌아왔어요. 위의 엔딩 버튼으로 다시 볼 수 있어요.",
    report: "★ 데이터 도시 정화 완료. 다들그래몬까지 일곱 AI몬스터를 되돌렸어요",
  },

  ending: {
    done: "데이터 도시가 깨끗해졌습니다",
    words:
      "<p>마을에서는 <b>내가 하는 일</b>을 살폈어요. " +
      "베끼지 않기, 함부로 올리지 않기, 안 알아보고 퍼뜨리지 않기.</p>" +
      "<p>도시에서는 <b>나에게 일어나는 일</b>을 살폈어요. " +
      "누가 화면에서 빠졌는지, 판단을 누구에게 넘겼는지, 이 알림이 누구를 위한 것인지.</p>" +
      "<p>제일 중요한 걸 하나만 기억한다면 이거예요. " +
      "영상을 한 시간 본 것도, 알림에 끌려다닌 것도 <b>마음이 약해서가 아니에요.</b> " +
      "그렇게 만들어져 있었어요. 그걸 알아채는 순간부터 " +
      "끌려다니는 쪽이 아니라 <b>고르는 쪽</b>이 됩니다.</p>" +
      "<p>다들 그렇게 해도 나는 물어볼 수 있어요. " +
      "무엇이 옳은지 정하는 건 사람이고, <b>나도 그 사람 중 하나예요.</b></p>",
  },
});

/* -----------------------------------------------------------
   박사님 의뢰
   ----------------------------------------------------------- */
MISSIONS.push(
  {
    id: "c1",
    stage: 2,
    title: "도시의 첫 정화",
    desc: "구역에 서 있는 그림자몬에게 다가가, 한 마리를 정화하세요.",
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
    desc: "🎯 '이건 누구를 위한 걸까?'로 5문제를 맞히세요.",
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
      return regularMonsters(2).every(function (m) { return s.caught.indexOf(m.id) !== -1; });
    },
    progress: function (s) {
      const n = regularMonsters(2).filter(function (m) { return s.caught.indexOf(m.id) !== -1; }).length;
      return n + " / " + regularMonsters(2).length;
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "c7",
    stage: 2,
    title: "다들 그래도",
    desc: "도시 한복판의 다들그래몬을 정화하세요. 같은 질문은 두 번 연달아 쓸 수 없어요.",
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
  }
);

/* -----------------------------------------------------------
   증표
   ----------------------------------------------------------- */
BADGES.push(
  {
    id: "b_bias", stage: 2, name: "편향 증표", color: TYPES.bias.accent, sprite: BADGE_SHIELD,
    desc: "화면에서 빠진 사람이 누구인지 찾아요.",
    goal: function (s) { return caughtOfType(s, "bias") >= 2; },
  },
  {
    id: "b_depend", stage: 2, name: "의존 증표", color: TYPES.depend.accent, sprite: BADGE_SHIELD,
    desc: "판단을 AI에게 통째로 넘기지 않아요.",
    goal: function (s) { return caughtOfType(s, "depend") >= 2; },
  },
  {
    id: "b_manipul", stage: 2, name: "조작 증표", color: TYPES.manipul.accent, sprite: BADGE_SHIELD,
    desc: "나를 붙잡아 두려는 설계를 알아채요.",
    goal: function (s) { return caughtOfType(s, "manipul") >= 2; },
  },
  {
    id: "b_dex2", stage: 2, name: "도시 도감 증표", color: "#5a6b7d", sprite: BADGE_BOOK,
    desc: "데이터 도시의 그림자몬 여섯 마리를 모두 정화했어요.",
    goal: function (s) {
      return regularMonsters(2).every(function (m) { return s.caught.indexOf(m.id) !== -1; });
    },
  },
  {
    id: "b_nadaum", stage: 2, name: "나다움지기 증표", color: "#c9a227", sprite: BADGE_CROWN,
    top: true,
    desc: "다들그래몬을 정화했어요. 다들 그래도 한 번 묻는 사람이에요.",
    goal: function (s) {
      const last = finalBossMonster(2);
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
  }
);
