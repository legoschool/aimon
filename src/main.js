/* ===========================================================
   AI몬스터 — 화면 전환과 입력

   화면은 6개. 한 번에 하나만 보인다.
     title · map · battle · dex · report · class
   =========================================================== */

const screens = {};
const el = {};
let current = "title";

/* -----------------------------------------------------------
   시작
   ----------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", function () {
  ["title", "map", "battle", "dex", "report", "class", "missions", "review"].forEach(function (id) {
    screens[id] = document.getElementById("screen-" + id);
  });

  el.nameInput = document.getElementById("nameInput");
  el.btnStart = document.getElementById("btnStart");
  el.studentList = document.getElementById("studentList");
  el.studentBox = document.getElementById("studentBox");
  el.btnTitleDex = document.getElementById("btnTitleDex");
  el.btnClass = document.getElementById("btnClass");

  el.mapCanvas = document.getElementById("mapCanvas");
  el.zoneLabel = document.getElementById("zoneLabel");
  el.hudDex = document.getElementById("hudDex");
  el.hudBalls = document.getElementById("hudBalls");
  el.hudHint = document.getElementById("hudHint");
  el.hudName = document.getElementById("hudName");
  el.hudMission = document.getElementById("hudMission");
  el.missionList = document.getElementById("missionList");
  el.reviewBody = document.getElementById("reviewBody");

  el.dexGrid = document.getElementById("dexGrid");
  el.reportBody = document.getElementById("reportBody");
  el.classBody = document.getElementById("classBody");

  loadAudioPrefs();
  loadRoster();
  renderStudentList();

  el.nameInput.value = lastStudentName();

  el.btnStart.onclick = function () {
    const name = (el.nameInput.value || "").trim();
    if (!name) {
      el.nameInput.focus();
      el.nameInput.classList.add("shake");
      setTimeout(function () { el.nameInput.classList.remove("shake"); }, 400);
      return;
    }
    if (hasStudent(name)) {
      // 같은 이름이 이미 있으면 이어서 한다
      selectStudent(name);
      enterMap("이어서 탐험합니다.");
    } else {
      newStudent(name);
      enterMap();
    }
  };
  el.nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") el.btnStart.click();
  });

  el.btnTitleDex.onclick = function () { openDex("title"); };
  el.btnClass.onclick = function () { openClass("title"); };

  document.getElementById("btnDex").onclick = function () { openDex("map"); };
  document.getElementById("btnReport").onclick = function () { openReport("map"); };
  document.getElementById("btnMissions").onclick = function () { openMissions("map"); };
  document.getElementById("btnMissionsBack").onclick = closeOverlay;
  document.getElementById("btnReview").onclick = function () { openReview("map"); };
  document.getElementById("btnReviewBack").onclick = function () {
    clearLock();
    closeOverlay();
  };
  document.getElementById("btnTitleBack").onclick = function () {
    stopBgm();
    show("title");
    loadRoster();
    renderStudentList();
  };

  document.getElementById("btnDexBack").onclick = closeOverlay;
  document.getElementById("btnReportBack").onclick = closeOverlay;
  document.getElementById("btnClassBack").onclick = closeOverlay;
  document.getElementById("btnPrint").onclick = function () { window.print(); };
  document.getElementById("btnClassPrint").onclick = function () { window.print(); };

  document.getElementById("tutorialNext").onclick = tutorialNext;

  setupAudioControls();
  setupFontControl();
  setupTouchPad();
  setupKeys();
  setupFirstGesture();

  show("title");
});

/* 브라우저는 사용자가 한 번 누르기 전엔 소리를 못 내게 막는다 */
function setupFirstGesture() {
  function wake() {
    initAudio();
    if (audio.bgmOn) startBgm();
    window.removeEventListener("pointerdown", wake);
    window.removeEventListener("keydown", wake);
  }
  window.addEventListener("pointerdown", wake);
  window.addEventListener("keydown", wake);
}

