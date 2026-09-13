/* ===========================================================
   AI몬스터 — 스테이지 목록과 지도 도우미

   스테이지 하나는 폴더 하나다.
     data/stage1/  AI 마을        (저작권 · 개인정보 · 허위정보)
     data/stage2/  데이터 도시    (편향 · 의존 · 조작)
     data/stage3/  잿빛 황무지    (감시 · 불신 · 소외)
   각 폴더의 stage.js 가 addStage({...}) 로 자기 지도와 이야기를 여기에 등록한다.

   지도는 모두 20칸 × 14줄이다. 한 칸이 16픽셀이므로 320×224.
   화면에 통째로 들어가므로 카메라(스크롤) 코드가 필요 없다.
   글자 하나가 한 칸이고, 글자의 뜻은 스테이지 파일 머리말에 적혀 있다.
   타일 모양은 글자가 아니라 shape 로 정한다 (같은 '#' 이 나무도, 건물도, 무너진 벽도 된다).

   스테이지 정의에 들어가는 칸 (stage1/stage.js 를 본보기로 보면 된다)
     id, name, place, sub, side, theme      이름과 소개 글
     hardFromLevel                          이 레벨부터 어려운 문항을 먼저 낸다
     enterLabel, tutorialKey                앞 스테이지 엔딩 버튼, 도착 안내를 봤는지 저장할 이름
     map, walkable, encounter, zoneName     지도
     tile, pure                             어두울 때와 정화된 뒤의 색
     start, finalSpot, bossSpot, homeSpots  자리
     arrival, arrivalFlash                  처음 왔을 때 박사님 안내 (1스테이지는 없음)
     clear { title, desc, report }          다 깬 뒤 퀘스트 칸과 기록 화면 문구
     ending { start?, spread?, gather?, done?, words }  엔딩 자막과 마지막 말
   =========================================================== */

const MAP_W = 20;
const MAP_H = 14;

const STAGES = [null]; // 0번은 쓰지 않는다. STAGES[1] 이 AI 마을.

function addStage(def) {
  STAGES[def.id] = def;
}

/* 마지막 스테이지 번호 */
function lastStage() {
  return STAGES.length - 1;
}

/* -----------------------------------------------------------
   지금 지도 꺼내기

   인자를 안 주면 학생이 지금 있는 스테이지를 본다.
   currentStage() 는 src/dex.js 에 있고 저장본을 읽는다.
   ----------------------------------------------------------- */
function stageData(n) {
  return STAGES[n || currentStage()] || STAGES[1];
}

function stageName(n) {
  return stageData(n).name;
}

function tileAt(x, y, n) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return "#";
  return stageData(n).map[y][x];
}

function canWalk(x, y, n) {
  return stageData(n).walkable.includes(tileAt(x, y, n));
}

function encounterTiles(n) {
  return stageData(n).encounter;
}

function zoneNames(n) {
  return stageData(n).zoneName;
}

function tileStyles(n) {
  return stageData(n).tile;
}

function pureTileStyles(n) {
  return stageData(n).pure;
}

function startSpot(n) {
  return stageData(n).start;
}

function finalSpot(n) {
  return stageData(n).finalSpot;
}

function bossSpot(n) {
  return stageData(n).bossSpot;
}

function homeSpots(n) {
  return stageData(n).homeSpots;
}
