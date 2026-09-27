/* ===========================================================
   AI몬스터 — 선생님 화면

   구글 시트에 모인 반 전체 기록을 표로 보여 준다.
   암호는 코드에 넣지 않는다. 선생님이 그때그때 입력하고,
   맞는지는 구글 쪽(Apps Script)에서 확인한다.
   그래서 학생이 소스를 봐도 암호를 알 수 없다.

   이 화면은 학생에게 보이지 않는다. 타이틀 아래 작은 [선생님] 로만 들어간다.

   시트의 창구(Apps Script)가 옛 판이면 2·3스테이지 주제 칸이 오지 않는다.
   그래도 멈추지 않고, 값이 온 주제만 막대와 칸으로 보여 준다.
   =========================================================== */

function renderAdminRows(container, allRows, view) {
  const state = view || { klass: "", order: "recent" };
  const rows = sortRecordRows(allRows.filter(function (r) {
    return !state.klass || String(r.klass || "") === state.klass;
  }), state.order);
  container.innerHTML = "";

  const controls = document.createElement("div");
  controls.className = "record-controls";
  function addSelect(labelText, values, selected, change) {
    const label = document.createElement("label");
    label.textContent = labelText + " ";
    const select = document.createElement("select");
    values.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item[0]; option.textContent = item[1];
      select.appendChild(option);
    });
    select.value = selected;
    select.onchange = function () { change(select.value); renderAdminRows(container, allRows, state); };
    label.appendChild(select); controls.appendChild(label);
  }
  const classes = Array.from(new Set(allRows.map(function (r) { return String(r.klass || ""); })))
    .filter(Boolean).sort(function (a, b) { return a.localeCompare(b, "ko", { numeric: true }); });
  addSelect("반", [["", "전체 반"]].concat(classes.map(function (k) { return [k, k]; })),
    state.klass, function (v) { state.klass = v; });
  addSelect("정렬", [["recent", "최근 수신순"], ["student", "반·번호순"], ["progress", "정화 수순"]],
    state.order, function (v) { state.order = v; });
  container.appendChild(controls);
  if (allRows.sourceVersion && !/^v(?:[4-9]|[1-9][0-9]+)$/.test(allRows.sourceVersion)) {
    const warning = document.createElement("p");
    warning.className = "rep-subnote";
    warning.textContent = "시트 연결 버전: " + allRows.sourceVersion +
      ". 현재 게임용 v4 코드로 연결을 갱신해야 합니다. 날짜와 2·3스테이지 기록은 빠져 있을 수 있습니다.";
    container.appendChild(warning);
  }

  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "rep-empty";
    p.textContent = "아직 올라온 기록이 없어요. 학생이 몬스터를 한 마리 정화하면 쌓이기 시작합니다.";
    container.appendChild(p);
    return;
  }

  const hasValue = function (v) { return v !== "" && v !== null && v !== undefined; };

  /* --- 반 전체 요약 --- */
  let caught = 0, asked = 0, right = 0;
  const topic = {};
  topicIds().forEach(function (k) { topic[k] = []; });
  rows.forEach(function (r) {
    caught += Number(r.caught) || 0;
    asked += Number(r.asked) || 0;
    right += Number(r.right) || 0;
    topicIds().forEach(function (k) {
      if (hasValue(r[k])) topic[k].push(Number(r[k]));
    });
  });
  const avg = function (a) {
    return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length) : 0;
  };
  // 값이 하나라도 온 주제만 보여 준다
  const shownTopics = topicIds().filter(function (k) { return topic[k].length > 0; });

  const head = document.createElement("div");
  head.className = "rep-head";
  head.innerHTML =
    "<h2>" + (state.klass ? esc(state.klass) + " 기록" : "전체 반 기록") + "</h2><p>" + rows.length + "명 · " +
    new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) +
    " 조회 · 누적 기록</p>";
  container.appendChild(head);

  const tiles = document.createElement("div");
  tiles.className = "rep-tiles";
  tiles.appendChild(tile("참여한 학생", rows.length + "명"));
  tiles.appendChild(tile("반 평균 정답률", (asked ? Math.round((right / asked) * 100) : 0) + "%",
    right + " / " + asked + "문제"));
  tiles.appendChild(tile("평균 정화 수", (rows.length ? (caught / rows.length).toFixed(1) : 0) + " / " + MONSTERS.length));
  container.appendChild(tiles);

  /* --- 어느 주제를 어려워하나 --- */
  container.appendChild(sectionTitle("우리 반이 어려워하는 주제"));
  const bars = document.createElement("div");
  bars.className = "rep-bars";
  shownTopics.forEach(function (k) {
    const v = avg(topic[k]);
    const d = document.createElement("div");
    d.className = "rep-bar";
    d.innerHTML =
      '<div class="rb-top"><span class="rb-label">' + TYPES[k].name + "</span>" +
      '<span class="rb-num">평균 ' + v + "% · " + topic[k].length + "명</span></div>" +
      '<div class="rb-track"><i style="width:' + v + "%;background:" + TYPES[k].accent + '"></i></div>';
    bars.appendChild(d);
  });
  container.appendChild(bars);

  const weakest = shownTopics
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

  /* 학생별 최신 누적 기록. 성적 순위를 표시하지 않는다. */
  container.appendChild(sectionTitle("학생별 기록"));
  const wrap = document.createElement("div");
  wrap.className = "table-scroll";
  const table = document.createElement("table");
  table.className = "class-table admin-table";
  table.innerHTML =
    "<thead><tr><th>시트 수신 일시 (한국 시각)</th><th>반</th><th>번호</th><th>별명</th><th>있는 곳</th>" +
    "<th>정화</th><th>증표</th><th>정답률</th><th>푼 문제</th>" +
    shownTopics.map(function (k) { return "<th>" + TYPES[k].name + "</th>"; }).join("") +
    "<th>🔑</th></tr></thead>";
  const tb = document.createElement("tbody");
  rows.forEach(function (r, i) {
    const tr = document.createElement("tr");
    const stage = Number(r.stage) || 0;
    tr.innerHTML =
      "<td class='ct-when'>" + esc(recordWhen(r)) + "</td>" +
      "<td>" + esc(r.klass) + "</td>" +
      "<td>" + esc(r.number) + "</td>" +
      "<td class='ct-name'>" + esc(r.nick) + "</td>" +
      "<td>" + (stage ? esc(stageName(stage)) : "-") + "</td>" +
      "<td>" + (r.caught || 0) + "</td>" +
      "<td>" + (r.badges || 0) + "</td>" +
      "<td><b>" + (hasValue(r.rate) ? r.rate + "%" : "-") + "</b></td>" +
      "<td>" + (r.asked || 0) + "</td>" +
      shownTopics.map(function (k) {
        return "<td>" + (hasValue(r[k]) ? r[k] + "%" : "-") + "</td>";
      }).join("") +
      "<td>" + (r.hints || 0) + "</td>";
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  wrap.appendChild(table);
  container.appendChild(wrap);

  const legend = document.createElement("p");
  legend.className = "rep-subnote";
  legend.textContent =
    "🔑 은 생각 열쇠를 쓴 문제 수예요. 전에 틀린 문제는 열쇠가 저절로 펼쳐지므로 함께 셉니다. " +
    "같은 반·번호는 마지막으로 받은 누적 기록만 나옵니다. 날짜별 학습 내역은 이 표에 포함되지 않습니다. " +
    "날짜 정보가 없는 기록은 최근 수신순에서 아래에 표시합니다. 원본 표시는 서버가 보낸 글자이며 날짜순 비교에는 쓰지 않습니다.";
  container.appendChild(legend);
}

function esc(v) {
  return String(v === undefined || v === null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