function setupAudioControls() {
  const s = document.getElementById("btnSfx");
  const b = document.getElementById("btnBgm");

  function paint() {
    s.textContent = audio.sfxOn ? "🔊 효과음" : "🔇 효과음";
    s.classList.toggle("off", !audio.sfxOn);
    b.textContent = audio.bgmOn ? "🎵 배경음" : "🎵̶ 배경음";
    b.classList.toggle("off", !audio.bgmOn);
  }

  s.onclick = function () { initAudio(); setSfx(!audio.sfxOn); paint(); };
  b.onclick = function () { initAudio(); setBgm(!audio.bgmOn); paint(); };
  paint();
}

/* -----------------------------------------------------------
   타이틀 — 이 컴퓨터에 남아 있는 학생 목록
   ----------------------------------------------------------- */
function renderStudentList() {
  const students = listStudents();
  el.studentBox.style.display = students.length ? "" : "none";
  el.studentList.innerHTML = "";

  students.forEach(function (s) {
    const row = document.createElement("div");
    row.className = "student-row";

    const go = document.createElement("button");
    go.className = "student-go";
    go.innerHTML =
      '<span class="st-name">' + escapeHtml(s.name) + "</span>" +
      '<span class="st-meta">정화 ' + s.caught + " / 6 · 정답률 " +
      (s.asked ? Math.round(s.rate * 100) : 0) + "%</span>";
    go.onclick = function () {
      sfx("button");
      selectStudent(s.name);
      enterMap("이어서 탐험합니다.");
    };
    row.appendChild(go);

    const del = document.createElement("button");
    del.className = "student-del";
    del.textContent = "지움";
    del.title = s.name + " 기록 지우기";
    del.onclick = function () {
      if (!confirm(s.name + " 의 기록을 지울까요? 되돌릴 수 없어요.")) return;
      deleteStudent(s.name);
      renderStudentList();
    };
    row.appendChild(del);

    el.studentList.appendChild(row);
  });
}

/* -----------------------------------------------------------
   화면 전환
   ----------------------------------------------------------- */
function show(name) {
  current = name;
  Object.keys(screens).forEach(function (k) {
    screens[k].classList.toggle("active", k === name);
  });
  // 맵을 보고 있을 때만 몬스터가 둥실거린다 (안 보이는 화면을 계속 그릴 이유가 없다)
  if (name === "map") startMapAnim();
  else stopMapAnim();
  window.scrollTo(0, 0);
}

let overlayFrom = "map";
function openDex(from) {
  sfx("dexOpen");
  overlayFrom = from;
  renderDex(el.dexGrid);
  show("dex");
}
function openReport(from) {
  sfx("button");
  overlayFrom = from;
  renderReport(el.reportBody);
  show("report");
}
function openClass(from) {
  sfx("button");
  overlayFrom = from;
  loadRoster();
  renderClassReport(el.classBody);
  show("class");
}
function openMissions(from) {
  sfx("button");
  overlayFrom = from;
  renderMissions(el.missionList);
  show("missions");
}
function openReview(from) {
  sfx("button");
  overlayFrom = from;
  show("review");
  startReview(el.reviewBody, function () {
    clearLock();
    closeOverlay();
    updateHud();
  });
}
function closeOverlay() {
  sfx("button");
  if (overlayFrom === "title") {
    show("title");
    renderStudentList();
  } else {
    show("map");
    drawWorld();
  }
}

/* -----------------------------------------------------------
   맵
   ----------------------------------------------------------- */
function enterMap(message) {
  show("map");
  initWorld(el.mapCanvas);
  world.onEncounter = onEncounter;
  world.onZone = function (name) {
    el.zoneLabel.textContent = name || "";
    el.zoneLabel.style.opacity = name ? "1" : "0";
  };
  updateHud();
  if (audio.bgmOn) startBgm();

  // 처음 하는 학생에게만 박사님이 말을 건다
  tutorialIntro(function () {
    if (message) flash(message);
  });
  if (save.tutorial.intro && message) flash(message);
}

