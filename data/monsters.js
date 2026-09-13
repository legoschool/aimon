/* ===========================================================
   AI몬스터 — 몬스터 목록의 틀과 도우미

   몬스터는 스테이지 폴더에서 더한다.
     data/stage1/monsters.js  AI 마을     (복붙몬 … 생각멈춤몬)
     data/stage2/monsters.js  데이터 도시 (끼리끼리몬 … 다들그래몬)
     data/stage3/monsters.js  잿빛 황무지 (엿봐몬 … 어차피몬)

   몬스터 한 마리에 들어가는 칸
     id, name, type(첫째 속성), type2(둘째 속성, 없어도 됨), stage, level, maxGrip
     boss       중간 보스 (그 스테이지에서 셋을 정화하면 bossSpot 에 나타난다)
     finalBoss  마지막 보스 (나머지 여섯을 정화하면 finalSpot 에 나타난다)
     party      볼 대신 모은 가치몬과 함께 싸우는 보스 (src/finale.js)
     desc, look, sprite, purified { id, name, desc, lesson, sprite }

   스프라이트
     16×16 격자. 한 글자가 한 픽셀.
       .  투명        w  흰색      k  검정
       l  밝은회색    g  중간회색  a  속성 강조색
     모눈종이처럼 보이므로 글자만 바꾸면 그림이 바뀐다.
   =========================================================== */

const BASE_PALETTE = {
  ".": "transparent",
  w: "#f8f8f0", // 흰색
  k: "#181818", // 검정
  l: "#c7c7c0", // 밝은 회색
  g: "#808080", // 중간 회색
  // "a" 는 몬스터 속성 강조색으로 런타임에 채워진다
};

const MONSTERS = [];

/* -----------------------------------------------------------
   스테이지별로 꺼내기

   예전 저장본에는 stage 가 없다. 없으면 1스테이지로 본다.
   인자를 안 주면 지금 있는 마을을 기준으로 한다.
   ----------------------------------------------------------- */
function stageOf(m) {
  return m.stage || 1;
}

function monstersOfStage(stage) {
  return MONSTERS.filter((m) => stageOf(m) === stage);
}

/* 마지막 보스를 뺀 여섯 마리 — 도감·의뢰의 기준이 된다 */
function regularMonsters(stage) {
  return monstersOfStage(stage || currentStage()).filter((m) => !m.finalBoss);
}

function finalBossMonster(stage) {
  return monstersOfStage(stage || currentStage()).filter((m) => m.finalBoss)[0];
}

/* 여섯을 모두 정화했는가 (마지막 보스가 나타나는 조건) */
function allRegularCaught(stage) {
  return regularMonsters(stage).every((m) => isCaught(m.id));
}

/* 그 스테이지를 끝냈는가 — 마지막 보스까지 정화했는가 */
function stageCleared(stage) {
  const last = finalBossMonster(stage);
  return !!last && isCaught(last.id);
}

/* 지금 이 학생이 갈 수 있는 몬스터 — 앞 스테이지를 깨야 다음 스테이지가 열린다 */
function unlockedMonsters() {
  return MONSTERS.filter((m) => stageOf(m) <= reachedStage());
}

/* 그 스테이지에서 정화한 수 */
function stageCaughtCount(stage) {
  return monstersOfStage(stage).filter((m) => isCaught(m.id)).length;
}

/* 속성별로 몬스터 꺼내기 */
function getMonstersByType(typeId) {
  return MONSTERS.filter((m) => m.type === typeId);
}

function getMonster(id) {
  return MONSTERS.find((m) => m.id === id);
}

/* 스프라이트 한 장에 쓸 팔레트 (속성 강조색을 a 자리에 끼워 넣는다) */
function paletteFor(typeId) {
  return Object.assign({}, BASE_PALETTE, { a: TYPES[typeId].accent });
}
