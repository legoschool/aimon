/* ===========================================================
   개발용 — 균형 시뮬레이션        실행: node tools/simulate.js [판 수]

   난이도 숫자(src/equations.js 의 BALANCE, 몬스터 장악력, FINALE)를 바꾸기 전에 돌려 본다.
   아이 모형
     · 문제마다 정답률 p 로 맞힌다. 보너스도 p 로 맞힌다.
     · 질문은 상성×강화가 가장 센 것을 고른다. 볼은 던질 수 있게 되면 바로, 가장 잘 잡히는 볼을 던진다.
     · 지면(신뢰도 0) 같은 몬스터에게 다시 도전한다. 판이 끝날 때 볼이 3개 밑이면 기본볼 3개를 받는다.
     · 마지막 싸움은 "딱 맞는 가치몬을 찾는 아이"와 "아무 가치몬이나 내는 아이"로 나눠 본다.
   실제 아이는 해설을 읽고 다시 만난 문제를 더 잘 맞히므로, 이 숫자는 조금 어렵게 나온다.
   =========================================================== */

const { loadGame } = require("./load.js");

const g = loadGame({ fakeSave: true });
const QUESTIONS = g.get("QUESTIONS");
const MONSTERS = g.get("MONSTERS");
const BALANCE = g.get("BALANCE");
const TOOLS = g.get("TOOLS");
const FINALE = g.get("FINALE");
const STAGES = g.get("STAGES");
const save = g.get("save");
const getTypeMultiplier = g.get("getTypeMultiplier");
const getComboMultiplier = g.get("getComboMultiplier");
const getToolBoost = g.get("getToolBoost");
const toolsForStage = g.get("toolsForStage");
const calcCatchChance = g.get("calcCatchChance");
const bal = g.get("bal");

function poolFor(m, tool) {
  const st = m.stage || 1;
  return QUESTIONS.filter((q) => (q.stage || 1) === st && q.tool === tool && (m.type === "all" || q.type === m.type || (m.type2 && q.type === m.type2)));
}

function fightNormal(m, p) {
  let grip = m.maxGrip, trust = BALANCE.maxTrust, streak = 0, right = 0, asked = 0, lastTool = null;
  const used = new Set();
  const tools = toolsForStage(m.stage || 1);
  for (let turn = 0; turn < 300; turn++) {
    let avail = tools.filter((t) => poolFor(m, t).some((q) => !used.has(q.id)));
    if (m.finalBoss) avail = avail.filter((t) => t !== lastTool);
    if (!avail.length) return { caught: false, asked };
    const tool = avail.slice().sort((a, b) => getTypeMultiplier(b, m.type, m.type2) * getToolBoost(b) - getTypeMultiplier(a, m.type, m.type2) * getToolBoost(a))[0];
    lastTool = tool;
    const pool = poolFor(m, tool).filter((q) => !used.has(q.id));
    const q = pool[Math.floor(Math.random() * pool.length)];
    asked++;
    if (Math.random() < p) {
      right++; streak++; used.add(q.id);
      let dmg = Math.round(BALANCE.baseDamage * getTypeMultiplier(tool, m.type, m.type2) * getComboMultiplier(streak) * getToolBoost(tool));
      if (q.why && asked > 1 && Math.random() < bal("whyChance") && Math.random() < p) dmg *= 2;
      grip = Math.max(0, grip - dmg);
    } else {
      streak = 0;
      trust -= Math.round(BALANCE.wrongPenalty * (TOOLS[tool].wrongDamageMultiplier || 1));
      if (trust <= 0) return { caught: false, asked };
    }
    if (grip <= m.maxGrip * BALANCE.catchGripRatio && right / asked >= bal("catchMinAccuracy") && asked >= bal("minAskedToCatch")) {
      const ids = Object.keys(save.balls).filter((b) => save.balls[b] > 0);
      if (!ids.length) return { caught: false, asked };
      ids.sort((a, b) => calcCatchChance(m, grip, right, asked, b, streak) - calcCatchChance(m, grip, right, asked, a, streak));
      const chance = calcCatchChance(m, grip, right, asked, ids[0], streak);
      save.balls[ids[0]]--;
      if (Math.random() < chance) return { caught: true, asked };
    }
  }
  return { caught: false, asked };
}

