/* ===========================================================
   AI몬스터 — 주제 · 판단 질문 · 상성표

   세 스테이지가 함께 쓰는 표다. 스테이지를 더하면 여기에
   주제(TYPES)와 질문(TOOLS)을 더하고, 상성표(TYPE_CHART)에 칸을 채운다.
   =========================================================== */

/* -----------------------------------------------------------
   주제 (몬스터 속성)

   stage 가 없으면 1스테이지 주제다.
   all 은 스테이지마다 있는 마지막 보스 전용이라 문제의 주제가 아니다.
   ----------------------------------------------------------- */
const TYPES = {
  /* --- 1스테이지 · AI 마을 : 내가 남에게 끼치는 해 (아이가 하는 쪽) --- */
  copyright: { id: "copyright", name: "저작권",   accent: "#3a6ea5" }, // 파랑
  privacy:   { id: "privacy",   name: "개인정보", accent: "#c9642a" }, // 주황
  disinfo:   { id: "disinfo",   name: "허위정보", accent: "#6b4a9e" }, // 보라

  /* --- 2스테이지 · 데이터 도시 : 나에게 보이지 않게 일어나는 일 (아이가 당하는 쪽) --- */
  bias:    { id: "bias",    name: "편향", accent: "#c2407a", stage: 2 }, // 자홍
  depend:  { id: "depend",  name: "의존", accent: "#2f8f8f", stage: 2 }, // 청록
  manipul: { id: "manipul", name: "조작", accent: "#c0392b", stage: 2 }, // 붉은색

  /* --- 3스테이지 · 잿빛 황무지 : 모두가 함께 만든 결과 (아이가 함께 바꾸는 쪽) --- */
  surveil:  { id: "surveil",  name: "감시", accent: "#3a9a4a", stage: 3 }, // 초록
  distrust: { id: "distrust", name: "불신", accent: "#4a54c8", stage: 3 }, // 남색
  exclude:  { id: "exclude",  name: "소외", accent: "#8a9a1e", stage: 3 }, // 올리브

  /* --- 마지막 보스 전용 --- */
  all: { id: "all", name: "모든 주제", accent: "#c9a227" }, // 금색
};

/* 문제의 주제 id 전부 — "all" 은 마지막 보스 전용이라 주제가 아니다 */
function topicIds() {
  return Object.keys(TYPES).filter(function (id) {
    return id !== "all";
  });
}

/* 그 스테이지의 주제들 (stage 가 없으면 1스테이지) */
function typesOfStage(stage) {
  return topicIds().filter(function (id) {
    return (TYPES[id].stage || 1) === stage;
  });
}

/* -----------------------------------------------------------
   판단 질문 = 포켓몬의 "기술" 자리

   이름을 답이 아니라 질문으로 둔다.

   예전에는 출처확인·권리존중·책임사용처럼 결론을 이름으로 썼다.
   그러면 아이가 도구를 고르는 순간 답의 모양을 통보받는다.
   "출처확인"을 골랐으면 정답은 당연히 확인하는 것이 된다.

   질문으로 바꾸면 무엇을 따져볼지만 정해지고 답은 알려주지 않는다.
   생각을 대신해 주지 않는 것이 이 게임이 하려는 일이다.

   스테이지마다 하나씩 늘어난다. 마을 넷 → 도시 다섯 → 황무지 여섯.
   stage 가 있으면 그 스테이지부터 보인다.
   ----------------------------------------------------------- */