function updateHud() {
  el.hudName.textContent = save.name;
  el.hudDex.textContent = "도감 " + dexCaughtCount() + " / " + MONSTERS.length;
  el.hudBalls.textContent =
    "판단볼 " + save.balls.basic + " · " + save.balls.reason + " · " + save.balls.sure;
  el.hudMission.textContent = "의뢰 " + missionsCleared() + " / " + MISSIONS.length;

  // 복습할 문제가 있으면 버튼에 개수를 띄운다
  const rBtn = document.getElementById("btnReview");
  const n = wrongCount();
  rBtn.textContent = n > 0 ? "복습 " + n : "복습";
  rBtn.classList.toggle("has-work", n > 0);

  const now = currentMission();
  el.hudHint.textContent = now
    ? "지금 할 일 — " + now.title + " : " + now.desc
    : remainingHint();
}

let flashTimer = null;
function flash(text) {
  const box = document.getElementById("mapFlash");
  box.textContent = text;
  box.classList.add("on");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(function () {
    box.classList.remove("on");
  }, 2600);
}

/* -----------------------------------------------------------
   조우 → 전투
   ----------------------------------------------------------- */
function onEncounter(monster) {
  sfx("encounter");
  show("battle");
  const dom = {
    canvas: document.getElementById("battleCanvas"),
    panel: document.getElementById("battlePanel"),
    monName: document.getElementById("monName"),
    monLv: document.getElementById("monLv"),
    monType: document.getElementById("monType"),
    gripBar: document.getElementById("gripBar"),
    gripText: document.getElementById("gripText"),
    trustBar: document.getElementById("trustBar"),
    trustText: document.getElementById("trustText"),
    scoreText: document.getElementById("scoreText"),
    catchHint: document.getElementById("catchHint"),
  };
  startBattle(monster, dom, onBattleEnd);
}

function onBattleEnd(reason, refilled) {
  // 잡았으면 맵에서 없애고, 놓쳤으면 같은 숲의 다른 자리로 옮긴다
  const bossAppeared = updateSpawnAfterBattle(battle.monster.id) === "boss";

  show("map");
  drawWorld();

  const cleared = checkMissions(); // 의뢰 확인 (보상까지 지급)
  updateHud();

  const lines = {
    caught: "도감에 새 가치몬이 등록됐어요!",
    lose: "다시 도전해 봐요. 해설을 떠올리면 훨씬 쉬워요.",
    run: "물러났어요.",
    dry: "이 몬스터의 문제를 모두 맞혔어요!",
    noball: "판단볼이 떨어져 물러났어요.",
  };
  let msg = lines[reason] || "";
  if (refilled) msg += " (기본판단볼 3개를 보충했어요)";
  if (msg) flash(msg);

  // 알릴 것이 겹치면 차례로 보여준다
  let delay = msg ? 2000 : 300;
  cleared.forEach(function (m) {
    setTimeout(function () {
      sfx("caught");
      flash("의뢰 완료 — " + m.title + (m.reward ? " · " + m.reward.label + " 받음!" : "!"));
    }, delay);
    delay += 2800;
  });

  if (bossAppeared) {
    setTimeout(function () {
      sfx("encounter");
      flash("허위정보 데이터숲에 가짜몬이 나타났어요!");
    }, delay);
    delay += 2800;
  }

  if (dexCaughtCount() === MONSTERS.length) {
    setTimeout(function () {
      openReport("map");
    }, delay + 400);
  }
}

/* -----------------------------------------------------------
   입력 — 키보드
   ----------------------------------------------------------- */
const KEYMAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  w: "up", s: "down", a: "left", d: "right",
  W: "up", S: "down", A: "left", D: "right",
  ㅈ: "up", ㄴ: "down", ㅁ: "left", ㅇ: "right", // 한글 자판이어도 움직이게
};

function setupKeys() {
  window.addEventListener("keydown", function (e) {
    if (tutorialIsOpen()) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tutorialNext();
      }
      return;
    }

    // 맵에서는 방향키로 걷는다
    if (current === "map") {
      const dir = KEYMAP[e.key];
      if (!dir) return;
      e.preventDefault();
      moveWorld(dir);
      return;
    }

    // 전투·복습에서는 숫자키와 엔터로 다 할 수 있다 (마우스 없이도)
    if (current === "battle" || current === "review") {
      handleChoiceKey(e);
    }
  });
}

