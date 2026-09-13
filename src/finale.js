/* ===========================================================
   AI몬스터 — 마지막 싸움 : 어차피몬과 가치몬들

   황무지의 마지막 보스는 볼로 잡지 않는다.
   세 곳을 지나며 모은 가치몬이 함께 싸운다.

   한 차례는 이렇게 흐른다.
     1) 어차피몬이 "어차피 ~" 하고 말을 건다
     2) 그 말에 맞설 가치몬 하나를 골라 내보낸다   (어떤 가치가 이 말에 맞는지 판단)
     3) 그 가치몬과 함께 할 대답을 고른다          (그 가치로 어떻게 답하는지 판단)

   맞히면 가치몬이 공격한다.
   이 말에 딱 맞는 가치몬이면 1.5배, 어울리면 1배, 빗나가면 0.5배다.
   한 번 싸운 가치몬은 쉰다. 한 가지 가치로는 못 이기고 여러 가치를 돌아가며 써야 한다.
   장악력이 0이 되면 모든 가치몬이 모여 함께 정화한다.

   틀려도 가치몬은 쉬지 않고, 그 말은 뒤에 다시 나온다 (전투 규칙과 같다).

   어차피몬의 말·대답·짝 가치몬은 data/stage3/finale.js 에 있다.
   이 파일은 그 표를 읽어 싸움을 진행할 뿐이다.
   =========================================================== */

const party = {
  turn: null, // 지금 어차피몬이 건 말 (FINALE.turns 의 한 칸)
  partner: null, // 내보낸 가치몬 (몬스터 객체)
  resting: [], // 한 번 싸우고 쉬는 몬스터 id
  doneTurns: [], // 맞혀서 끝난 말 id
  lastTurnId: null,
  fought: [], // 이번 싸움에서 함께 싸운 몬스터 id
  bestHits: 0, // 딱 맞는 가치몬과 함께 맞힌 횟수 (짝꿍 증표)
};

/* 이 몬스터는 가치몬과 함께 싸우는 보스인가 */
function isPartyBoss(monster) {
  return !!monster && !!monster.party;
}

/* 함께 싸울 수 있는 가치몬 — 정화한 몬스터 전부 (지금 싸우는 보스는 빼고) */
function partyMembers() {
  return MONSTERS.filter(function (m) {
    return isCaught(m.id) && m.id !== battle.monster.id;
  });
}

function partyIsResting(m) {
  return party.resting.indexOf(m.id) !== -1;
}

/* 이 말에 이 가치몬이 얼마나 맞는가: best / good / miss */
function partyMatch(turn, m) {
  if (turn.best.indexOf(m.purified.id) !== -1) return "best";
  if ((turn.good || []).indexOf(m.purified.id) !== -1) return "good";
  return "miss";
}

/* 이 말에 딱 맞는 가치몬 중 이 학생이 가진 것 (해설에 이름을 알려 주려고) */
function partyBestNames(turn) {
  return partyMembers()
    .filter(function (m) { return turn.best.indexOf(m.purified.id) !== -1; })
    .map(function (m) { return m.purified.name; });
}

/* -----------------------------------------------------------
   시작
   ----------------------------------------------------------- */
function startPartyBattle(monster, dom, onEnd) {
  resetBattle(monster, dom, onEnd, "party");
  party.turn = null;
  party.partner = null;
  party.resting = [];
  party.doneTurns = [];
  party.lastTurnId = null;
  party.fought = [];
  party.bestHits = 0;

  showMessage(
    "황무지 한복판에서 <b>" + monster.name + "</b>" + josa(monster.name, "이", "가") + " 일어났다!",
    monster.desc,
    "가치몬을 부른다",
    function () {
      tutorialParty(renderPartyTurn);
    }
  );
}

/* -----------------------------------------------------------
   어차피몬의 말 고르기
   아직 맞히지 못한 말 중에서, 딱 맞는 가치몬이 쉬지 않고 있는 말을 먼저 낸다.
   ----------------------------------------------------------- */
function pickPartyTurn() {
  let pool = FINALE.turns.filter(function (t) {
    return party.doneTurns.indexOf(t.id) === -1;
  });
  if (pool.length === 0) {
    // 말을 다 맞혔는데도 남았다면 처음부터 다시 돈다
    party.doneTurns = [];
    pool = FINALE.turns.slice();
  }
  if (pool.length > 1) {
    pool = pool.filter(function (t) { return t.id !== party.lastTurnId; });
  }
  const members = partyMembers();
  const ready = pool.filter(function (t) {
    return members.some(function (m) {
      return !partyIsResting(m) && t.best.indexOf(m.purified.id) !== -1;
    });
  });
  const from = ready.length > 0 ? ready : pool;
  return from[Math.floor(Math.random() * from.length)];
}