const TOOLS = {
  verify: {
    id: "verify", name: "진짜일까?", icon: "🔍",
    desc: "이 말이 사실인지, 어디서 왔는지 따져본다.",
  },
  respect: {
    id: "respect", name: "누구의 것일까?", icon: "⚖️",
    desc: "이것에 주인이 있는지, 있다면 누구인지 살펴본다.",
  },
  ownership: {
    id: "ownership", name: "누가 다칠까?", icon: "🤝",
    desc: "내 행동으로 누가 어떤 영향을 받을지 헤아려본다.",
  },
  critique: {
    id: "critique", name: "나는 왜 이걸 하려 하지?", icon: "🧠",
    desc: "내 마음속 진짜 이유를 들여다본다.",
    /* 안전패: 틀려도 덜 다친다.
       자기 동기를 돌아보는 일은 틀려도 벌할 것이 아니다.
       데이터 도시의 "조작"에는 이 질문이 가장 세다.
       나를 붙잡아 두려는 설계를 깨는 건 결국 내가 왜 여기 있는지 묻는 일이다. */
    wrongDamageMultiplier: 0.5,
  },

  /* --- 데이터 도시에서 열린다 ---
     추천 화면, 자동 재생, 품절 알림은 앞의 넷으로 안 풀린다.
     "누가 다칠까?"는 내 행동의 피해자를 묻는데 나는 아무것도 안 했고,
     "나는 왜 이걸 하려 하지?"는 내 동기를 묻는데 따질 것은 만든 사람의 동기다. */
  purpose: {
    id: "purpose", name: "이건 누구를 위한 걸까?", icon: "🎯",
    desc: "이것이 누구에게 이롭게 만들어졌는지 따져본다.",
    stage: 2,
  },

  /* --- 잿빛 황무지에서 열린다 ---
     황무지는 누구 한 사람이 망가뜨린 곳이 아니다.
     "나 하나쯤이야"가 모두에게서 한꺼번에 일어난 곳이다.
     그래서 마지막 질문은 나를 넘어 모두를 그려 보게 한다. */
  everyone: {
    id: "everyone", name: "모두가 그렇게 하면 어떻게 될까?", icon: "🌍",
    desc: "나 하나만이 아니라 모두가 그렇게 할 때 어떤 세상이 될지 그려본다.",
    stage: 3,
  },
};

/* 이 스테이지에서 쓸 수 있는 질문만 추린다 */
function toolsForStage(stage) {
  return Object.keys(TOOLS).filter(function (id) {
    return !TOOLS[id].stage || TOOLS[id].stage <= stage;
  });
}

/* -----------------------------------------------------------
   상성표 — TYPE_CHART[질문][주제] = 데미지 배율

   주제마다 "효과 굉장"(1.5)인 질문이 하나, "효과 별로"(0.5)인 질문이 하나다.
     마을   진짜일까?→허위정보   누구의 것일까?→저작권   누가 다칠까?→개인정보
     도시   진짜일까?→의존       나는 왜?→조작            누구를 위한?→편향
     황무지 누구를 위한?→감시    모두가 그렇게 하면?→불신  누가 다칠까?→소외
   "나는 왜 이걸 하려 하지?" 는 마을에서 전부 1.0 이고 오답 피해가 절반이다.
   "모두가 그렇게 하면?" 은 약한 상대가 없다. 대신 황무지에서만 쓸 수 있다.
   ----------------------------------------------------------- */
const TYPE_CHART = {
  /*           저작권          개인정보       허위정보      편향       의존         조작          감시          불신           소외          전부 */
  verify:    { copyright: 0.5, privacy: 1.0, disinfo: 1.5, bias: 1.0, depend: 1.5, manipul: 0.5, surveil: 0.5, distrust: 0.5, exclude: 1.0, all: 1.0 },
  respect:   { copyright: 1.5, privacy: 0.5, disinfo: 1.0, bias: 0.5, depend: 1.0, manipul: 1.0, surveil: 1.0, distrust: 1.0, exclude: 0.5, all: 1.0 },
  ownership: { copyright: 1.0, privacy: 1.5, disinfo: 0.5, bias: 1.0, depend: 0.5, manipul: 1.0, surveil: 1.0, distrust: 1.0, exclude: 1.5, all: 1.0 },
  critique:  { copyright: 1.0, privacy: 1.0, disinfo: 1.0, bias: 1.0, depend: 1.0, manipul: 1.5, surveil: 1.0, distrust: 1.0, exclude: 1.0, all: 1.0 },
  purpose:   { copyright: 1.0, privacy: 1.0, disinfo: 0.5, bias: 1.5, depend: 1.0, manipul: 1.0, surveil: 1.5, distrust: 1.0, exclude: 1.0, all: 1.0 },
  everyone:  { copyright: 1.0, privacy: 1.0, disinfo: 1.0, bias: 1.0, depend: 1.0, manipul: 1.0, surveil: 1.0, distrust: 1.5, exclude: 1.0, all: 1.0 },
};

