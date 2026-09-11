/* ===========================================================
   AI몬스터 — 선생님 화면

   구글 시트에 모인 반 전체 기록을 표로 보여 준다.
   암호는 코드에 넣지 않는다. 선생님이 그때그때 입력하고,
   맞는지는 구글 쪽(Apps Script)에서 확인한다.
   그래서 학생이 소스를 봐도 암호를 알 수 없다.

   이 화면은 학생에게 보이지 않는다. 타이틀 아래 작은 [선생님] 로만 들어간다.
   =========================================================== */

function renderAdminRows(container, rows) {
  container.innerHTML = "";

  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "rep-empty";
    p.textContent = "아직 올라온 기록이 없어요. 학생이 몬스터를 한 마리 정화하면 쌓이기 시작합니다.";
    container.appendChild(p);
    return;
  }

  /* --- 반 전체 요약 --- */
  let caught = 0, asked = 0, right = 0, badges = 0;
  const topic = { copyright: [], privacy: [], disinfo: [] };
  rows.forEach(function (r) {
    caught += Number(r.caught) || 0;
    asked += Number(r.asked) || 0;
    right += Number(r.right) || 0;
    badges += Number(r.badges) || 0;
    ["copyright", "privacy", "disinfo"].forEach(function (k) {
      if (r[k] !== "" && r[k] !== null && r[k] !== undefined) topic[k].push(Number(r[k]));
    });
  });
  const avg = function (a) {
    return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length) : 0;
  };

  const head = document.createElement("div");
  head.className = "rep-head";
  head.innerHTML =
    "<h2>반 전체 기록</h2><p>" + rows.length + "명 · " +
    new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) +
    " 기준</p>";
  container.appendChild(head);

  const tiles = document.createElement("div");
  tiles.className = "rep-tiles";
  tiles.appendChild(tile("참여한 학생", rows.length + "명"));
  tiles.appendChild(tile("반 평균 정답률", (asked ? Math.round((right / asked) * 100) : 0) + "%",
    right + " / " + asked + "문제"));
  tiles.appendChild(tile("평균 정화 수", (rows.length ? (caught / rows.length).toFixed(1) : 0) + " / 7"));
  container.appendChild(tiles);

  /* --- 어느 주제를 어려워하나 --- */
  container.appendChild(sectionTitle("우리 반이 어려워하는 주제"));
  const bars = document.createElement("div");
  bars.className = "rep-bars";
  ["copyright", "privacy", "disinfo"].forEach(function (k) {
    const v = avg(topic[k]);
    const d = document.createElement("div");
    d.className = "rep-bar";
    d.innerHTML =
      '<div class="rb-top"><span class="rb-label">' + TYPES[k].name + "</span>" +
      '<span class="rb-num">평균 ' + v + "%</span></div>" +
      '<div class="rb-track"><i style="width:' + v + "%;background:" + TYPES[k].accent + '"></i></div>';
    bars.appendChild(d);
  });
  container.appendChild(bars);

  const weakest = ["copyright", "privacy", "disinfo"]
    .filter(function (k) { return topic[k].length >= 3; })
    .sort(function (a, b) { return avg(topic[a]) - avg(topic[b]); })[0];
  if (weakest) {
    const note = document.createElement("div");
    note.className = "rep-diag";
    note.innerHTML =
      "<p>반 전체가 <b>" + TYPES[weakest].name +
      "</b>" + josa(TYPES[weakest].name, "을", "를") +
      " 가장 어려워했어요. 다음 시간에 이 주제를 함께 짚어 보면 좋겠어요.</p>";
    container.appendChild(note);
  }

  /* --- 학생별 표 (정화 수 → 정답률 순) --- */
  container.appendChild(sectionTitle("학생별 기록"));
  const table = document.createElement("table");
  table.className = "class-table admin-table";
  table.innerHTML =
    "<thead><tr><th>#</th><th>반</th><th>번호</th><th>별명</th>" +
    "<th>정화</th><th>증표</th><th>정답률</th><th>푼 문제</th>" +
    "<th>저작권</th><th>개인정보</th><th>허위정보</th><th>🔑</th><th>마지막</th></tr></thead>";
  const tb = document.createElement("tbody");
  rows.forEach(function (r, i) {
    const tr = document.createElement("tr");
    if (i < 3) tr.className = "top" + (i + 1);
    tr.innerHTML =
      "<td>" + (i + 1) + "</td>" +
      "<td>" + esc(r.klass) + "</td>" +
      "<td>" + esc(r.number) + "</td>" +
      "<td class='ct-name'>" + esc(r.nick) + "</td>" +
      "<td>" + (r.caught || 0) + "</td>" +
      "<td>" + (r.badges || 0) + "</td>" +
      "<td><b>" + (r.rate === "" ? "-" : r.rate + "%") + "</b></td>" +
      "<td>" + (r.asked || 0) + "</td>" +
      "<td>" + (r.copyright === "" ? "-" : r.copyright + "%") + "</td>" +
      "<td>" + (r.privacy === "" ? "-" : r.privacy + "%") + "</td>" +
      "<td>" + (r.disinfo === "" ? "-" : r.disinfo + "%") + "</td>" +
      "<td>" + (r.hints || 0) + "</td>" +
      "<td class='ct-when'>" + (esc(r.when) || "-") + "</td>";
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  container.appendChild(table);

  const legend = document.createElement("p");
  legend.className = "rep-subnote";
  legend.textContent =
    "🔑 은 생각 열쇠를 쓴 문제 수예요. 틀린 문제보다 이쪽이 어디서 막혔는지 더 잘 알려줍니다. " +
    "같은 반·번호는 가장 최근 기록만 나옵니다.";
  container.appendChild(legend);
}

function esc(v) {
  return String(v === undefined || v === null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
