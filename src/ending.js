/* ===========================================================
   AI몬스터 — 엔딩 (스테이지 정화)

   스테이지의 마지막 보스까지 정화하면 여기로 온다.

   예전에는 작은 알림 한 줄이 스쳐 지나가고 기록 화면이 열렸다.
   그래서 아이들이 게임이 끝났는지도 몰랐다.

   끝은 분명해야 한다. 그래서 세 가지를 한다.
     1) 지도가 눈앞에서 밝아진다 ("정화"를 글이 아니라 색으로 본다)
     2) 가치몬 일곱이 자기 자리로 돌아와 선다
     3) 일곱 가지 배운 것을 한자리에 모아 다시 읽는다

   3번이 이 게임의 진짜 결말이다.
   몬스터를 다 잡은 것이 아니라, 물어보는 법을 배운 것이 끝이다.

   자막과 마지막 말은 스테이지 파일(data/stageN/stage.js)의 ending 에 있다.
   마지막 스테이지를 끝내면 세 곳의 여정을 한 장에 모은 "여정 증서"가 더 붙는다.
   =========================================================== */

const END_TILE = 16;
const END_SCALE = 2;

/* 이 엔딩이 다루는 몬스터 — 지금 있는 스테이지의 것만 */
function endMonsters() {
  return monstersOfStage(currentStage());
}

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
  dark: 1.2, // 어둠이 남아 있는 동안
  spread: 4.4, // 빛이 다 퍼지는 시각
  monsters: 7.6, // 가치몬이 다 모이는 시각
  finish: 8.8, // 글이 올라오는 시각
};

/* 스테이지 파일에 적힌 자막. 비어 있으면 이름으로 만든다 */
function endCaption(key) {
  const def = stageData();
  const last = finalBossMonster();
  const texts = def.ending || {};
  if (texts[key]) return texts[key];
  if (key === "start") return last.name + josa(last.name, "이", "가") + " 빛으로 흩어졌습니다…";
  if (key === "spread") return "어둠이 걷히고 있어요…";
  if (key === "gather") return "가치몬들이 " + def.place + josa(def.place, "으로", "로") + " 돌아옵니다";
  return stageName() + josa(stageName(), "이", "가") + " 깨끗해졌습니다";
}

/* -----------------------------------------------------------
   열기
   ----------------------------------------------------------- */
