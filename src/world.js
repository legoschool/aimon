/* ===========================================================
   AI몬스터 — 맵 돌아다니기 & 조우

   몬스터는 풀숲 위에 "보이게" 서 있다.
   예전처럼 걸을 때마다 확률로 튀어나오지 않는다.

   무작위 조우는 아무 성과 없이 헤매는 시간을 만든다.
   눈에 보이면 목표가 분명해지고, 무엇보다
   선생님이 교실을 돌며 화면만 봐도 진도를 알 수 있다.
   =========================================================== */

const TILE = 16;
const MAP_SCALE = 2; // 정수배만! 320×224 → 640×448

const world = {
  x: 0, // initWorld 에서 지금 스테이지의 시작 칸으로 채운다
  y: 0,
  dir: "down",
  frame: 0,
  steps: 0,
  moving: false,
  ctx: null,
  spawns: [], // [{ id, x, y }] 맵 위에 서 있는 몬스터들
  bob: 0, // 둥실거리는 애니메이션
  animTimer: null,
  onEncounter: null,
  onZone: null,
  lastZone: null,
};

/* 중간 보스와 마지막 보스가 설 자리는 스테이지마다 다르다.
   data/map.js 의 bossSpot() · finalSpot() 이 알려 준다. */

/* 마지막 보스를 뺀 여섯 마리 중 몇 마리를 정화했는가 */
function regularCaughtCount() {
  return regularMonsters().filter(function (m) {
    return isCaught(m.id);
  }).length;
}

function initWorld(canvas) {
  world.ctx = setupCanvas(canvas, MAP_W * TILE, MAP_H * TILE, MAP_SCALE);
  const st = startSpot();
  world.x = st.x;
  world.y = st.y;
  world.dir = "down";
  world.frame = 0;
  world.steps = 0;
  spawnAll();
  startMapAnim();
  drawWorld();
}

/* -----------------------------------------------------------
   몬스터 배치
   ----------------------------------------------------------- */

/* 어떤 속성의 풀숲 칸을 모두 모은다 */
function zoneTiles(typeId) {
  const tiles = encounterTiles();
  const ch = Object.keys(tiles).filter(function (k) {
    return tiles[k] === typeId;
  })[0];
  const list = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (tileAt(x, y) === ch) list.push({ x: x, y: y });
    }
  }
  return list;
}

/* 다른 몬스터나 주인공과 겹치지 않는 자리 하나 고르기 */
function freeSpotIn(typeId, skipId) {
  const tiles = zoneTiles(typeId).filter(function (t) {
    if (t.x === world.x && t.y === world.y) return false;
    return !world.spawns.some(function (s) {
      return s.id !== skipId && s.x === t.x && s.y === t.y;
    });
  });
  if (tiles.length === 0) return null;
  return tiles[Math.floor(Math.random() * tiles.length)];
}

/* 아직 정화하지 않은 몬스터를 모두 맵에 세운다 */
function spawnAll() {
  world.spawns = [];
  // 지금 있는 마을의 몬스터만 세운다
  monstersOfStage(currentStage()).forEach(function (m) {
    if (isCaught(m.id)) return;

    // 마지막 보스 — 여섯을 모두 정화해야 한복판에 나타난다
    if (m.finalBoss) {
      if (!allRegularCaught()) return;
      const f = finalSpot();
      world.spawns.push({ id: m.id, x: f.x, y: f.y });
      return;
    }

    // 가짜몬 — 3마리 이상 정화해야 나타나고, 자리는 고정이다
    if (m.boss) {
      if (regularCaughtCount() < 3) return;
      const b = bossSpot();
      world.spawns.push({ id: m.id, x: b.x, y: b.y });
      return;
    }

    const spot = freeSpotIn(m.type, m.id);
    if (spot) world.spawns.push({ id: m.id, x: spot.x, y: spot.y });
  });
}

