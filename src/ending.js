/* ===========================================================
   AI몬스터 — 엔딩 (AI 마을 정화)

   마지막 보스까지 정화하면 여기로 온다.

   예전에는 작은 알림 한 줄이 스쳐 지나가고 기록 화면이 열렸다.
   그래서 아이들이 게임이 끝났는지도 몰랐다.

   끝은 분명해야 한다. 그래서 세 가지를 한다.
     1) 지도가 눈앞에서 밝아진다 — "정화"를 글이 아니라 색으로 본다
     2) 가치몬 일곱이 자기 숲으로 돌아와 선다
     3) 일곱 가지 배운 것을 한자리에 모아 다시 읽는다

   3번이 이 게임의 진짜 결말이다.
   몬스터를 다 잡은 것이 아니라, 물어보는 법을 배운 것이 끝이다.
   =========================================================== */

const END_TILE = 16;
const END_SCALE = 2;

const ending = {
  ctx: null,
  timer: null,
  t: 0,
  wave: 0,
  sparks: [],
  shown: 0, // 지금까지 나타난 가치몬 수
  done: false,
};

/* 연출 시간표 (초) */
const END_T = {
  dark: 1.2,     // 어둠이 남아 있는 동안
  spread: 4.4,   // 빛이 다 퍼지는 시각
  monsters: 7.6, // 가치몬이 다 모이는 시각
  finish: 8.8,   // 글이 올라오는 시각
};

/* -----------------------------------------------------------
   열기
   ----------------------------------------------------------- */
function openEnding() {
  show("ending");
  stopMapAnim();

  save.endingSeen = true;
  writeSave();

  const canvas = document.getElementById("endCanvas");
  ending.ctx = setupCanvas(canvas, MAP_W * END_TILE, MAP_H * END_TILE, END_SCALE);

  const body = document.getElementById("endBody");
  body.innerHTML = "";
  body.classList.remove("on");
  document.getElementById("endSkip").style.display = "";

  playEndingScene();
}

/* 다시 볼 때는 연출을 건너뛰고 글만 본다 */
function openEndingSummary() {
  show("ending");
  stopMapAnim();

  const canvas = document.getElementById("endCanvas");
  ending.ctx = setupCanvas(canvas, MAP_W * END_TILE, MAP_H * END_TILE, END_SCALE);
  ending.wave = 99;
  ending.shown = MONSTERS.length;
  ending.sparks = [];
  drawEndingFrame();

  setCaption("AI 마을이 깨끗해졌습니다");
  showEndingBody();
}

/* -----------------------------------------------------------
   연출
   ----------------------------------------------------------- */
function playEndingScene() {
  stopEndingScene();

  ending.t = 0;
  ending.wave = 0;
  ending.sparks = [];
  ending.shown = 0;
  ending.done = false;

  setCaption("생각멈춤몬이 빛으로 흩어졌습니다…");
  drawEndingFrame();

  // 프레임 수가 아니라 실제 흐른 시간을 본다.
  // 학생이 다른 탭을 잠깐 보고 오면 브라우저가 타이머를 초당 1회로 조인다.
  // 프레임을 세면 그동안 연출이 멈춰 버리지만, 시계를 보면 건너뛰고 따라잡는다.
  const startedAt = Date.now();
  let saidSpread = false;
  let saidGather = false;

  ending.timer = setInterval(function () {
    const t = (Date.now() - startedAt) / 1000;
    ending.t = t;

    /* 1단계 — 빛이 한복판에서 바깥으로 퍼진다 */
    if (t >= END_T.dark && t < END_T.spread) {
      if (!saidSpread) {
        saidSpread = true;
        setCaption("어둠이 걷히고 있어요…");
        sfx("purify");
      }
      const p = (t - END_T.dark) / (END_T.spread - END_T.dark);
      ending.wave = p * 17;

      // 빛의 가장자리에 반짝이를 흩뿌린다
      for (let i = 0; i < 2; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = ending.wave * END_TILE * END_SCALE;
        ending.sparks.push({
          x: (FINAL_SPOT.x + 0.5) * END_TILE * END_SCALE + Math.cos(ang) * r,
          y: (FINAL_SPOT.y + 0.5) * END_TILE * END_SCALE + Math.sin(ang) * r,
          vx: Math.cos(ang) * 0.7,
          vy: Math.sin(ang) * 0.7 - 0.5,
          size: 2 + Math.random() * 4,
          life: 1,
          color: Math.random() < 0.5 ? "#ffffff" : "#ffe9a8",
        });
      }
    }

    /* 2단계 — 가치몬이 하나씩 자기 숲으로 돌아온다 */
    if (t >= END_T.spread) {
      ending.wave = 99;
      if (!saidGather) {
        saidGather = true;
        setCaption("가치몬들이 마을로 돌아옵니다");
      }
      const p = (t - END_T.spread) / (END_T.monsters - END_T.spread);
      const want = Math.min(MONSTERS.length, Math.floor(p * MONSTERS.length) + 1);
      while (ending.shown < want) {
        ending.shown++;
        sfx(ending.shown === MONSTERS.length ? "caught" : "correct");
      }
    }

    /* 3단계 — 마무리 */
    if (t >= END_T.finish && !ending.done) {
      ending.done = true;
      setCaption("AI 마을이 깨끗해졌습니다");
      sfx("purify");
      showEndingBody();
    }

    /* 반짝이 움직이기 */
    ending.sparks.forEach(function (s) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.06;
      s.life -= 0.02;
    });
    ending.sparks = ending.sparks.filter(function (s) { return s.life > 0; });

    drawEndingFrame();

    if (t >= END_T.finish + 1.6) stopEndingScene();
  }, 1000 / 60);
}

