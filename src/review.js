/* ===========================================================
   AI몬스터 — 복습 모드

   틀렸던 문제만 모아 다시 푼다.
   맞히면 기록에서 지워지고, 지운 만큼 판단볼을 받는다.

   기록(리포트)에 틀린 문제가 쌓이기만 하고 게임 안에서
   다시 풀 방법이 없었다. 틀린 문제를 다시 푸는 것이
   이 게임에서 배움이 일어나는 자리이므로 따로 마련한다.

   전투가 아니므로 신뢰도도, 몬스터도 없다. 틀려도 잃는 게 없다.
   그래야 부담 없이 다시 도전한다.
   =========================================================== */

const review = {
  queue: [],
  index: 0,
  right: 0,
  cleared: [], // 이번에 기록에서 지운 문항
  body: null,
  onExit: null,
};

/* 지금 틀린 것으로 남아 있는 문항들 */
function wrongQuestions() {
  return QUESTIONS.filter(function (q) {
    return save.wrongIds.indexOf(q.id) !== -1;
  });
}

function wrongCount() {
  return wrongQuestions().length;
}

/* -----------------------------------------------------------
   들어가기
   ----------------------------------------------------------- */
function startReview(container, onExit) {
  review.body = container;
  review.onExit = onExit;
  review.queue = wrongQuestions();
  review.index = 0;
  review.right = 0;
  review.cleared = [];

  // 순서를 섞어 외워서 맞히는 걸 막는다
  for (let i = review.queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = review.queue[i];
    review.queue[i] = review.queue[j];
    review.queue[j] = t;
  }

  renderReviewIntro();
}

function renderReviewIntro() {
  const p = review.body;
  clearLock();
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "msg-box";

  if (review.queue.length === 0) {
    box.innerHTML =
      '<p class="msg-title">다시 풀 문제가 없어요!</p>' +
      '<p class="msg-body">틀린 문제가 하나도 없거나, 모두 다시 맞혀서 지웠어요. 잘하고 있어요.</p>';
    const back = document.createElement("button");
    back.className = "btn primary";
    back.textContent = "돌아가기";
    back.onclick = function () { sfx("button"); if (review.onExit) review.onExit(); };
    box.appendChild(back);
    p.appendChild(box);
    return;
  }

  box.innerHTML =
    '<p class="msg-title">틀렸던 문제 <b>' + review.queue.length + "개</b>가 기다려요</p>" +
    '<p class="msg-body">다시 맞히면 기록에서 지워지고 판단볼을 받아요.<br>' +
    "여기서는 틀려도 신뢰도가 줄지 않으니 마음 편히 도전해요.</p>";

  const go = document.createElement("button");
  go.className = "btn primary";
  go.textContent = "시작하기";
  go.onclick = function () { sfx("button"); renderReviewQuestion(); };
  box.appendChild(go);

  const back = document.createElement("button");
  back.className = "btn ghost";
  back.textContent = "나중에 하기";
  back.style.marginTop = "10px";
  back.onclick = function () { sfx("button"); if (review.onExit) review.onExit(); };
  box.appendChild(back);

  p.appendChild(box);
}

/* -----------------------------------------------------------
   문제 내기
   ----------------------------------------------------------- */
function renderReviewQuestion() {
  const q = review.queue[review.index];
  if (!q) return renderReviewDone();

  const p = review.body;
  p.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "q-wrap";

  const tag = document.createElement("div");
  tag.className = "q-tag";
  tag.innerHTML =
    "<span>" + TYPES[q.type].name + " · " + TOOLS[q.tool].icon + " " + TOOLS[q.tool].name + "</span>" +
    '<span class="again">' + (review.index + 1) + " / " + review.queue.length + "</span>";
  wrap.appendChild(tag);

  const sit = document.createElement("p");
  sit.className = "q-situation";
  sit.textContent = q.situation;
  wrap.appendChild(sit);

  const qt = document.createElement("p");
  qt.className = "q-question";
  qt.textContent = q.question;
  wrap.appendChild(qt);

  buildHintBox(q, wrap); // 복습에서는 전에 틀린 문제이므로 처음부터 펼쳐진다

  const list = document.createElement("div");
  list.className = "q-options";
  q.options.forEach(function (opt, i) {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = '<span class="opt-no">' + (i + 1) + "</span><span>" + opt + "</span>";
    b.onclick = function () { gradeReview(i); };
    list.appendChild(b);
  });
  wrap.appendChild(list);
  p.appendChild(wrap);

  // 복습도 읽고 풀어야 한다. 전에 본 문제이므로 절반만 잠근다.
  lockUntilRead(
    wrap,
    Array.prototype.slice.call(list.querySelectorAll(".opt")),
    calcReadMs(q, true, 0),
    "문제를 읽어요",
    false
  );
}

