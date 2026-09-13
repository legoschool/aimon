/* 교실/개발용 간단 정적 서버.
   게임 자체는 서버 없이 index.html 을 더블클릭해도 돌아간다.
   이 파일은 브라우저에서 점검할 때만 쓴다.   실행: node serve.js

   점검하다 몬스터를 잡으면 선생님 시트에 가짜 줄이 쌓인다.
   그래서 이 서버로 열 때는 시트 연동을 꺼서 내보낸다.
   실제로 보내 봐야 할 때만 SHEET=on 으로 켠다.   예: SHEET=on node serve.js   */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 5178;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

http
  .createServer(function (req, res) {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel === "/") rel = "/index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    fs.readFile(file, function (err, buf) {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("not found: " + rel);
        return;
      }
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      if (rel === "/data/config.js" && process.env.SHEET !== "on") {
        buf = Buffer.from(
          buf.toString("utf8").replace(
            /const SHEET_ENABLED = true;/,
            "const SHEET_ENABLED = false; // 점검 서버라 시트로 보내지 않는다 (serve.js)"
          )
        );
      }
      res.end(buf);
    });
  })
  .listen(PORT, function () {
    console.log("AI몬스터 점검 서버: http://localhost:" + PORT);
  });
