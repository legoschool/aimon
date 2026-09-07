/* ===========================================================
   AI몬스터 — 결과 리포트

   속성별·도구별 정답률을 보여주고, 틀렸던 문제를 다시 읽게 한다.
   인쇄하면 그대로 학습지가 된다.
   =========================================================== */

function renderReport(container) {
  container.innerHTML = "";

  const all = overallAccuracy();

  /* ---- 머리말 ---- */
  const head = document.createElement("div");
  head.className = "rep-head";
  head.innerHTML =
    "<h2>AI몬스터 탐험 기록</h2>" +
    "<p>" +
    (save.name || "탐험가") +
    " · " +
    new Date().toLocaleDateString("ko-KR") +
    "</p>";
  container.appendChild(head);

  /* ---- 큰 숫자 3개 ---- */
  const tiles = document.createElement("div");
  tiles.className = "rep-tiles";
  tiles.appendChild(tile("정화한 AI몬스터", dexCaughtCount() + " / " + MONSTERS.length));
  tiles.appendChild(
    tile("전체 정답률", Math.round(all.rate * 100) + "%", all.right + " / " + all.asked + "문제")
  );
  tiles.appendChild(tile("만난 횟수", save.battles + "번"));
  container.appendChild(tiles);

  if (all.asked === 0) {
    const empty = document.createElement("p");
    empty.className = "rep-empty";
    empty.textContent = "아직 푼 문제가 없어요. 데이터숲을 걸어 다니며 AI몬스터를 만나 보세요.";
    container.appendChild(empty);
    return;
  }

  /* ---- 속성별 ---- */
  container.appendChild(sectionTitle("어떤 주제를 잘 아나요?"));
  const byType = document.createElement("div");
  byType.className = "rep-bars";
  ["copyright", "privacy", "disinfo"].forEach(function (t) {
    const s = save.stats[t];
    byType.appendChild(bar(TYPES[t].name, s.right, s.asked, TYPES[t].accent));
  });
  container.appendChild(byType);

  /* ---- 도구별 ---- */
  container.appendChild(sectionTitle("어떤 판단 도구를 잘 쓰나요?"));
  const byTool = document.createElement("div");
  byTool.className = "rep-bars";
  Object.keys(TOOLS).forEach(function (id) {
    const s = save.toolStats[id];
    byTool.appendChild(bar(TOOLS[id].icon + " " + TOOLS[id].name, s.right, s.asked, "#5a6b7d"));
  });
  container.appendChild(byTool);

  /* ---- 진단 한마디 ---- */
  container.appendChild(sectionTitle("선생님 한마디"));
  const diag = document.createElement("div");
  diag.className = "rep-diag";
  diag.innerHTML = diagnose(all);
  container.appendChild(diag);

  /* ---- 정화한 가치몬 ---- */
  if (dexCaughtCount() > 0) {
    container.appendChild(sectionTitle("내가 얻은 가치"));
    const got = document.createElement("div");
    got.className = "rep-values";
    MONSTERS.filter(function (m) {
      return isCaught(m.id);
    }).forEach(function (m) {
      const row = document.createElement("div");
      row.className = "rep-value";
      const img = document.createElement("img");
      img.src = spriteToDataURL(m.purified.sprite, paletteFor(m.type), 3);
      img.alt = m.purified.name;
      row.appendChild(img);
      const txt = document.createElement("div");
      txt.innerHTML =
        "<b>" + m.purified.name + "</b><span>" + m.purified.lesson + "</span>";
      row.appendChild(txt);
      got.appendChild(row);
    });
    container.appendChild(got);
  }

  /* ---- 틀렸던 문제 다시 보기 ---- */
  const wrongs = QUESTIONS.filter(function (q) {
    return save.wrongIds.indexOf(q.id) !== -1;
  });
  if (wrongs.length > 0) {
    container.appendChild(sectionTitle("한 번이라도 틀렸던 문제 (" + wrongs.length + "개)"));
    const list = document.createElement("div");
    list.className = "rep-wrongs";
    wrongs.forEach(function (q) {
      const item = document.createElement("div");
      item.className = "rep-wrong";
      item.innerHTML =
        '<p class="rw-tag">' + TYPES[q.type].name + " · " + TOOLS[q.tool].name + "</p>" +
        '<p class="rw-sit">' + escapeHtml(q.situation) + "</p>" +
        '<p class="rw-q">' + escapeHtml(q.question) + "</p>" +
        '<p class="rw-a">정답: ' + escapeHtml(q.options[q.answer]) + "</p>" +
        '<p class="rw-e">' + escapeHtml(q.explanation) + "</p>";
      list.appendChild(item);
    });
    container.appendChild(list);
  }
}

