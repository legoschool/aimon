/* ===========================================================
   개발용 — 게임 데이터를 노드에서 불러온다

   게임은 브라우저에서 돌지만, 문항 검사·문항표 만들기·균형 시뮬레이션은
   브라우저 없이 노드로 돌리는 편이 빠르다. 이 파일이 index.html 과 같은 순서로
   data/ 파일을 읽어 한 공간에 담는다. (수업에는 필요 없다)

   index.html 의 <script> 목록을 읽어 순서를 그대로 따른다.
   그래서 파일을 더하거나 옮기면 index.html 만 고치면 된다.
   =========================================================== */

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function scriptList() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const list = [];
  const re = /<script src="([^"]+)"><\/script>/g;
  let m;
  while ((m = re.exec(html))) list.push(m[1]);
  return list;
}

/* data/ 전부와 src/equations.js 를 읽는다. 저장본이 필요한 함수를 쓰려면 fakeSave 를 준다. */
function loadGame(options) {
  const opt = options || {};
  const ctx = { console, Math, Date, JSON };
  vm.createContext(ctx);
  const files = scriptList().filter(function (f) {
    return f.indexOf("data/") === 0 || f === "src/equations.js";
  });
  files.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  });
  if (opt.fakeSave) {
    vm.runInContext(
      "var save = { caught: [], stage: 1, stats: {}, toolStats: {}, balls: { basic: 6, reason: 3, sure: 1 } };" +
        "function isCaught(id) { return save.caught.indexOf(id) !== -1; }" +
        "function currentStage() { return save.stage; }" +
        "function dexCaughtCount() { return save.caught.length; }" +
        "function reachedStage() { return save.stage; }",
      ctx
    );
  }
  ctx.get = function (name) {
    return vm.runInContext(name, ctx);
  };
  return ctx;
}

module.exports = { loadGame, ROOT };
