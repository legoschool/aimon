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
  const just = [];

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
  const groups = [{ title: "어디서나", list: BADGES.filter(function (b) { return !b.stage; }) }];
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
  img.src = got
    ? spriteToDataURL(b.sprite, badgePalette(b), 4)
    : spriteToDataURL(b.sprite, { ".": "transparent", k: "#c3c3c3", w: "#dedede", a: "#d4d4d4" }, 4);
  card.appendChild(img);

  const name = document.createElement("p");
  name.className = "badge-name";
  name.textContent = got ? b.name : "? ? ?";
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
    img.src = spriteToDataURL(b.sprite, badgePalette(b), 3);
    img.alt = b.name;
    item.appendChild(img);

    const txt = document.createElement("div");
    txt.innerHTML = "<b>" + b.name + "</b><span>" + b.desc + "</span>";
    item.appendChild(txt);

    row.appendChild(item);
  });

  container.appendChild(row);
}
