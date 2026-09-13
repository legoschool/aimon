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

/* 저장본을 찾는 열쇠 — 반·번호가 있으면 그것이 사람을 가른다.
   닉네임을 바꿔도 이어서 할 수 있고, 닉네임이 겹쳐도 섞이지 않는다. */
function studentKey(klass, number, nick) {
  const k = String(klass || "").trim();
  const n = String(number || "").trim();
  if (k && n) return k + "-" + n;
  return String(nick || "").trim();
}

/* 화면에 보여 줄 이름 */
function displayName(s) {
  const t = s || save;
  if (!t) return "";
  if (t.nick && t.klass && t.number) return t.nick + " (" + t.klass + "-" + t.number + ")";
  return t.nick || t.name || "";
}

/* 주제·질문마다 { right, asked } 칸을 만든다.

   예전에는 세 주제와 네 질문을 손으로 적어 두었다.
   2스테이지가 편향·의존·조작과 다섯 번째 질문을 더했는데 칸은 그대로라서,
   데이터 도시에서 첫 답을 고르는 순간 없는 칸에 숫자를 더하다 멈췄다.
   [기록] 화면도 없는 질문 칸을 읽다 멈췄다.
   이제 data/tools.js 의 목록에서 칸을 만들므로 주제나 질문이 늘면 칸도 따라 는다. */
function emptyTally(ids) {
  const t = {};
  ids.forEach(function (id) {
    t[id] = { right: 0, asked: 0 };
  });
  return t;
}

/* 칸이 없으면 만들어서 돌려준다 — 저장본이 어떤 모양이든 멈추지 않게 */
function tallyOf(table, id) {
  if (!table[id]) table[id] = { right: 0, asked: 0 };
  return table[id];
}

function blankSave(name) {
  return {
    name: name || "탐험가", // 저장본을 찾는 열쇠
    klass: "", // 반
    number: "", // 번호
    nick: name || "탐험가", // 화면에 보이는 이름
    caught: [],
    balls: { basic: BALLS.basic.start, reason: BALLS.reason.start, sure: BALLS.sure.start },
    stats: emptyTally(topicIds()),
    toolStats: emptyTally(Object.keys(TOOLS)),
    wrongIds: [],
    hintIds: [], // 생각 열쇠를 쓴 문항 (어디서 막히는지 선생님께 보여 준다)
    battles: 0,
    startedAt: null,
    lastPlayed: null,
    tutorial: { intro: false, battle: false, catchTip: false, city: false },
    missionsDone: [], // 달성한 박사님 의뢰 id
    badges: [], // 얻은 증표 id — 사라지지 않고 기록·인쇄에 남는다
    reviewCleared: 0, // 복습으로 지운 문항 수 (누적)
    perfectCatch: false, // 한 문제도 안 틀리고 정화한 적이 있는가
    endingSeen: false, // 1스테이지 엔딩을 본 적이 있는가
    stage: 1, // 지금 있는 마을 (1 = AI 마을, 2 = 데이터 도시)
    stagesSeen: [], // 엔딩을 본 스테이지 번호들
  };
}

const save = blankSave("");

/* 저장본 하나를 save 에 옮겨 담는다 (예전 저장본에 없던 항목은 기본값으로 채움)

   맨 윗단만 채우면 안 된다. 예전 저장본에도 stats 는 있으니 통째로 그대로 들어오고,
   그 안에 새 주제 칸이 없어 멈춘다. 그래서 칸 묶음(stats·toolStats·balls·tutorial)은
   기본값 위에 예전 값을 덮어 합친다. */
function applySave(data) {
  const fresh = blankSave(data.name);
  Object.keys(fresh).forEach(function (k) {
    const v = data[k];
    if (v === undefined || v === null) {
      save[k] = fresh[k];
    } else if (isPlainObject(fresh[k]) && isPlainObject(v)) {
      save[k] = Object.assign({}, fresh[k], v);
    } else {
      save[k] = v;
    }
  });
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
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
        nick: s.nick || n,
        klass: s.klass || "",
        number: s.number || "",
        label: displayName(s),
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

/* 처음부터 하기 (같은 열쇠가 있으면 덮어쓴다) */
function newStudent(klass, number, nick) {
  const key = studentKey(klass, number, nick);
  applySave(blankSave(key));
  save.klass = String(klass || "").trim();
  save.number = String(number || "").trim();
  save.nick = String(nick || "").trim() || key;
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

/* 지금 있는 마을 — 예전 저장본에는 없으므로 없으면 1이다 */
function currentStage() {
  return save.stage || 1;
}

/* 지금 마을의 마지막 보스까지 정화했는가.
   지도 색, 퀘스트 배너, 엔딩이 모두 이 하나를 보고 움직인다. */
function villageIsPure() {
  return stageCleared(currentStage());
}

/* 다음 마을이 열렸는가 — 1스테이지를 끝내야 데이터 도시로 갈 수 있다 */
function nextStageOpen() {
  return stageCleared(1) && currentStage() === 1;
}

/* 이 학생이 가 볼 수 있는 가장 먼 스테이지.
   앞 스테이지의 마지막 보스를 정화해야 다음이 열린다.
   기록 화면은 여기까지의 주제와 질문만 보여 준다 (아직 안 열린 것은 보여 주지 않는다). */
function reachedStage() {
  let n = 1;
  while (n < LAST_STAGE && stageCleared(n)) n++;
  return Math.max(n, currentStage());
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

/* 문제 하나 풀 때마다 기록
   toolId 가 없으면(질문을 고르지 않는 싸움) 질문별 칸은 건드리지 않는다 */
function recordAnswer(question, toolId, isCorrect) {
  const s = tallyOf(save.stats, question.type);
  s.asked++;
  if (isCorrect) s.right++;

  if (toolId) {
    const t = tallyOf(save.toolStats, toolId);
    t.asked++;
    if (isCorrect) t.right++;
  }

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
