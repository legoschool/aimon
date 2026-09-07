/* ===========================================================
   AI몬스터 — 전투 (조우 → 문제풀이 → 포획 → 정화)

   캔버스는 몬스터 그림과 볼 애니메이션만 맡는다.
   글자(문제·해설·메뉴)는 전부 HTML 이다.
   한글 문제 지문은 게임보이 해상도에 물리적으로 안 들어가고,
   한글 픽셀 폰트는 오프라인에서 구할 수 없기 때문이다.
   =========================================================== */

const BALL_SPRITE = [
  "..kkkk..",
  ".kwwwwk.",
  "kwwwwwwk",
  "kkkkkkkk",
  "kkkaakkk",
  "kwwaawwk",
  ".kwwwwk.",
  "..kkkk..",
];
const BALL_PALETTE = { ".": "transparent", k: "#181818", w: "#f8f8f0", a: "#d94f4f" };

const CANVAS_SIZE = 320;
const MON_SCALE = 16; // 16×16 스프라이트를 16배 → 256px
const MON_OFFSET = (CANVAS_SIZE - 16 * MON_SCALE) / 2;

const battle = {
  monster: null,
  grip: 0,
  trust: 0,
  streak: 0,
  right: 0,
  asked: 0,
  usedIds: [],
  seenIds: [],
  lastId: null,
  question: null,
  tool: null,
  phase: "intro",
  purifying: false,
  monY: 0, // 흔들림·튀어오름 연출용 세로 오프셋
  monAlpha: 1,
  ball: null, // {x, y, visible, shake}
  ctx: null,
  dom: {},
  onEnd: null,
};

/* -----------------------------------------------------------
   시작
   ----------------------------------------------------------- */
function startBattle(monster, dom, onEnd) {
  battle.monster = monster;
  battle.grip = monster.maxGrip;
  battle.trust = BALANCE.maxTrust;
  battle.streak = 0;
  battle.right = 0;
  battle.asked = 0;
  battle.usedIds = [];
  battle.lastId = null;
  battle.question = null;
  battle.tool = null;
  battle.phase = "intro";
  battle.purifying = false;
  battle.monY = 0;
  battle.monAlpha = 1;
  battle.ball = null;
  battle.dom = dom;
  battle.onEnd = onEnd;

  if (!battle.ctx) {
    battle.ctx = setupCanvas(dom.canvas, CANVAS_SIZE, CANVAS_SIZE, 1);
  }

  save.battles++;
  writeSave();

  drawBattle();
  updateGauges();

  showMessage(
    "앗! 야생 <b>" + monster.name + "</b>이(가) 나타났다!",
    monster.desc,
    "맞설 준비를 한다",
    function () {
      battle.phase = "tool";
      // 첫 전투라면 도구와 상성을 먼저 알려준다.
      // 이미 본 학생이면 tutorialBattle 이 곧바로 renderToolChoice 를 부른다.
      tutorialBattle(monster, renderToolChoice);
    }
  );
}

/* -----------------------------------------------------------
   그리기
   ----------------------------------------------------------- */
