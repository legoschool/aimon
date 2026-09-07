/* ===========================================================
   AI몬스터 — 맵 돌아다니기 & 조우
   =========================================================== */

const TILE = 16;
const MAP_SCALE = 2; // 정수배만! 320×224 → 640×448

const world = {
  x: START.x,
  y: START.y,
  dir: "down",
  frame: 0,
  steps: 0,
  moving: false,
  ctx: null,
  onEncounter: null, // 조우가 일어나면 main.js 가 넘겨준 함수를 부른다
  onZone: null, // 밟고 있는 구역 이름이 바뀌면 알려준다
  lastZone: null,
};

const ENCOUNTER_RATE = 0.14; // 숲 한 칸 걸을 때마다 조우할 확률

function initWorld(canvas) {
  world.ctx = setupCanvas(canvas, MAP_W * TILE, MAP_H * TILE, MAP_SCALE);
  world.x = START.x;
  world.y = START.y;
  world.dir = "down";
  world.frame = 0;
  world.steps = 0;
  drawWorld();
}

function drawWorld() {
  const ctx = world.ctx;
  if (!ctx) return;
  drawMap(ctx, TILE, MAP_SCALE);

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

/* 한 칸 움직이기. 벽이면 방향만 바꾸고 제자리에 선다. */
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

  // 걸음 사이에 아주 짧은 간격을 둬서 키를 눌러도 미끄러지지 않게
  setTimeout(function () {
    world.moving = false;
    checkEncounter();
  }, 90);
}

function announceZone() {
  const ch = tileAt(world.x, world.y);
  const name = ZONE_NAME[ch] || "";
  if (name !== world.lastZone) {
    world.lastZone = name;
    if (world.onZone) world.onZone(name);
  }
}

function checkEncounter() {
  const ch = tileAt(world.x, world.y);
  const type = ENCOUNTER_TILE[ch];
  if (!type) return;
  if (Math.random() >= ENCOUNTER_RATE) return;

  const monster = rollMonster(type);
  if (monster && world.onEncounter) world.onEncounter(monster);
}

/* -----------------------------------------------------------
   어떤 몬스터가 나올까

   같은 숲에 두 마리가 산다. 약한 쪽이 더 자주 나온다.
   가짜몬(보스)은 다른 몬스터를 3마리 이상 정화한 뒤에야 나타난다.
   ----------------------------------------------------------- */
function rollMonster(type) {
  let pool = getMonstersByType(type);

  const caughtCount = dexCaughtCount();
  pool = pool.filter(function (m) {
    return !m.boss || caughtCount >= 3;
  });
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];

  // 레벨이 낮은 쪽 65%, 높은 쪽 35%
  pool.sort(function (a, b) {
    return a.level - b.level;
  });
  return Math.random() < 0.65 ? pool[0] : pool[1];
}

/* 아직 안 잡은 몬스터가 어느 숲에 있는지 알려준다 (길잡이 문구) */
function remainingHint() {
  const left = MONSTERS.filter(function (m) {
    return !isCaught(m.id);
  });
  if (left.length === 0) return "모든 AI몬스터를 정화했어요!";

  const bossOnly = left.length === 1 && left[0].boss;
  if (bossOnly && dexCaughtCount() < 3) {
    return "가짜몬은 3마리 이상 정화해야 나타나요.";
  }
  const zones = [];
  left.forEach(function (m) {
    if (m.boss && dexCaughtCount() < 3) return;
    const n = TYPES[m.type].name + " 데이터숲";
    if (zones.indexOf(n) === -1) zones.push(n);
  });
  return "아직 " + left.length + "마리 남았어요 · " + zones.join(", ");
}