function stopEndingScene() {
  if (ending.timer) {
    clearInterval(ending.timer);
    ending.timer = null;
  }
}

function skipEnding() {
  stopEndingScene();
  ending.wave = 99;
  ending.shown = MONSTERS.length;
  ending.sparks = [];
  ending.done = true;
  drawEndingFrame();
  setCaption("AI 마을이 깨끗해졌습니다");
  showEndingBody();
}

function setCaption(text) {
  const c = document.getElementById("endCaption");
  if (c) c.textContent = text;
}

/* -----------------------------------------------------------
   한 장면 그리기
   ----------------------------------------------------------- */
function drawEndingFrame() {
  const ctx = ending.ctx;
  if (!ctx) return;

  // 빛이 지나간 칸부터 밝아진다. 가장자리는 2.4칸에 걸쳐 부드럽게 넘어간다.
  const cx = FINAL_SPOT.x;
  const cy = FINAL_SPOT.y;
  const w = ending.wave;
  drawMap(ctx, END_TILE, END_SCALE, function (x, y) {
    if (w >= 99) return 1;
    const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    const v = (w - d) / 2.4;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  });

  // 돌아온 가치몬들 — 막 나타난 한 마리만 옅게 시작한다
  for (let i = 0; i < ending.shown && i < MONSTERS.length; i++) {
    const m = MONSTERS[i];
    const spot = HOME_SPOTS[m.id];
    if (!spot) continue;

    ctx.globalAlpha = ending.shown - i >= 2 ? 1 : 0.55;
    drawSprite(
      ctx,
      m.purified.sprite,
      paletteFor(m.type),
      spot.x * END_TILE * END_SCALE,
      spot.y * END_TILE * END_SCALE,
      END_SCALE,
      false
    );
    ctx.globalAlpha = 1;
  }

  // 주인공 — 생각지기 바로 아래에 서서 올려다본다
  const sp = playerSprite("up", 0);
  drawSprite(
    ctx,
    sp.grid,
    PLAYER_PALETTE,
    FINAL_SPOT.x * END_TILE * END_SCALE,
    (FINAL_SPOT.y + 1) * END_TILE * END_SCALE,
    END_SCALE,
    sp.flip
  );

  // 반짝이
  ending.sparks.forEach(function (s) {
    ctx.globalAlpha = Math.max(0, s.life);
    ctx.fillStyle = s.color;
    ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
  });
  ctx.globalAlpha = 1;
}

/* -----------------------------------------------------------
   엔딩 글 — 이 게임이 하려던 말을 한자리에 모은다
   ----------------------------------------------------------- */
function showEndingBody() {
  const box = document.getElementById("endBody");
  document.getElementById("endSkip").style.display = "none";
  renderEndingBody(box);
  box.classList.add("on");
}