/* 전투가 끝난 뒤 — 잡았으면 없애고, 놓쳤으면 같은 숲의 다른 자리로 옮긴다 */
function updateSpawnAfterBattle(monsterId) {
  const m = getMonster(monsterId);

  if (isCaught(monsterId)) {
    world.spawns = world.spawns.filter(function (s) {
      return s.id !== monsterId;
    });

    const onMap = function (pred) {
      return world.spawns.some(function (s) { return pred(getMonster(s.id)); });
    };

    // 여섯을 모두 채우는 순간 마지막 보스가 한복판에 나타난다
    const last = finalBossMonster();
    if (last && !isCaught(last.id) && allRegularCaught() && !onMap(function (x) { return x.finalBoss; })) {
      const f = finalSpot();
      world.spawns.push({ id: last.id, x: f.x, y: f.y });
      return "final";
    }

    // 3마리를 채우는 순간 가짜몬이 등장한다
    const boss = monstersOfStage(currentStage()).filter(function (x) { return x.boss; })[0];
    if (boss && !isCaught(boss.id) && regularCaughtCount() >= 3 && !onMap(function (x) { return x.boss; })) {
      const b = bossSpot();
      world.spawns.push({ id: boss.id, x: b.x, y: b.y });
      return "boss";
    }
    return null;
  }

  // 놓친 몬스터는 자리를 옮겨 다시 도전할 수 있게 한다 (보스는 제자리)
  if (m.boss || m.finalBoss) return null;
  const spot = freeSpotIn(m.type, monsterId);
  if (!spot) return null;
  world.spawns.forEach(function (s) {
    if (s.id === monsterId) { s.x = spot.x; s.y = spot.y; }
  });
  return null;
}

/* -----------------------------------------------------------
   그리기
   ----------------------------------------------------------- */
function drawWorld() {
  const ctx = world.ctx;
  if (!ctx) return;
  drawMap(ctx, TILE, MAP_SCALE);

  // 맵 위의 몬스터들 — 살짝 둥실거린다
  world.spawns.forEach(function (s) {
    const m = getMonster(s.id);
    const lift = world.bob ? -2 : 0;
    drawSprite(
      ctx,
      m.sprite,
      paletteFor(m.type),
      s.x * TILE * MAP_SCALE,
      (s.y * TILE + lift) * MAP_SCALE,
      MAP_SCALE,
      false
    );
  });

  const sp = playerSprite(world.dir, world.frame);
  drawSprite(
    ctx,
    sp.grid,
    PLAYER_PALETTE,
    world.x * TILE * MAP_SCALE,
    world.y * TILE * MAP_SCALE,
    MAP_SCALE,
    sp.flip
  );
}

function startMapAnim() {
  stopMapAnim();
  world.animTimer = setInterval(function () {
    world.bob = world.bob ? 0 : 1;
    drawWorld();
  }, 420);
}

function stopMapAnim() {
  if (world.animTimer) {
    clearInterval(world.animTimer);
    world.animTimer = null;
  }
}

/* -----------------------------------------------------------
   움직이기
   ----------------------------------------------------------- */
function moveWorld(dir) {
  if (world.moving) return;
  world.dir = dir;

  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
  const nx = world.x + d[0];
  const ny = world.y + d[1];

  if (!canWalk(nx, ny)) {
    world.frame = 0;
    drawWorld();
    announceZone();
    return;
  }

  world.moving = true;
  world.x = nx;
  world.y = ny;
  world.frame++;
  world.steps++;
  drawWorld();
  announceZone();
  sfx("step");

  setTimeout(function () {
    world.moving = false;
    bumpIntoMonster();
  }, 90);
}

function announceZone() {
  const ch = tileAt(world.x, world.y);
  const name = zoneNames()[ch] || "";
  if (name !== world.lastZone) {
    world.lastZone = name;
    if (world.onZone) world.onZone(name);
  }
}

/* 몬스터가 서 있는 칸에 올라서면 전투가 시작된다 */
function bumpIntoMonster() {
  const hit = world.spawns.filter(function (s) {
    return s.x === world.x && s.y === world.y;
  })[0];
  if (!hit) return;
  const m = getMonster(hit.id);
  if (m && world.onEncounter) world.onEncounter(m);
}

/* -----------------------------------------------------------
   길잡이 문구
   ----------------------------------------------------------- */
function remainingHint() {
  const last = finalBossMonster();

  // 마지막 관문이 열렸는가
  if (last && !isCaught(last.id) && allRegularCaught()) {
    return "지도 한복판에 " + last.name + josa(last.name, "이", "가") +
      " 나타났어요. 마지막 관문이에요!";
  }
  if (last && isCaught(last.id)) {
    return "모든 AI몬스터를 정화했어요. 당신은 진짜 " + last.purified.name + "예요!";
  }

  const left = regularMonsters().filter(function (m) {
    return !isCaught(m.id);
  });
  if (left.length === 0) return "모든 그림자몬을 정화했어요!";

  const boss = left.filter(function (m) { return m.boss; })[0];
  if (left.length === 1 && boss) {
    return "마지막 " + boss.name + josa(boss.name, "이", "가") + " 기다리고 있어요.";
  }
  if (boss && regularCaughtCount() < 3) {
    return "아직 " + left.length + "마리 · " + boss.name +
      josa(boss.name, "은", "는") + " 3마리를 정화해야 나타나요.";
  }
  return "아직 " + left.length + "마리 남았어요. 풀숲 위의 몬스터에게 다가가 보세요.";
}
