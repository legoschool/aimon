/* ===========================================================
   AI몬스터 — 도감 · 저장 · 기록

   저장은 localStorage 한 칸에 통째로 넣는다.
   교실 컴퓨터는 브라우저를 초기화하는 경우가 있어서,
   읽기·쓰기 모두 try/catch 로 감싸고 실패해도 게임은 그냥 돌아가게 한다.
   =========================================================== */

/* -----------------------------------------------------------
   저장 — 학생별로 따로 남긴다

   교실 컴퓨터는 여러 학생이 돌려 쓴다.
   한 칸에 한 명분만 저장하면 다음 학생이 앞 사람 기록을 덮어써 버린다.
   그래서 이름을 열쇠로 여러 명분을 함께 보관한다.

     aimon_roster_v1 : { "민서": {…}, "지호": {…} }
     aimon_last_v1   : 마지막에 한 사람 이름

   save 는 "지금 하고 있는 학생" 한 명이다.
   전투·기록 쪽 코드는 예전 그대로 save 만 보면 된다.
   ----------------------------------------------------------- */

const ROSTER_KEY = "aimon_roster_v1";
const LAST_KEY = "aimon_last_v1";

let roster = {}; // 이름 → 저장본

function blankSave(name) {
  return {
    name: name || "탐험가",
    caught: [],
    balls: { basic: BALLS.basic.start, reason: BALLS.reason.start, sure: BALLS.sure.start },
    stats: {
      copyright: { right: 0, asked: 0 },
      privacy: { right: 0, asked: 0 },
      disinfo: { right: 0, asked: 0 },
    },
    toolStats: {
      verify: { right: 0, asked: 0 },
      respect: { right: 0, asked: 0 },
      ownership: { right: 0, asked: 0 },
      critique: { right: 0, asked: 0 },
    },
    wrongIds: [],
    battles: 0,
    startedAt: null,
    lastPlayed: null,
    tutorial: { intro: false, battle: false, catchTip: false },
    missionsDone: [], // 달성한 박사님 의뢰 id
  };
}

const save = blankSave("");

/* 저장본 하나를 save 에 옮겨 담는다 (예전 저장본에 없던 항목은 기본값으로 채움) */
function applySave(data) {
  const fresh = blankSave(data.name);
  Object.keys(fresh).forEach(function (k) {
    save[k] = data[k] !== undefined ? data[k] : fresh[k];
  });
  if (!save.tutorial) save.tutorial = { intro: false, battle: false, catchTip: false };
}

function loadRoster() {
  try {
    roster = JSON.parse(localStorage.getItem(ROSTER_KEY)) || {};
  } catch (e) {
    roster = {};
  }
  return roster;
}

function writeRoster() {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  } catch (e) {
    /* 저장이 막힌 환경이어도 진행에는 지장 없다 */
  }
}

function writeSave() {
  if (!save.name) return;
  save.lastPlayed = Date.now();
  roster[save.name] = JSON.parse(JSON.stringify(save));
  writeRoster();
  try {
    localStorage.setItem(LAST_KEY, save.name);
  } catch (e) {
    /* 무시 */
  }
}

/* 이름 목록 — 최근에 한 사람이 위로 */
function listStudents() {
  return Object.keys(roster)
    .map(function (n) {
      const s = roster[n];
      let right = 0;
      let asked = 0;
      Object.keys(s.stats || {}).forEach(function (k) {
        right += s.stats[k].right;
        asked += s.stats[k].asked;
      });
      return {
        name: n,
        caught: (s.caught || []).length,
        right: right,
        asked: asked,
        rate: asked > 0 ? right / asked : 0,
        lastPlayed: s.lastPlayed || 0,
      };
    })
    .sort(function (a, b) {
      return b.lastPlayed - a.lastPlayed;
    });
}

function lastStudentName() {
  try {
    return localStorage.getItem(LAST_KEY) || "";
  } catch (e) {
    return "";
  }
}