/* -----------------------------------------------------------
   1) 어차피몬이 말을 건다 → 누구를 내보낼까
   ----------------------------------------------------------- */
function renderPartyTurn() {
  clearLock();
  battle.phase = "party-pick";

  // 모두 한 번씩 싸웠으면 다시 힘을 모은다
  const members = partyMembers();
  if (members.length > 0 && members.every(partyIsResting)) {
    party.resting = [];
    showMessage(
      "가치몬들이 모두 한 번씩 싸웠어요.",
      "잠깐 숨을 고르고 다시 힘을 모읍니다. 이번에도 여러 가치몬과 돌아가며 맞서요.",
      "다시 맞서기",
      renderPartyTurn
    );
    return;
  }

  if (!party.turn) party.turn = pickPartyTurn();
  const turn = party.turn;

  const p = panel();
  p.innerHTML = "";

  const line = document.createElement("div");
  line.className = "boss-line";
  line.innerHTML =
    '<span class="bl-who">' + escapeHtml(battle.monster.name) + "</span>" +
    '<p class="bl-text">' + escapeHtml(turn.line) + "</p>";
  p.appendChild(line);

  const head = document.createElement("p");
  head.className = "panel-head";
  head.textContent = "이 말에 맞설 가치몬을 골라요. 한 번 싸운 가치몬은 쉬어요.";
  p.appendChild(head);

  buildHintBox(turn, p);

  // 스테이지별로 묶어 보여 준다 — 어디서 배운 가치인지 떠올리게
  for (let st = 1; st <= lastStage(); st++) {
    const group = members.filter(function (m) { return stageOf(m) === st; });
    if (group.length === 0) continue;

    const label = document.createElement("p");
    label.className = "party-group";
    label.textContent = stageName(st);
    p.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "party-grid";
    group.forEach(function (m) {
      const resting = partyIsResting(m);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "party-btn" + (resting ? " resting" : "");
      btn.disabled = resting;
      btn.innerHTML =
        '<img alt="" src="' + spriteToDataURL(m.purified.sprite, paletteFor(m.type), 2) + '">' +
        '<span class="pb-name">' + escapeHtml(m.purified.name) + "</span>" +
        (resting ? '<span class="pb-rest">쉬는 중</span>' : "");
      btn.onclick = function () {
        sfx("button");
        renderPartnerCheck(m);
      };
      grid.appendChild(btn);
    });
    p.appendChild(grid);
  }

  const row = document.createElement("div");
  row.className = "action-row";
  const runBtn = document.createElement("button");
  runBtn.className = "btn ghost";
  runBtn.textContent = "물러나기";
  runBtn.onclick = function () { endBattle("run"); };
  row.appendChild(runBtn);
  p.appendChild(row);
}

/* 고른 가치몬이 어떤 가치인지 한 번 읽고 정한다.
   이름만 보고 누르지 않게, 이 가치몬이 무엇을 지키는지 보여 준다. */
function renderPartnerCheck(m) {
  clearLock();
  const p = panel();
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "partner-card";
  box.innerHTML =
    '<img alt="" src="' + spriteToDataURL(m.purified.sprite, paletteFor(m.type), 4) + '">' +
    '<div class="pc-text">' +
    "<b>" + escapeHtml(m.purified.name) + "</b>" +
    '<span class="pc-from">' + escapeHtml(stageName(stageOf(m))) + " · " + escapeHtml(m.name) + "에서 정화</span>" +
    '<p class="pc-desc">' + escapeHtml(m.purified.desc) + "</p>" +
    '<p class="pc-lesson">' + escapeHtml(m.purified.lesson) + "</p>" +
    "</div>";
  p.appendChild(box);

  const line = document.createElement("p");
  line.className = "partner-ask";
  line.innerHTML =
    "어차피몬의 말: <b>" + escapeHtml(party.turn.line) + "</b><br>" +
    escapeHtml(m.purified.name) + josa(m.purified.name, "과", "와") + " 함께 맞설까요?";
  p.appendChild(line);

  const row = document.createElement("div");
  row.className = "action-row";
  const go = document.createElement("button");
  go.className = "btn primary";
  go.textContent = "함께 맞서기";
  go.onclick = function () {
    sfx("button");
    party.partner = m;
    askPartyQuestion();
  };
  row.appendChild(go);
  const back = document.createElement("button");
  back.className = "btn ghost";
  back.textContent = "다시 고르기";
  back.onclick = function () {
    sfx("button");
    renderPartyTurn();
  };
  row.appendChild(back);
  p.appendChild(row);
  go.focus();
}

