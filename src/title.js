/* ===========================================================
   AI몬스터 — 대문 (첫 화면)

   이름을 적기 전에 이 게임이 무엇을 하는 게임인지 한눈에 보여 준다.
     1) 행렬      그림자몬이 줄지어 걷다가 한 마리씩 가치몬으로 바뀐다
     2) 하는 법   만난다 → 질문을 골라 푼다 → 정화한다
     3) 여정      스테이지마다 작은 지도, 아이의 자리, 주제, 몬스터
     4) 질문      스테이지마다 하나씩 열리는 판단 질문

   글과 그림은 모두 data/ 의 표(STAGES · MONSTERS · TYPES · TOOLS)에서 가져온다.
   스테이지나 몬스터를 더하면 대문도 저절로 따라 바뀐다.

   교실 컴퓨터가 느릴 수 있어 움직이는 그림은 행렬 하나뿐이고,
   대문을 떠나면 멈춘다 (main.js 의 show 가 부른다).
   =========================================================== */

const titleFx = {
  ctx: null,
  timer: null,
  walkers: [], // [{ m, x, purified, flash }]
  tick: 0,
  built: false,
};

const PARADE_W = 360; // 행렬 캔버스의 그리는 폭 (CSS 로 칸에 맞게 늘거나 준다)
const PARADE_H = 64;
const PARADE_SCALE = 3; // 16칸 스프라이트 → 48px
const PARADE_GAP = 60; // 몬스터 사이 간격

/* 대문에 처음 들어올 때 한 번 만든다 */
function buildTitle() {
  if (titleFx.built) return;
  titleFx.built = true;

  buildHowTo(document.getElementById("titleHow"));
  buildStageCards(document.getElementById("titleStages"));
  buildToolChips(document.getElementById("titleTools"));

  const canvas = document.getElementById("titleParade");
  if (canvas) {
    titleFx.ctx = setupCanvas(canvas, PARADE_W, PARADE_H, 1);
    // 마지막 보스는 대문에 세우지 않는다. 끝까지 가서 만나는 즐거움을 남겨 둔다.
    const cast = MONSTERS.filter(function (m) { return !m.finalBoss; });
    // 처음부터 화면에 몇 마리가 보이게 오른쪽 끝에서부터 늘어세운다
    titleFx.walkers = cast.map(function (m, i) {
      const x = PARADE_W - 40 - PARADE_GAP * i;
      return { m: m, x: x, purified: x > PARADE_W * 0.55, flash: 0 };
    });
  }
}

function startTitleAnim() {
  buildTitle();
  stopTitleAnim();
  if (!titleFx.ctx) return;
  drawParade();
  titleFx.timer = setInterval(stepParade, 60);
}

function stopTitleAnim() {
  if (titleFx.timer) {
    clearInterval(titleFx.timer);
    titleFx.timer = null;
  }
}

/* 한 걸음 — 오른쪽으로 걷고, 가운데를 지나면 정화되고, 끝을 넘으면 맨 뒤로 */
function stepParade() {
  titleFx.tick++;
  const w = titleFx.walkers;
  const minX = Math.min.apply(null, w.map(function (a) { return a.x; }));
  w.forEach(function (a) {
    a.x += 1;
    if (!a.purified && a.x > PARADE_W * 0.55) {
      a.purified = true;
      a.flash = 1;
    }
    if (a.flash > 0) a.flash = Math.max(0, a.flash - 0.08);
    if (a.x > PARADE_W + 16) {
      a.x = Math.min(minX, a.x) - PARADE_GAP;
      a.purified = false;
    }
  });
  drawParade();
}

function drawParade() {
  const ctx = titleFx.ctx;
  if (!ctx) return;
  ctx.clearRect(0, 0, PARADE_W, PARADE_H);

  // 왼쪽은 잿빛, 오른쪽은 밝은 풀빛 — 가운데를 지나며 정화된다
  const grad = ctx.createLinearGradient(0, 0, PARADE_W, 0);
  grad.addColorStop(0, "#8d8478");
  grad.addColorStop(0.5, "#b9b39f");
  grad.addColorStop(0.56, "#cfe3b5");
  grad.addColorStop(1, "#dcebc4");
  ctx.fillStyle = grad;
  ctx.fillRect(0, PARADE_H - 12, PARADE_W, 12);

  const bob = titleFx.tick % 10 < 5 ? 0 : -2;
  titleFx.walkers.forEach(function (a, i) {
    if (a.x < -60 || a.x > PARADE_W + 10) return;
    const grid = a.purified ? a.m.purified.sprite : a.m.sprite;
    const y = PARADE_H - 16 * PARADE_SCALE - 6 + (i % 2 ? bob : -bob - 2);
    drawSprite(ctx, grid, paletteFor(a.m.type), Math.round(a.x), y, PARADE_SCALE, false);
    if (a.flash > 0) {
      ctx.globalAlpha = a.flash;
      drawSpriteSilhouette(ctx, grid, Math.round(a.x), y, PARADE_SCALE, "#ffffff", false);
      ctx.globalAlpha = 1;
    }
  });
}

