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

/* ========== 🌑 마지막 관문 ==========
   여섯 그림자를 관통하는 뿌리.
   복붙도, 막 올림도, 그럴싸도 결국 "스스로 생각하기를 멈춘 자리"에서 나온다.
   그래서 마지막에 이것을 둔다. */
MONSTERS.push({
  id: "meomchum",
  name: "생각멈춤몬",
  type: "all",
  level: 15,
  maxGrip: 200,
  finalBoss: true,
  desc: "AI가 주는 답을 그냥 받아 적게 만든다. 여섯 그림자가 모두 여기서 나왔다.",
  look: "눈을 감고 입을 다문 커다란 형체. 아래에 금빛 띠가 잠들어 있다.",
  sprite: [
    "..kkkkkkkkkkkk..",
    ".kwwwwwwwwwwwwk.",
    "kwwwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwwwk",
    "kwkkkkwwwwkkkkwk",
    "kwwwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwwwk",
    "kwwkkkkkkkkkkwwk",
    "kwwwwwwwwwwwwwwk",
    "kwwwwwwwwwwwwwwk",
    ".kwwwwwwwwwwwwk.",
    "..kaaaaaaaaaak..",
    ".kaaaaaaaaaaaak.",
    ".kaaaaaaaaaaaak.",
    ".kkkk......kkkk.",
    "..kk........kk..",
  ],
  purified: {
    id: "saenggak",
    name: "생각지기",
    desc: "그대로 믿지 않고 한 번 더 생각하는 힘.",
    lesson:
      "AI가 아무리 똑똑해도 무엇이 옳은지 정하는 건 사람이에요. 그대로 믿지 않고 한 번 더 생각하는 그 힘이, 나를 나답게 만듭니다.",
    sprite: [
      "..kkkkkkkkkkkk..",
      ".kwwwwwwwwwwwwk.",
      "kwwwwwwwwwwwwwwk",
      "kwwwaawwwwaawwwk",
      "kwwwaawwwwaawwwk",
      "kwwwwwwwwwwwwwwk",
      "kwwwwwwwwwwwwwwk",
      "kwwaawwwwwwwwaak",
      "kwwwaaaaaaaaawwk",
      "kwwwwwwwwwwwwwwk",
      ".kwwwwwwwwwwwwk.",
      "..kaaaaaaaaaak..",
      ".kaaaaaaaaaaaak.",
      ".kaaaaaaaaaaaak.",
      ".kkkk......kkkk.",
      "..kk........kk..",
    ],
  },
});


/* ===========================================================
   2스테이지 — 데이터 도시

   1스테이지가 "내가 남에게 끼치는 해"라면 여기는
   "나에게 보이지 않게 일어나는 일"이다.
   아이는 하는 쪽이 아니라 당하는 쪽에 선다.

   속성이 둘인 몬스터가 셋 있다. 상성이 반쪽만 맞으므로
   어떤 질문을 쓸지 고르는 일 자체가 어려워진다.
   =========================================================== */