/* -----------------------------------------------------------
   2) 가치몬과 함께 할 대답 고르기
   ----------------------------------------------------------- */
function askPartyQuestion() {
  const turn = party.turn;
  const m = party.partner;
  battle.phase = "party-question";

  // 읽기 잠금·튕겨 누르기 감지는 보통 전투와 같은 식을 쓴다
  const asQuestion = {
    situation: turn.line,
    question: m.purified.name + josa(m.purified.name, "과", "와") + " 함께 뭐라고 대답할까?",
    options: turn.options,
  };
  const seenBefore = battle.seenIds.indexOf(turn.id) !== -1;
  if (!seenBefore) battle.seenIds.push(turn.id);

  const p = panel();
  p.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "q-wrap";

  const tag = document.createElement("div");
  tag.className = "q-tag";
  tag.innerHTML =
    '<img class="q-partner" alt="" src="' + spriteToDataURL(m.purified.sprite, paletteFor(m.type), 2) + '">' +
    "<span>" + escapeHtml(m.purified.name) + josa(m.purified.name, "이", "가") + " 나섰어요</span>" +
    (seenBefore ? '<span class="again">다시 만난 말</span>' : "");
  wrap.appendChild(tag);

  const sit = document.createElement("p");
  sit.className = "q-situation boss-quote";
  sit.textContent = battle.monster.name + ": " + turn.line;
  wrap.appendChild(sit);

  const qt = document.createElement("p");
  qt.className = "q-question";
  qt.textContent = asQuestion.question;
  wrap.appendChild(qt);

  buildHintBox(turn, wrap);

  const list = document.createElement("div");
  list.className = "q-options";
  turn.options.forEach(function (opt, i) {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = '<span class="opt-no">' + (i + 1) + "</span><span>" + escapeHtml(opt) + "</span>";
    b.onclick = function () { gradeParty(i); };
    list.appendChild(b);
  });
  wrap.appendChild(list);
  p.appendChild(wrap);

  lockUntilRead(
    wrap,
    Array.prototype.slice.call(list.querySelectorAll(".opt")),
    calcReadMs(asQuestion, seenBefore, battle.instantCount),
    "말을 읽어요",
    true
  );
}

/* -----------------------------------------------------------
   3) 채점
   ----------------------------------------------------------- */
function gradeParty(choice) {
  const turn = party.turn;
  const m = party.partner;
  const correct = choice === turn.answer;
  const match = partyMatch(turn, m);

  battle.asked++;
  recordTopicAnswer(turn.topic, correct);

  const instant = isInstantAnswer(msSinceUnlock());
  if (instant) battle.instantCount++;
  resetUnlock();

  let amount = 0;
  let loss = 0;
  if (correct) {
    battle.right++;
    battle.streak++;
    amount = Math.round(FINALE.baseDamage * FINALE.match[match] * getComboMultiplier(battle.streak));
    battle.grip = Math.max(0, battle.grip - amount);
    party.resting.push(m.id);
    if (party.fought.indexOf(m.id) === -1) party.fought.push(m.id);
    if (match === "best") party.bestHits++;
    party.doneTurns.push(turn.id);
    sfx("correct");
    setTimeout(function () { sfx("hit"); }, 260);
    hitAnimation();
  } else {
    battle.streak = 0;
    loss = BALANCE.wrongPenalty;
    battle.trust -= loss;
    sfx("wrong");
  }
  party.lastTurnId = turn.id;

  updateGauges();
  renderPartyResult(correct, choice, amount, loss, match, instant);
}