/* -----------------------------------------------------------
   정화한 가치몬이 판단 질문을 키운다

   잡아서 도감에 넣고 끝나면 도감은 목표일 뿐 도구가 되지 못한다.
   "배운 가치가 곧 내 판단력이 된다"가 이 게임의 주제이므로,
   가치몬은 자기 주제에 "효과 굉장"인 질문을 키운다. 상성표에서 저절로 나온다.
     확인지기·진실지기(허위정보) → 진짜일까?      출처지기·허락지기(저작권) → 누구의 것일까?
     동의지기·비밀지기(개인정보) → 누가 다칠까?    ...
   "나는 왜 이걸 하려 하지?" 는 특정 주제가 약점이 아니므로
   그 밖의 가치몬이 한 마리씩 조금(+5%) 키운다.

   세 스테이지를 지나면 몇몇 질문이 너무 세져서 상성을 따질 이유가 사라졌다.
   그래서 강해지는 폭에 한도(+50%)를 둔다. 황무지에서도 상성이 맞는 질문이 가장 세다.
   ----------------------------------------------------------- */
const TOOL_BOOST_PER = 0.15; // 자기 주제에 센 질문: 한 마리당 +15%
const CRITIQUE_BOOST_PER = 0.05; // "나는 왜?": 그 밖의 가치몬 한 마리당 +5%
const TOOL_BOOST_MAX = 1.5; // 아무리 커도 1.5배까지

/* 이 몬스터를 정화하면 크게 자라는 질문들 */
function toolsGrownBy(monster) {
  return Object.keys(TOOLS).filter(function (id) {
    return TYPE_CHART[id][monster.type] === 1.5;
  });
}

/* 몬스터 한 마리가 이 질문을 얼마나 키우는가 */
function boostFrom(monster, toolId) {
  if (toolsGrownBy(monster).indexOf(toolId) !== -1) return TOOL_BOOST_PER;
  if (toolId === "critique") return CRITIQUE_BOOST_PER;
  return 0;
}

/* 이 질문이 지금 얼마나 세졌는가 (1.0 이면 아직 그대로) */
function getToolBoost(toolId) {
  let b = 1;
  MONSTERS.forEach(function (m) {
    if (isCaught(m.id)) b += boostFrom(m, toolId);
  });
  return Math.min(TOOL_BOOST_MAX, Math.round(b * 100) / 100);
}

/* 그 질문을 키워 준 가치몬 이름들 (버튼에 이유를 보여 주려고) */
function boostSourceNames(toolId) {
  const named = [];
  let others = 0;
  MONSTERS.forEach(function (m) {
    if (!isCaught(m.id)) return;
    if (toolsGrownBy(m).indexOf(toolId) !== -1) named.push(m.purified.name);
    else if (toolId === "critique") others++;
  });
  if (others > 0) named.push((named.length ? "그 밖의 " : "") + "가치몬 " + others + "마리");
  return named;
}

/* 속성이 둘인 몬스터는 1.25 나 0.75 같은 어중간한 배율이 나온다.
   딱 떨어지는 값이 아니어도 문구가 나오도록 범위로 고른다. */
function effectMessage(mult) {
  if (mult >= 1.4) return "효과가 굉장했다!";
  if (mult >= 1.15) return "효과가 좋았다!";
  if (mult <= 0.6) return "효과가 별로였다...";
  if (mult <= 0.85) return "효과가 조금 약했다.";
  return "";
}

/* 콤보 배율 — 연속으로 맞힐수록 세진다 */
const COMBO_MULTIPLIER = [1.0, 1.0, 1.2, 1.4, 1.6]; // index = 연속 정답 수 (4 이상은 1.6 고정)

function getComboMultiplier(streak) {
  return COMBO_MULTIPLIER[Math.min(streak, 4)];
}

/* 속성이 둘인 몬스터는 두 배율의 평균을 쓴다.
   1.5 와 0.5 가 만나면 1.0 이 되어, "세게 때리려면 둘 다 맞는 질문을 찾아야 한다"가 된다. */
function getTypeMultiplier(toolId, monsterType, monsterType2) {
  const a = TYPE_CHART[toolId][monsterType];
  if (!monsterType2) return a;
  const b = TYPE_CHART[toolId][monsterType2];
  return Math.round(((a + b) / 2) * 100) / 100;
}