MONSTERS.push(
  /* ========== 👀 편향 ========== */
  {
    id: "kkirikkiri",
    name: "끼리끼리몬",
    type: "bias",
    stage: 2,
    level: 12,
    maxGrip: 110,
    desc: "비슷한 것만 잔뜩 모아 보여 주고, 나머지는 슬그머니 치운다.",
    look: "똑같은 눈이 한 줄로 박힌 덩어리. 전부 같은 곳을 본다.",
    sprite: [
      "................",
      ".....kkkkkk.....",
      "...kkllllllkk...",
      "..kllllllllllk..",
      "..kll.ll.ll.lk..",
      "..kl.a.la.la.k..",
      "..kll.ll.ll.lk..",
      "..kllllllllllk..",
      "..kllaaaaaallk..",
      "..kllllllllllk..",
      "...kllllllllk...",
      "....kkllllkk....",
      "......kkkk......",
      ".....k....k.....",
      "....kk....kk....",
      "................",
    ],
    purified: {
      id: "duru",
      name: "두루지기",
      desc: "화면에 없는 것이 무엇인지 먼저 찾는 눈.",
      lesson:
        "추천은 내가 좋아할 것을 보여 주면서 내가 모르는 것을 치워요. 무엇이 있는지보다 무엇이 없는지를 먼저 보면 세상이 다시 넓어집니다.",
      sprite: [
        "................",
        ".....kkkkkk.....",
        "...kkwwwwwwkk...",
        "..kwwwwwwwwwwk..",
        "..kww.ww.ww.wk..",
        "..kwa..w.aw.ak..",
        "..kww.ww.ww.wk..",
        "..kwwwwwwwwwwk..",
        "..kwwaawwaawwk..",
        "..kwwwwwwwwwwk..",
        "...kwwwwwwwwk...",
        "....kkwwwwkk....",
        "......kkkk......",
        ".....k....k.....",
        "....kk....kk....",
        "................",
      ],
    },
  },

  {
    id: "ssajaba",
    name: "싸잡아몬",
    type: "bias",
    type2: "disinfo",
    stage: 2,
    level: 13,
    maxGrip: 120,
    desc: "여럿을 하나로 눌러 찍어 \"다 그렇다\"고 말하게 만든다.",
    look: "커다란 도장. 눌린 자리마다 얼굴이 납작해져 있다.",
    sprite: [
      "................",
      "....kkkkkkkk....",
      "....kllllllk....",
      "....kllllllk....",
      "....kllllllk....",
      "...kkllllllkk...",
      "..kllllllllllk..",
      "..kl.a.a.a..lk..",
      "..kllllllllllk..",
      "..kkkkkkkkkkkk..",
      "...kaaaaaaaak...",
      "....kkkkkkkk....",
      "......k..k......",
      "......k..k......",
      ".....kk..kk.....",
      "................",
    ],
    purified: {
      id: "jeomada",
      name: "저마다지기",
      desc: "뭉뚱그린 말 속에서 한 사람씩 다시 보는 눈.",
      lesson:
        "\"요즘 애들은 다 그렇다\"는 말에는 아무도 없어요. 한 사람씩 세어 보면 늘 다른 사람이 있습니다.",
      sprite: [
        "................",
        "....kkkkkkkk....",
        "....kwwwwwwk....",
        "....kwawwawk....",
        "....kwwwwwwk....",
        "...kkwwwwwwkk...",
        "..kwwwwwwwwwwk..",
        "..kwa.wa.wwa.k..",
        "..kwwwwwwwwwwk..",
        "..kwwwwwwwwwwk..",
        "...kwaawwaawk...",
        "....kkwwwwkk....",
        "......k..k......",
        "......k..k......",
        ".....kk..kk.....",
        "................",
      ],
    },
  },

  /* ========== 🧭 의존 ========== */
  {
    id: "sikindaero",
    name: "시킨대로몬",
    type: "depend",
    stage: 2,
    level: 12,
    maxGrip: 110,
    desc: "AI가 알려 준 대로만 움직이게 하고, 왜인지는 묻지 못하게 한다.",
    look: "머리 위 줄에 매달린 인형. 팔다리가 줄에 끌려다닌다.",
    sprite: [
      ".......k........",
      ".......k........",
      "....kkkkkkk.....",
      "...kllllllllk...",
      "...kl.a..a.lk...",
      "...kllllllllk...",
      "...kll.kk.llk...",
      "...kllllllllk...",
      "....kkkkkkkk....",
      ".....k....k.....",
      "..kkkk....kkkk..",
      ".....k....k.....",
      ".....k....k.....",
      "....kk....kk....",
      "....k......k....",
      "................",
    ],
    purified: {
      id: "seusuro",
      name: "스스로지기",
      desc: "답을 받고도 왜 그런지 스스로 따라가 보는 힘.",
      lesson:
        "AI가 답을 주는 일과 내가 알게 되는 일은 달라요. 왜 그런지 한 줄씩 따라가 본 것만 내 것이 됩니다.",
      sprite: [
        "................",
        ".....a....a.....",
        "....kkkkkkk.....",
        "...kwwwwwwwwk...",
        "...kw.a..a.wk...",
        "...kwwwwwwwwk...",
        "...kww.aa.wwk...",
        "...kwwwwwwwwk...",
        "....kkkkkkkk....",
        ".....k....k.....",
        "..kkkk....kkkk..",
        ".....k....k.....",
        ".....k....k.....",
        "....kk....kk....",
        "....k......k....",
        "................",
      ],
    },
  },

  {
    id: "tteoneomgim",
    name: "떠넘김몬",
    type: "depend",
    stage: 2,
    level: 14,
    maxGrip: 130,
    desc: "잘못이 드러나면 \"AI가 그랬다\"며 옆을 가리키게 만든다.",
    look: "한 손으로 옆을 가리킨 채 등 뒤로 숨는 형체.",
    sprite: [
      "................",
      "...kkkkkk.......",
      "..kllllllk......",
      "..kl.a.a.k......",
      "..kllllllk......",
      "..kll..llk......",
      "..kllllllk......",
      "..kkkkkkkk......",
      "...kllllk.kkkk..",
      "...kllllkkllllk.",
      "...kllllk.aaaak.",
      "...kkkkkk.kkkkk.",
      "....k..k........",
      "....k..k........",
      "...kk..kk.......",
      "................",
    ],
    purified: {
      id: "chaegim",
      name: "책임지기",
      desc: "마지막으로 고른 사람이 나라는 것을 아는 힘.",
      lesson:
        "도구가 틀릴 수 있다는 걸 알면서 확인하지 않았다면, 정한 사람은 나예요. 책임은 마지막으로 고른 사람에게 남습니다.",
      sprite: [
        "................",
        "...kkkkkk.......",
        "..kwwwwwwk......",
        "..kw.a.a.k......",
        "..kwwwwwwk......",
        "..kww.aawwk.....",
        "..kwwwwwwk......",
        "..kkkkkkkk......",
        "...kwwwwk.......",
        "...kwaawk.......",
        "...kwwwwk.......",
        "...kkkkkk.......",
        "....k..k........",
        "....k..k........",
        "...kk..kk.......",
        "................",
      ],
    },
  },

  /* ========== ⏳ 조작 ========== */
  {
    id: "hanbeonman",
    name: "한번만더몬",
    type: "manipul",
    type2: "depend",
    stage: 2,
    level: 13,
    maxGrip: 120,
    desc: "끝나기 전에 다음 것을 띄워, 멈출 자리를 없앤다.",
    look: "끝없이 아래로 흘러내리는 화면. 바닥이 보이지 않는다.",
    sprite: [
      "................",
      "..kkkkkkkkkkkk..",
      "..kllllllllllk..",
      "..kl.a....a..k..",
      "..kllllllllllk..",
      "..kllllllllllk..",
      "..kl.a....a..k..",
      "..kllllllllllk..",
      "..kllllllllllk..",
      "..kl.a....a..k..",
      "..kllllllllllk..",
      "..kkkkkkkkkkkk..",
      ".....kaaaak.....",
      "......kaak......",
      ".......kk.......",
      "................",
    ],
    purified: {
      id: "sigan",
      name: "시간지기",
      desc: "멈출 자리를 내가 정하는 힘.",
      lesson:
        "계속 보는 데는 아무것도 안 해도 되고, 멈추는 데는 내가 무언가를 해야 해요. 그렇게 만들어 둔 것이지 내 마음이 약한 게 아닙니다.",
      sprite: [
        "................",
        "..kkkkkkkkkkkk..",
        "..kwwwwwwwwwwk..",
        "..kw.a....a..k..",
        "..kwwwwwwwwwwk..",
        "..kwwaawwaawwk..",
        "..kwwaawwaawwk..",
        "..kwwaawwaawwk..",
        "..kwwwwwwwwwwk..",
        "..kw.a....a..k..",
        "..kwwwwwwwwwwk..",
        "..kkkkkkkkkkkk..",
        "......kwwk......",
        "......kwwk......",
        ".....kkwwkk.....",
        "................",
      ],
    },
  },

  /* 데이터 도시의 중간 보스 — 셋을 정화해야 나타난다 */
  {
    id: "heundeuleo",
    name: "흔들어몬",
    type: "manipul",
    type2: "bias",
    stage: 2,
    boss: true,
    level: 16,
    maxGrip: 160,
    desc: "놓칠까 봐, 뒤처질까 봐 마음을 흔들어 서두르게 만든다.",
    look: "쉬지 않고 울리는 커다란 종. 물결이 사방으로 퍼진다.",
    sprite: [
      ".......kk.......",
      "......kllk......",
      ".....kllllk.....",
      "....kllllllk....",
      "....kllllllk....",
      "...kllllllllk...",
      "...kl.a..a.lk...",
      "..kllllllllllk..",
      "..kllllllllllk..",
      ".kkkkkkkkkkkkkk.",
      ".......kk.......",
      "..a..........a..",
      ".a.a........a.a.",
      "a...a......a...a",
      "................",
      "................",
    ],
    purified: {
      id: "jungsim",
      name: "중심지기",
      desc: "급한 마음이 들 때 한 박자 늦추는 힘.",
      lesson:
        "급하게 만들면 따져 볼 시간이 없어져요. 서두르게 하는 말을 만나면, 그 말이 누구에게 이로운지 먼저 보세요.",
      sprite: [
        ".......kk.......",
        "......kwwk......",
        ".....kwwwwk.....",
        "....kwwwwwwk....",
        "....kwwwwwwk....",
        "...kwwwwwwwwk...",
        "...kw.a..a.wk...",
        "..kwwwwwwwwwwk..",
        "..kwwwwwwwwwwk..",
        ".kkkkkkkkkkkkkk.",
        ".......kk.......",
        ".......aa.......",
        ".......aa.......",
        "......kaak......",
        ".......kk.......",
        "................",
      ],
    },
  }
);