function openEnding() {
  show("ending");
  stopMapAnim();

  save.endingSeen = true;
  if (!save.stagesSeen) save.stagesSeen = [];
  if (save.stagesSeen.indexOf(currentStage()) === -1) save.stagesSeen.push(currentStage());
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
  ending.shown = endMonsters().length;
  ending.sparks = [];
  drawEndingFrame();

  setCaption(endCaption("done"));
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

  setCaption(endCaption("start"));
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
        setCaption(endCaption("spread"));
        sfx("purify");
      }
      const p = (t - END_T.dark) / (END_T.spread - END_T.dark);
      ending.wave = p * 17;

      // 빛의 가장자리에 반짝이를 흩뿌린다
      for (let i = 0; i < 2; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = ending.wave * END_TILE * END_SCALE;
        const c = finalSpot();
        ending.sparks.push({
          x: (c.x + 0.5) * END_TILE * END_SCALE + Math.cos(ang) * r,
          y: (c.y + 0.5) * END_TILE * END_SCALE + Math.sin(ang) * r,
          vx: Math.cos(ang) * 0.7,
          vy: Math.sin(ang) * 0.7 - 0.5,
          size: 2 + Math.random() * 4,
          life: 1,
          color: Math.random() < 0.5 ? "#ffffff" : "#ffe9a8",
        });
      }
    }

    /* 2단계 — 가치몬이 하나씩 자기 자리로 돌아온다 */
    if (t >= END_T.spread) {
      ending.wave = 99;
      if (!saidGather) {
        saidGather = true;
        setCaption(endCaption("gather"));
      }
      const total = endMonsters().length;
      const p = (t - END_T.spread) / (END_T.monsters - END_T.spread);
      const want = Math.min(total, Math.floor(p * total) + 1);
      while (ending.shown < want) {
        ending.shown++;
        sfx(ending.shown === total ? "caught" : "correct");
      }
    }

    /* 3단계 — 마무리 */
    if (t >= END_T.finish && !ending.done) {
      ending.done = true;
      setCaption(endCaption("done"));
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
  ending.shown = endMonsters().length;
  ending.sparks = [];
  ending.done = true;
  drawEndingFrame();
  setCaption(endCaption("done"));
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
  const center = finalSpot();
  const cx = center.x;
  const cy = center.y;
  const w = ending.wave;
  drawMap(ctx, END_TILE, END_SCALE, function (x, y) {
    if (w >= 99) return 1;
    const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    const v = (w - d) / 2.4;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  });

  // 돌아온 가치몬들 — 막 나타난 한 마리만 옅게 시작한다
  const mons = endMonsters();
  const spots = homeSpots();
  for (let i = 0; i < ending.shown && i < mons.length; i++) {
    const m = mons[i];
    const spot = spots[m.id];
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

  // 주인공 — 한복판(마지막 보스가 서 있던 자리) 바로 아래에 서서 올려다본다
  const sp = playerSprite("up", 0);
  drawSprite(
    ctx,
    sp.grid,
    PLAYER_PALETTE,
    center.x * END_TILE * END_SCALE,
    (center.y + 1) * END_TILE * END_SCALE,
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

const KOREAN_COUNT = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

function renderEndingBody(container) {
  container.innerHTML = "";
  const all = overallAccuracy();
  const st = currentStage();
  const def = stageData(st);

  /* ---- 머리말 ---- */
  const head = document.createElement("div");
  head.className = "end-head";
  head.innerHTML =
    '<p class="end-badge">' + (st === lastStage() ? "ALL CLEAR" : "STAGE CLEAR") + "</p>" +
    "<h2>" + escapeHtml(endCaption("done")) + "</h2>" +
    '<p class="end-who">' +
    escapeHtml(displayName() || "탐험가") +
    " · " +
    new Date().toLocaleDateString("ko-KR") +
    "</p>";
  container.appendChild(head);

  /* ---- 큰 숫자 ---- */
  const tiles = document.createElement("div");
  tiles.className = "rep-tiles";
  const mons = endMonsters();
  tiles.appendChild(tile("정화한 AI몬스터", mons.length + " / " + mons.length));
  tiles.appendChild(
    tile("전체 정답률", Math.round(all.rate * 100) + "%", all.right + " / " + all.asked + "문제")
  );
  tiles.appendChild(tile("얻은 증표", badgeCount() + " / " + BADGES.length));
  container.appendChild(tiles);

  /* ---- 가치몬이 남긴 말 — 여기가 진짜 결말이다 ---- */
  const t1 = document.createElement("h3");
  t1.className = "end-sec";
  t1.textContent = (KOREAN_COUNT[mons.length] || mons.length) + " 가치몬이 남긴 말";
  container.appendChild(t1);

  const list = document.createElement("div");
  list.className = "end-lessons";
  mons.forEach(function (m) {
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
      '<span class="el-from">' + escapeHtml(m.name) + "에서 정화</span>" +
      "<p>" + escapeHtml(m.purified.lesson) + "</p>";
    row.appendChild(txt);

    list.appendChild(row);
  });
  container.appendChild(list);

  /* ---- 교실 밖으로 가지고 나갈 것 ---- */
  const ids = toolsForStage(st);
  const t2 = document.createElement("h3");
  t2.className = "end-sec";
  t2.textContent = "교실 밖에서도 쓰는 " + (KOREAN_COUNT[ids.length] || ids.length) + " 가지 질문";
  container.appendChild(t2);

  const tools = document.createElement("div");
  tools.className = "end-tools";
  ids.forEach(function (id) {
    const s = tallyOrZero(save.toolStats, id);
    const rate = s.asked > 0 ? Math.round((s.right / s.asked) * 100) + "%" : "아직 안 씀";
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

  /* ---- 마지막 스테이지를 끝냈으면 세 곳의 여정을 한 장에 ---- */
  if (st === lastStage()) {
    container.appendChild(renderJourneyCertificate());
  }

  /* ---- 마지막 말 ---- */
  const words = document.createElement("div");
  words.className = "end-words";
  words.innerHTML = (def.ending && def.ending.words) || "";
  container.appendChild(words);

  /* ---- 버튼 ---- */
  const row = document.createElement("div");
  row.className = "end-btns no-print";

  // 다음 스테이지가 열렸으면 가장 크게 보여야 할 버튼이다
  if (nextStageOpen()) {
    const nextDef = stageData(st + 1);
    const bNext = document.createElement("button");
    bNext.className = "btn primary big";
    bNext.textContent = nextDef.enterLabel || nextDef.name + josa(nextDef.name, "으로", "로") + " 떠나기";
    bNext.onclick = function () {
      sfx("caught");
      enterStage(st + 1);
    };
    row.appendChild(bNext);
  }

  const bRep = document.createElement("button");
  bRep.className = "btn" + (nextStageOpen() ? "" : " primary");
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
  bMap.textContent = def.place + " 둘러보기";
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

/* -----------------------------------------------------------
   여정 증서 — 세 곳을 모두 정화한 아이에게
   모은 가치몬을 한 장에 늘어놓는다. 인쇄하면 그대로 증서가 된다.
   ----------------------------------------------------------- */
function renderJourneyCertificate() {
  const box = document.createElement("section");
  box.className = "journey-cert";

  const caughtAll = MONSTERS.filter(function (m) { return isCaught(m.id); });
  const all = overallAccuracy();

  const title = document.createElement("h3");
  title.className = "jc-title";
  title.textContent = "AI몬스터 여정 증서";
  box.appendChild(title);

  const names = STAGES.slice(1).map(function (s) { return s.name; });
  const who = document.createElement("p");
  who.className = "jc-who";
  who.innerHTML =
    "<b>" + escapeHtml(displayName() || "탐험가") + "</b> 탐험가는 " +
    escapeHtml(names.join(", ")) + josa(names[names.length - 1], "을", "를") +
    " 모두 정화하고 가치몬 " + caughtAll.length + "마리를 되찾았습니다.";
  box.appendChild(who);

  for (let st = 1; st <= lastStage(); st++) {
    const row = document.createElement("div");
    row.className = "jc-row";
    const label = document.createElement("span");
    label.className = "jc-stage";
    label.textContent = stageName(st);
    row.appendChild(label);
    monstersOfStage(st).forEach(function (m) {
      const img = document.createElement("img");
      img.alt = m.purified.name;
      img.title = m.purified.name;
      img.src = spriteToDataURL(
        isCaught(m.id) ? m.purified.sprite : m.sprite,
        isCaught(m.id) ? paletteFor(m.type) : shadowPalette(),
        2
      );
      row.appendChild(img);
    });
    box.appendChild(row);
  }

  const facts = document.createElement("p");
  facts.className = "jc-facts";
  facts.textContent =
    "전체 정답률 " + Math.round(all.rate * 100) + "% · 푼 문제 " + all.asked + "개 · 증표 " +
    badgeCount() + "개" +
    (save.partyBest ? " · 마지막 싸움에서 함께 싸운 가치몬 " + save.partyBest + "마리" : "") +
    " · " + new Date().toLocaleDateString("ko-KR");
  box.appendChild(facts);

  return box;
}
