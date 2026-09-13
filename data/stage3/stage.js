/* ===========================================================
   3스테이지 · 잿빛 황무지 — 지도 · 이야기 · 의뢰 · 증표

   이 폴더만 보면 3스테이지를 고칠 수 있다.
     stage.js     지도, 박사님 안내, 엔딩 글, 의뢰, 증표   (이 파일)
     monsters.js  그림자몬 여섯과 마지막 보스
     questions.js 상황 문제
     finale.js    마지막 싸움에서 어차피몬이 거는 말과 대답

   지도 글자
     #  무너진 벽   .  갈라진 땅   =  부서진 길   ~  마른 저수지   L  마지막 쉼터
     E  감시탑 구역(감시)   F  의심 안개 늪(불신)   G  끊어진 역(소외)
   =========================================================== */

addStage({
  id: 3,
  name: "잿빛 황무지",
  place: "황무지", // 문장 안에서 부르는 말 ("가치몬들이 황무지로 돌아옵니다")
  sub: "사람들이 묻기를 멈추자 서로 지켜보고, 서로 믿지 못하고, 느린 사람을 두고 떠나 잿빛이 된 곳",
  side: "함께 바꾸는 쪽", // 이 스테이지에서 아이가 서는 자리
  theme: "모두가 함께 만든 결과", // 대문 카드에 쓰는 한 줄
  hardFromLevel: 19, // 이 레벨 이상인 몬스터는 어려운 문항을 먼저 낸다
  enterLabel: "🌫 잿빛 황무지로 떠나기", // 앞 스테이지 엔딩에 뜨는 버튼
  tutorialKey: "waste", // 도착 안내를 봤는지 저장하는 이름

  map: [
    "####################",
    "#EEEEE.#....#FFFFFF#",
    "#EEEEE.#.==.#FFFFFF#",
    "#EE#EE...==...FF#FF#",
    "#EEEEE...==...FFFFF#",
    "#.....#..==..#.....#",
    "#========.=========#",
    "#.....#..==..#.....#",
    "#GGGGG...==...~~~..#",
    "#GG#GG...==..~~~~~.#",
    "#GGGGG...==...~~~..#",
    "#GGGGG.#.==.#......#",
    "#........LLLL......#",
    "####################",
  ],

  walkable: ".=EFG",
  encounter: { E: "surveil", F: "distrust", G: "exclude" },

  zoneName: {
    E: "감시탑 구역",
    F: "의심 안개 늪",
    G: "끊어진 역",
    L: "마지막 쉼터",
    "~": "마른 저수지",
  },

  /* 어두울 때 — 잿빛 흙과 무너진 벽, 구역마다 속성색 한 방울 */
  tile: {
    "#": { base: "#4a4540", dot: "#2f2b27", shape: "ruin" },
    ".": { base: "#8d8478", dot: "#766d62", shape: "crack" },
    "=": { base: "#6e675e", dot: "#5a544c", shape: "road" },
    "~": { base: "#6b6a5f", dot: "#55544a", shape: "dry" },
    L: { base: "#857a6a", dot: "#62584a", shape: "house" },
    E: { base: "#78736b", dot: "#3a9a4a", shape: "eye" },
    F: { base: "#78736b", dot: "#4a54c8", shape: "fog" },
    G: { base: "#78736b", dot: "#8a9a1e", shape: "gap" },
  },

  /* 정화된 뒤 — 무너진 벽에 이끼가 덮이고, 마른 저수지에 물이 돈다 */
  pure: {
    "#": { base: "#6f8f5a", dot: "#4d7040" },
    ".": { base: "#c9dcae", dot: "#b2c795" },
    "=": { base: "#efe9d2", dot: "#ddd5ba" },
    "~": { base: "#82c7ea", dot: "#5cabd8" },
    L: { base: "#dbd0bb", dot: "#b19f86" },
    E: { base: "#a9cf95", dot: "#3a9a4a" },
    F: { base: "#a9cf95", dot: "#4a54c8" },
    G: { base: "#a9cf95", dot: "#8a9a1e" },
  },

  start: { x: 10, y: 11 }, // 마지막 쉼터 앞
  finalSpot: { x: 9, y: 6 }, // 길이 끊어진 한복판
  bossSpot: { x: 2, y: 2 }, // 줄세움몬 — 감시탑 구역 안쪽

  homeSpots: {
    eopbwa: { x: 2, y: 1 },
    julseum: { x: 4, y: 3 },
    motmideo: { x: 15, y: 1 },
    pyeongareum: { x: 17, y: 3 },
    dugoga: { x: 2, y: 9 },
    moreunchuk: { x: 4, y: 10 },
    eochapi: { x: 9, y: 6 },
  },

  /* ---- 처음 도착했을 때 박사님 안내 ----
     {acc} {min} 은 잡는 조건 숫자로 바뀐다 (src/equations.js 의 STAGE_BALANCE) */
  arrival: [
    {
      title: "잿빛 황무지에 도착했어요",
      text:
        "데이터 도시까지 깨끗하게 만들어 줘서 고마워요, <b>{name}</b> 탐험가.<br><br>" +
        "그런데 이곳은 <b>풀도 불빛도 없는 잿빛 땅</b>이에요.",
    },
    {
      title: "여기는 왜 황무지가 됐을까요?",
      text:
        "사람들이 묻기를 멈추고 모든 것을 AI에게 맡겼어요.<br>" +
        "그러자 <b>서로 지켜보고</b>, <b>서로 믿지 못하고</b>, <b>느린 사람을 두고</b> 떠났어요.<br><br>" +
        "누구 한 사람이 망가뜨린 곳이 아니에요. \"나 하나쯤이야\"가 모두에게서 한꺼번에 일어난 곳이에요.",
    },
    {
      title: "이번엔 함께 바꾸는 쪽이에요",
      text:
        "마을에서는 <b>내가 하는 일</b>을, 도시에서는 <b>나에게 일어나는 일</b>을 살폈어요.<br><br>" +
        "황무지에서는 반과 모둠, 가족과 동네의 한 사람으로서 <b>무엇을 함께 정할지</b> 고릅니다.",
    },
    {
      title: "세 구역이 있어요",
      text:
        "<span class='tut-chip e'>감시탑 구역 · 감시</span> 누가 누구를 지켜보고 점수 매기는지<br>" +
        "<span class='tut-chip f'>의심 안개 늪 · 불신</span> 진짜까지 믿지 못하게 되는지<br>" +
        "<span class='tut-chip g'>끊어진 역 · 소외</span> 누구를 두고 가는지",
    },
    {
      title: "여섯 번째 질문이 열렸어요",
      text:
        "🌍 <b>모두가 그렇게 하면 어떻게 될까?</b><br><br>" +
        "나 하나만 보면 괜찮아 보이는 일도 모두가 하면 황무지가 돼요.<br>" +
        "잡으려면 정답률 <b>{acc}% 이상</b>, 문제 <b>{min}개 이상</b>이 필요해요.",
    },
    {
      title: "마지막 관문은 혼자 싸우지 않아요",
      text:
        "그림자몬 여섯을 모두 정화하면 한복판에 <b>어차피몬</b>이 나타나요.<br><br>" +
        "그때는 볼을 던지지 않아요. 지금까지 모은 <b>가치몬들과 함께</b> 싸웁니다.",
      done: "가볼게요!",
    },
  ],
  arrivalFlash: "잿빛 황무지에 도착했어요. 여섯 번째 질문이 열렸습니다!",

  /* ---- 다 깨고 난 뒤 ---- */
  clear: {
    title: "잿빛 황무지 정화 완료!",
    desc: "세 곳을 모두 되살렸어요. 위의 엔딩 버튼으로 마지막 이야기를 다시 볼 수 있어요.",
    report: "★ 잿빛 황무지 정화 완료. 어차피몬까지 일곱 AI몬스터를 모두 되돌렸어요",
  },

  ending: {
    spread: "잿빛이 걷히고 있어요…",
    done: "잿빛 황무지에 다시 풀이 돋았습니다",
    words:
      "<p>마을에서는 <b>내가 하는 일</b>을 살폈어요. " +
      "베끼지 않기, 함부로 올리지 않기, 안 알아보고 퍼뜨리지 않기.</p>" +
      "<p>도시에서는 <b>나에게 일어나는 일</b>을 살폈어요. " +
      "화면에서 누가 빠졌는지, 판단을 누구에게 넘겼는지, 이 알림은 누구를 위한 것인지.</p>" +
      "<p>황무지에서는 <b>우리가 함께 정하는 일</b>을 살폈어요. " +
      "서로 지켜보기보다 믿을 방법 만들기, 편을 가르기보다 끝까지 듣기, 느린 사람을 두고 가지 않기.</p>" +
      "<p>어차피몬은 혼자 힘으로는 이길 수 없는 상대였어요. 세 곳에서 모은 가치몬이 함께였기에 이겼어요. " +
      "교실 밖에서도 같아요. 누군가 <b>어차피</b>라고 말할 때, 옆 사람과 함께 <b>그래도</b>라고 말해 주세요.</p>",
  },
});