function renderPartyResult(correct, choice, amount, loss, match, instant) {
  const turn = party.turn;
  const m = party.partner;
  const p = panel();
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "result-box " + (correct ? "ok" : "no");

  const head = document.createElement("p");
  head.className = "result-head";
  if (correct) {
    const say = {
      best: m.purified.name + josa(m.purified.name, "이", "가") + " 딱 맞았어요! 효과가 굉장했다!",
      good: m.purified.name + josa(m.purified.name, "과", "와") + " 잘 맞섰어요!",
      miss: "대답은 맞았어요. 그런데 효과가 별로였다...",
    };
    head.textContent = say[match] + (battle.streak >= 2 ? " " + battle.streak + "연속!" : "");
  } else {
    head.textContent = "아쉬워요. 신뢰도가 " + loss + " 줄었어요.";
  }
  box.appendChild(head);

  if (instant) {
    const warn = document.createElement("p");
    warn.className = "result-warn";
    warn.textContent = "너무 빨리 골랐어요. 다음 말은 읽을 시간이 조금 더 길어져요.";
    box.appendChild(warn);
  }

  if (!correct) {
    const yours = document.createElement("p");
    yours.className = "result-yours";
    yours.textContent = "고른 대답: " + turn.options[choice];
    box.appendChild(yours);
    const right = document.createElement("p");
    right.className = "result-right";
    right.textContent = "좋은 대답: " + turn.options[turn.answer];
    box.appendChild(right);
  }

  const ex = document.createElement("p");
  ex.className = "result-explain";
  ex.textContent = turn.explanation;
  box.appendChild(ex);

  // 어떤 가치몬이 이 말에 딱 맞았는지 알려 준다. 다음에 고를 때의 실마리가 된다.
  const names = partyBestNames(turn);
  if (match !== "best" && names.length > 0) {
    const tip = document.createElement("p");
    tip.className = "result-hint party-tip";
    tip.textContent = "이 말에는 " + names.join(", ") + josa(names[names.length - 1], "이", "가") + " 딱 맞아요.";
    box.appendChild(tip);
  }

  const d = document.createElement("p");
  d.className = "result-dmg";
  d.textContent = correct
    ? "장악력 " + amount + " 감소  (" + m.purified.name + " ×" + FINALE.match[match] +
      " · 콤보 ×" + getComboMultiplier(battle.streak) + ")  " + m.purified.name + josa(m.purified.name, "은", "는") + " 잠깐 쉬어요."
    : "이 말은 다시 나와요. " + m.purified.name + josa(m.purified.name, "은", "는") + " 쉬지 않고 기다려요.";
  box.appendChild(d);

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = "계속하기";
  btn.onclick = afterPartyResult;
  box.appendChild(btn);

  p.appendChild(box);
  lockUntilRead(box, [btn], calcExplainMs(correct), "해설을 읽어요");
}

function afterPartyResult() {
  party.partner = null;

  if (battle.trust <= 0) {
    sfx("lose");
    showMessage(
      "신뢰도가 바닥났어요...",
      battle.monster.name + josa(battle.monster.name, "이", "가") +
        " 잿빛 안개 속으로 물러났어요. 해설을 떠올리며 가치몬들과 다시 도전해요.",
      "돌아가기",
      function () { endBattle("lose"); }
    );
    return;
  }

  if (battle.grip <= 0) {
    finishTogether();
    return;
  }

  party.turn = null;
  renderPartyTurn();
}

/* -----------------------------------------------------------
   마무리 — 모든 가치몬이 모여 함께 정화한다
   ----------------------------------------------------------- */
function finishTogether() {
  clearLock();
  battle.phase = "party-finish";
  const p = panel();
  p.innerHTML =
    '<div class="msg-box"><p class="msg-title">가치몬들이 모두 모여요!</p>' +
    '<p class="msg-body">함께 싸운 가치몬 ' + party.fought.length + "마리를 포함해 모은 가치몬 " +
    partyMembers().length + "마리가 한목소리로 말해요. \"그래도!\"</p></div>";

  // 몬스터를 둘러싸는 자리를 정해 둔다
  const members = partyMembers();
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const radius = 128;
  battle.fx.party = members.map(function (m, i) {
    const ang = -Math.PI / 2 + (Math.PI * 2 * i) / members.length;
    return {
      grid: m.purified.sprite,
      pal: paletteFor(m.type),
      x: cx + Math.cos(ang) * radius - 16,
      y: cy + Math.sin(ang) * radius - 16,
      alpha: 0,
    };
  });

  sfx("purify");
  let shown = 0;
  const timer = setInterval(function () {
    if (shown < battle.fx.party.length) {
      battle.fx.party[shown].alpha = 1;
      shown++;
      if (shown % 4 === 0) sfx("correct");
      drawBattle();
      return;
    }
    clearInterval(timer);

    markCaught(battle.monster.id);
    save.partyBest = Math.max(save.partyBest || 0, party.fought.length);
    save.partyBestHits = Math.max(save.partyBestHits || 0, party.bestHits);
    if (battle.asked > 0 && battle.right === battle.asked) save.perfectCatch = true;
    writeSave();

    setTimeout(playPurify, 350);
  }, 70);
}