function hasStudent(name) {
  return Object.prototype.hasOwnProperty.call(roster, name);
}

/* 이어서 하기 */
function selectStudent(name) {
  if (!hasStudent(name)) return false;
  applySave(roster[name]);
  writeSave();
  return true;
}

/* 처음부터 하기 (같은 이름이 있으면 덮어쓴다) */
function newStudent(name) {
  applySave(blankSave(name || "탐험가"));
  save.startedAt = Date.now();
  writeSave();
}

function deleteStudent(name) {
  delete roster[name];
  writeRoster();
}

/* -----------------------------------------------------------
   조회
   ----------------------------------------------------------- */
function isCaught(id) {
  return save.caught.indexOf(id) !== -1;
}

function dexCaughtCount() {
  return save.caught.length;
}

function markCaught(id) {
  if (!isCaught(id)) {
    save.caught.push(id);
    writeSave();
  }
}

/* 문제 하나 풀 때마다 기록 */
function recordAnswer(question, toolId, isCorrect) {
  const s = save.stats[question.type];
  s.asked++;
  if (isCorrect) s.right++;

  const t = save.toolStats[toolId];
  t.asked++;
  if (isCorrect) t.right++;

  if (!isCorrect && save.wrongIds.indexOf(question.id) === -1) {
    save.wrongIds.push(question.id);
  }
  writeSave();
}

function spendBall(ballId) {
  if (save.balls[ballId] > 0) {
    save.balls[ballId]--;
    writeSave();
    return true;
  }
  return false;
}

function totalBalls() {
  return save.balls.basic + save.balls.reason + save.balls.sure;
}

/* 볼이 다 떨어지면 게임이 막히므로, 판이 끝날 때마다 기본볼을 조금 채워준다 */
function refillBalls() {
  if (totalBalls() < 3) {
    save.balls.basic += 3;
    writeSave();
    return true;
  }
  return false;
}

/* 전체 정답률 */
function overallAccuracy() {
  let r = 0;
  let a = 0;
  Object.keys(save.stats).forEach(function (k) {
    r += save.stats[k].right;
    a += save.stats[k].asked;
  });
  return { right: r, asked: a, rate: a > 0 ? r / a : 0 };
}

/* -----------------------------------------------------------
   도감 화면 그리기
   ----------------------------------------------------------- */
function renderDex(container) {
  container.innerHTML = "";

  MONSTERS.forEach(function (m) {
    const got = isCaught(m.id);
    const card = document.createElement("div");
    card.className = "dex-card" + (got ? " caught" : " unknown");

    const pal = paletteFor(m.type);
    const grid = got ? m.purified.sprite : m.sprite;

    const img = document.createElement("img");
    img.className = "dex-sprite";
    img.alt = got ? m.purified.name : "아직 만나지 않은 AI몬스터";
    img.src = got
      ? spriteToDataURL(grid, pal, 4)
      : spriteToDataURL(m.sprite, shadowPalette(), 4);
    card.appendChild(img);

    const no = document.createElement("div");
    no.className = "dex-no";
    no.textContent = "No." + String(MONSTERS.indexOf(m) + 1).padStart(2, "0");
    card.appendChild(no);

    const name = document.createElement("div");
    name.className = "dex-name";
    name.textContent = got ? m.purified.name : "? ? ?";
    card.appendChild(name);

    const from = document.createElement("div");
    from.className = "dex-from";
    from.textContent = got ? m.name + " 에서 정화" : TYPES[m.type].name;
    card.appendChild(from);

    if (got) {
      const lesson = document.createElement("p");
      lesson.className = "dex-lesson";
      lesson.textContent = m.purified.lesson;
      card.appendChild(lesson);
    }

    container.appendChild(card);
  });
}

/* 아직 못 만난 몬스터는 실루엣만 보여준다 */
function shadowPalette() {
  return { ".": "transparent", w: "#c3c3c3", k: "#c3c3c3", l: "#c3c3c3", g: "#c3c3c3", a: "#c3c3c3" };
}
