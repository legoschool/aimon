/* ===========================================================
   AI몬스터 — 판단 도구 & 상성표
   =========================================================== */

/* 몬스터 속성
   앞의 셋이 본편이고, all 은 마지막 보스 전용이다.
   세 주제를 관통하는 뿌리 — "스스로 생각하기를 멈춘 것" — 이라
   특정 주제에 묶이지 않는다. */
const TYPES = {
  copyright: { id: "copyright", name: "저작권",   accent: "#3a6ea5" }, // 파랑
  privacy:   { id: "privacy",   name: "개인정보", accent: "#c9642a" }, // 주황
  disinfo:   { id: "disinfo",   name: "허위정보", accent: "#6b4a9e" }, // 보라
  all:       { id: "all",       name: "모든 주제", accent: "#c9a227" }, // 금색

  /* --- 2스테이지 · 데이터 도시 ---
     1스테이지가 "내가 남에게 끼치는 해"라면 여기는
     "나에게 보이지 않게 일어나는 일"이다. 아이가 하는 쪽이 아니라 당하는 쪽이다. */
  bias:    { id: "bias",    name: "편향", accent: "#c2407a" }, // 자홍
  depend:  { id: "depend",  name: "의존", accent: "#2f8f8f" }, // 청록
  manipul: { id: "manipul", name: "조작", accent: "#c0392b" }, // 붉은색
};

/* -----------------------------------------------------------
   판단 도구 4종 = 포켓몬의 "기술 4개" 자리

   이름을 답이 아니라 질문으로 둔다.

   예전에는 출처확인·권리존중·책임사용처럼 결론을 이름으로 썼다.
   그러면 아이가 도구를 고르는 순간 답의 모양을 통보받는다.
   "출처확인"을 골랐으면 정답은 당연히 확인하는 것이 된다.

   질문으로 바꾸면 무엇을 따져볼지만 정해지고 답은 알려주지 않는다.
   생각을 대신해 주지 않는 것이 이 게임이 하려는 일이다.
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
     앞의 넷으로는 안 풀리는 상황이 있다.
     추천 화면, 자동 재생, 품절 알림, 붙잡는 챗봇.
     "누가 다칠까?"는 내 행동의 피해자를 묻는데 나는 아무것도 안 했고,
     "나는 왜 이걸 하려 하지?"는 내 동기를 묻는데 따질 것은 만든 사람의 동기다.
     그래서 다섯 번째가 필요하다. */
  purpose: {
    id: "purpose", name: "이건 누구를 위한 걸까?", icon: "🎯",
    desc: "이것이 누구에게 이롭게 만들어졌는지 따져본다.",
    stage: 2, // 1스테이지에서는 보이지 않는다
  },
};

/* 이 스테이지에서 쓸 수 있는 도구만 추린다 */
function toolsForStage(stage) {
  return Object.keys(TOOLS).filter(function (id) {
    return !TOOLS[id].stage || TOOLS[id].stage <= stage;
  });
}

/* -----------------------------------------------------------
   상성표 — TYPE_CHART[도구][몬스터속성] = 데미지 배율

   앞의 3개는 가위바위보 순환이라 아이들이 금방 익힌다.
       "진짜일까?"      → 허위정보
       "누구의 것일까?"  → 저작권
       "누가 다칠까?"    → 개인정보
   "나는 왜 이걸 하려 하지?" 는 전부 1.0. 대신 오답 피해가 절반이다.
   ----------------------------------------------------------- */
