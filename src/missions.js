/* ===========================================================
   AI몬스터 — 의뢰 확인과 보상

   전투가 끝날 때마다 확인해서, 새로 달성한 의뢰가 있으면
   보상을 주고 화면에 알린다.
   =========================================================== */

function missionDone(id) {
  return save.missionsDone.indexOf(id) !== -1;
}

function missionsCleared() {
  return missionsOfStage().filter(function (m) {
    return missionDone(m.id);
  }).length;
}

/* 새로 달성한 의뢰를 찾아 보상을 주고, 그 목록을 돌려준다 */
function checkMissions() {
  const justDone = [];

  missionsOfStage().forEach(function (m) {
    if (missionDone(m.id)) return;
    if (!m.goal(save)) return;

    save.missionsDone.push(m.id);
    if (m.reward && m.reward.ball) {
      save.balls[m.reward.ball] += m.reward.count;
    }
    justDone.push(m);
  });

  if (justDone.length > 0) writeSave();
  return justDone;
}

/* 지금 진행 중인 의뢰 하나 (화면 위 안내용) */
function currentMission() {
  return missionsOfStage().filter(function (m) {
    return !missionDone(m.id);
  })[0] || null;
}

/* -----------------------------------------------------------
   의뢰 목록 화면
   ----------------------------------------------------------- */
function renderMissions(container) {
  container.innerHTML = "";

  const head = document.createElement("p");
  head.className = "sheet-note";
  head.innerHTML =
    "박사님이 부탁한 일이에요. 달성하면 <b>가치볼</b>을 받아요. " +
    "<b>" + missionsCleared() + " / " + MISSIONS.length + "</b> 완료";
  container.appendChild(head);

  missionsOfStage().forEach(function (m, i) {
    const done = missionDone(m.id);
    const card = document.createElement("div");
    card.className = "mission" + (done ? " done" : "");

    card.innerHTML =
      '<div class="ms-check">' + (done ? "✓" : i + 1) + "</div>" +
      '<div class="ms-body">' +
      '<p class="ms-title">' + m.title + "</p>" +
      '<p class="ms-desc">' + m.desc + "</p>" +
      '<p class="ms-foot">' +
      '<span class="ms-progress">' + m.progress(save) + "</span>" +
      (m.reward ? '<span class="ms-reward">보상 · ' + m.reward.label + "</span>" : "") +
      "</p>" +
      "</div>";

    container.appendChild(card);
  });
}