function renderEndingBody(container) {
  container.innerHTML = "";
  const all = overallAccuracy();

  /* ---- 머리말 ---- */
  const head = document.createElement("div");
  head.className = "end-head";
  head.innerHTML =
    '<p class="end-badge">ALL CLEAR</p>' +
    "<h2>AI 마을이 깨끗해졌습니다</h2>" +
    '<p class="end-who">' +
    escapeHtml(displayName() || "탐험가") +
    " · " +
    new Date().toLocaleDateString("ko-KR") +
    "</p>";
  container.appendChild(head);

  /* ---- 큰 숫자 ---- */
  const tiles = document.createElement("div");
  tiles.className = "rep-tiles";
  tiles.appendChild(tile("정화한 AI몬스터", MONSTERS.length + " / " + MONSTERS.length));
  tiles.appendChild(
    tile("전체 정답률", Math.round(all.rate * 100) + "%", all.right + " / " + all.asked + "문제")
  );
  tiles.appendChild(tile("얻은 증표", badgeCount() + " / " + BADGES.length));
  container.appendChild(tiles);

  /* ---- 일곱 가지 배운 것 — 여기가 진짜 결말이다 ---- */
  const t1 = document.createElement("h3");
  t1.className = "end-sec";
  t1.textContent = "일곱 가치몬이 남긴 말";
  container.appendChild(t1);

  const list = document.createElement("div");
  list.className = "end-lessons";
  MONSTERS.forEach(function (m) {
    const row = document.createElement("div");
    row.className = "end-lesson" + (m.finalBoss ? " final" : "");

    const img = document.createElement("img");
    img.src = spriteToDataURL(m.purified.sprite, paletteFor(m.type), 3);
    img.alt = m.purified.name;
    row.appendChild(img);

    const txt = document.createElement("div");
    txt.className = "el-text";
    txt.innerHTML =
      "<b>" + escapeHtml(m.purified.name) + "</b>" +
      '<span class="el-from">' + escapeHtml(m.name) + " 에서 정화</span>" +
      "<p>" + escapeHtml(m.purified.lesson) + "</p>";
    row.appendChild(txt);

    list.appendChild(row);
  });
  container.appendChild(list);

  /* ---- 교실 밖으로 가지고 나갈 것 ---- */
  const t2 = document.createElement("h3");
  t2.className = "end-sec";
  t2.textContent = "교실 밖에서도 쓰는 네 가지 질문";
  container.appendChild(t2);

  const tools = document.createElement("div");
  tools.className = "end-tools";
  Object.keys(TOOLS).forEach(function (id) {
    const s = save.toolStats[id];
    const rate = s.asked > 0 ? Math.round((s.right / s.asked) * 100) + "%" : "—";
    const c = document.createElement("div");
    c.className = "end-tool";
    c.innerHTML =
      '<span class="et-icon">' + TOOLS[id].icon + "</span>" +
      "<b>" + escapeHtml(TOOLS[id].name) + "</b>" +
      '<span class="et-desc">' + escapeHtml(TOOLS[id].desc) + "</span>" +
      '<span class="et-rate">내 정답률 ' + rate + "</span>";
    tools.appendChild(c);
  });
  container.appendChild(tools);

  /* ---- 마지막 말 ---- */
  const words = document.createElement("div");
  words.className = "end-words";
  words.innerHTML =
    "<p>이 게임에서 이긴 방법은 답을 <b>빨리</b> 고르는 것이 아니었어요. " +
    "상황을 끝까지 읽고, 누구의 것인지 묻고, 누가 다칠지 헤아리고, " +
    "내가 왜 이걸 하려는지 들여다본 것이었어요.</p>" +
    "<p>AI는 앞으로 더 똑똑해집니다. 그래서 더 귀해지는 건 " +
    "<b>답을 아는 사람</b>이 아니라 <b>무엇이 옳은지 묻는 사람</b>이에요.</p>" +
    "<p>생각멈춤몬은 완전히 사라지지 않아요. 바쁠 때, 귀찮을 때, " +
    "남들이 다 그렇게 할 때 다시 찾아옵니다. " +
    "그때 <b>한 번 더 생각하는 것</b> — 그게 오늘 여러분이 얻은 진짜 힘이에요.</p>";
  container.appendChild(words);

  /* ---- 버튼 ---- */
  const row = document.createElement("div");
  row.className = "end-btns no-print";

  const bRep = document.createElement("button");
  bRep.className = "btn primary";
  bRep.textContent = "내 기록 보기";
  bRep.onclick = function () { openReport("ending"); };
  row.appendChild(bRep);

  const bDex = document.createElement("button");
  bDex.className = "btn";
  bDex.textContent = "도감 보기";
  bDex.onclick = function () { openDex("ending"); };
  row.appendChild(bDex);

  const bPrint = document.createElement("button");
  bPrint.className = "btn";
  bPrint.textContent = "이 화면 인쇄";
  bPrint.onclick = function () { window.print(); };
  row.appendChild(bPrint);

  const bMap = document.createElement("button");
  bMap.className = "btn ghost";
  bMap.textContent = "마을 둘러보기";
  bMap.onclick = function () {
    sfx("button");
    stopEndingScene();
    show("map");
    drawWorld();
    updateHud();
  };
  row.appendChild(bMap);

  container.appendChild(row);
}
