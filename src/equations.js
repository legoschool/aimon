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

  /* --- 막 찍기 막기 ---
     벌을 신뢰도가 아니라 "시간"으로 준다.

     연속 오답에 신뢰도를 더 깎아 봤더니, 재 보니 정반대였다.
     찍는 아이는 어차피 76% 지고 있어서 달라지는 게 없고,
     정직하게 못 푸는 아이(정답률 50%)만 패배가 17%→21% 로 늘었다.
     맞히고 틀리고로 벌을 주면 결국 못 하는 아이를 때리게 된다.

     그래서 "잠금이 풀리자마자 튕기듯 누르는" 행동 자체만 잡는다.
     읽는 아이는 절대 걸리지 않고, 찍는 아이만 점점 느려진다. */
  instantMs: 700, // 잠금 해제 후 이 안에 누르면 안 읽은 것으로 본다
  instantAddMs: 1500, // 그때마다 다음 문제 읽기 시간이 이만큼 늘어난다
  instantAddMax: 6000, // 늘어나도 여기까지

  /* 잡으려면 적어도 이만큼은 풀어야 한다.
     두 문제를 운으로 맞혀 바로 던지는 길을 막고,
     몬스터 하나마다 최소 네 가지 상황은 겪게 한다. */
  minAskedToCatch: 4,

  /* --- 읽을 시간 ---
     문제가 뜨자마자는 보기를 고를 수 없다. 글자 수에 맞춰 잠깐 잠긴다.
     "빨리 풀어라"가 아니라 "빨리는 못 푼다"이므로,
     천천히 읽는 아이에게 불리하지 않다. 위쪽 한계만 있고 아래는 없다. */
  readBaseMs: 2200, // 기본으로 잠기는 시간
  readPerCharMs: 26, // 글자 하나당 더해지는 시간
  readMaxMs: 7000, // 아무리 길어도 여기까지
  reReadRatio: 0.5, // 전에 틀려서 다시 만난 문제는 절반만

  /* 해설도 읽게 한다. 배움은 해설에서 일어나므로 여기가 더 중요하다. */
  explainLockWrongMs: 3500, // 틀렸을 때
  explainLockRightMs: 1200, // 맞았을 때

  /* --- "왜?" 보너스 ---
     맞힌 뒤 가끔 "왜 그럴까?"를 한 번 더 묻는다.
     행동은 맞았는데 이유가 틀린 경우를 잡는 자리다.

     모든 문제에 물으면 분량과 시간이 두 배가 되므로 가끔만 나온다.
     맞히면 2배 공격, 틀려도 잃는 것은 없다.
     이유를 생각해 본 것 자체가 이미 얻은 것이라 벌하지 않는다. */
  whyChance: 0.35, // 맞힌 문제 중 이 비율로 보너스가 열린다
  whyBonusMultiplier: 2, // 이유까지 맞히면 그 문제의 데미지가 2배
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
  const boost = getToolBoost(toolId); // 정화한 가치몬이 키워 준 만큼
  return {
    amount: Math.round(BALANCE.baseDamage * typeMult * comboMult * boost),
    typeMult: typeMult,
    comboMult: comboMult,
    boost: boost,
    message: EFFECT_MESSAGE[typeMult] || "",
  };
}

/* 틀렸을 때 깎이는 신뢰도 — 언제나 같다.
   연속으로 틀린다고 더 깎지 않는다. 위 BALANCE 주석 참고. */
function calcTrustLoss(toolId) {
  const half = TOOLS[toolId].wrongDamageMultiplier || 1;
  return Math.round(BALANCE.wrongPenalty * half);
}

/* -----------------------------------------------------------
   읽을 시간

   문제가 뜨고 이만큼은 보기를 고를 수 없다.
   글이 길수록 길게 잠기고, 전에 틀려서 다시 만난 문제는 절반만 잠긴다.
   ----------------------------------------------------------- */
function calcReadMs(question, seenBefore, instantCount) {
  const chars =
    question.situation.length +
    question.question.length +
    question.options.reduce(function (sum, o) { return sum + o.length; }, 0);

  let ms = Math.min(BALANCE.readBaseMs + chars * BALANCE.readPerCharMs, BALANCE.readMaxMs);
  if (seenBefore) ms = Math.round(ms * BALANCE.reReadRatio);

  // 앞서 튕기듯 눌렀던 횟수만큼 더 오래 잠근다
  const extra = Math.min((instantCount || 0) * BALANCE.instantAddMs, BALANCE.instantAddMax);
  return ms + extra;
}

/* 잠금이 풀린 뒤 이만큼 안에 눌렀으면 읽지 않은 것으로 본다 */
function isInstantAnswer(msSinceUnlock) {
  return msSinceUnlock >= 0 && msSinceUnlock < BALANCE.instantMs;
}

/* 잡을 수 있는가 — 장악력·정답률에 더해 최소 문항 수까지 본다 */
function hasEnoughAnswers(asked) {
  return asked >= BALANCE.minAskedToCatch;
}

/* 해설을 읽을 시간 */
function calcExplainMs(isCorrect) {
  return isCorrect ? BALANCE.explainLockRightMs : BALANCE.explainLockWrongMs;
}

/* "왜?" 보너스를 열까?
   맞힌 문제에만, 그 문제에 why 가 달려 있을 때만, 가끔.
   첫 문제에는 열지 않는다 — 아직 게임에 익숙하지 않다. */
function shouldOfferWhy(question, isCorrect, asked) {
  if (!isCorrect || !question || !question.why) return false;
  if (asked <= 1) return false;
  return Math.random() < BALANCE.whyChance;
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
  const enoughOk = hasEnoughAnswers(asked);
  return {
    ok: gripOk && accOk && enoughOk,
    gripOk: gripOk,
    accOk: accOk,
    enoughOk: enoughOk,
    needMore: Math.max(0, BALANCE.minAskedToCatch - asked),
  };
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
