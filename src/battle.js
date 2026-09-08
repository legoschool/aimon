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
  lastTool: null, // 방금 쓴 도구 — 마지막 보스전에서는 연속으로 못 쓴다
  instantCount: 0, // 잠금이 풀리자마자 튕기듯 누른 횟수
  phase: "intro",
  purifying: false,
  monY: 0, // 흔들림·튀어오름 연출용 세로 오프셋
  monAlpha: 1,
  ball: null, // {x, y, visible, shake}
  fx: { flash: 0, rings: [], sparks: [], white: 0 }, // 정화 연출
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
  battle.lastTool = null;
  battle.instantCount = 0;
  resetUnlock();
  clearLock();
  battle.phase = "intro";
  battle.purifying = false;
  battle.monY = 0;
  battle.monAlpha = 1;
  battle.ball = null;
  battle.fx = { flash: 0, rings: [], sparks: [], white: 0 };
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
  const fx = battle.fx;
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;

  // 퍼져 나가는 빛의 고리 (몬스터 뒤)
  fx.rings.forEach(function (r) {
    ctx.globalAlpha = Math.max(0, r.life);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.w;
    ctx.beginPath();
    ctx.arc(cx, cy, r.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // 장악력이 깎일수록 몬스터가 흐릿해진다.
  // 0 이 되어도 완전히 지워지지 않고 옅게 남아서,
  // "약해졌지만 아직 사라지지 않았다" 를 눈으로 보여 준다.
  let monAlpha = battle.monAlpha;
  if (!battle.purifying) {
    const left = Math.max(0, battle.grip) / m.maxGrip;
    monAlpha = Math.min(monAlpha, 0.45 + 0.55 * left);
  }

  ctx.globalAlpha = monAlpha;
  drawSprite(ctx, grid, pal, MON_OFFSET, MON_OFFSET + battle.monY, MON_SCALE, false);
  ctx.globalAlpha = 1;

  // 하얗게 타오르는 실루엣 (정화되는 순간)
  if (fx.white > 0) {
    ctx.globalAlpha = Math.min(1, fx.white);
    drawSpriteSilhouette(ctx, grid, MON_OFFSET, MON_OFFSET + battle.monY, MON_SCALE, "#ffffff", false);
    ctx.globalAlpha = 1;
  }

  // 흩어지는 반짝이
  fx.sparks.forEach(function (s) {
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
  });
  ctx.globalAlpha = 1;

  if (battle.ball && battle.ball.visible) {
    const b = battle.ball;
    drawSprite(ctx, BALL_SPRITE, BALL_PALETTE, b.x, b.y, 6, false);
  }

  // 화면 전체가 번쩍
  if (fx.flash > 0) {
    ctx.globalAlpha = Math.min(1, fx.flash);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalAlpha = 1;
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
    d.catchHint.textContent = "지금 가치볼을 던질 수 있어요!";
  } else if (!check.enoughOk) {
    // "몇 문제를 더 풀어라"는 규칙이라 벌처럼 들린다.
    // "아직 안 사라졌다, 더 공격해라"는 목표라서 아이가 더 하고 싶어진다.
    d.catchHint.textContent = check.gripOk
      ? "장악력은 0이지만 아직 완전히 사라지지 않았어요! " +
        check.needMore + "번 더 맞혀서 완전히 몰아내요."
      : "아직 힘이 남아 있어요. " + check.needMore + "번은 더 맞혀야 해요.";
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

/* 읽는 동안 잠그는 장치는 src/readlock.js 에 있다 (복습 모드와 함께 쓴다) */

/* -----------------------------------------------------------
   생각 열쇠 — 답 대신 질문을 돌려준다

   보기를 지워 주는 힌트는 넣지 않는다. 그건 생각을 건너뛰게 만들어서
   이 게임이 하려는 일과 정반대다.
   대신 "무엇을 따져봐야 하는지"를 되묻는다.

   공짜이고 횟수 제한도 없다. 답을 주지 않으니 많이 볼수록 좋다.
   전에 틀린 적 있는 문제라면 처음부터 펼쳐 둔다 — 막힌 아이를 그냥 두지 않는다.
   (복습 모드도 이 함수를 쓴다)
   ----------------------------------------------------------- */
function buildHintBox(q, container) {
  if (!q.hint) return;

  const seenWrong = save.wrongIds.indexOf(q.id) !== -1;

  const box = document.createElement("div");
  box.className = "hint-box" + (seenWrong ? " open" : "");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hint-btn";
  btn.textContent = seenWrong ? "🔑 생각 열쇠" : "🔑 생각 열쇠 — 막히면 눌러요";
  box.appendChild(btn);

  const text = document.createElement("p");
  text.className = "hint-text";
  text.textContent = q.hint;
  box.appendChild(text);

  if (seenWrong) markHintUsed(q.id);

  btn.onclick = function () {
    sfx("button");
    box.classList.toggle("open");
    if (box.classList.contains("open")) markHintUsed(q.id);
  };

  container.appendChild(box);
}

function markHintUsed(id) {
  if (save.hintIds.indexOf(id) === -1) {
    save.hintIds.push(id);
    writeSave();
  }
}

function showMessage(title, body, btnLabel, next) {
  clearLock();
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
  clearLock();
  const p = panel();
  p.innerHTML = "";

  const avail = availableTools(battle.monster, battle.usedIds);

  // 마지막 보스에게는 한 가지 눈으로 맞설 수 없다.
  // 방금 쓴 도구는 다음 문제에서 잠긴다 — 네 관점을 번갈아 써야 이긴다.
  const isFinal = !!battle.monster.finalBoss;
  const blocked = isFinal ? battle.lastTool : null;

  const head = document.createElement("p");
  head.className = "panel-head";
  head.textContent = isFinal
    ? "생각멈춤몬에게는 한 가지 눈으로 맞설 수 없어요. 방금 쓴 도구는 잠깁니다."
    : "어떤 판단 도구로 맞설까?";
  p.appendChild(head);

  const grid = document.createElement("div");
  grid.className = "tool-grid";

  Object.keys(TOOLS).forEach(function (id) {
    const t = TOOLS[id];
    const mult = getTypeMultiplier(id, battle.monster.type);
    const left = getQuestions(battle.monster.type, id).filter(function (q) {
      return battle.usedIds.indexOf(q.id) === -1;
    }).length;
    const justUsed = blocked === id;
    const usable = avail.indexOf(id) !== -1 && !justUsed;

    const btn = document.createElement("button");
    btn.className = "tool-btn" + (usable ? "" : " locked");
    btn.disabled = !usable;

    // 정화한 가치몬이 이 도구를 키워 줬다면 알려 준다
    const boost = getToolBoost(id);
    const boostRow =
      boost > 1
        ? '<span class="tool-boost">▲ ' +
          Math.round((boost - 1) * 100) + "% 강해짐 · " +
          boostSourceNames(id).join(", ") +
          "</span>"
        : "";

    btn.innerHTML =
      '<span class="tool-icon">' + t.icon + "</span>" +
      '<span class="tool-name">' + t.name + "</span>" +
      '<span class="tool-desc">' + t.desc + "</span>" +
      boostRow +
      '<span class="tool-meta">' +
      (mult === 1.5 ? '<b class="good">효과 굉장</b>' : mult === 0.5 ? '<b class="bad">효과 별로</b>' : "<b>보통</b>") +
      '<span class="tool-left">' +
      (justUsed ? "방금 썼어요" : usable ? "남은 문제 " + left : "문제 없음") +
      "</span>" +
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
  throwBtn.textContent = "🔮 가치볼 던지기";
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
  battle.lastTool = toolId; // 마지막 보스전에서는 이 도구가 다음 턴에 잠긴다
  battle.phase = "question";
  // 전에 만난 문제인지 먼저 확인해 둔다 (다시 만난 문제는 절반만 잠근다)
  const seenBefore = battle.seenIds.indexOf(q.id) !== -1;
  if (!seenBefore) battle.seenIds.push(q.id);

  const p = panel();
  p.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "q-wrap";

  const tag = document.createElement("div");
  tag.className = "q-tag";
  tag.innerHTML =
    "<span>" + TOOLS[toolId].icon + " " + TOOLS[toolId].name + "</span>" +
    (seenBefore && save.wrongIds.indexOf(q.id) !== -1
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

  buildHintBox(q, wrap);

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

  // 다 읽을 때까지는 고를 수 없다
  lockUntilRead(
    wrap,
    Array.prototype.slice.call(list.querySelectorAll(".opt")),
    calcReadMs(q, seenBefore, battle.instantCount),
    "문제를 읽어요",
    true // 문제 화면에서만 "얼마 만에 눌렀는지"를 잰다
  );
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

  // 잠금이 풀리자마자 튕기듯 눌렀는가 — 안 읽었다는 신호
  const instant = isInstantAnswer(msSinceUnlock());
  if (instant) battle.instantCount++;
  resetUnlock();

  let dmg = null;
  let loss = 0;
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
    loss = calcTrustLoss(toolId);
    battle.trust -= loss;
    sfx("wrong");
  }

  updateGauges();
  renderResult(correct, choice, dmg, loss, instant);
}

function renderResult(correct, choice, dmg, loss, instant) {
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
    head.textContent = "아쉬워요. 신뢰도가 " + loss + " 줄었어요.";
  }
  box.appendChild(head);

  // 튕기듯 눌렀으면 알려 준다. 신뢰도를 깎지 않고 다음 읽기 시간만 늘린다.
  if (instant) {
    const warn = document.createElement("p");
    warn.className = "result-warn";
    warn.textContent =
      "너무 빨리 골랐어요. 다음 문제는 읽을 시간이 조금 더 길어져요. " +
      "상황을 끝까지 읽고 고르면 훨씬 잘 맞힐 수 있어요.";
    box.appendChild(warn);
  }

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
      "장악력 " + dmg.amount + " 감소  (상성 ×" + dmg.typeMult +
      " · 콤보 ×" + dmg.comboMult +
      (dmg.boost > 1 ? " · 가치몬 ×" + dmg.boost.toFixed(2) : "") + ")";
    box.appendChild(d);
  } else {
    const again = document.createElement("p");
    again.className = "result-dmg";
    again.textContent = "이 문제는 다시 나와요. 해설을 읽었으니 다음엔 맞힐 수 있어요.";
    box.appendChild(again);
  }

  // 가끔 "왜 그럴까?"를 한 번 더 묻는다 (맞혔을 때만)
  const offerWhy = shouldOfferWhy(q, correct, battle.asked);

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = offerWhy ? "⭐ 보너스 — 왜 그럴까?" : "계속하기";
  btn.onclick = offerWhy
    ? function () { renderWhyBonus(q, dmg); }
    : afterResult;
  box.appendChild(btn);

  p.appendChild(box);

  // 해설도 읽고 넘어가게 한다. 배움은 여기서 일어나므로 문제보다 더 중요하다.
  lockUntilRead(box, [btn], calcExplainMs(correct), "해설을 읽어요");
}

/* -----------------------------------------------------------
   "왜?" 보너스

   행동은 맞았는데 이유가 틀린 경우를 잡는 자리다.
   맞히면 그 문제의 데미지가 2배. 틀려도 잃는 것은 없다.
   이유를 생각해 본 것 자체가 이미 얻은 것이라 벌하지 않는다.
   ----------------------------------------------------------- */
function renderWhyBonus(q, dmg) {
  clearLock();
  sfx("dexOpen");

  const p = panel();
  p.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "q-wrap";

  const tag = document.createElement("div");
  tag.className = "q-tag";
  tag.innerHTML =
    '<span class="why-badge">⭐ 보너스</span>' +
    "<span>맞히면 이번 공격이 2배가 돼요</span>";
  wrap.appendChild(tag);

  const qt = document.createElement("p");
  qt.className = "q-question";
  qt.textContent = q.why.question;
  wrap.appendChild(qt);

  const list = document.createElement("div");
  list.className = "q-options";
  q.why.options.forEach(function (opt, i) {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = '<span class="opt-no">' + (i + 1) + "</span><span>" + opt + "</span>";
    b.onclick = function () {
      gradeWhy(q, dmg, i);
    };
    list.appendChild(b);
  });
  wrap.appendChild(list);
  p.appendChild(wrap);

  lockUntilRead(
    wrap,
    Array.prototype.slice.call(list.querySelectorAll(".opt")),
    2200,
    "이유를 생각해요"
  );
}

function gradeWhy(q, dmg, choice) {
  const correct = choice === q.why.answer;
  let extra = 0;

  if (correct) {
    // 그 문제의 데미지만큼 한 번 더 (합쳐서 2배)
    extra = Math.round(dmg.amount * (BALANCE.whyBonusMultiplier - 1));
    battle.grip = Math.max(0, battle.grip - extra);
    sfx("caught");
    hitAnimation();
  } else {
    sfx("button");
  }
  updateGauges();

  const p = panel();
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "result-box " + (correct ? "ok" : "why-miss");

  const head = document.createElement("p");
  head.className = "result-head";
  head.textContent = correct
    ? "이유까지 맞혔어요! 공격이 2배가 됐어요."
    : "이유는 조금 달라요. 그래도 잃는 건 없어요.";
  box.appendChild(head);

  if (!correct) {
    const right = document.createElement("p");
    right.className = "result-right";
    right.textContent = "이유: " + q.why.options[q.why.answer];
    box.appendChild(right);
  }

  const ex = document.createElement("p");
  ex.className = "result-explain";
  ex.textContent = q.why.explanation;
  box.appendChild(ex);

  const d = document.createElement("p");
  d.className = "result-dmg";
  d.textContent = correct
    ? "장악력을 " + extra + " 더 깎았어요! (합쳐서 " + (dmg.amount + extra) + ")"
    : "행동을 고른 건 맞았으니 공격은 그대로예요.";
  box.appendChild(d);

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = "계속하기";
  btn.onclick = afterResult;
  box.appendChild(btn);

  p.appendChild(box);
  lockUntilRead(box, [btn], 1600, "이유를 읽어요");
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
      "이제 가치볼을 던져 정화할 수 있어요.",
      "가치볼 고르기",
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
  clearLock();
  battle.phase = "ball";
  const p = panel();
  p.innerHTML = "";

  const head = document.createElement("p");
  head.className = "panel-head";
  head.textContent = "어떤 가치볼을 던질까?";
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
          "가치볼이 다 떨어졌어요.",
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

  // 한 문제도 틀리지 않고 잡았는가 (무결점 증표 조건)
  if (battle.asked > 0 && battle.right === battle.asked) {
    save.perfectCatch = true;
    writeSave();
  }

  drawBattle();
  sfx("caught");

  showMessage(
    "잡았다! <b>" + battle.monster.name + "</b>을(를) 붙잡았어요!",
    "이제 정화해서 가치몬으로 되돌립니다.",
    "정화하기",
    playPurify
  );
}

/* -----------------------------------------------------------
   정화 연출

   이 게임에서 가장 중요한 순간이다.
   그림자몬이 하얗게 타오르며 빛으로 흩어졌다가,
   같은 실루엣의 가치몬으로 돌아온다.

   실루엣이 같기 때문에 "다른 것이 왔다"가 아니라
   "같은 것이 바뀌었다"로 읽힌다. 그게 이 게임이 하려는 말이다.
   ----------------------------------------------------------- */
function playPurify() {
  const p = panel();
  p.innerHTML = '<div class="msg-box"><p class="msg-title">정화하는 중...</p></div>';
  sfx("purify");

  const accent = TYPES[battle.monster.type].accent;
  const fx = battle.fx;
  fx.rings = [];
  fx.sparks = [];
  fx.flash = 0;
  fx.white = 0;

  let t = 0;
  const step = 1 / 60; // 초 단위로 센다
  const timer = setInterval(function () {
    t += step;

    /* 0.0~0.8초 — 하얗게 타오르며 고리가 퍼진다 */
    if (t < 0.8) {
      fx.white = t / 0.8;
      if (Math.random() < 0.25) {
        fx.rings.push({ r: 20, w: 3, life: 1, color: accent });
      }
    }

    /* 0.8초 — 번쩍! 그림자몬이 사라지고 가치몬으로 바뀐다 */
    if (!battle.purifying && t >= 0.8) {
      battle.purifying = true;
      battle.monAlpha = 0;
      fx.flash = 1;
      fx.white = 0;
      // 사방으로 반짝이가 흩어진다
      for (let i = 0; i < 46; i++) {
        const ang = (Math.PI * 2 * i) / 46 + Math.random() * 0.3;
        const spd = 2.2 + Math.random() * 3.4;
        fx.sparks.push({
          x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2,
          vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
          size: 3 + Math.random() * 5, life: 1,
          color: i % 3 === 0 ? "#ffffff" : accent,
        });
      }
      for (let i = 0; i < 3; i++) {
        fx.rings.push({ r: 10 + i * 14, w: 5, life: 1, color: "#ffffff" });
      }
    }

    /* 0.8초 이후 — 가치몬이 서서히 또렷해진다 */
    if (battle.purifying && battle.monAlpha < 1) {
      battle.monAlpha = Math.min(1, battle.monAlpha + 0.045);
    }

    /* 입자와 고리를 움직인다 */
    fx.flash = Math.max(0, fx.flash - 0.09);
    fx.rings.forEach(function (r) {
      r.r += 4.5;
      r.life -= 0.035;
    });
    fx.rings = fx.rings.filter(function (r) { return r.life > 0 && r.r < CANVAS_SIZE; });
    fx.sparks.forEach(function (s) {
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.09;      // 살짝 떨어진다
      s.vx *= 0.985;
      s.life -= 0.018;
    });
    fx.sparks = fx.sparks.filter(function (s) { return s.life > 0; });

    drawBattle();

    /* 끝 — 정리하고 결과를 보여 준다 */
    if (t >= 2.6) {
      clearInterval(timer);
      battle.monAlpha = 1;
      fx.rings = [];
      fx.sparks = [];
      fx.flash = 0;
      fx.white = 0;
      drawBattle();
      showPurified();
    }
  }, 1000 / 60);
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

  // 이번 정화로 어떤 판단 도구가 세졌는지 알려 준다
  const grownTool = Object.keys(TOOLS).filter(function (id) {
    return TOOL_BOOST_TYPE[id] === m.type;
  })[0];
  if (grownTool) {
    const up = document.createElement("p");
    up.className = "purify-boost";
    up.innerHTML =
      TOOLS[grownTool].icon + " <b>" + TOOLS[grownTool].name + "</b> 이(가) 더 강해졌어요! " +
      "<span>지금 " + Math.round((getToolBoost(grownTool) - 1) * 100) + "% 강화</span>";
    box.appendChild(up);
  }

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
  clearLock();
  const refilled = refillBalls();
  if (battle.onEnd) battle.onEnd(reason, refilled);
}
