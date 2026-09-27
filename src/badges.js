/* ===========================================================
   AI몬스터 — 증표 주기와 보여 주기

   전투·복습이 끝날 때마다 확인해서, 새로 얻은 증표를 알려 준다.
   가치볼과 달리 소모되지 않고 그대로 남는다.
   =========================================================== */

function hasBadge(id) {
  return (save.badges || []).indexOf(id) !== -1;
}

function badgeCount() {
  return (save.badges || []).length;
}

/* 새로 얻은 증표를 찾아 기록하고, 그 목록을 돌려준다 */
function checkBadges() {
  if (!save.badges) save.badges = [];
  const personal = awardPersonalBadges(save);
  const just = BADGES.filter(function (b) { return personal.indexOf(b.id) !== -1; });

  BADGES.forEach(function (b) {
    if (hasBadge(b.id)) return;
    if (!b.goal(save)) return;
    save.badges.push(b.id);
    just.push(b);
  });

  if (just.length > 0) writeSave();
  return just;
}

/* -----------------------------------------------------------
   증표 화면
   ----------------------------------------------------------- */
function renderBadges(container) {
  container.innerHTML = "";

  const note = document.createElement("p");
  note.className = "sheet-note";
  note.innerHTML =
    "가치볼은 쓰면 사라지지만 <b>증표는 남습니다.</b> " +
    "기록에 실리고 인쇄됩니다. <b>" + badgeCount() + " / " + BADGES.length + "</b> 획득";
  container.appendChild(note);

  // 어디서나 얻는 증표 → 스테이지마다 얻는 증표 순서로 묶는다
  const groups = [
    { title: "영역별 강점", list: BADGES.filter(function (b) { return b.kind === 'strength'; }) },
    { title: "풀이와 복습 노력", list: BADGES.filter(function (b) { return b.kind === 'effort'; }) },
    { title: "내 약속", list: BADGES.filter(function (b) { return b.kind === 'pledge'; }) },
    { title: "어디서나", list: BADGES.filter(function (b) { return !b.stage && !b.kind; }) }
  ];
  for (let st = 1; st <= lastStage(); st++) {
    groups.push({
      stage: st,
      title: stageName(st),
      list: BADGES.filter(function (b) { return b.stage === st; }),
    });
  }

  groups.forEach(function (g) {
    if (g.list.length === 0) return;
    const sec = document.createElement("h3");
    sec.className = "badge-sec";
    sec.textContent = g.title;
    container.appendChild(sec);

    // 아직 가 보지 못한 스테이지의 증표는 무엇인지 알려 주지 않는다 (끝까지 가서 만나는 즐거움)
    if (g.stage && g.stage > reachedStage()) {
      const lock = document.createElement("p");
      lock.className = "sheet-note";
      lock.textContent = "앞 스테이지를 정화하면 증표 " + g.list.length + "개가 열려요.";
      container.appendChild(lock);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "badge-grid";
    g.list.forEach(function (b) {
      grid.appendChild(badgeCard(b));
    });
    container.appendChild(grid);
  });
}

function badgeCard(b) {
  const got = hasBadge(b.id);
  const card = document.createElement("div");
  card.className = "badge-card" + (got ? " got" : " locked") + (b.top ? " top" : "");

  const img = document.createElement("img");
  img.className = "badge-img";
  img.alt = got ? b.name : "아직 얻지 못한 증표";
  img.src = badgeImageSource(b) || (got
    ? spriteToDataURL(b.sprite, badgePalette(b), 4)
    : spriteToDataURL(b.sprite, { ".": "transparent", k: "#c3c3c3", w: "#dedede", a: "#d4d4d4" }, 4));
  card.appendChild(img);

  const name = document.createElement("p");
  name.className = "badge-name";
  name.textContent = got || b.kind ? b.name : "? ? ?";
  card.appendChild(name);

  const desc = document.createElement("p");
  desc.className = "badge-desc";
  desc.textContent = b.desc;
  card.appendChild(desc);

  return card;
}

/* -----------------------------------------------------------
   기록(리포트)에 넣을 증표 칸 — 인쇄에도 그대로 나온다
   ----------------------------------------------------------- */
function appendBadgeSection(container) {
  const got = BADGES.filter(function (b) { return hasBadge(b.id); });
  if (got.length === 0) return;

  container.appendChild(sectionTitle("얻은 증표 (" + got.length + " / " + BADGES.length + ")"));

  const row = document.createElement("div");
  row.className = "rep-badges";

  got.forEach(function (b) {
    const item = document.createElement("div");
    item.className = "rep-badge" + (b.top ? " top" : "");

    const img = document.createElement("img");
    img.src = badgeImageSource(b) || spriteToDataURL(b.sprite, badgePalette(b), 3);
    img.alt = b.name;
    item.appendChild(img);

    const txt = document.createElement("div");
    txt.innerHTML = "<b>" + b.name + "</b><span>" + b.desc + "</span>";
    item.appendChild(txt);

    row.appendChild(item);
  });

  container.appendChild(row);
}

/* 첫 화면에서도 전달받은 학생 기록만 쓴다. 현재 save와 섞지 않는다. */
function renderStudentBadges(container, student, key) {
  const ids = student.badges || [];
  const got = BADGES.filter(function (b) { return ids.indexOf(b.id) !== -1; });
  const personal = got.filter(function (b) { return !!b.kind; });
  personal.sort(function (a, b) {
    const order = { pledge:0, strength:1, effort:2 };
    return order[a.kind] - order[b.kind];
  });
  const panel = document.createElement('section');
  panel.className = 'student-achievements';
  const label = document.createElement('p');
  label.className = 'achievement-label';
  label.textContent = (student.nick || student.name) + '의 배지 · ' + got.length + '개';
  panel.appendChild(label);
  const strip = document.createElement('div'); strip.className = 'achievement-strip';
  (personal.length ? personal : got).slice(0, 4).forEach(function (b) {
    const item = document.createElement('div'); item.className = 'achievement-token';
    const img = document.createElement('img'); img.alt = ''; img.src = badgeImageSource(b) || spriteToDataURL(b.sprite, badgePalette(b), 3);
    const name = document.createElement('span'); name.textContent = b.name;
    item.append(img, name); strip.appendChild(item);
  });
  if (!got.length) strip.textContent = '문제를 풀고 복습하면 배지가 생겨요.';
  panel.appendChild(strip);
  const details = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = '배지와 영역별 기록 보기'; details.appendChild(summary);
  const note = document.createElement('p'); note.className = 'achievement-note';
  note.textContent = '강점: 10회·80% / 깊은 판단: 20회·90% / 탐구: 정답률과 관계없이 20회. 반복 풀이와 마지막 싸움도 횟수에 포함돼요. 얻은 배지는 이후 정답률이 내려가도 남아요.';
  details.appendChild(note);
  const stats = document.createElement('div'); stats.className = 'achievement-stats';
  topicIds().forEach(function(k) {
    const t = personalTally(student, k), row = document.createElement('p');
    row.textContent = TYPES[k].name + ' · ' + (t.asked ? t.right + '/' + t.asked + '회 정답 (' + Math.round(t.right / t.asked * 100) + '%)' : '아직 풀지 않았어요');
    stats.appendChild(row);
  });
  details.appendChild(stats);
  got.forEach(function(b) {
    const row = document.createElement('p'); row.className = 'achievement-evidence';
    const e = (student.badgeEvidence || {})[b.id];
    row.textContent = b.name + ' · ' + b.desc + (e && b.topic ? ' / 획득 당시 ' + e.right + '/' + e.asked + '회 정답' : '');
    details.appendChild(row);
  });
  panel.appendChild(details);
  if ((student.caught || []).indexOf('eochapi') !== -1) {
    const link = document.createElement('a'); link.className = 'btn small';
    link.textContent = completedReflection(student) ? '내 약속과 기록장 열기' : '약속 쓰고 배지 받기';
    link.href = 'mockups/ending-reflection.html?mode=game&student=' + encodeURIComponent(key);
    panel.appendChild(link);
  }
  container.appendChild(panel);
}

/* 영역 이름과 색을 문장 안에 넣어 작은 배지도 구별할 수 있게 한다. */
function badgeImageSource(b) {
  if (!b.topic) return b.art || '';
  const color = TYPES[b.topic].accent;
  const label = TYPES[b.topic].name;
  const icon = b.kind === 'effort'
    ? '<path d="M35 55l6-13 9 4-6 13zM50 67l6-14 9 4-6 14z" fill="#fff0c4"/>'
    : '<path d="M28 38h17l5 5 5-5h17v24H55l-5 5-5-5H28z" fill="#fff5d7"/><path d="M50 44v18M33 45h10M57 45h10M33 53h10M57 53h10" stroke="' + color + '" stroke-width="3"/>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><path d="M25 82l-7 32 20-7 12 10 12-10 20 7-7-32" fill="' + color + '" stroke="#29352a" stroke-width="3"/><path d="M15 15h22V7h26v8h22v58L72 91 50 103 28 91 15 73z" fill="' + color + '" stroke="#2e392c" stroke-width="4"/><path d="M21 22h22v-8h14v8h22v49L67 86 50 95 33 86 21 71z" fill="none" stroke="#e4c779" stroke-width="3"/>' + icon + '<text x="50" y="82" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="#fff5d7">' + label + '</text></svg>');
}