const TYPE_CHART = {
  /*            저작권  개인정보  허위정보  편향   의존   조작   전부 */
  verify:    { copyright: 0.5, privacy: 1.0, disinfo: 1.5, bias: 1.0, depend: 1.5, manipul: 0.5, all: 1.0 },
  respect:   { copyright: 1.5, privacy: 0.5, disinfo: 1.0, bias: 0.5, depend: 1.0, manipul: 1.0, all: 1.0 },
  ownership: { copyright: 1.0, privacy: 1.5, disinfo: 0.5, bias: 1.0, depend: 0.5, manipul: 1.0, all: 1.0 },
  critique:  { copyright: 1.0, privacy: 1.0, disinfo: 1.0, bias: 1.0, depend: 1.0, manipul: 1.5, all: 1.0 },
  purpose:   { copyright: 1.0, privacy: 1.0, disinfo: 0.5, bias: 1.5, depend: 1.0, manipul: 1.0, all: 1.0 },
};

/* -----------------------------------------------------------
   정화한 가치몬이 판단 도구를 키운다

   잡아서 도감에 넣고 끝나면 도감은 목표일 뿐 도구가 되지 못한다.
   "배운 가치가 곧 내 판단력이 된다"가 이 게임의 주제이므로,
   그 주제를 정화할수록 그 주제에 강한 도구가 세지게 한다.

     허위정보 가치몬(확인지기·진실지기) → 🔍 "진짜일까?"
     저작권   가치몬(출처지기·허락지기) → ⚖️ "누구의 것일까?"
     개인정보 가치몬(동의지기·비밀지기) → 🤝 "누가 다칠까?"
     🧠 "나는 왜 이걸 하려 하지?" 는 특정 주제가 없으므로
        "전체 정화 수"로 천천히 큰다.
   ----------------------------------------------------------- */
const TOOL_BOOST_TYPE = {
  verify: "disinfo",
  respect: "copyright",
  ownership: "privacy",
  critique: null, // 전체 정화 수로 큰다
  purpose: "bias", // 편향 가치몬(두루지기·저마다지기)이 키운다
};

const TOOL_BOOST_PER = 0.15; // 같은 주제 한 마리당 배율 +0.15
const CRITIQUE_BOOST_PER = 0.05; // "나는 왜?" 는 아무 몬스터나 한 마리당 +0.05

/* 이 도구가 지금 얼마나 세졌는가 (1.0 이면 아직 그대로) */
function getToolBoost(toolId) {
  const type = TOOL_BOOST_TYPE[toolId];
  if (!type) {
    return 1 + dexCaughtCount() * CRITIQUE_BOOST_PER;
  }
  const n = MONSTERS.filter(function (m) {
    return m.type === type && isCaught(m.id);
  }).length;
  return 1 + n * TOOL_BOOST_PER;
}

/* 그 도구를 키워 주는 가치몬 이름들 (화면에 이유를 보여 주려고) */
function boostSourceNames(toolId) {
  const type = TOOL_BOOST_TYPE[toolId];
  if (!type) {
    return dexCaughtCount() > 0 ? ["정화한 가치몬 " + dexCaughtCount() + "마리"] : [];
  }
  return MONSTERS.filter(function (m) {
    return m.type === type && isCaught(m.id);
  }).map(function (m) {
    return m.purified.name;
  });
}

/* 배율에 따라 띄우는 문구 (1세대 "효과가 굉장했다!" 자리) */
const EFFECT_MESSAGE = {
  1.5: "효과가 굉장했다!",
  1.0: "",
  0.5: "효과가 별로였다...",
};

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

/* 데이터 도시의 몬스터는 속성을 둘 가질 수 있다.
   상성이 반쪽만 맞으므로 어떤 질문을 쓸지 고르는 일 자체가 어려워진다.
   두 배율의 평균을 쓴다. 1.5 와 0.5 가 만나면 1.0 이 되어,
   "세게 때리려면 둘 다 맞는 질문을 찾아야 한다"가 된다. */
function getTypeMultiplier(toolId, monsterType, monsterType2) {
  const a = TYPE_CHART[toolId][monsterType];
  if (!monsterType2) return a;
  const b = TYPE_CHART[toolId][monsterType2];
  return Math.round(((a + b) / 2) * 100) / 100;
}