function drawBattle() {
  const ctx = battle.ctx;
  if (!ctx || !battle.monster) return;

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // 바닥 그림자
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.beginPath();
  ctx.ellipse(CANVAS_SIZE / 2, CANVAS_SIZE - 40, 90, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  const m = battle.monster;
  const pal = paletteFor(m.type);
  const grid = battle.purifying ? m.purified.sprite : m.sprite;

  ctx.globalAlpha = battle.monAlpha;
  drawSprite(ctx, grid, pal, MON_OFFSET, MON_OFFSET + battle.monY, MON_SCALE, false);
  ctx.globalAlpha = 1;

  if (battle.ball && battle.ball.visible) {
    const b = battle.ball;
    drawSprite(ctx, BALL_SPRITE, BALL_PALETTE, b.x, b.y, 6, false);
  }
}

function updateGauges() {
  const m = battle.monster;
  const d = battle.dom;

  d.monName.textContent = m.name;
  d.monLv.textContent = "Lv." + m.level;
  d.monType.textContent = TYPES[m.type].name;
  d.monType.style.background = TYPES[m.type].accent;

  const gripPct = Math.max(0, (battle.grip / m.maxGrip) * 100);
  d.gripBar.style.width = gripPct + "%";
  d.gripBar.className = "bar" + (gripPct <= 30 ? " low" : "");
  d.gripText.textContent = Math.max(0, Math.round(battle.grip)) + " / " + m.maxGrip;

  const trustPct = Math.max(0, (battle.trust / BALANCE.maxTrust) * 100);
  d.trustBar.style.width = trustPct + "%";
  d.trustBar.className = "bar trust" + (trustPct <= 30 ? " low" : "");
  d.trustText.textContent = Math.max(0, Math.round(battle.trust));

  const acc = battle.asked > 0 ? Math.round((battle.right / battle.asked) * 100) : 0;
  d.scoreText.textContent = battle.right + " / " + battle.asked + " (" + acc + "%)";

  const check = canThrowBall(battle.grip, m.maxGrip, battle.right, battle.asked);
  d.catchHint.className = "catch-hint" + (check.ok ? " ready" : "");
  if (check.ok) {
    d.catchHint.textContent = "지금 판단볼을 던질 수 있어요!";
  } else if (!check.gripOk && !check.accOk) {
    d.catchHint.textContent = "장악력을 더 낮추고, 정답률도 60% 이상이어야 해요.";
  } else if (!check.gripOk) {
    d.catchHint.textContent = "장악력이 30% 이하로 내려가야 볼을 던질 수 있어요.";
  } else {
    d.catchHint.textContent = "정답률이 60% 이상이어야 볼을 던질 수 있어요.";
  }
}

/* -----------------------------------------------------------
   패널 — 메시지 / 도구선택 / 문제 / 해설 / 볼선택
   ----------------------------------------------------------- */
function panel() {
  return battle.dom.panel;
}

function showMessage(title, body, btnLabel, next) {
  const p = panel();
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "msg-box";

  const h = document.createElement("p");
  h.className = "msg-title";
  h.innerHTML = title;
  box.appendChild(h);

  if (body) {
    const b = document.createElement("p");
    b.className = "msg-body";
    b.textContent = body;
    box.appendChild(b);
  }

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = btnLabel || "다음";
  btn.onclick = function () {
    sfx("button");
    next();
  };
  box.appendChild(btn);

  p.appendChild(box);
  btn.focus();
}

/* ---- 도구 선택 ---- */
function renderToolChoice() {
  const p = panel();
  p.innerHTML = "";

  const avail = availableTools(battle.monster, battle.usedIds);

  const head = document.createElement("p");
  head.className = "panel-head";
  head.textContent = "어떤 판단 도구로 맞설까?";
  p.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "tool-grid";

  Object.keys(TOOLS).forEach(function (id) {
    const t = TOOLS[id];
    const mult = getTypeMultiplier(id, battle.monster.type);
    const left = getQuestions(battle.monster.type, id).filter(function (q) {
      return battle.usedIds.indexOf(q.id) === -1;
    }).length;
    const usable = avail.indexOf(id) !== -1;

    const btn = document.createElement("button");
    btn.className = "tool-btn" + (usable ? "" : " locked");
    btn.disabled = !usable;

    btn.innerHTML =
      '<span class="tool-icon">' + t.icon + "</span>" +
      '<span class="tool-name">' + t.name + "</span>" +
      '<span class="tool-desc">' + t.desc + "</span>" +
      '<span class="tool-meta">' +
      (mult === 1.5 ? '<b class="good">효과 굉장</b>' : mult === 0.5 ? '<b class="bad">효과 별로</b>' : "<b>보통</b>") +
      '<span class="tool-left">' + (usable ? "남은 문제 " + left : "문제 없음") + "</span>" +
      "</span>";

    btn.onclick = function () {
      askQuestion(id);
    };
    grid.appendChild(btn);
  });

  p.appendChild(grid);

  // 포획 / 도망
  const row = document.createElement("div");
  row.className = "action-row";

  const check = canThrowBall(battle.grip, battle.monster.maxGrip, battle.right, battle.asked);
  const throwBtn = document.createElement("button");
  throwBtn.className = "btn ball" + (check.ok ? "" : " locked");
  throwBtn.disabled = !check.ok;
  throwBtn.textContent = "🔮 판단볼 던지기";
  throwBtn.onclick = renderBallChoice;
  row.appendChild(throwBtn);

  const runBtn = document.createElement("button");
  runBtn.className = "btn ghost";
  runBtn.textContent = "도망가기";
  runBtn.onclick = function () {
    endBattle("run");
  };
  row.appendChild(runBtn);

  p.appendChild(row);

  if (avail.length === 0) {
    showMessage(
      "더 낼 문제가 없어요.",
      "이 몬스터에게 낼 수 있는 문제를 모두 맞혔어요. 오늘은 여기까지!",
      "돌아가기",
      function () {
        endBattle("dry");
      }
    );
  }
}

/* ---- 문제 내기 ---- */
function askQuestion(toolId) {
  // 방금 틀린 문제가 곧바로 또 나오면 지루하므로, 다른 게 있으면 그쪽을 먼저 낸다
  let q = null;
  if (battle.lastId) {
    const soft = battle.usedIds.concat([battle.lastId]);
    q = pickQuestion(battle.monster, toolId, soft, battle.seenIds);
  }
  if (!q) q = pickQuestion(battle.monster, toolId, battle.usedIds, battle.seenIds);
  if (!q) {
    renderToolChoice();
    return;
  }

  battle.question = q;
  battle.tool = toolId;
  battle.phase = "question";
  if (battle.seenIds.indexOf(q.id) === -1) battle.seenIds.push(q.id);

  const p = panel();
  p.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "q-wrap";

  const tag = document.createElement("div");
  tag.className = "q-tag";
  tag.innerHTML =
    "<span>" + TOOLS[toolId].icon + " " + TOOLS[toolId].name + "</span>" +
    (battle.seenIds.indexOf(q.id) !== -1 && save.wrongIds.indexOf(q.id) !== -1
      ? '<span class="again">다시 만난 문제</span>'
      : "");
  wrap.appendChild(tag);

  const sit = document.createElement("p");
  sit.className = "q-situation";
  sit.textContent = q.situation;
  wrap.appendChild(sit);

  const qt = document.createElement("p");
  qt.className = "q-question";
  qt.textContent = q.question;
  wrap.appendChild(qt);

  const list = document.createElement("div");
  list.className = "q-options";
  q.options.forEach(function (opt, i) {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = '<span class="opt-no">' + (i + 1) + "</span><span>" + opt + "</span>";
    b.onclick = function () {
      grade(i);
    };
    list.appendChild(b);
  });
  wrap.appendChild(list);

  p.appendChild(wrap);
}

/* ---- 채점 ---- */
function grade(choice) {
  const q = battle.question;
  const toolId = battle.tool;
  const correct = choice === q.answer;

  battle.asked++;
  battle.lastId = q.id;
  recordAnswer(q, toolId, correct);

  // 맞히면 풀에서 빠지고, 틀리면 풀로 돌아온다
  battle.usedIds = markAnswer(battle.usedIds, q.id, correct);

  let dmg = null;
  if (correct) {
    battle.right++;
    battle.streak++;
    dmg = calcDamage(toolId, battle.monster.type, battle.streak);
    battle.grip = Math.max(0, battle.grip - dmg.amount);
    sfx("correct");
    setTimeout(function () { sfx("hit"); }, 260);
    hitAnimation();
  } else {
    battle.streak = 0;
    battle.trust -= calcTrustLoss(toolId);
    sfx("wrong");
  }

  updateGauges();
  renderResult(correct, choice, dmg);
}

function renderResult(correct, choice, dmg) {
  const q = battle.question;
  const p = panel();
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "result-box " + (correct ? "ok" : "no");

  const head = document.createElement("p");
  head.className = "result-head";
  if (correct) {
    let extra = "";
    if (dmg.message) extra = " " + dmg.message;
    if (battle.streak >= 2) extra += " " + battle.streak + "연속 정답!";
    head.textContent = "정답!" + extra;
  } else {
    head.textContent = "아쉬워요. 신뢰도가 " + calcTrustLoss(battle.tool) + " 줄었어요.";
  }
  box.appendChild(head);

  if (!correct) {
    const yours = document.createElement("p");
    yours.className = "result-yours";
    yours.textContent = "고른 답: " + q.options[choice];
    box.appendChild(yours);

    const right = document.createElement("p");
    right.className = "result-right";
    right.textContent = "정답: " + q.options[q.answer];
    box.appendChild(right);

    const hint = document.createElement("p");
    hint.className = "result-hint";
    hint.textContent = q.wrongHint;
    box.appendChild(hint);
  }

  const ex = document.createElement("p");
  ex.className = "result-explain";
  ex.textContent = q.explanation;
  box.appendChild(ex);

  if (correct) {
    const d = document.createElement("p");
    d.className = "result-dmg";
    d.textContent =
      "장악력 " + dmg.amount + " 감소  (상성 ×" + dmg.typeMult + " · 콤보 ×" + dmg.comboMult + ")";
    box.appendChild(d);
  } else {
    const again = document.createElement("p");
    again.className = "result-dmg";
    again.textContent = "이 문제는 다시 나와요. 해설을 읽었으니 다음엔 맞힐 수 있어요.";
    box.appendChild(again);
  }

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = "계속하기";
  btn.onclick = afterResult;
  box.appendChild(btn);

  p.appendChild(box);
  btn.focus();
}

function afterResult() {
  if (battle.trust <= 0) {
    sfx("lose");
    showMessage(
      "신뢰도가 바닥났어요...",
      battle.monster.name + "이(가) 안개 속으로 사라졌어요. 해설을 떠올리며 다시 도전해 봐요.",
      "돌아가기",
      function () {
        endBattle("lose");
      }
    );
    return;
  }

  const check = canThrowBall(battle.grip, battle.monster.maxGrip, battle.right, battle.asked);
  if (check.ok) {
    showMessage(
      "<b>" + battle.monster.name + "</b>의 힘이 크게 약해졌어요!",
      "이제 판단볼을 던져 정화할 수 있어요.",
      "판단볼 고르기",
      function () {
        // 처음 던져 보는 학생에게만 조건을 설명한다
        tutorialCatch(renderBallChoice);
      }
    );
    return;
  }

  battle.phase = "tool";
  renderToolChoice();
}

/* ---- 볼 선택 ---- */
function renderBallChoice() {
  battle.phase = "ball";
  const p = panel();
  p.innerHTML = "";

  const head = document.createElement("p");
  head.className = "panel-head";
  head.textContent = "어떤 판단볼을 던질까?";
  p.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "ball-grid";

  Object.keys(BALLS).forEach(function (id) {
    const b = BALLS[id];
    const count = save.balls[id];
    const chance = calcCatchChance(
      battle.monster, battle.grip, battle.right, battle.asked, id, battle.streak
    );

    const btn = document.createElement("button");
    btn.className = "ball-btn" + (count > 0 ? "" : " locked");
    btn.disabled = count <= 0;
    btn.innerHTML =
      '<span class="ball-name">' + b.name + "</span>" +
      '<span class="ball-count">' + count + "개 남음</span>" +
      '<span class="ball-chance">성공 확률 약 ' + Math.round(chance * 100) + "%</span>";
    btn.onclick = function () {
      throwBall(id);
    };
    grid.appendChild(btn);
  });

  p.appendChild(grid);

  const row = document.createElement("div");
  row.className = "action-row";
  const back = document.createElement("button");
  back.className = "btn ghost";
  back.textContent = "문제를 더 풀기";
  back.onclick = function () {
    battle.phase = "tool";
    renderToolChoice();
  };
  row.appendChild(back);
  p.appendChild(row);
}

/* ---- 던지기 ---- */
function throwBall(ballId) {
  if (!spendBall(ballId)) {
    renderBallChoice();
    return;
  }

  const chance = calcCatchChance(
    battle.monster, battle.grip, battle.right, battle.asked, ballId, battle.streak
  );
  const caught = Math.random() < chance;
  const shakes = calcShakes(chance, caught);

  battle.phase = "throw";
  const p = panel();
  p.innerHTML = '<div class="msg-box"><p class="msg-title">' +
    BALLS[ballId].name + "을(를) 던졌다!</p></div>";

  sfx("throwBall");
  animateThrow(shakes, caught);
}

function animateThrow(shakes, caught) {
  // 1) 볼이 날아간다
  battle.ball = { x: 20, y: 250, visible: true };
  const startX = 20;
  const startY = 250;
  const endX = CANVAS_SIZE / 2 - 24;
  const endY = 110;

  let t = 0;
  const flight = setInterval(function () {
    t += 0.06;
    if (t >= 1) {
      clearInterval(flight);
      battle.ball.x = endX;
      battle.ball.y = endY;
      battle.monAlpha = 0; // 몬스터가 볼 안으로 빨려 들어간다
      drawBattle();
      setTimeout(function () {
        dropAndShake(shakes, caught, endX, endY);
      }, 260);
      return;
    }
    battle.ball.x = startX + (endX - startX) * t;
    battle.ball.y = startY + (endY - startY) * t - Math.sin(Math.PI * t) * 110;
    drawBattle();
  }, 16);
}

function dropAndShake(shakes, caught, bx, by) {
  // 2) 볼이 바닥으로 떨어진다
  const floorY = CANVAS_SIZE - 96;
  let y = by;
  const fall = setInterval(function () {
    y += 9;
    if (y >= floorY) {
      y = floorY;
      clearInterval(fall);
      battle.ball.y = y;
      drawBattle();
      setTimeout(function () {
        doShakes(shakes, caught, bx, floorY, 0);
      }, 320);
      return;
    }
    battle.ball.y = y;
    drawBattle();
  }, 16);
}

function doShakes(total, caught, bx, by, done) {
  if (done >= total) {
    if (caught) {
      setTimeout(function () { onCaught(); }, 380);
    } else {
      setTimeout(function () { onEscaped(total); }, 300);
    }
    return;
  }

  // 3) 한 번 흔든다 (좌 → 우 → 가운데)
  const seq = [-7, -7, 0, 7, 7, 0];
  let i = 0;
  sfx("shake");
  const shake = setInterval(function () {
    battle.ball.x = bx + seq[i];
    drawBattle();
    i++;
    if (i >= seq.length) {
      clearInterval(shake);
      setTimeout(function () {
        doShakes(total, caught, bx, by, done + 1);
      }, 300);
    }
  }, 55);
}

function onEscaped(shakes) {
  battle.ball = null;
  battle.monAlpha = 1;
  drawBattle();
  sfx("escape");

  const line =
    shakes >= 3 ? "아깝다! 세 번이나 흔들렸는데 튀어나왔어요."
    : shakes === 0 ? "볼이 그대로 튕겨 나왔어요."
    : shakes + "번 흔들리다 튀어나왔어요.";

  showMessage(
    line,
    "문제를 더 풀어 장악력을 낮추면 훨씬 잘 잡혀요.",
    "다시 맞서기",
    function () {
      if (totalBalls() <= 0) {
        showMessage(
          "판단볼이 다 떨어졌어요.",
          "일단 물러났다가 다시 도전해요.",
          "돌아가기",
          function () { endBattle("noball"); }
        );
        return;
      }
      battle.phase = "tool";
      renderToolChoice();
    }
  );
}

/* ---- 포획 성공 → 정화 ---- */
function onCaught() {
  battle.ball = null;
  markCaught(battle.monster.id);
  drawBattle();
  sfx("caught");

  showMessage(
    "잡았다! <b>" + battle.monster.name + "</b>을(를) 붙잡았어요!",
    "이제 정화해서 가치몬으로 되돌립니다.",
    "정화하기",
    playPurify
  );
}

function playPurify() {
  const p = panel();
  p.innerHTML = '<div class="msg-box"><p class="msg-title">정화하는 중...</p></div>';
  sfx("purify");

  // 그림자몬이 하얗게 사라졌다가, 같은 실루엣의 가치몬으로 돌아온다
  let a = 1;
  const out = setInterval(function () {
    a -= 0.08;
    battle.monAlpha = Math.max(a, 0);
    drawBattle();
    if (a <= 0) {
      clearInterval(out);
      battle.purifying = true;
      let b = 0;
      const inn = setInterval(function () {
        b += 0.08;
        battle.monAlpha = Math.min(b, 1);
        drawBattle();
        if (b >= 1) {
          clearInterval(inn);
          setTimeout(showPurified, 300);
        }
      }, 40);
    }
  }, 40);
}

function showPurified() {
  const m = battle.monster;
  const p = panel();
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "purify-box";

  const h = document.createElement("p");
  h.className = "purify-head";
  h.innerHTML = m.name + " → <b>" + m.purified.name + "</b>";
  box.appendChild(h);

  const d = document.createElement("p");
  d.className = "purify-desc";
  d.textContent = m.purified.desc;
  box.appendChild(d);

  const l = document.createElement("p");
  l.className = "purify-lesson";
  l.textContent = m.purified.lesson;
  box.appendChild(l);

  const note = document.createElement("p");
  note.className = "purify-note";
  note.textContent = "도감에 등록했어요. (" + dexCaughtCount() + " / " + MONSTERS.length + ")";
  box.appendChild(note);

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = "도감에 넣고 돌아가기";
  btn.onclick = function () {
    endBattle("caught");
  };
  box.appendChild(btn);

  p.appendChild(box);
  btn.focus();
}

/* ---- 맞았을 때 몬스터가 움찔 ---- */
function hitAnimation() {
  let n = 0;
  const seq = [6, -4, 3, 0];
  const t = setInterval(function () {
    battle.monY = seq[n];
    drawBattle();
    n++;
    if (n >= seq.length) clearInterval(t);
  }, 55);
}

function endBattle(reason) {
  const refilled = refillBalls();
  if (battle.onEnd) battle.onEnd(reason, refilled);
}
