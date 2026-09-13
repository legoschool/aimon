/* ===========================================================
   개발용 — 문항표.md 만들기        실행: node tools/make-question-table.js

   선생님이 인쇄해서 검토하는 문항표를 문항 파일에서 새로 만든다.
   문항을 고친 뒤 한 번 돌리면 문항표가 게임과 똑같아진다. 손으로 고치지 않는다.
   =========================================================== */

const fs = require("fs");
const path = require("path");
const { loadGame, ROOT } = require("./load.js");

const g = loadGame();
const QUESTIONS = g.get("QUESTIONS");
const TYPES = g.get("TYPES");
const TOOLS = g.get("TOOLS");
const STAGES = g.get("STAGES");
const MONSTERS = g.get("MONSTERS");
const FINALE = g.get("FINALE");
const typesOfStage = g.get("typesOfStage");
const toolsForStage = g.get("toolsForStage");

const LEVEL = { easy: "쉬움", hard: "어려움" };
const NUM = ["1", "2", "3", "4"];
const clip = (s, n) => (s.length > n ? s.slice(0, n) + "…" : s);
const cell = (s) => String(s).replace(/\|/g, "／");

const today = new Date();
const out = [];
out.push("# AI몬스터 문항표 (" + QUESTIONS.length + "문항과 마지막 싸움의 말 " + FINALE.turns.length + "개)");
out.push("");
out.push("만든 날: " + today.getFullYear() + ". " + (today.getMonth() + 1) + ". " + today.getDate() + ".");
out.push("");
out.push("정답 보기 끝에 (정답)이 붙어 있습니다. 학생에게 나눠 줄 때는 이 표시를 지워 주세요.");
out.push("문항을 고칠 곳은 스테이지 폴더의 `questions.js`(예: `data/stage2/questions.js`)이고, 문항 번호(예: `cr_02`)로 찾으면 됩니다.");
out.push("이 파일은 `node tools/make-question-table.js` 로 다시 만들 수 있습니다. 손으로 고치면 다음에 만들 때 사라집니다.");
out.push("");

/* ---------- 한눈에 보기 ---------- */
out.push("## 한눈에 보기");
out.push("");
for (let st = 1; st < STAGES.length; st++) {
  const qs = QUESTIONS.filter((q) => (q.stage || 1) === st);
  out.push("### " + st + "스테이지 " + STAGES[st].name + " (" + qs.length + "문항)");
  out.push("");
  out.push("| 번호 | 주제 | 따져볼 질문 | 난이도 | 상황 |");
  out.push("|---|---|---|---|---|");
  qs.forEach((q) => {
    out.push("| `" + q.id + "` | " + TYPES[q.type].name + " | " + cell(TOOLS[q.tool].name) + " | " + LEVEL[q.level] + " | " + cell(clip(q.situation, 34)) + " |");
  });
  out.push("");
}

/* 분포 */
out.push("### 주제와 질문별 문항 수");
out.push("");
const allTools = Object.keys(TOOLS);
out.push("| 스테이지 | 주제 | " + allTools.map((t) => cell(TOOLS[t].name)).join(" | ") + " | 합계 |");
out.push("|---|---|" + allTools.map(() => "---").join("|") + "|---|");
for (let st = 1; st < STAGES.length; st++) {
  typesOfStage(st).forEach((t) => {
    const qs = QUESTIONS.filter((q) => (q.stage || 1) === st && q.type === t);
    const open = toolsForStage(st);
    out.push("| " + STAGES[st].name + " | " + TYPES[t].name + " | " + allTools.map((tool) => (open.indexOf(tool) === -1 ? "없음" : qs.filter((q) => q.tool === tool).length)).join(" | ") + " | " + qs.length + " |");
  });
}
out.push("");
for (let st = 1; st < STAGES.length; st++) {
  const qs = QUESTIONS.filter((q) => (q.stage || 1) === st);
  const d = [0, 0, 0, 0];
  const w = [0, 0, 0];
  qs.forEach((q) => { d[q.answer]++; if (q.why) w[q.why.answer]++; });
  out.push("- " + STAGES[st].name + ": 정답 번호 1번 " + d[0] + " · 2번 " + d[1] + " · 3번 " + d[2] + " · 4번 " + d[3] + " / 보너스 정답 1번 " + w[0] + " · 2번 " + w[1] + " · 3번 " + w[2]);
}
out.push("");