/* -----------------------------------------------------------
   박사님 의뢰 (goal·progress 의 s 는 그 학생의 저장본)
   ----------------------------------------------------------- */
MISSIONS.push(
  {
    id: "w1",
    stage: 3,
    title: "황무지의 첫 정화",
    desc: "구역에 서 있는 그림자몬에게 다가가, 한 마리를 정화하세요.",
    goal: function (s) { return caughtInStage(s, 3) >= 1; },
    progress: function (s) { return Math.min(caughtInStage(s, 3), 1) + " / 1"; },
    reward: { ball: "reason", count: 2, label: "근거볼 2개" },
  },
  {
    id: "w2",
    stage: 3,
    title: "울타리 세우기",
    desc: "감시 그림자몬 2마리를 정화하세요. (엿봐몬 · 줄세움몬)",
    goal: function (s) { return caughtOfType(s, "surveil") >= 2; },
    progress: function (s) { return caughtOfType(s, "surveil") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "w3",
    stage: 3,
    title: "믿음 되찾기",
    desc: "불신 그림자몬 2마리를 정화하세요. (못믿어몬 · 편가름몬)",
    goal: function (s) { return caughtOfType(s, "distrust") >= 2; },
    progress: function (s) { return caughtOfType(s, "distrust") + " / 2"; },
    reward: { ball: "reason", count: 1, label: "근거볼 1개" },
  },
  {
    id: "w4",
    stage: 3,
    title: "아무도 두고 가지 않기",
    desc: "소외 그림자몬 2마리를 정화하세요. (두고가몬 · 모른척몬)",
    goal: function (s) { return caughtOfType(s, "exclude") >= 2; },
    progress: function (s) { return caughtOfType(s, "exclude") + " / 2"; },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "w5",
    stage: 3,
    title: "여섯 번째 질문 쓰기",
    desc: "🌍 '모두가 그렇게 하면 어떻게 될까?'로 5문제를 맞히세요.",
    goal: function (s) { return (s.toolStats.everyone || { right: 0 }).right >= 5; },
    progress: function (s) {
      return Math.min((s.toolStats.everyone || { right: 0 }).right, 5) + " / 5";
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "w6",
    stage: 3,
    title: "황무지의 그림자를 모두 걷어내기",
    desc: "그림자몬 6마리를 모두 정화해 황무지 도감을 채우세요.",
    goal: function (s) {
      return regularMonsters(3).every(function (m) { return s.caught.indexOf(m.id) !== -1; });
    },
    progress: function (s) {
      const n = regularMonsters(3).filter(function (m) { return s.caught.indexOf(m.id) !== -1; }).length;
      return n + " / " + regularMonsters(3).length;
    },
    reward: { ball: "sure", count: 1, label: "확신볼 1개" },
  },
  {
    id: "w7",
    stage: 3,
    title: "그래도",
    desc: "황무지 한복판의 어차피몬을 정화하세요. 모은 가치몬들과 함께 싸워요.",
    goal: function (s) {
      const last = finalBossMonster(3);
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
    progress: function (s) {
      const last = finalBossMonster(3);
      if (!last) return "-";
      if (s.caught.indexOf(last.id) !== -1) return "1 / 1";
      return allRegularCaught(3) ? "지금 열렸어요!" : "0 / 1";
    },
  }
);

/* -----------------------------------------------------------
   증표 (한 번 얻으면 기록과 인쇄에 남는다)
   ----------------------------------------------------------- */
BADGES.push(
  {
    id: "b_surveil", stage: 3, name: "감시 증표", color: TYPES.surveil.accent, sprite: BADGE_SHIELD,
    desc: "지켜보는 눈이 누구를 위한 것인지 물어요.",
    goal: function (s) { return caughtOfType(s, "surveil") >= 2; },
  },
  {
    id: "b_distrust", stage: 3, name: "불신 증표", color: TYPES.distrust.accent, sprite: BADGE_SHIELD,
    desc: "확인할 것은 확인하고, 믿을 것은 믿어요.",
    goal: function (s) { return caughtOfType(s, "distrust") >= 2; },
  },
  {
    id: "b_exclude", stage: 3, name: "소외 증표", color: TYPES.exclude.accent, sprite: BADGE_SHIELD,
    desc: "느린 사람을 두고 가지 않아요.",
    goal: function (s) { return caughtOfType(s, "exclude") >= 2; },
  },
  {
    id: "b_dex3", stage: 3, name: "황무지 도감 증표", color: "#5a6b7d", sprite: BADGE_BOOK,
    desc: "잿빛 황무지의 그림자몬 여섯 마리를 모두 정화했어요.",
    goal: function (s) {
      return regularMonsters(3).every(function (m) { return s.caught.indexOf(m.id) !== -1; });
    },
  },
  {
    /* 가치몬을 많이 부른 것보다 알맞게 부른 것을 칭찬한다.
       말에 맞는 가치를 찾아내는 것이 마지막 싸움에서 배우는 일이기 때문이다. */
    id: "b_match", stage: 3, name: "짝꿍 증표", color: "#2f7d4f", sprite: BADGE_SPROUT,
    desc: "마지막 싸움에서 어차피몬의 말에 딱 맞는 가치몬을 다섯 번 찾아냈어요.",
    goal: function (s) { return (s.partyBestHits || 0) >= 5; },
  },
  {
    id: "b_geuraedo", stage: 3, name: "그래도지기 증표", color: "#c9a227", sprite: BADGE_CROWN,
    top: true,
    desc: "어차피몬을 정화했어요. '어차피' 대신 '그래도'라고 말하는 사람이에요.",
    goal: function (s) {
      const last = finalBossMonster(3);
      return !!last && s.caught.indexOf(last.id) !== -1;
    },
  }
);
