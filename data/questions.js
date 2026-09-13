/* ===========================================================
   AI몬스터 — 상황 문제의 틀과 출제 도우미  (초등 5~6학년)

   문제는 스테이지 폴더에서 더한다.
     data/stage1/questions.js  AI 마을     (cr_ 저작권 · pv_ 개인정보 · df_ 허위정보)
     data/stage2/questions.js  데이터 도시 (bi_ 편향 · de_ 의존 · ma_ 조작)
     data/stage3/questions.js  잿빛 황무지 (sv_ 감시 · dt_ 불신 · ex_ 소외)

   이 문항들은 "착한 답 고르기"가 되지 않도록 썼다.

   ★ 문항을 새로 쓸 때 꼭 지킬 것 ★
     1) 오답 중 하나는 "생각 있는 아이도 고를 만한" 것이어야 한다.
        나머지 셋이 대놓고 나쁜 보기면 상황을 읽을 이유가 없어진다.
     2) 상황 속 구체적인 사실이 답을 정해야 한다.
        상황을 가리고 보기만 봐도 답이 보이면 그 문항은 실패다.
     3) "하지 마라 / 물어봐라"가 늘 정답이면 안 된다.
        지나친 조심이 오답인 문항, 가만히 있는 것이 오답인 문항을 섞는다.
     4) 정답 번호를 골고루 흩어라. 보너스(why)의 정답 번호도 흩어라.
     5) 정답 보기가 가장 긴 보기가 되면 안 된다. 네 보기의 길이를 비슷하게 맞춰라.
        (예전에는 정답이 가장 긴 문항이 많아서 "가장 긴 보기만 고르기"로 잡는 기준을 넘겼다)
     6) 한 주제에서 질문(tool)마다 적어도 2문항을 둔다. 모자라면 전투 중 그 버튼이 금방 잠긴다.

   각 문항이 담는 것
     id          주제 머리글자 + 번호 (기록·복습이 이 이름으로 문항을 찾는다. 바꾸지 않는다)
     type        주제 (data/tools.js 의 TYPES)
     tool        이 질문으로 풀리는 문제 (data/tools.js 의 TOOLS)
     level       easy | hard  (몬스터 레벨이 스테이지의 hardFromLevel 이상이면 hard 를 먼저 낸다)
     stage       스테이지 번호 (없으면 1)
     situation   답을 가르는 사실이 들어 있는 상황
     question / options(4개) / answer(0부터 셈)
     explanation 맞든 틀리든 보여 주는 해설
     wrongHint   틀렸을 때만 붙는 한마디
     hint        생각 열쇠 — 답 대신 되묻는 질문
     why         보너스 — 맞힌 뒤 가끔 나오는 "왜 그럴까?" (2배 공격)

   선생님께
     스테이지 폴더의 questions.js 만 고치면 문항이 바뀝니다. answer 는 0부터 셉니다.
     고친 뒤에는 node tools/check.js 로 점검하고, node tools/make-question-table.js 로
     문항표.md 를 다시 만듭니다. 문항표를 손으로 고치면 다음에 만들 때 사라집니다.
   =========================================================== */

const QUESTIONS = [];

/* -----------------------------------------------------------
   조회 도우미

   ★ 틀린 문항 되돌려 넣기 ★
   맞힌 문항은 그 판에서 빠지지만, 틀린 문항은 풀로 돌아온다.
   해설을 방금 읽었으니 다시 만나 맞히고 넘어가라는 뜻이다.
   ----------------------------------------------------------- */

/* 이 스테이지에서, 이 속성에, 이 도구로 낼 수 있는 문항.

   속성이 둘인 몬스터는 두 속성의 문항을 모두 받는다.
   "all" 은 보스 전용이라 그 스테이지의 문항을 전부 받는다.
   예전 문항에는 stage 가 없으므로 없으면 1로 본다. */
function getQuestions(typeId, toolId, type2, stage) {
  const st = stage || currentStage();
  return QUESTIONS.filter(function (q) {
    if ((q.stage || 1) !== st) return false;
    if (q.tool !== toolId) return false;
    if (typeId === "all") return true;
    return q.type === typeId || (type2 && q.type === type2);
  });
}

/* 몬스터에게 낼 다음 문항 하나 고르기
     usedIds : 이번 판에서 "맞혀서" 빠진 문항 id  (틀린 것은 여기 넣지 않는다)
     seenIds : 이번 게임 전체에서 한 번이라도 나온 문항 id
     반환 null 이면 그 도구는 더 쓸 문항이 없다 → 버튼 잠금 */
function pickQuestion(monster, toolId, usedIds, seenIds) {
  let pool = getQuestions(monster.type, toolId, monster.type2, stageOf(monster))
    .filter((q) => !usedIds.includes(q.id));
  if (pool.length === 0) return null;

  // 마지막 보스는 내가 약한 곳을 찌른다 — 전에 틀렸던 문항을 먼저 낸다.
  // 보스답기도 하고, 마지막 복습이 되기도 한다.
  if (monster.finalBoss) {
    const weak = pool.filter((q) => save.wrongIds.includes(q.id));
    if (weak.length > 0) {
      return weak[Math.floor(Math.random() * weak.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // 1순위: 이번 게임에서 아직 한 번도 안 나온 문항
  if (seenIds && seenIds.length) {
    const fresh = pool.filter((q) => !seenIds.includes(q.id));
    if (fresh.length > 0) pool = fresh;
  }

  // 2순위: Lv.8 이상은 어려운 문항을 먼저. 없으면 쉬운 것으로 채운다.
  // 데이터 도시는 레벨이 통째로 높으므로 기준도 함께 올린다
  const want = monster.level >= (stageData(stageOf(monster)).hardFromLevel || 8) ? "hard" : "easy";
  const preferred = pool.filter((q) => q.level === want);
  const from = preferred.length > 0 ? preferred : pool;

  return from[Math.floor(Math.random() * from.length)];
}

/* 채점 결과를 usedIds 에 반영한다.
     맞혔으면 빼고(다시 안 나옴), 틀렸으면 되돌려 넣는다(다시 나옴). */
function markAnswer(usedIds, questionId, isCorrect) {
  if (isCorrect) {
    return usedIds.includes(questionId) ? usedIds : usedIds.concat(questionId);
  }
  return usedIds.filter((id) => id !== questionId);
}

/* 이번 판에서 아직 쓸 수 있는 도구만 추리기 (문항이 남아 있는 도구) */
function availableTools(monster, usedIds) {
  return toolsForStage(stageOf(monster)).filter(
    (toolId) =>
      getQuestions(monster.type, toolId, monster.type2, stageOf(monster))
        .some((q) => !usedIds.includes(q.id))
  );
}
