/* ===========================================================
   AI몬스터 — 지도

   스테이지마다 지도가 하나씩 있다. 크기는 모두 20칸 × 14줄이다.
   한 칸이 16픽셀이므로 320×224. 화면에 통째로 들어가므로
   카메라(스크롤) 코드가 필요 없다.

   글자 하나가 한 칸. 뜻은 스테이지마다 다르다.

   1스테이지 · AI 마을 (숲)
     #  나무      .  땅      =  길      ~  물      L  연구소
     C  저작권 숲   P  개인정보 숲   D  허위정보 숲

   2스테이지 · 데이터 도시 (도시)
     #  건물      .  보도    =  큰길    ~  저수지   L  관제실
     X  추천의 거리  Y  자동응답 구역  Z  알림 광장

   타일 모양은 글자가 아니라 shape 로 정한다.
   그래야 같은 '#' 이 마을에서는 나무, 도시에서는 건물이 된다.
   =========================================================== */

const MAP_W = 20;
const MAP_H = 14;

/* -----------------------------------------------------------
   1스테이지 — AI 마을
   ----------------------------------------------------------- */
const STAGE1 = {
  id: 1,
  name: "AI 마을",
  sub: "사람들이 무심코 저지르는 잘못이 그림자가 되어 떠도는 곳",

  map: [
    "####################",
    "#....CC....##...DD.#",
    "#...CCCC...##..DDDD#",
    "#...CCCC...=...DDDD#",
    "#....CC....=....DD.#",
    "#..........=.......#",
    "#==================#",
    "#..........=.......#",
    "#....PP....=.....~~#",
    "#...PPPP...=....~~~#",
    "#...PPPP...=.....~~#",
    "#....PP....=.......#",
    "#.........LLL......#",
    "####################",
  ],

  walkable: ".=CPD",
  encounter: { C: "copyright", P: "privacy", D: "disinfo" },

  zoneName: {
    C: "저작권 데이터숲",
    P: "개인정보 데이터숲",
    D: "허위정보 데이터숲",
    L: "AI 연구소",
    "~": "데이터 호수",
  },

  /* 어두울 때 (4색 그레이스케일 + 숲마다 속성색 한 방울) */
  tile: {
    "#": { base: "#3f4f3a", dot: "#2b381f", shape: "tree" },
    ".": { base: "#a8b89a", dot: "#98a98a", shape: "ground" },
    "=": { base: "#d8d4c0", dot: "#c9c4b0", shape: "road" },
    "~": { base: "#6f93b8", dot: "#5b7fa6", shape: "water" },
    L: { base: "#b0a898", dot: "#8a8272", shape: "house" },
    C: { base: "#7d9c7a", dot: "#3a6ea5", shape: "grass" },
    P: { base: "#7d9c7a", dot: "#c9642a", shape: "grass" },
    D: { base: "#7d9c7a", dot: "#6b4a9e", shape: "grass" },
  },

  /* 정화된 뒤 — 같은 지도, 같은 구조인데 빛이 든다 */
  pure: {
    "#": { base: "#4f7a45", dot: "#356030" },
    ".": { base: "#c6dbab", dot: "#b3cb98" },
    "=": { base: "#f2ecd6", dot: "#e2dbc0" },
    "~": { base: "#82c7ea", dot: "#5cabd8" },
    L: { base: "#dbd2bf", dot: "#b3a28b" },
    C: { base: "#a2cc92", dot: "#4f97d8" },
    P: { base: "#a2cc92", dot: "#f0873f" },
    D: { base: "#a2cc92", dot: "#9a72d6" },
  },

  start: { x: 11, y: 11 }, // 연구소 앞
  finalSpot: { x: 11, y: 6 }, // 두 길이 만나는 한복판
  bossSpot: { x: 17, y: 2 }, // 가짜몬 — 허위정보 숲 안쪽

  /* 엔딩에서 가치몬들이 서는 자리 — 자기가 지키던 숲으로 돌아간다 */
  homeSpots: {
    bokbut: { x: 5, y: 2 },
    seuljjeok: { x: 7, y: 3 },
    makollim: { x: 5, y: 9 },
    sulsul: { x: 7, y: 10 },
    geureolssa: { x: 16, y: 2 },
    gajja: { x: 18, y: 3 },
    meomchum: { x: 11, y: 6 },
  },
};

