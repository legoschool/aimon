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
};

/* 판단 도구 4종 = 포켓몬의 "기술 4개" 자리 */
const TOOLS = {
  verify: {
    id: "verify", name: "출처확인", icon: "🔍",
    desc: "이 정보가 어디서 왔는지 따져본다.",
  },
  respect: {
    id: "respect", name: "권리존중", icon: "⚖️",
    desc: "남이 만든 것에는 주인이 있다.",
  },
  ownership: {
    id: "ownership", name: "책임사용", icon: "🤝",
    desc: "내 행동이 남에게 어떤 영향을 줄지 생각한다.",
  },
  critique: {
    id: "critique", name: "비판적사고", icon: "🧠",
    desc: "잘 모를 땐 한 번 더 신중하게.",
    /* 안전패: 배율은 안 오르지만 틀려도 덜 다친다 */
    wrongDamageMultiplier: 0.5,
  },
};

/* -----------------------------------------------------------
   상성표 — TYPE_CHART[도구][몬스터속성] = 데미지 배율

   앞의 3개는 가위바위보 순환이라 아이들이 금방 익힌다.
       출처확인 → 허위정보 → (책임사용이 강함)
       권리존중 → 저작권
       책임사용 → 개인정보
   비판적사고는 전부 1.0. 대신 오답 피해가 절반.
   ----------------------------------------------------------- */
const TYPE_CHART = {
  verify:    { disinfo: 1.5, copyright: 0.5, privacy: 1.0, all: 1.0 },
  respect:   { copyright: 1.5, privacy: 0.5, disinfo: 1.0, all: 1.0 },
  ownership: { privacy: 1.5, disinfo: 0.5, copyright: 1.0, all: 1.0 },
  critique:  { copyright: 1.0, privacy: 1.0, disinfo: 1.0, all: 1.0 },
};

/* -----------------------------------------------------------
   정화한 가치몬이 판단 도구를 키운다

   잡아서 도감에 넣고 끝나면 도감은 목표일 뿐 도구가 되지 못한다.
   "배운 가치가 곧 내 판단력이 된다"가 이 게임의 주제이므로,
   그 주제를 정화할수록 그 주제에 강한 도구가 세지게 한다.

     허위정보 가치몬(확인지기·진실지기) → 🔍 출처확인
     저작권   가치몬(출처지기·허락지기) → ⚖️ 권리존중
     개인정보 가치몬(동의지기·비밀지기) → 🤝 책임사용
     🧠 비판적사고는 특정 주제가 없으므로 "전체 정화 수"로 천천히 큰다.
   ----------------------------------------------------------- */
const TOOL_BOOST_TYPE = {
  verify: "disinfo",
  respect: "copyright",
  ownership: "privacy",
  critique: null, // 전체 정화 수로 큰다
};

const TOOL_BOOST_PER = 0.15; // 같은 주제 한 마리당 배율 +0.15
const CRITIQUE_BOOST_PER = 0.05; // 비판적사고는 아무 몬스터나 한 마리당 +0.05

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

/* 콤보 배율 — 연속으로 맞힐수록 세진다 */
const COMBO_MULTIPLIER = [1.0, 1.0, 1.2, 1.4, 1.6]; // index = 연속 정답 수 (4 이상은 1.6 고정)

function getComboMultiplier(streak) {
  return COMBO_MULTIPLIER[Math.min(streak, 4)];
}

function getTypeMultiplier(toolId, monsterType) {
  return TYPE_CHART[toolId][monsterType];
}