/* ===========================================================
   반 전체 기록 — 선생님용

   한 컴퓨터에서 여러 학생이 했을 때, 누가 어디까지 했는지 한눈에 본다.
   이 화면도 그대로 인쇄된다.
   =========================================================== */
function renderClassReport(container) {
  container.innerHTML = "";
  const students = listStudents();

  const head = document.createElement("div");
  head.className = "rep-head";
  head.innerHTML =
    "<h2>반 전체 기록</h2>" +
    "<p>이 컴퓨터에 남아 있는 기록 " + students.length + "명 · " +
    new Date().toLocaleDateString("ko-KR") + "</p>";
  container.appendChild(head);

  if (students.length === 0) {
    const p = document.createElement("p");
    p.className = "rep-empty";
    p.textContent = "아직 저장된 기록이 없어요.";
    container.appendChild(p);
    return;
  }

  /* 반 평균 */
  let cRight = 0, cAsked = 0, cCaught = 0;
  const byType = { copyright: { right: 0, asked: 0 }, privacy: { right: 0, asked: 0 }, disinfo: { right: 0, asked: 0 } };
  students.forEach(function (s) {
    cRight += s.right; cAsked += s.asked; cCaught += s.caught;
    const raw = roster[s.name];
    Object.keys(byType).forEach(function (t) {
      byType[t].right += raw.stats[t].right;
      byType[t].asked += raw.stats[t].asked;
    });
  });

  const tiles = document.createElement("div");
  tiles.className = "rep-tiles";
  tiles.appendChild(tile("참여한 학생", students.length + "명"));
  tiles.appendChild(tile("반 평균 정답률", (cAsked ? Math.round((cRight / cAsked) * 100) : 0) + "%", cRight + " / " + cAsked + "문제"));
  tiles.appendChild(tile("평균 정화 수", (students.length ? (cCaught / students.length).toFixed(1) : 0) + " / 6"));
  container.appendChild(tiles);

  /* 반 전체가 어느 주제를 어려워하나 */
  container.appendChild(sectionTitle("우리 반이 어려워하는 주제"));
  const bars = document.createElement("div");
  bars.className = "rep-bars";
  ["copyright", "privacy", "disinfo"].forEach(function (t) {
    bars.appendChild(bar(TYPES[t].name, byType[t].right, byType[t].asked, TYPES[t].accent));
  });
  container.appendChild(bars);

  const weakest = ["copyright", "privacy", "disinfo"]
    .filter(function (t) { return byType[t].asked >= 5; })
    .sort(function (a, b) {
      return byType[a].right / byType[a].asked - byType[b].right / byType[b].asked;
    })[0];
  if (weakest) {
    const note = document.createElement("div");
    note.className = "rep-diag";
    note.innerHTML =
      "<p>반 전체가 <b>" + TYPES[weakest].name +
      "</b>을(를) 가장 어려워했어요. 이 주제를 함께 다시 짚어 보면 좋겠어요.</p>";
    container.appendChild(note);
  }

  /* 학생별 표 */
  container.appendChild(sectionTitle("학생별 기록"));
  const table = document.createElement("table");
  table.className = "class-table";
  table.innerHTML =
    "<thead><tr><th>이름</th><th>정화</th><th>정답률</th><th>푼 문제</th><th>마지막</th></tr></thead>";
  const tb = document.createElement("tbody");
  students.forEach(function (s) {
    const tr = document.createElement("tr");
    const when = s.lastPlayed
      ? new Date(s.lastPlayed).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
      : "-";
    tr.innerHTML =
      "<td class='ct-name'>" + escapeHtml(s.name) + "</td>" +
      "<td>" + s.caught + " / 6</td>" +
      "<td>" + (s.asked ? Math.round(s.rate * 100) : 0) + "%</td>" +
      "<td>" + s.asked + "</td>" +
      "<td class='ct-when'>" + when + "</td>";
    tb.appendChild(tr);
  });
  table.appendChild(tb);
  container.appendChild(table);
}

