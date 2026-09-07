/* ===========================================================
   AI몬스터 — 몬스터 6종 + 정화 짝

   이름 규칙
     그림자몬 : 나쁜 행동 + 몬
     가치몬   : 좋은 행동 + 지기
     짝은 반드시 반대말 (복붙 ↔ 출처, 막 올림 ↔ 동의 ...)

   스프라이트
     16×16 격자. 한 글자가 한 픽셀.
       .  투명        w  흰색      k  검정
       l  밝은회색    g  중간회색  a  속성 강조색
     모눈종이처럼 보이므로 글자만 바꾸면 그림이 바뀐다.

     가치몬은 그림자몬과 "같은 실루엣"을 쓴다.
     세부만 바뀌므로 정화 연출이 자연스럽고,
     "같은 상황인데 다른 선택"이라는 뜻이 그림으로 읽힌다.
   =========================================================== */

const BASE_PALETTE = {
  ".": "transparent",
  w: "#f8f8f0", // 흰색
  k: "#181818", // 검정
  l: "#c7c7c0", // 밝은 회색
  g: "#808080", // 중간 회색
  // "a" 는 몬스터 속성 강조색으로 런타임에 채워진다
};

const MONSTERS = [
  /* ========== ⚖️ 저작권 ========== */
  {
    id: "bokbut",
    name: "복붙몬",
    type: "copyright",
    level: 5,
    maxGrip: 60,
    desc: "인터넷에 있는 글을 통째로 복사해 자기가 쓴 것처럼 숙제로 낸다.",
    look: "종이 두 장이 겹쳐진 몸통. 눈이 Ctrl과 V 모양이다.",
    sprite: [
      "................",
      "...kkkkkkkk.....",
      "...kllllllk.....",
      "...kllllllk.....",
      "...kll.kkkkkkkk.",
      "...kll.kwwwwwwk.",
      "...kll.kwwwwwwk.",
      "...kkkkkwwwwwwk.",
      ".......kwkwwkwk.",
      ".......kwkwwkwk.",
      ".......kwwwwwwk.",
      ".......kwaaaawk.",
      ".......kwwwwwwk.",
      ".......kkkkkkkk.",
      "........k....k..",
      ".......kk....kk.",
    ],
    purified: {
      id: "chulcheo",
      name: "출처지기",
      desc: "내 말로 다시 쓰고, 가져온 곳을 밝히는 습관.",
      lesson: "베낀 글은 아무리 예뻐도 내 글이 아니에요. 내 말로 바꾸고 어디서 봤는지 적어두면 그때부터 내 자료가 됩니다.",
      sprite: [
        "................",
        "...kkkkkkkk.....",
        "...kwwwwwwk.....",
        "...kwaawwwk.....",
        "...kwa.kkkkkkkk.",
        "...kw..kwwwwwwk.",
        "...kw..kwwwwwwk.",
        "...kkkkkwakkawk.",
        ".......kwwwwwwk.",
        ".......kwwaawwk.",
        ".......kwaaaawk.",
        ".......kwwaawwk.",
        ".......kwwwwwwk.",
        ".......kkkkkkkk.",
        "........k....k..",
        ".......kk....kk.",
      ],
    },
  },

  {
    id: "seuljjeok",
    name: "슬쩍몬",
    type: "copyright",
    level: 8,
    maxGrip: 90,
    desc: "워터마크를 지우고 이미지·글꼴·음악을 슬쩍 가져다 쓴다.",
    look: "위쪽 모서리가 비스듬히 닳은 지우개. 아랫몸에 반쯤 지워진 워터마크가 남아 있다.",
    sprite: [
      "................",
      "..........kkkkk.",
      ".......kkkwwwwk.",
      "....kkkwwwwwwwk.",
      "..kkkwwwwwwwwwk.",
      "..kwwkkwwwwkkwk.",
      "..kwwkkwwwwkkwk.",
      "..kwwwwwwwwwwwk.",
      "..kwwwwaaaawwwk.",
      "..kwwwwwwwwwwwk.",
      "..kkkkkkkkkkkkk.",
      "..klllllllllllk.",
      "..klaall.l.lllk.",
      "..kll.l.aallllk.",
      "..kkkkkkkkkkkkk.",
      "................",
    ],
    purified: {
      id: "heorak",
      name: "허락지기",
      desc: "만든 사람이 정한 이용 조건을 확인하는 습관.",
      lesson: "무료라고 다 마음대로 쓸 수 있는 건 아니에요. 만든 사람이 '어디까지 써도 된다'고 적어둔 조건을 먼저 읽어봅니다.",
      sprite: [
        "................",
        "..........kkkkk.",
        ".......kkkwwwwk.",
        "....kkkwwwwwwwk.",
        "..kkkwwwwwwwwwk.",
        "..kwwakwwwwkawk.",
        "..kwwwwwwwwwwwk.",
        "..kwwwaaaaawwwk.",
        "..kwwwwwwwwwwwk.",
        "..kkkkkkkkkkkkk.",
        "..kwwwwwwwwwwwk.",
        "..kwwwwwwwwawwk.",
        "..kwwaawwwawwwk.",
        "..kwwwaaawwwwwk.",
        "..kkkkkkkkkkkkk.",
        "................",
      ],
    },
  },

  /* ========== 🤝 개인정보 ========== */
  {
    id: "makollim",
    name: "막올림몬",
    type: "privacy",
    level: 6,
    maxGrip: 70,
    desc: "친구 사진을 허락도 안 받고 막 올리거나 AI에 집어넣는다.",
    look: "액자 몸통. 안에 얼굴이 흐릿하게 지워져 있다.",
    sprite: [
      "................",
      "..kkkkkkkkkkkk..",
      "..kwwwwwwwwwwk..",
      "..kwkkkkkkkkwk..",
      "..kwkllllllkwk..",
      "..kwkl.gg.lkwk..",
      "..kwkl.gg.lkwk..",
      "..kwkllllllkwk..",
      "..kwkl.gg.lkwk..",
      "..kwkllllllkwk..",
      "..kwkkkkkkkkwk..",
      "..kwwaaaaaawwk..",
      "..kwwwwwwwwwwk..",
      "..kkkkkkkkkkkk..",
      "....k......k....",
      "...kk......kk...",
    ],
    purified: {
      id: "dongui",
      name: "동의지기",
      desc: "올리기 전에 찍힌 사람에게 물어보는 습관.",
      lesson: "사진 속 얼굴에도 주인이 있어요. 올리기 전에 '이거 올려도 돼?' 한마디면 충분합니다.",
      sprite: [
        "................",
        "..kkkkkkkkkkkk..",
        "..kwwwwwwwwwwk..",
        "..kwkkkkkkkkwk..",
        "..kwkwwwwwwkwk..",
        "..kwkwakkawkwk..",
        "..kwkwwwwwwkwk..",
        "..kwkwaaaawkwk..",
        "..kwkwwwwwwkwk..",
        "..kwkwwwwwwkwk..",
        "..kwkkkkkkkkwk..",
        "..kwwaaaaaawwk..",
        "..kwwwwwwwwwwk..",
        "..kkkkkkkkkkkk..",
        "....k......k....",
        "...kk......kk...",
      ],
    },
  },

  {
    id: "sulsul",
    name: "술술몬",
    type: "privacy",
    level: 9,
    maxGrip: 100,
    desc: "챗봇에 이름·학교·주소·전화번호를 술술 적어 넣는다.",
    look: "입력창 모양 몸통. 아래로 글자가 줄줄 새어 나온다.",
    sprite: [
      "................",
      "..kkkkkkkkkkkk..",
      "..kllllllllllk..",
      "..klkkllllkklk..",
      "..klkkllllkklk..",
      "..kllllllllllk..",
      "..kllaaaaaallk..",
      "..kllllllllllk..",
      "..kkkkkkkkkkkk..",
      "....a..a..a.....",
      "...a..a..a......",
      "....a..a...a....",
      "..a...a..a......",
      "....a....a..a...",
      "..a...a.....a...",
      "................",
    ],
    purified: {
      id: "bimil",
      name: "비밀지기",
      desc: "꼭 필요한 정보만 최소한으로 넣는 습관.",
      lesson: "챗봇에 적은 말은 사라지지 않아요. 이름·학교·주소는 넣지 않아도 대부분 답을 받을 수 있습니다.",
      sprite: [
        "................",
        "..kkkkkkkkkkkk..",
        "..kwwwwwwwwwwk..",
        "..kwkkwwwwkkwk..",
        "..kwkkwwwwkkwk..",
        "..kwwwwwwwwwwk..",
        "..kwwaaaaaawwk..",
        "..kwwwwwwwwwwk..",
        "..kkkkkkkkkkkk..",
        "......kkkk......",
        ".....kw..wk.....",
        "....kkkkkkkk....",
        "....kwwaawwk....",
        "....kwwaawwk....",
        "....kkkkkkkk....",
        "................",
      ],
    },
  },

  /* ========== 🔍 허위정보 ========== */
  {
    id: "geureolssa",
    name: "그럴싸몬",
    type: "disinfo",
    level: 7,
    maxGrip: 80,
    desc: "AI가 지어낸 거짓말을 그럴싸하게 꾸며 진짜처럼 퍼뜨린다.",
    look: "말풍선 몸통. 안의 글자가 계속 바뀐다.",
    sprite: [
      "................",
      "....kkkkkkkk....",
      "..kkwwwwwwwwkk..",
      ".kwwwwwwwwwwwwk.",
      ".kwwkkwwwwkkwwk.",
      ".kwwkkwwwwkkwwk.",
      ".kwwwwwwwwwwwwk.",
      ".kwwaaawwaaawwk.",
      ".kwwwaaaaaawwwk.",
      ".kwwaaawwwaawwk.",
      ".kwwwwwwwwwwwwk.",
      "..kkwwwwwwwwkk..",
      "....kkwwwwkk....",
      "......kwwk......",
      ".......kk.......",
      "................",
    ],
    purified: {
      id: "hwagin",
      name: "확인지기",
      desc: "두 군데 이상에서 교차 확인하는 습관.",
      lesson: "AI는 모를 때도 아는 척을 해요. 한 곳에서만 본 정보는 아직 사실이 아닙니다.",
      sprite: [
        "................",
        "....kkkkkkkk....",
        "..kkwwwwwwwwkk..",
        ".kwwwwwwwwwwwwk.",
        ".kwwkawwwwakwwk.",
        ".kwwkawwwwakwwk.",
        ".kwwwwwwwwwwwwk.",
        ".kwwwaaaaaawwwk.",
        ".kwwwwwwwwwwwwk.",
        ".kwwwwaaaawwwwk.",
        ".kwwwwwwwwwwwwk.",
        "..kkwwwwwwwwkk..",
        "....kkwwwwkk....",
        "......kwwk......",
        ".......kk.......",
        "................",
      ],
    },
  },

  {
    id: "gajja",
    name: "가짜몬",
    type: "disinfo",
    level: 10,
    maxGrip: 120,
    boss: true,
    desc: "딥페이크 영상과 가짜 뉴스로 사람을 속인다.",
    look: "얼굴이 세로로 쪼개져, 왼쪽과 오른쪽의 눈코입 높이가 서로 어긋나 있다.",
    sprite: [
      "................",
      "..kkkkkkk.......",
      "..kwwwwwkkkkkkk.",
      "..kwkkwwkwwwwwk.",
      "..kwkkwwkwwwwwk.",
      "..kwwwwwkwkkwwk.",
      "..kwwwwwkwkkwwk.",
      "..kwaaawkwwwwwk.",
      "..kwwwwwkwwwwwk.",
      "..kwwwwwkwwaaak.",
      "..kwwwwwkwwwwwk.",
      "..kwwwwwkwwwwwk.",
      "..kkkkkkkkkkkkk.",
      "................",
      "....kk.....kk...",
      "...kkk.....kkk..",
    ],
    purified: {
      id: "jinsil",
      name: "진실지기",
      desc: "진짜와 가짜를 가려내는 눈.",
      lesson: "진짜처럼 보이는 것과 진짜인 것은 달라요. 누가 언제 만들었는지 찾을 수 없다면 한 번 더 의심합니다.",
      sprite: [
        "................",
        "..kkkkkkkkkkkkk.",
        "..kwwwwwwwwwwwk.",
        "..kwwwwwwwwwwwk.",
        "..kwwkkwwwkkwwk.",
        "..kwwkkwwwkkwwk.",
        "..kwwwwwwwwwwwk.",
        "..kwwwwwwwwwwwk.",
        "..kwaawwwwwaawk.",
        "..kwwaaaaaaawwk.",
        "..kwwwwwwwwwwwk.",
        "..kwwwwwwwwwwwk.",
        "..kkkkkkkkkkkkk.",
        "................",
        "....kk.....kk...",
        "...kkk.....kkk..",
      ],
    },
  },
];

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
