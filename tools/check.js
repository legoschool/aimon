/* ===========================================================
   개발용 — 게임 데이터 전체 점검        실행: node tools/check.js

   문항이나 몬스터, 지도를 고친 뒤 한 번 돌린다. 브라우저를 열기 전에 잡을 수 있는 것을 잡는다.
     · 문항: 칸 빠짐, 보기 4개, 정답 번호, 보너스, 생각 열쇠 물음표
     · 문항: 정답 보기가 가장 긴가 (찍어서 맞히는 길), 보기 길이 차이
     · 문항: 주제마다 질문별 2문항 이상 (모자라면 전투 중 버튼이 잠긴다)
     · 문항: 정답 번호·보너스 정답 번호가 한쪽에 몰렸는가
     · 마지막 싸움의 말: 가치몬 id, 모든 가치몬이 어느 말엔가 딱 맞는가
     · 몬스터 그림 16×16, 상성표 빈칸, 지도 크기와 모든 칸이 이어져 있는가
     · 의뢰·증표·문항 id 겹침
   끝에 "문제 없음"이 나오면 된다. 고칠 것이 있으면 목록으로 나온다.
   =========================================================== */

const { loadGame } = require("./load.js");

const g = loadGame();
const QUESTIONS = g.get("QUESTIONS");
const MONSTERS = g.get("MONSTERS");
const TOOLS = g.get("TOOLS");
const TYPES = g.get("TYPES");
const TYPE_CHART = g.get("TYPE_CHART");
const STAGES = g.get("STAGES");
const MISSIONS = g.get("MISSIONS");
const BADGES = g.get("BADGES");
const FINALE = g.get("FINALE");
const toolsForStage = g.get("toolsForStage");
const typesOfStage = g.get("typesOfStage");

const problems = [];
const warn = [];
const bad = (msg) => problems.push(msg);

/* ---------- 문항 ---------- */
const seen = {};
QUESTIONS.forEach((q) => {
  const id = q.id || "(id 없음)";
  if (seen[id]) bad(id + ": id 가 겹친다");
  seen[id] = true;
  ["type", "tool", "level", "situation", "question", "explanation", "wrongHint", "hint"].forEach((k) => {
    if (!q[k]) bad(id + ": " + k + " 칸이 비었다");
  });
  if (!TYPES[q.type]) bad(id + ": 없는 주제 " + q.type);
  if (!TOOLS[q.tool]) bad(id + ": 없는 질문 " + q.tool);
  if (!Array.isArray(q.options) || q.options.length !== 4) { bad(id + ": 보기는 4개여야 한다"); return; }
  if (!(q.answer >= 0 && q.answer < 4)) bad(id + ": answer 는 0~3 이어야 한다 (0부터 센다)");
  if (q.hint && !/\?$/.test(q.hint.trim())) bad(id + ": 생각 열쇠는 물음으로 끝나야 한다");
  const L = q.options.map((o) => o.length);
  const others = L.filter((_, i) => i !== q.answer);
  if (L[q.answer] > Math.max.apply(null, others)) warn.push(id + ": 정답 보기가 가장 길다 (" + L.join("/") + ")");
  if (Math.max.apply(null, L) / Math.min.apply(null, L) > 1.6) warn.push(id + ": 보기 길이 차이가 크다 (" + L.join("/") + ")");
  if (!q.why) warn.push(id + ": 왜 그럴까 보너스가 없다");
  else {
    if (!Array.isArray(q.why.options) || q.why.options.length !== 3) bad(id + ": 보너스 보기는 3개여야 한다");
    if (!(q.why.answer >= 0 && q.why.answer < 3)) bad(id + ": 보너스 answer 는 0~2");
  }
  const st = q.stage || 1;
  if (TOOLS[q.tool] && (TOOLS[q.tool].stage || 1) > st) bad(id + ": " + st + "스테이지 문항인데 " + TOOLS[q.tool].stage + "스테이지에서 열리는 질문을 쓴다");
});

