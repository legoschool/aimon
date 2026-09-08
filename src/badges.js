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

  const grid = document.createElement("div");
  grid.className = "badge-grid";

  BADGES.forEach(function (b) {
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

    grid.appendChild(card);
  });

  container.appendChild(grid);
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