/* -----------------------------------------------------------
   이렇게 해요 — 세 걸음
   ----------------------------------------------------------- */
function buildHowTo(box) {
  if (!box) return;
  const shadow = MONSTERS[0];
  const steps = [
    {
      img: spriteToDataURL(shadow.sprite, paletteFor(shadow.type), 3),
      title: "그림자몬을 만나요",
      text: "지도 위에 보이는 그림자몬에게 다가가면 싸움이 시작돼요.",
    },
    {
      icon: TOOLS.verify.icon,
      title: "질문을 골라 풀어요",
      text: "진짜일까? 누구의 것일까? 따져볼 질문을 고르면 상황 문제가 나와요.",
    },
    {
      img: spriteToDataURL(shadow.purified.sprite, paletteFor(shadow.type), 3),
      title: "가치몬으로 정화해요",
      text:
        shadow.name + josa(shadow.name, "은", "는") + " " +
        shadow.purified.name + josa(shadow.purified.name, "이", "가") +
        " 돼요. 정화한 가치몬은 질문을 더 세게 만들어요.",
    },
  ];
  box.innerHTML = "";
  steps.forEach(function (s, i) {
    const li = document.createElement("li");
    li.className = "how-step";
    li.innerHTML =
      '<span class="hs-no">' + (i + 1) + "</span>" +
      (s.img ? '<img alt="" src="' + s.img + '">' : '<span class="hs-icon">' + s.icon + "</span>") +
      '<span class="hs-text"><b>' + escapeHtml(s.title) + "</b>" + escapeHtml(s.text) + "</span>";
    box.appendChild(li);
  });
}

/* -----------------------------------------------------------
   세 곳을 정화하는 여정 — 스테이지 카드
   ----------------------------------------------------------- */
function buildStageCards(box) {
  if (!box) return;
  box.innerHTML = "";

  for (let st = 1; st <= lastStage(); st++) {
    const def = stageData(st);
    const card = document.createElement("article");
    card.className = "stage-card";

    // 작은 지도 — 정화되기 전의 모습
    const mapBox = document.createElement("div");
    mapBox.className = "sc-map";
    const c = document.createElement("canvas");
    const mctx = setupCanvas(c, MAP_W * 16, MAP_H * 16, 1);
    drawMap(mctx, 16, 1, function () { return 0; }, st);
    mapBox.appendChild(c);
    const no = document.createElement("span");
    no.className = "sc-no";
    no.textContent = st + "스테이지";
    mapBox.appendChild(no);
    card.appendChild(mapBox);

    const body = document.createElement("div");
    body.className = "sc-body";

    const topics = typesOfStage(st).map(function (t) {
      return '<span class="sc-chip" style="background:' + TYPES[t].accent + '">' + escapeHtml(TYPES[t].name) + "</span>";
    }).join("");

    body.innerHTML =
      '<h3 class="sc-name">' + escapeHtml(def.name) + "</h3>" +
      '<p class="sc-theme">' + escapeHtml(def.theme) + ' · <b>' + escapeHtml(def.side) + "</b></p>" +
      '<p class="sc-topics">' + topics + "</p>";

    // 그림자몬 줄 — 마지막 보스는 실루엣으로만
    const row = document.createElement("div");
    row.className = "sc-mons";
    monstersOfStage(st).forEach(function (m) {
      const img = document.createElement("img");
      if (m.finalBoss) {
        img.src = spriteToDataURL(m.sprite, { ".": "transparent", w: "#3b3833", k: "#3b3833", l: "#3b3833", g: "#3b3833", a: "#3b3833" }, 2);
        img.alt = "마지막 관문";
        img.title = "마지막 관문";
        img.className = "sc-boss";
      } else {
        img.src = spriteToDataURL(m.sprite, paletteFor(m.type), 2);
        img.alt = m.name;
        img.title = m.name;
      }
      row.appendChild(img);
    });
    body.appendChild(row);

    const last = finalBossMonster(st);
    const note = document.createElement("p");
    note.className = "sc-note";
    note.textContent = last && last.party
      ? "마지막 관문에서는 모은 가치몬들과 함께 싸워요."
      : st === 1
        ? "처음은 여기서 시작해요."
        : stageName(st - 1) + josa(stageName(st - 1), "을", "를") + " 정화하면 열려요.";
    body.appendChild(note);

    card.appendChild(body);
    box.appendChild(card);
  }
}

/* -----------------------------------------------------------
   따져볼 질문 — 스테이지마다 하나씩 열린다
   ----------------------------------------------------------- */
function buildToolChips(box) {
  if (!box) return;
  box.innerHTML = "";
  Object.keys(TOOLS).forEach(function (id) {
    const t = TOOLS[id];
    const chip = document.createElement("span");
    chip.className = "tool-chip" + (t.stage ? " later" : "");
    chip.innerHTML =
      '<span class="tc-icon">' + t.icon + "</span>" + escapeHtml(t.name) +
      (t.stage ? '<small>' + escapeHtml(stageName(t.stage)) + "에서</small>" : "");
    box.appendChild(chip);
  });
}