/* 주제마다 질문별 문항 수, 정답 번호 쏠림 */
for (let st = 1; st < STAGES.length; st++) {
  const qs = QUESTIONS.filter((q) => (q.stage || 1) === st);
  typesOfStage(st).forEach((t) => {
    toolsForStage(st).forEach((tool) => {
      const n = qs.filter((q) => q.type === t && q.tool === tool).length;
      if (n < 2) bad(st + "스테이지 " + TYPES[t].name + ": '" + TOOLS[tool].name + "' 문항이 " + n + "개 (2개 이상 필요)");
    });
  });
  const dist = [0, 0, 0, 0];
  const why = [0, 0, 0];
  let longest = 0;
  qs.forEach((q) => {
    dist[q.answer]++;
    if (q.why) why[q.why.answer]++;
    const L = q.options.map((o) => o.length);
    if (L[q.answer] >= Math.max.apply(null, L)) longest++;
  });
  const spread = (arr) => Math.max.apply(null, arr) - Math.min.apply(null, arr);
  if (spread(dist) > Math.max(2, qs.length * 0.12)) warn.push(st + "스테이지 정답 번호가 몰렸다 " + dist.join("·"));
  if (spread(why) > Math.max(2, qs.length * 0.12)) warn.push(st + "스테이지 보너스 정답 번호가 몰렸다 " + why.join("·"));
  if (longest > qs.length * 0.3) warn.push(st + "스테이지 정답이 가장 긴 보기인 문항이 " + longest + "/" + qs.length);
  console.log(st + "스테이지 " + STAGES[st].name + ": 문항 " + qs.length + " · 정답 번호 " + dist.join("·") + " · 보너스 정답 " + why.join("·") + " · 정답이 가장 긴 문항 " + longest);
}

/* ---------- 몬스터 ---------- */
const monIds = {};
MONSTERS.forEach((m) => {
  if (monIds[m.id]) bad("몬스터 id 겹침 " + m.id);
  monIds[m.id] = true;
  [["sprite", m.sprite], ["purified.sprite", m.purified && m.purified.sprite]].forEach(([name, grid]) => {
    if (!grid || grid.length !== 16 || grid.some((r) => r.length !== 16)) bad(m.id + ": " + name + " 는 16×16 이어야 한다");
    else if (grid.join("").replace(/[.wklga]/g, "").length) bad(m.id + ": " + name + " 에 쓸 수 없는 글자가 있다");
  });
  if (!TYPES[m.type]) bad(m.id + ": 없는 주제 " + m.type);
  if (m.type2 && !TYPES[m.type2]) bad(m.id + ": 없는 둘째 주제 " + m.type2);
  const st = STAGES[m.stage || 1];
  if (!st) bad(m.id + ": 없는 스테이지 " + m.stage);
  else if (!st.homeSpots[m.id]) bad(m.id + ": " + st.name + " 엔딩 자리(homeSpots)가 없다");
});
for (let st = 1; st < STAGES.length; st++) {
  const ms = MONSTERS.filter((m) => (m.stage || 1) === st);
  if (ms.filter((m) => m.finalBoss).length !== 1) bad(st + "스테이지 마지막 보스는 하나여야 한다");
  if (ms.filter((m) => !m.finalBoss).length !== 6) warn.push(st + "스테이지 그림자몬이 여섯이 아니다 (" + ms.length + ")");
}

/* ---------- 상성표 ---------- */
Object.keys(TOOLS).forEach((tool) => {
  Object.keys(TYPES).forEach((t) => {
    if (typeof (TYPE_CHART[tool] || {})[t] !== "number") bad("상성표에 빈칸: " + tool + " × " + t);
  });
});