/* ---------- 문항 전체 ---------- */
for (let st = 1; st < STAGES.length; st++) {
  out.push("---");
  out.push("");
  out.push("# " + st + "스테이지 " + STAGES[st].name);
  out.push("");
  out.push(STAGES[st].theme + ". 아이는 " + STAGES[st].side + "에 섭니다.");
  out.push("");
  typesOfStage(st).forEach((t) => {
    out.push("## " + TYPES[t].name);
    out.push("");
    QUESTIONS.filter((q) => (q.stage || 1) === st && q.type === t).forEach((q) => {
      out.push("### " + q.id + " · " + TOOLS[q.tool].name + " · " + LEVEL[q.level]);
      out.push("");
      out.push("상황: " + q.situation);
      out.push("");
      out.push("질문: " + q.question);
      out.push("");
      q.options.forEach((o, i) => out.push(NUM[i] + ". " + o + (i === q.answer ? " (정답)" : "")));
      out.push("");
      out.push("해설: " + q.explanation);
      out.push("");
      out.push("틀렸을 때 한마디: " + q.wrongHint);
      out.push("");
      out.push("생각 열쇠: " + q.hint);
      if (q.why) {
        out.push("");
        out.push("보너스(왜 그럴까?): " + q.why.question);
        out.push("");
        q.why.options.forEach((o, i) => out.push("   " + NUM[i] + ") " + o + (i === q.why.answer ? " (정답)" : "")));
        out.push("");
        out.push("보너스 해설: " + q.why.explanation);
      }
      out.push("");
    });
  });
}

/* ---------- 마지막 싸움 ---------- */
if (FINALE) {
  const byPid = {};
  MONSTERS.forEach((m) => { byPid[m.purified.id] = m.purified.name; });
  const boss = MONSTERS.find((m) => m.id === FINALE.monsterId);
  out.push("---");
  out.push("");
  out.push("# 마지막 싸움: " + boss.name + "의 말");
  out.push("");
  out.push("어차피몬이 말을 걸면 아이는 그 말에 맞설 가치몬을 고르고, 그 가치몬과 함께 할 대답을 고릅니다. 딱 맞는 가치몬이면 공격이 1.5배, 어울리는 가치몬이면 1배, 나머지는 0.5배입니다. 고칠 곳은 `data/stage3/finale.js` 입니다.");
  out.push("");
  FINALE.turns.forEach((t) => {
    out.push("### " + t.id + " · " + TYPES[t.topic].name);
    out.push("");
    out.push("어차피몬: " + t.line);
    out.push("");
    t.options.forEach((o, i) => out.push(NUM[i] + ". " + o + (i === t.answer ? " (좋은 대답)" : "")));
    out.push("");
    out.push("해설: " + t.explanation);
    out.push("");
    out.push("생각 열쇠: " + t.hint);
    out.push("");
    out.push("딱 맞는 가치몬: " + t.best.map((p) => byPid[p]).join(", ") + (t.good && t.good.length ? " / 어울리는 가치몬: " + t.good.map((p) => byPid[p]).join(", ") : ""));
    out.push("");
  });
}

fs.writeFileSync(path.join(ROOT, "문항표.md"), out.join("\n"));
console.log("문항표.md 를 새로 만들었습니다. 문항 " + QUESTIONS.length + "개, 마지막 싸움의 말 " + (FINALE ? FINALE.turns.length : 0) + "개");