/* -----------------------------------------------------------
   조각들
   ----------------------------------------------------------- */
function tile(label, value, sub) {
  const d = document.createElement("div");
  d.className = "rep-tile";
  d.innerHTML =
    '<span class="rt-label">' + label + "</span>" +
    '<span class="rt-value">' + value + "</span>" +
    (sub ? '<span class="rt-sub">' + sub + "</span>" : "");
  return d;
}

function sectionTitle(text) {
  const h = document.createElement("h3");
  h.className = "rep-section";
  h.textContent = text;
  return h;
}

function bar(label, right, asked, color) {
  const pct = asked > 0 ? Math.round((right / asked) * 100) : 0;
  const g = asked > 0 ? gradeOf(right / asked) : { label: "안 풀었어요", tone: "none" };

  const d = document.createElement("div");
  d.className = "rep-bar";
  d.innerHTML =
    '<div class="rb-top"><span class="rb-label">' + label + "</span>" +
    '<span class="rb-num">' + right + " / " + asked + " · " + pct + "%</span></div>" +
    '<div class="rb-track"><i style="width:' + pct + "%;background:" + color + '"></i></div>' +
    '<span class="rb-grade ' + g.tone + '">' + g.label + "</span>";
  return d;
}

/* 성적을 보고 한마디 만들어 준다 */
function diagnose(all) {
  const lines = [];
  const pct = Math.round(all.rate * 100);

  if (pct >= 90) {
    lines.push("AI를 쓸 때 무엇을 조심해야 하는지 아주 잘 알고 있어요.");
  } else if (pct >= 75) {
    lines.push("대부분의 상황에서 옳은 판단을 하고 있어요.");
  } else if (pct >= 60) {
    lines.push("기본은 잡혀 있어요. 헷갈리는 상황을 조금만 더 살펴보면 좋겠어요.");
  } else {
    lines.push("아직 헷갈리는 것이 많아요. 틀렸던 문제를 다시 읽어 보는 것부터 해 봐요.");
  }

  // 가장 약한 속성 짚어주기
  let worst = null;
  ["copyright", "privacy", "disinfo"].forEach(function (t) {
    const s = save.stats[t];
    if (s.asked < 3) return;
    const r = s.right / s.asked;
    if (!worst || r < worst.rate) worst = { type: t, rate: r };
  });
  if (worst && worst.rate < 0.7) {
    lines.push(
      "특히 <b>" + TYPES[worst.type].name +
      "</b> 문제를 더 살펴보면 좋겠어요. 이 주제의 가치몬 설명을 다시 읽어 보세요."
    );
  }

  // 안 써 본 도구 짚어주기
  const unused = Object.keys(TOOLS).filter(function (id) {
    return save.toolStats[id].asked === 0;
  });
  if (unused.length > 0) {
    lines.push(
      "아직 <b>" +
        unused.map(function (id) { return TOOLS[id].name; }).join(", ") +
        "</b> 도구를 써 보지 않았어요. 다음엔 다른 방법으로도 맞서 보세요."
    );
  }

  if (dexCaughtCount() === MONSTERS.length) {
    lines.push("AI몬스터를 모두 정화했어요. 도감을 친구에게 소개해 보세요!");
  }

  return lines.map(function (l) { return "<p>" + l + "</p>"; }).join("");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