/* ---------- 지도 ---------- */
const MAP_W = g.get("MAP_W");
const MAP_H = g.get("MAP_H");
for (let st = 1; st < STAGES.length; st++) {
  const d = STAGES[st];
  if (d.map.length !== MAP_H || d.map.some((r) => r.length !== MAP_W)) { bad(d.name + " 지도는 " + MAP_W + "×" + MAP_H + " 이어야 한다"); continue; }
  const walk = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H && d.walkable.indexOf(d.map[y][x]) !== -1;
  const key = (x, y) => x + "," + y;
  const reach = new Set([key(d.start.x, d.start.y)]);
  const queue = [[d.start.x, d.start.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (walk(nx, ny) && !reach.has(key(nx, ny))) { reach.add(key(nx, ny)); queue.push([nx, ny]); }
    });
  }
  let cells = 0;
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (walk(x, y)) cells++;
  if (reach.size !== cells) bad(d.name + ": 시작 칸에서 닿지 않는 칸이 " + (cells - reach.size) + "개 있다");
  ["start", "finalSpot", "bossSpot"].forEach((k) => { if (!walk(d[k].x, d[k].y)) bad(d.name + ": " + k + " 가 걸을 수 없는 칸이다"); });
  Object.keys(d.encounter).forEach((ch) => {
    if (!d.map.join("").includes(ch)) bad(d.name + ": 구역 글자 " + ch + " 가 지도에 없다");
    if (!d.tile[ch] || !d.pure[ch]) bad(d.name + ": 구역 글자 " + ch + " 의 색이 없다");
  });
  if (!d.clear || !d.ending || !d.ending.words) bad(d.name + ": clear 또는 ending 글이 없다");
  if (st > 1 && !d.arrival) warn.push(d.name + ": 도착 안내(arrival)가 없다");
}

/* ---------- 의뢰·증표 ---------- */
[["의뢰", MISSIONS], ["증표", BADGES]].forEach(([name, list]) => {
  const ids = {};
  list.forEach((x) => { if (ids[x.id]) bad(name + " id 겹침 " + x.id); ids[x.id] = true; });
});

/* ---------- 마지막 싸움 ---------- */
if (typeof FINALE !== "undefined" && FINALE) {
  const purifiedIds = {};
  MONSTERS.forEach((m) => { purifiedIds[m.purified.id] = m; });
  const boss = MONSTERS.find((m) => m.id === FINALE.monsterId);
  if (!boss || !boss.party) bad("FINALE.monsterId 가 party 보스를 가리키지 않는다");
  const covered = new Set();
  const dist = [0, 0, 0, 0];
  let longest = 0;
  FINALE.turns.forEach((t) => {
    if (!TYPES[t.topic]) bad(t.id + ": 없는 주제 " + t.topic);
    if (!Array.isArray(t.options) || t.options.length !== 4) bad(t.id + ": 대답은 4개");
    dist[t.answer]++;
    const L = t.options.map((o) => o.length);
    if (L[t.answer] > Math.max.apply(null, L.filter((_, i) => i !== t.answer))) warn.push(t.id + ": 좋은 대답이 가장 길다 (" + L.join("/") + ")");
    if (L[t.answer] >= Math.max.apply(null, L)) longest++;
    t.best.concat(t.good || []).forEach((pid) => {
      if (!purifiedIds[pid]) bad(t.id + ": 없는 가치몬 id " + pid);
      if (purifiedIds[pid] && purifiedIds[pid].id === FINALE.monsterId) bad(t.id + ": 보스 자신은 짝이 될 수 없다");
    });
    t.best.forEach((pid) => covered.add(pid));
    if (!/\?$/.test(t.hint.trim())) bad(t.id + ": 생각 열쇠는 물음으로 끝나야 한다");
  });
  const party = MONSTERS.filter((m) => m.id !== FINALE.monsterId);
  const lonely = party.filter((m) => !covered.has(m.purified.id)).map((m) => m.purified.name);
  if (lonely.length) warn.push("마지막 싸움에서 딱 맞는 말이 하나도 없는 가치몬: " + lonely.join(", "));
  console.log("마지막 싸움: 말 " + FINALE.turns.length + " · 좋은 대답 번호 " + dist.join("·") + " · 좋은 대답이 가장 긴 말 " + longest + " · 딱 맞는 말이 있는 가치몬 " + covered.size + "/" + party.length);
}

console.log("몬스터 " + MONSTERS.length + " · 의뢰 " + MISSIONS.length + " · 증표 " + BADGES.length + " · 질문 " + Object.keys(TOOLS).length);
if (warn.length) console.log("\n살펴볼 것 " + warn.length + "건\n- " + warn.join("\n- "));
if (problems.length) {
  console.log("\n고칠 것 " + problems.length + "건\n- " + problems.join("\n- "));
  process.exitCode = 1;
} else {
  console.log("\n문제 없음" + (warn.length ? " (살펴볼 것은 위에)" : ""));
}