/* -----------------------------------------------------------
   2스테이지 — 데이터 도시

   마을은 내가 남에게 하는 일이 보이는 크기다.
   도시는 거대한 장치가 나에게 하는 일이 안 보이는 크기다.
   그래서 길이 곧게 나뉜 격자다. 숲처럼 구불거리지 않는다.
   ----------------------------------------------------------- */
const STAGE2 = {
  id: 2,
  name: "데이터 도시",
  sub: "보이지 않는 장치가 사람을 조금씩 움직이는 곳",

  map: [
    "####################",
    "#XXXXX=.....=YYYYYY#",
    "#XXXXX=.....=YYYYYY#",
    "#XXXXX=.....=YYYYYY#",
    "#XXXXX=.....=YYYYYY#",
    "#==================#",
    "#ZZZZZ=.....=......#",
    "#ZZZZZ=.....=.~~~~.#",
    "#ZZZZZ=.....=.~~~~.#",
    "#ZZZZZ=.....=......#",
    "#==================#",
    "#.......LLLL.......#",
    "#..................#",
    "####################",
  ],

  walkable: ".=XYZ",
  encounter: { X: "bias", Y: "depend", Z: "manipul" },

  zoneName: {
    X: "추천의 거리",
    Y: "자동응답 구역",
    Z: "알림 광장",
    L: "데이터 관제실",
    "~": "데이터 저수지",
  },

  /* 어두울 때 — 콘크리트 회색에 구역마다 속성색 한 방울 */
  tile: {
    "#": { base: "#4a4a55", dot: "#33333d", shape: "building" },
    ".": { base: "#9a9aa5", dot: "#8a8a95", shape: "ground" },
    "=": { base: "#6a6a78", dot: "#5a5a66", shape: "road" },
    "~": { base: "#4a6f8f", dot: "#3a5c78", shape: "water" },
    L: { base: "#8a8296", dot: "#6a6276", shape: "house" },
    X: { base: "#7a7a88", dot: "#c2407a", shape: "signal" },
    Y: { base: "#7a7a88", dot: "#2f8f8f", shape: "signal" },
    Z: { base: "#7a7a88", dot: "#c0392b", shape: "signal" },
  },

  /* 정화된 뒤 — 잿빛이 걷히고 하늘색이 돈다 */
  pure: {
    "#": { base: "#6f7f8f", dot: "#54636f" },
    ".": { base: "#dcdfe6", dot: "#cacfd8" },
    "=": { base: "#eef1f6", dot: "#dde1e9" },
    "~": { base: "#82c7ea", dot: "#5cabd8" },
    L: { base: "#ded6e8", dot: "#b6aec2" },
    X: { base: "#ccd2de", dot: "#c2407a" },
    Y: { base: "#ccd2de", dot: "#2f8f8f" },
    Z: { base: "#ccd2de", dot: "#c0392b" },
  },

  start: { x: 9, y: 12 }, // 관제실 앞
  finalSpot: { x: 9, y: 7 }, // 도시 한복판 광장
  bossSpot: { x: 3, y: 8 }, // 흔들어몬 — 알림 광장 안쪽

  homeSpots: {
    kkirikkiri: { x: 2, y: 2 },
    ssajaba: { x: 4, y: 3 },
    sikindaero: { x: 14, y: 2 },
    tteoneomgim: { x: 16, y: 3 },
    hanbeonman: { x: 2, y: 7 },
    heundeuleo: { x: 4, y: 8 },
    dadeulgeurae: { x: 9, y: 7 },
  },
};

const STAGES = [null, STAGE1, STAGE2]; // 0번은 쓰지 않는다
const LAST_STAGE = 2;

/* -----------------------------------------------------------
   지금 지도 꺼내기

   인자를 안 주면 학생이 지금 있는 마을을 본다.
   currentStage() 는 src/dex.js 에 있고 저장본을 읽는다.
   ----------------------------------------------------------- */
function stageData(n) {
  return STAGES[n || currentStage()] || STAGE1;
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
