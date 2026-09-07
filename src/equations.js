/* ===========================================================
   AI몬스터 — 모든 수식

   게임의 숫자는 전부 여기 모여 있다.
   "너무 어렵다 / 너무 쉽다" 는 피드백이 오면 이 파일만 고치면 된다.
   =========================================================== */

const BALANCE = {
  baseDamage: 25, // 한 문제 맞혔을 때 기본 데미지
  maxTrust: 100, // 플레이어 신뢰도
  wrongPenalty: 15, // 틀렸을 때 깎이는 신뢰도
  catchGripRatio: 0.3, // 장악력이 이 비율 이하로 떨어져야 볼을 던질 수 있다
  catchMinAccuracy: 0.6, // 그리고 정답률이 이 이상이어야 한다
  maxCatchChance: 0.95, // 포획 확률 상한 (100% 는 없다)
};

/* 판단볼 3종 */
const BALLS = {
  basic: { id: "basic", name: "기본판단볼", rate: 1.0, start: 6 },
  reason: { id: "reason", name: "근거볼", rate: 1.5, start: 3 },
  sure: { id: "sure", name: "확신볼", rate: 2.5, start: 1 },
};

/* -----------------------------------------------------------
   데미지
   ----------------------------------------------------------- */
function calcDamage(toolId, monsterType, streak) {
  const typeMult = getTypeMultiplier(toolId, monsterType);
  const comboMult = getComboMultiplier(streak);
  return {
    amount: Math.round(BALANCE.baseDamage * typeMult * comboMult),
    typeMult: typeMult,
    comboMult: comboMult,
    message: EFFECT_MESSAGE[typeMult] || "",
  };
}

/* 틀렸을 때 깎이는 신뢰도 — 비판적사고는 절반만 다친다 */
function calcTrustLoss(toolId) {
  const half = TOOLS[toolId].wrongDamageMultiplier || 1;
  return Math.round(BALANCE.wrongPenalty * half);
}

/* -----------------------------------------------------------
   포획

   PokeRogue 의 젠6 공식에서 뼈대를 가져오되,
   운이 아니라 "얼마나 이해했는가" 가 결과를 정하도록 바꿨다.
     base        장악력을 얼마나 깎았는가
     accuracy    지금까지 정답률
     combo       마지막에 연속으로 맞혔는가
   ----------------------------------------------------------- */
function canThrowBall(grip, maxGrip, right, asked) {
  const gripOk = grip <= maxGrip * BALANCE.catchGripRatio;
  const accOk = asked > 0 && right / asked >= BALANCE.catchMinAccuracy;
  return { ok: gripOk && accOk, gripOk: gripOk, accOk: accOk };
}

function accuracyMultiplier(accuracy) {
  // 0.6 → 1.0 , 0.8 → 1.3 , 1.0 → 1.6  (사이는 직선으로 이어짐)
  if (accuracy <= 0.6) return 1.0;
  return 1.0 + ((accuracy - 0.6) / 0.4) * 0.6;
}

function calcCatchChance(monster, grip, right, asked, ballId, streak) {
  const M = monster.maxGrip;
  const H = Math.max(grip, 0);

  // 젠1 의 (3M-2H)/3M 을 세제곱한다.
  // 그냥 쓰면 던질 수 있게 되는 순간 이미 80% 라서 한 번에 잡히고,
  // 볼 3종도 전부 상한에 걸려 의미가 없어진다.
  // 세제곱하면 문턱에서 약 51%, 장악력을 0까지 깎으면 100% 가 되어
  // "조금만 더 풀면 잡겠다" 는 판단이 생긴다.
  const base = Math.pow((3 * M - 2 * H) / (3 * M), 3);

  const ball = BALLS[ballId].rate;
  const acc = accuracyMultiplier(asked > 0 ? right / asked : 0);
  const combo = streak >= 3 ? 1.2 : 1.0;
  return Math.min(base * ball * acc * combo, BALANCE.maxCatchChance);
}

/* -----------------------------------------------------------
   흔들림 횟수

   FullScreenPokemon 의 numBallShakes 방식.
   매번 주사위를 굴리는 게 아니라 "몇 번 흔들릴지" 를 먼저 정하고 보여준다.
   세 번 흔들리다 튀어나오는 아쉬움이 "조금만 더 풀면 잡겠다" 가 된다.
   ----------------------------------------------------------- */
function calcShakes(chance, caught) {
  if (caught) return 3; // 잡히면 세 번 흔들리고 멈춘다
  if (chance >= 0.6) return 3;
  if (chance >= 0.35) return 2;
  if (chance >= 0.15) return 1;
  return 0;
}

/* -----------------------------------------------------------
   결과 리포트용 등급
   ----------------------------------------------------------- */
function gradeOf(accuracy) {
  if (accuracy >= 0.9) return { label: "아주 잘함", tone: "best" };
  if (accuracy >= 0.75) return { label: "잘함", tone: "good" };
  if (accuracy >= 0.6) return { label: "보통", tone: "mid" };
  return { label: "더 연습해요", tone: "low" };
}