function fightParty(m, p, smart) {
  const members = MONSTERS.filter((x) => save.caught.indexOf(x.id) !== -1 && x.id !== m.id);
  let grip = m.maxGrip, trust = BALANCE.maxTrust, streak = 0, asked = 0;
  let resting = new Set(), done = new Set(), last = null;
  for (let t = 0; t < 600; t++) {
    if (members.every((x) => resting.has(x.id))) resting = new Set();
    let pool = FINALE.turns.filter((x) => !done.has(x.id));
    if (!pool.length) { done = new Set(); pool = FINALE.turns.slice(); }
    if (pool.length > 1) pool = pool.filter((x) => x.id !== last);
    const ready = pool.filter((x) => members.some((mm) => !resting.has(mm.id) && x.best.indexOf(mm.purified.id) !== -1));
    const from = ready.length ? ready : pool;
    const turn = from[Math.floor(Math.random() * from.length)];
    const free = members.filter((x) => !resting.has(x.id));
    const pick = smart
      ? free.find((x) => turn.best.indexOf(x.purified.id) !== -1) || free.find((x) => (turn.good || []).indexOf(x.purified.id) !== -1) || free[Math.floor(Math.random() * free.length)]
      : free[Math.floor(Math.random() * free.length)];
    const match = turn.best.indexOf(pick.purified.id) !== -1 ? "best" : (turn.good || []).indexOf(pick.purified.id) !== -1 ? "good" : "miss";
    asked++; last = turn.id;
    if (Math.random() < p) {
      streak++;
      grip -= Math.round(FINALE.baseDamage * FINALE.match[match] * getComboMultiplier(streak));
      resting.add(pick.id); done.add(turn.id);
      if (grip <= 0) return { caught: true, asked };
    } else {
      streak = 0;
      trust -= BALANCE.wrongPenalty;
      if (trust <= 0) return { caught: false, asked };
    }
  }
  return { caught: false, asked };
}

function playStage(st, p, smartParty) {
  save.stage = st;
  const mons = MONSTERS.filter((m) => (m.stage || 1) === st);
  const regular = mons.filter((m) => !m.finalBoss);
  let battles = 0, asked = 0, bossAsked = 0;
  for (let guard = 0; guard < 120; guard++) {
    const n = regular.filter((m) => save.caught.indexOf(m.id) !== -1).length;
    const open = mons.filter((m) => save.caught.indexOf(m.id) === -1 && (!m.boss || n >= 3) && (!m.finalBoss || n === regular.length));
    if (!open.length) break;
    const m = open[0];
    battles++;
    const r = m.party ? fightParty(m, p, smartParty) : fightNormal(m, p);
    asked += r.asked;
    if (m.finalBoss) bossAsked += r.asked;
    if (r.caught) save.caught.push(m.id);
    if (save.balls.basic + save.balls.reason + save.balls.sure < 3) save.balls.basic += 3;
  }
  save.balls.reason += 4; // 의뢰 보상을 대략 더한다
  save.balls.sure += 3;
  return { cleared: mons.every((m) => save.caught.indexOf(m.id) !== -1), battles, asked, bossAsked };
}

const N = Number(process.argv[2] || 200);
console.log("판 수 " + N + " (아이 한 명이 처음부터 끝까지 하는 것을 한 판으로 센다)\n");
[[0.5, true], [0.6, true], [0.7, true], [0.8, true], [0.9, true], [0.7, false]].forEach(([p, smartParty]) => {
  const rows = {};
  for (let i = 0; i < N; i++) {
    save.caught = []; save.balls = { basic: 6, reason: 3, sure: 1 };
    for (let st = 1; st < STAGES.length; st++) {
      const r = playStage(st, p, smartParty);
      (rows[st] = rows[st] || []).push(r);
      if (!r.cleared) break;
    }
  }
  const line = Object.keys(rows).map((st) => {
    const rs = rows[st];
    const ok = rs.filter((r) => r.cleared);
    const avg = (k) => (ok.length ? (ok.reduce((s, r) => s + r[k], 0) / ok.length).toFixed(0) : "-");
    return STAGES[st].name + " 완주 " + Math.round((ok.length / rs.length) * 100) + "% · 문제 " + avg("asked") + "개 · 싸움 " + avg("battles") + "번 · 마지막 보스 " + avg("bossAsked") + "문제";
  });
  console.log("정답률 " + p + (smartParty ? "" : " (마지막 싸움에서 아무 가치몬이나)") + "\n  " + line.join("\n  "));
});