/* -----------------------------------------------------------
   숫자키 1~4 로 고르기, 엔터로 넘어가기

   교실에는 마우스가 서툰 아이가 있다. 손이 불편한 아이도 있다.
   화면에 보이는 순서 그대로 숫자키에 대응시킨다.
   ----------------------------------------------------------- */
function handleChoiceKey(e) {
  const root = current === "battle"
    ? document.getElementById("battlePanel")
    : document.getElementById("reviewBody");
  if (!root) return;

  if (e.key === "Enter" || e.key === " ") {
    const primary = root.querySelector(".btn.primary:not([disabled])");
    if (primary) {
      e.preventDefault();
      primary.click();
    }
    return;
  }

  const n = parseInt(e.key, 10);
  if (!(n >= 1 && n <= 4)) return;

  // 지금 화면에 있는 것 중 먼저 잡히는 것을 누른다
  const groups = [".opt", ".tool-btn", ".ball-btn"];
  for (let i = 0; i < groups.length; i++) {
    const list = root.querySelectorAll(groups[i]);
    if (list.length >= n) {
      const target = list[n - 1];
      if (target && !target.disabled) {
        e.preventDefault();
        target.click();
      }
      return; // 잠겨 있으면 아무 일도 안 일어난다 (읽는 중)
    }
  }
}

/* -----------------------------------------------------------
   글자 크기 — 칠판 글씨가 잘 안 보이는 아이를 위해
   ----------------------------------------------------------- */
const FONT_STEPS = [
  { px: 16, label: "가" },
  { px: 18.5, label: "가" },
  { px: 21, label: "가" },
];
const FONT_KEY = "aimon_font_v1";
let fontStep = 0;

function applyFontStep() {
  document.documentElement.style.fontSize = FONT_STEPS[fontStep].px + "px";
  const btn = document.getElementById("btnFont");
  if (btn) {
    btn.textContent = "글자 " + ["보통", "크게", "아주 크게"][fontStep];
    btn.style.fontSize = fontStep === 0 ? "" : "0.8rem";
  }
  try {
    localStorage.setItem(FONT_KEY, String(fontStep));
  } catch (err) {
    /* 저장이 막혀도 이번 판에는 적용된다 */
  }
}

function setupFontControl() {
  try {
    const saved = parseInt(localStorage.getItem(FONT_KEY), 10);
    if (saved >= 0 && saved < FONT_STEPS.length) fontStep = saved;
  } catch (err) {
    /* 무시 */
  }
  const btn = document.getElementById("btnFont");
  if (btn) {
    btn.onclick = function () {
      sfx("button");
      fontStep = (fontStep + 1) % FONT_STEPS.length;
      applyFontStep();
    };
  }
  applyFontStep();
}

/* -----------------------------------------------------------
   입력 — 화면 방향 버튼 (터치·마우스 겸용)
   ----------------------------------------------------------- */
function setupTouchPad() {
  // 길게 누르기 반복은 한 번에 하나만 돌게 하고, 멈추는 책임을 창 전체가 진다.
  // 버튼 위에서만 pointerup 을 듣게 하면, 손가락을 버튼 밖으로 빼고 떼었을 때
  // 반복이 멈추지 않아 주인공이 혼자 계속 걸어간다.
  let holdTimer = null;

  function stopHold() {
    if (holdTimer !== null) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
  }

  ["up", "down", "left", "right"].forEach(function (dir) {
    const btn = document.getElementById("pad-" + dir);
    if (!btn) return;

    btn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      if (tutorialIsOpen()) return;
      stopHold();
      moveWorld(dir);
      holdTimer = setInterval(function () {
        moveWorld(dir);
      }, 160);
    });

    // 버튼에서 손가락이 벗어나면 바로 멈춘다
    btn.addEventListener("pointerleave", stopHold);
  });

  // 어디서 손을 떼든, 창을 벗어나든, 다른 화면으로 넘어가든 반드시 멈춘다
  window.addEventListener("pointerup", stopHold);
  window.addEventListener("pointercancel", stopHold);
  window.addEventListener("blur", stopHold);
  document.addEventListener("visibilitychange", stopHold);
}