/* ========== 🌑 데이터 도시의 마지막 관문 ==========
   편향도, 의존도, 조작도 결국 "다들 그러니까"에서 버틴다.
   1스테이지 생각멈춤몬이 혼자 생각하기를 멈춘 것이라면,
   이쪽은 여럿이 같이 멈춘 것이다. */
MONSTERS.push({
  id: "dadeulgeurae",
  name: "다들그래몬",
  type: "all",
  stage: 2,
  level: 20,
  maxGrip: 260,
  finalBoss: true,
  desc: "\"다들 그렇게 한다\"는 말로 묻기를 멈추게 만든다. 데이터 도시의 세 그림자가 모두 여기서 나왔다.",
  look: "한 몸에 붙은 여러 얼굴. 전부 같은 쪽만 바라본다.",
  sprite: [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kllllllllllllk.",
    ".kl.a...a...a.k.",
    ".kllllllllllllk.",
    ".klkkllkkllkklk.",
    ".kllllllllllllk.",
    ".kl.a...a...a.k.",
    ".kllllllllllllk.",
    ".kllllllllllllk.",
    ".kl.a...a...a.k.",
    ".kllllllllllllk.",
    ".kkkkkkkkkkkkkk.",
    "...k........k...",
    "..kk........kk..",
    "................",
  ],
  purified: {
    id: "nadaum",
    name: "나다움지기",
    desc: "다들 그래도 나는 한 번 묻는 힘.",
    lesson:
      "남들이 다 그렇게 해도 나는 물어볼 수 있어요. 무엇이 옳은지 정하는 건 사람이라고 배웠다면, 그 사람은 나여야 합니다.",
    sprite: [
      "................",
      ".kkkkkkkkkkkkkk.",
      ".kwwwwwwwwwwwwk.",
      ".kwa...aa...awk.",
      ".kwwwwwwwwwwwwk.",
      ".kww.ww.ww.wwwk.",
      ".kwwwwwwwwwwwwk.",
      ".kw.a..aa..a.wk.",
      ".kwwwwwwwwwwwwk.",
      ".kwwwwaawwwwwwk.",
      ".kw.a..aa..a.wk.",
      ".kwwwwwwwwwwwwk.",
      ".kkkkkkkkkkkkkk.",
      "...k........k...",
      "..kk........kk..",
      "................",
    ],
  },
});

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

/* 지금 이 학생이 갈 수 있는 몬스터 — 도시는 마을을 깨야 열린다 */
function unlockedMonsters() {
  return MONSTERS.filter((m) => stageOf(m) === 1 || stageCleared(1));
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
