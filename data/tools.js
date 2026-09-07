/* ===========================================================
   AI몬스터 — 판단 도구 & 상성표
   =========================================================== */

/* 몬스터 속성 3종 */
const TYPES = {
  copyright: { id: "copyright", name: "저작권",   accent: "#3a6ea5" }, // 파랑
  privacy:   { id: "privacy",   name: "개인정보", accent: "#c9642a" }, // 주황
  disinfo:   { id: "disinfo",   name: "허위정보", accent: "#6b4a9e" }, // 보라
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
  verify:    { disinfo: 1.5, copyright: 0.5, privacy: 1.0 },
  respect:   { copyright: 1.5, privacy: 0.5, disinfo: 1.0 },
  ownership: { privacy: 1.5, disinfo: 0.5, copyright: 1.0 },
  critique:  { copyright: 1.0, privacy: 1.0, disinfo: 1.0 },
};

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