/* -----------------------------------------------------------
   채점 — 맞히면 기록에서 지운다
   ----------------------------------------------------------- */
function gradeReview(choice) {
  const q = review.queue[review.index];
  const correct = choice === q.answer;

  if (correct) {
    review.right++;
    const at = save.wrongIds.indexOf(q.id);
    if (at !== -1) {
      save.wrongIds.splice(at, 1);
      review.cleared.push(q.id);
      save.reviewCleared = (save.reviewCleared || 0) + 1; // 복습왕 증표 조건
      writeSave();
    }
    sfx("correct");
  } else {
    sfx("wrong");
  }

  const p = review.body;
  p.innerHTML = "";

  const box = document.createElement("div");
  box.className = "result-box " + (correct ? "ok" : "no");

  const head = document.createElement("p");
  head.className = "result-head";
  head.textContent = correct ? "정답! 기록에서 지웠어요." : "아직 헷갈리는군요. 해설을 다시 읽어요.";
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

  const note = document.createElement("p");
  note.className = "result-dmg";
  note.textContent = correct
    ? "이제 이 문제는 복습 목록에서 빠져요."
    : "이 문제는 복습 목록에 그대로 남아요. 다음에 또 만나요.";
  box.appendChild(note);

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.textContent = review.index + 1 < review.queue.length ? "다음 문제" : "결과 보기";
  btn.onclick = function () {
    sfx("button");
    review.index++;
    if (review.index < review.queue.length) renderReviewQuestion();
    else renderReviewDone();
  };
  box.appendChild(btn);

  p.appendChild(box);
  lockUntilRead(box, [btn], calcExplainMs(correct), "해설을 읽어요", false);
}

/* -----------------------------------------------------------
   마무리 — 지운 만큼 판단볼을 준다
   ----------------------------------------------------------- */
function renderReviewDone() {
  clearLock();
  const p = review.body;
  p.innerHTML = "";

  // 두 개 지울 때마다 기본판단볼 하나 (최대 3개)
  const basic = Math.min(Math.floor(review.cleared.length / 2), 3);
  const allClear = review.cleared.length > 0 && wrongCount() === 0;
  if (basic > 0) save.balls.basic += basic;
  if (allClear) save.balls.reason += 1;
  if (basic > 0 || allClear) writeSave();

  const newBadges = checkBadges(); // 복습왕 증표는 여기서 나온다

  const box = document.createElement("div");
  box.className = "msg-box";

  let reward = "";
  if (basic > 0) reward += "기본판단볼 " + basic + "개";
  if (allClear) reward += (reward ? " · " : "") + "근거볼 1개";

  box.innerHTML =
    '<p class="msg-title">복습 끝!</p>' +
    '<p class="msg-body">' +
    review.queue.length + "문제 중 <b>" + review.right + "문제</b>를 맞혔어요.<br>" +
    "기록에서 <b>" + review.cleared.length + "문제</b>를 지웠어요." +
    (reward ? "<br><br>보상 — <b>" + reward + "</b>" : "") +
    (newBadges.length
      ? "<br><br>🏅 증표 획득 — <b>" +
        newBadges.map(function (b) { return b.name; }).join(", ") + "</b>"
      : "") +
    (wrongCount() > 0
      ? "<br><br>아직 " + wrongCount() + "문제가 남았어요. 언제든 다시 도전해요."
      : "<br><br>틀린 문제를 모두 지웠어요. 정말 잘했어요!") +
    "</p>";

  if (allClear) sfx("caught");
  else sfx("purify");

  const back = document.createElement("button");
  back.className = "btn primary";
  back.textContent = "돌아가기";
  back.onclick = function () { sfx("button"); if (review.onExit) review.onExit(); };
  box.appendChild(back);

  p.appendChild(box);
}
