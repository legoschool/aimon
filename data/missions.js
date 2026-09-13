/* ===========================================================
   AI몬스터 — 박사님 의뢰(미션)의 틀

   도감만 있으면 목표가 막연하다.
   의뢰가 있으면 "오늘 수업에서 어디까지" 가 분명해진다.

   의뢰 자체는 스테이지 파일(data/stageN/stage.js)이 MISSIONS.push 로 더한다.
     id          저장본에 남는 이름 (바꾸면 이미 한 학생의 기록이 사라진다)
     stage       어느 스테이지의 의뢰인지
     goal(s)     달성했는지 (s = 그 학생의 저장본)
     progress(s) 화면에 보여줄 진행 상황
     reward      달성하면 주는 것 (없으면 생략)

   선생님께 — 수업 시간에 맞춰 스테이지 파일에서 의뢰 개수를 줄이거나 순서를 바꿔 쓰세요.
   =========================================================== */

const MISSIONS = [];

/* 그 스테이지에서 몇 마리를 정화했는지 */
function caughtInStage(s, stage) {
  return monstersOfStage(stage).filter(function (m) {
    return s.caught.indexOf(m.id) !== -1;
  }).length;
}

/* 어떤 속성(첫째 속성)을 몇 마리 정화했는지 */
function caughtOfType(s, typeId) {
  return MONSTERS.filter(function (m) {
    return m.type === typeId && s.caught.indexOf(m.id) !== -1;
  }).length;
}

/* 전체 정답률 */
function accuracyOf(s) {
  let r = 0;
  let a = 0;
  Object.keys(s.stats).forEach(function (k) {
    r += s.stats[k].right;
    a += s.stats[k].asked;
  });
  return a > 0 ? r / a : 0;
}

/* 지금 스테이지의 의뢰만 — 도시에 있는 아이에게 마을 의뢰를 보여 줄 이유가 없다 */
function missionsOfStage(stage) {
  return MISSIONS.filter(function (m) {
    return (m.stage || 1) === (stage || currentStage());
  });
}
