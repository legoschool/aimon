/* 실제 학생 기록이나 서버 없이 날짜·정렬·화면 구성을 검사한다. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { loadGame, ROOT } = require("./load");
const path = require("node:path");
function element(tag) {
  return { tag, children: [], textContent: "", _html: "",
    set innerHTML(v) { this._html = v; this.children = []; },
    get innerHTML() { return this._html; },
    appendChild(child) { this.children.push(child); return child; }
  };
}
const ctx = loadGame();
ctx.document = { createElement: element };
["src/records.js", "src/report.js", "src/admin.js"].forEach(function (file) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), ctx);
});
const newer = { t: Date.parse("2026-09-27T00:00:00Z"), klass: "5-1", number: "10", nick: "가", caught: 1 };
const older = { t: Date.parse("2025-12-31T23:59:00Z"), klass: "5-1", number: "2", nick: "나", caught: 20 };
const unknown = { klass: "6-1", number: "1", nick: "다", when: "09/01 12:30" };
const rows = [older, unknown, newer];
assert.equal(ctx.sortRecordRows(rows, "recent")[0], newer);
assert.equal(ctx.sortRecordRows(rows, "recent")[2], unknown);
assert.equal(ctx.sortRecordRows(rows, "student")[0], older);
assert.equal(ctx.sortRecordRows(rows, "progress")[0], older);
assert.equal(rows[0], older, "original data must remain unchanged");
assert.match(ctx.recordWhen(newer), /2026.*09.*27.*09:00/);
assert.match(ctx.recordWhen({ lastPlayed: older.t }), /2026.*01.*01.*08:59/);
assert.equal(ctx.recordWhen({ t: "bad" }), "날짜 정보 없음");
assert.match(ctx.recordWhen(unknown), /원본 표시/);
rows.sourceVersion = "v2";
const container = element("div");
ctx.renderAdminRows(container, rows);
const flatten = n => [n].concat(n.children.flatMap(flatten));
let nodes = flatten(container);
assert.ok(nodes.some(n => n.textContent.includes("v4 코드")));
let table = nodes.find(n => n.tag === "table");
assert.match(table.innerHTML, /<th>시트 수신 일시/);
assert.match(table.children[0].children[0].innerHTML, /2026.*09.*27/);
ctx.renderAdminRows(container, rows, { klass: "5-1", order: "student" });
nodes = flatten(container);
table = nodes.find(n => n.tag === "table");
assert.equal(table.children[0].children.length, 2);
assert.match(table.children[0].children[0].innerHTML, /<td>2<\/td>/);
ctx.renderAdminRows(container, []);
assert.ok(flatten(container).some(n => n.textContent.includes("아직 올라온 기록")));
console.log("기록 검사 통과: 연도·한국 시각·날짜 누락·정렬·반 선택·구버전 안내·빈 기록");
