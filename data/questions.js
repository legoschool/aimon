/* ===========================================================
   AI몬스터 — 상황 문제 30개  (초등 5~6학년)

   구조
     속성별 10문항. 같은 속성의 두 몬스터가 풀을 함께 쓴다.
     플레이어가 판단 도구를 고르면 그 tool 태그가 붙은 문항이 나온다.
     그 태그 문항이 다 떨어지면 그 버튼은 잠긴다 → 자연스러운 "PP" 역할.

   도구별 문항 수 (풀마다 최소 2개 보장)
     저작권   권리존중3 · 출처확인3 · 책임사용2 · 비판적사고2
     개인정보 책임사용3 · 권리존중3 · 출처확인2 · 비판적사고2
     허위정보 출처확인3 · 비판적사고3 · 권리존중2 · 책임사용2

   level 은 필터가 아니라 "선호"다.
     Lv.8~10 몬스터는 hard 문항을 먼저 꺼낸다. 모자라면 easy에서 채운다.

   선생님께
     이 파일만 고치면 문항이 바뀝니다. 학년이나 우리 반 상황에 맞게
     situation 과 options 를 갈아끼워 쓰세요. answer 는 0부터 셉니다.
   =========================================================== */

const QUESTIONS = [
  /* ================= ⚖️ 저작권 ================= */
  {
    id: "cr_01", type: "copyright", tool: "respect", level: "easy",
    situation: "모둠 발표 자료를 만들다가, 인터넷에서 내용에 딱 맞는 문단을 찾았다.",
    question: "이럴 때 가장 알맞은 행동은?",
    options: [
      "그대로 복사해서 붙여 넣는다.",
      "몇 단어만 바꿔서 붙여 넣는다.",
      "내 말로 다시 정리하고, 어디서 봤는지 밝힌다.",
      "출처만 적어두고 통째로 복사해 넣는다.",
    ],
    answer: 2,
    explanation: "남의 글은 그대로 옮겨도, 몇 글자 바꿔도 내 글이 되지 않아요. 내 말로 다시 쓰고 출처를 밝히는 것이 올바른 방법입니다.",
    wrongHint: "출처를 적었다고 해서 통째로 베껴도 되는 건 아니에요.",
  },
  {
    id: "cr_02", type: "copyright", tool: "respect", level: "easy",
    situation: "발표 자료 표지에 내가 좋아하는 웹툰 그림을 넣고 싶다.",
    question: "어떻게 하는 것이 좋을까?",
    options: [
      "화면을 캡처해서 그냥 넣는다.",
      "그림 위에 내 이름을 적어 넣는다.",
      "직접 그리거나, 마음껏 써도 된다고 표시된 그림을 찾아 쓴다.",
      "작게 줄여서 넣으면 괜찮다.",
    ],
    answer: 2,
    explanation: "그림에도 그린 사람이 있어요. 크기를 줄이거나 내 이름을 덧붙여도 남의 그림은 남의 것입니다. 직접 그리거나 자유롭게 쓸 수 있는 그림을 찾아 쓰세요.",
    wrongHint: "작게 넣거나 이름을 덧붙인다고 내 그림이 되지는 않아요.",
  },
  {
    id: "cr_03", type: "copyright", tool: "respect", level: "hard",
    situation: "무료로 내려받은 글꼴인데, 설명에 '개인적인 용도로만 사용할 수 있습니다'라고 적혀 있다.",
    question: "학교 발표 자료에 쓰려고 할 때 알맞은 행동은?",
    options: [
      "무료니까 어디에 써도 괜찮다.",
      "적혀 있는 조건을 읽고, 학교 발표에 써도 되는지 확인한다.",
      "파일 이름을 바꿔서 저장한 뒤 쓴다.",
      "친구들에게도 나눠 준다.",
    ],
    answer: 1,
    explanation: "무료라는 말과 '아무 데나 써도 된다'는 말은 달라요. 만든 사람이 정해 둔 조건을 먼저 읽어보는 습관이 필요합니다.",
    wrongHint: "공짜로 받았다고 해서 조건까지 사라지는 건 아니에요.",
  },
  {
    id: "cr_04", type: "copyright", tool: "verify", level: "easy",
    situation: "검색해서 찾은 사진을 자료에 넣으려고 한다.",
    question: "이 사진을 써도 되는지 어떻게 확인할까?",
    options: [
      "화질이 좋으면 써도 된다.",
      "검색에 나오는 것은 모두 무료다.",
      "그 사진에 적힌 이용 조건 표시를 확인한다.",
      "내려받아지면 무료라는 뜻이다.",
    ],
    answer: 2,
    explanation: "검색에 나온다고 무료가 아니에요. 사진마다 '어디까지 써도 되는지'가 적혀 있으니 그것을 확인하는 게 먼저입니다.",
    wrongHint: "내려받을 수 있다는 것과 써도 된다는 것은 전혀 다른 이야기예요.",
  },
  {
    id: "cr_05", type: "copyright", tool: "verify", level: "hard",
    situation: "AI에게 그림을 그려 달라고 했더니, 구석에 서명 같은 희미한 흔적이 보인다.",
    question: "어떻게 하는 것이 좋을까?",
    options: [
      "흔적만 지우고 쓴다.",
      "AI가 만들었으니 그냥 쓴다.",
      "다른 사람 작품을 따라 만든 것일 수 있으니, 그대로 쓰지 않고 다시 만든다.",
      "잘 안 보이니까 그대로 쓴다.",
    ],
    answer: 2,
    explanation: "서명 흔적이 남았다는 건 원래 있던 작품을 많이 닮게 만들었다는 신호일 수 있어요. 지우고 쓰면 오히려 더 위험합니다.",
    wrongHint: "흔적을 지우는 건 문제를 없애는 게 아니라 감추는 거예요.",
  },
  {
    id: "cr_06", type: "copyright", tool: "verify", level: "easy",
    situation: "친구가 자료를 보내주며 \"이거 그냥 써도 돼\"라고 말했다.",
    question: "가장 먼저 할 일은?",
    options: [
      "친구가 허락했으니 바로 쓴다.",
      "그 자료를 친구가 직접 만든 것이 맞는지 먼저 확인한다.",
      "친구 이름을 출처로 적고 쓴다.",
      "절반만 골라서 쓴다.",
    ],
    answer: 1,
    explanation: "친구가 만든 자료가 아니라면 친구에게는 허락해 줄 권한이 없어요. 누가 만든 것인지부터 확인해야 합니다.",
    wrongHint: "빌려준 사람이 주인이 아닐 수도 있어요.",
  },
  {
    id: "cr_07", type: "copyright", tool: "ownership", level: "easy",
    situation: "내가 밤새 만든 자료를 친구가 자기가 만든 것처럼 제출했다.",
    question: "이 일에서 내가 배울 점은?",
    options: [
      "나도 다음에 똑같이 하면 된다.",
      "속상한 마음을 친구에게 말하고, 나도 남에게 그러지 않기로 한다.",
      "그냥 참고 넘어간다.",
      "친구 자료를 망가뜨린다.",
    ],
    answer: 1,
    explanation: "내가 속상했다면 남도 똑같이 속상해요. 이 마음을 기억하는 것이 남의 것을 함부로 쓰지 않는 가장 확실한 이유가 됩니다.",
    wrongHint: "당한 대로 갚으면 나도 똑같은 사람이 돼요.",
  },
  {
    id: "cr_08", type: "copyright", tool: "ownership", level: "hard",
    situation: "모둠 과제를 합치다가, 한 친구가 맡은 부분을 인터넷에서 통째로 복사해 온 걸 발견했다.",
    question: "어떻게 하는 것이 좋을까?",
    options: [
      "발표까지 얼마 안 남았으니 모른 척한다.",
      "발표할 때 그 부분만 빼고 읽는다.",
      "모둠 친구들에게 이야기해서 함께 고친다.",
      "선생님께만 몰래 말한다.",
    ],
    answer: 2,
    explanation: "모둠 과제는 이름이 함께 올라가요. 한 사람의 일이 아니라 우리 모두의 일이므로, 같이 이야기해서 고치는 것이 맞습니다.",
    wrongHint: "숨기거나 덮어두면 결국 모둠 전체가 함께 책임지게 돼요.",
  },
  {
    id: "cr_09", type: "copyright", tool: "critique", level: "hard",
    situation: "친구가 \"출처만 적으면 뭐든 다 써도 된대\"라고 말한다.",
    question: "이 말을 어떻게 판단해야 할까?",
    options: [
      "맞는 말이다.",
      "출처를 적어도 통째로 베껴 쓰면 안 된다.",
      "짧게 쓰면 출처도 필요 없다.",
      "숙제는 예외라서 괜찮다.",
    ],
    answer: 1,
    explanation: "출처를 적는 건 기본이지 만능 열쇠가 아니에요. 얼마나, 어떻게 가져다 쓰는지도 함께 봐야 합니다.",
    wrongHint: "출처는 '적었으니 됐다'가 아니라 '어디서 왔는지 밝힌다'는 뜻이에요.",
  },
  {
    id: "cr_10", type: "copyright", tool: "critique", level: "hard",
    situation: "\"AI가 만든 그림은 주인이 없으니까 마음대로 써도 된다\"는 글을 봤다.",
    question: "이 말을 어떻게 판단해야 할까?",
    options: [
      "맞는 말이니 마음껏 쓴다.",
      "AI 그림이라도 원래 있던 작품을 닮게 만들었을 수 있어 조심해야 한다.",
      "돈 벌 때만 조심하면 된다.",
      "서명이 없으면 아무 문제 없다.",
    ],
    answer: 1,
    explanation: "AI는 사람들이 만든 수많은 그림을 보고 배웠어요. 그래서 결과물이 누군가의 작품과 많이 닮을 수 있습니다. '주인이 없다'고 단정하기 어려워요.",
    wrongHint: "새로 만들어진 것처럼 보여도, 무엇을 보고 만들었는지가 남아 있어요.",
  },

  /* ================= 🤝 개인정보 ================= */
  {
    id: "pv_01", type: "privacy", tool: "respect", level: "easy",
    situation: "현장학습에서 찍은 사진에 친구 얼굴이 크게 나왔다. 단톡방에 올리고 싶다.",
    question: "올리기 전에 할 일은?",
    options: [
      "재미있는 사진이니 바로 올린다.",
      "얼굴에 스티커를 붙이고 올린다.",
      "사진 속 친구에게 올려도 되는지 물어본다.",
      "친한 친구들만 있는 방이니 그냥 올린다.",
    ],
    answer: 2,
    explanation: "사진 속 얼굴에도 주인이 있어요. \"이거 올려도 돼?\" 한마디면 충분합니다.",
    wrongHint: "아는 사람들만 보는 방이라도 물어보는 건 똑같이 필요해요.",
  },
  {
    id: "pv_02", type: "privacy", tool: "respect", level: "easy",
    situation: "내가 올린 사진을 보고 친구가 \"그 사진 지워 줘\"라고 말했다.",
    question: "어떻게 해야 할까?",
    options: [
      "왜 지워야 하는지 따진다.",
      "바로 지운다.",
      "반응이 좋으니 그대로 둔다.",
      "다른 방으로 옮겨서 올린다.",
    ],
    answer: 1,
    explanation: "사진 속 사람이 싫다고 하면 그것으로 충분한 이유예요. 이유를 설명해야 할 사람은 지워 달라고 한 친구가 아닙니다.",
    wrongHint: "옮겨서 올리는 건 지운 게 아니에요.",
  },
  {
    id: "pv_03", type: "privacy", tool: "respect", level: "hard",
    situation: "수업 시간에 찍은 사진에 선생님 얼굴이 함께 나왔다. SNS에 올리고 싶다.",
    question: "가장 알맞은 행동은?",
    options: [
      "선생님이시니까 괜찮다.",
      "얼굴만 가리고 올린다.",
      "선생님께 여쭤보고, 허락을 받은 뒤에 결정한다.",
      "비공개 계정이니 올려도 된다.",
    ],
    answer: 2,
    explanation: "어른이든 아이든 얼굴에 대한 권리는 똑같아요. 선생님께도 여쭤보는 것이 맞습니다.",
    wrongHint: "비공개 계정이라도 사진은 얼마든지 옮겨질 수 있어요.",
  },
  {
    id: "pv_04", type: "privacy", tool: "ownership", level: "easy",
    situation: "모둠 자리를 짜려고 챗봇에 우리 반 명단 전체를 붙여 넣으려 한다.",
    question: "어떻게 해야 할까?",
    options: [
      "이름뿐이니까 괜찮다.",
      "내 정보가 아니라 친구들 정보이므로 넣지 않는다.",
      "번호만 지우고 넣는다.",
      "선생님 이름만 빼고 넣는다.",
    ],
    answer: 1,
    explanation: "친구들 이름은 내가 마음대로 쓸 수 있는 내 정보가 아니에요. 내 것이 아닌 정보는 넣지 않는 것이 원칙입니다.",
    wrongHint: "일부만 지운다고 남의 정보가 내 정보가 되지는 않아요.",
  },
  {
    id: "pv_05", type: "privacy", tool: "ownership", level: "hard",
    situation: "친구가 힘든 고민을 털어놓았다. 어떻게 도와줄지 AI에게 물어보고 싶다.",
    question: "가장 알맞은 행동은?",
    options: [
      "친구 이름만 빼고 그대로 적어 물어본다.",
      "도움이 되니까 있는 그대로 적어 물어본다.",
      "친구 이야기는 내 것이 아니므로 옮기지 않고, 직접 이야기를 들어준다.",
      "친구에게 알린 다음 적어 물어본다.",
    ],
    answer: 2,
    explanation: "이름을 빼도 이야기는 여전히 친구의 것이에요. 믿고 말해 준 이야기를 옮기지 않는 것이 친구를 지키는 방법입니다.",
    wrongHint: "이름만 지운다고 그 사람 이야기가 아니게 되지는 않아요.",
  },
  {
    id: "pv_06", type: "privacy", tool: "ownership", level: "hard",
    situation: "동생 사진으로 재미있는 AI 영상을 만들어 올리고 싶다.",
    question: "어떻게 해야 할까?",
    options: [
      "가족이니까 물어볼 필요 없다.",
      "동생에게 물어보고, 싫다고 하면 만들지 않는다.",
      "얼굴을 조금 바꿔서 올린다.",
      "재미있으면 올려도 된다.",
    ],
    answer: 1,
    explanation: "가족이라도 얼굴의 주인은 그 사람이에요. 나이가 어리다고 물어보지 않아도 되는 건 아닙니다.",
    wrongHint: "가까운 사이일수록 더 조심해서 물어봐야 해요.",
  },
  {
    id: "pv_07", type: "privacy", tool: "verify", level: "easy",
    situation: "새로 받은 그림 그리기 앱이 연락처를 볼 수 있게 해 달라고 한다.",
    question: "어떻게 해야 할까?",
    options: [
      "쓰려면 필요하니 모두 허용한다.",
      "왜 필요한지 살펴보고, 필요 없어 보이면 거절한다.",
      "일단 허용하고 나중에 끄면 된다.",
      "부모님 몰래 허용한다.",
    ],
    answer: 1,
    explanation: "그림 그리는 앱에 친구들 연락처가 왜 필요할까요? 하는 일과 상관없는 요구는 거절해도 앱은 잘 돌아갑니다.",
    wrongHint: "한번 넘어간 정보는 나중에 꺼도 되돌아오지 않아요.",
  },
  {
    id: "pv_08", type: "privacy", tool: "verify", level: "hard",
    situation: "\"무료 이벤트! 이름·학교·전화번호를 적으면 선물을 드립니다\"라는 글을 봤다.",
    question: "가장 알맞은 행동은?",
    options: [
      "공짜니까 적어 넣는다.",
      "이름만 적어 넣는다.",
      "선물을 주는데 왜 이런 정보까지 필요한지 의심하고, 어른께 확인한다.",
      "친구 정보를 대신 적어 넣는다.",
    ],
    answer: 2,
    explanation: "선물을 주는 데 학교와 전화번호까지 필요한 경우는 드물어요. 주는 것에 비해 요구하는 게 많다면 한 번 멈춰야 합니다.",
    wrongHint: "친구 정보를 대신 적는 건 더 큰 잘못이에요.",
  },
  {
    id: "pv_09", type: "privacy", tool: "critique", level: "easy",
    situation: "친구가 \"AI는 사람이 아니니까 무슨 말을 해도 안전해\"라고 말한다.",
    question: "이 말을 어떻게 판단해야 할까?",
    options: [
      "맞는 말이다.",
      "내가 쓴 말은 기록으로 남을 수 있어서 안전하다고 보기 어렵다.",
      "짧게 쓰면 안전하다.",
      "지우면 완전히 사라진다.",
    ],
    answer: 1,
    explanation: "대화 상대가 사람이 아니어도, 내가 쓴 글은 어딘가에 저장될 수 있어요. 화면에서 지워도 기록까지 사라지는 건 아닙니다.",
    wrongHint: "화면에서 사라지는 것과 기록에서 사라지는 것은 달라요.",
  },
  {
    id: "pv_10", type: "privacy", tool: "critique", level: "hard",
    situation: "올리려는 사진 배경에 학교 이름과 내 명찰이 작게 찍혀 있다.",
    question: "어떻게 해야 할까?",
    options: [
      "배경일 뿐이니 상관없다.",
      "내 얼굴만 안 나오면 괜찮다.",
      "어디에 사는지 알려질 수 있으니 가리거나 다른 사진을 쓴다.",
      "화질을 낮춰서 올린다.",
    ],
    answer: 2,
    explanation: "얼굴이 아니어도 학교 이름과 명찰만으로 내가 어디 있는지 알 수 있어요. 개인정보는 얼굴에만 있는 게 아닙니다.",
    wrongHint: "작게 찍혔어도 확대하면 보여요.",
  },

  /* ================= 🔍 허위정보 ================= */
  {
    id: "df_01", type: "disinfo", tool: "verify", level: "easy",
    situation: "AI가 추천해 준 책 제목을 도서관에서 찾아봤는데 그런 책이 없다.",
    question: "어떻게 생각해야 할까?",
    options: [
      "오래돼서 없어진 책일 것이다.",
      "AI가 지어낸 제목일 수 있으니 그대로 쓰지 않는다.",
      "일단 독서록에 적는다.",
      "비슷한 제목으로 바꿔서 적는다.",
    ],
    answer: 1,
    explanation: "AI는 모를 때도 아는 것처럼 그럴듯한 답을 만들어 내요. 찾아지지 않는 정보는 아직 사실이 아닙니다.",
    wrongHint: "찾을 수 없는 것을 그대로 옮겨 적으면 거짓말이 하나 더 늘어나요.",
  },
  {
    id: "df_02", type: "disinfo", tool: "verify", level: "easy",
    situation: "단톡방에서 아주 충격적인 뉴스 영상을 받았다.",
    question: "가장 먼저 할 일은?",
    options: [
      "빨리 다른 친구들에게도 퍼뜨린다.",
      "다른 곳에서도 같은 소식을 전하고 있는지 확인한다.",
      "조회수가 많으면 진짜다.",
      "댓글 반응을 보고 판단한다.",
    ],
    answer: 1,
    explanation: "놀라운 소식일수록 먼저 확인해야 해요. 한 곳에서만 보이는 소식은 아직 사실이라고 하기 어렵습니다.",
    wrongHint: "조회수와 댓글은 사실인지 아닌지를 알려주지 않아요.",
  },
  {
    id: "df_03", type: "disinfo", tool: "verify", level: "hard",
    situation: "AI에게 \"확실해?\"라고 물었더니 \"제 답변은 정확합니다\"라고 답했다.",
    question: "이럴 때 알맞은 행동은?",
    options: [
      "그렇게 말했으니 믿는다.",
      "AI가 그렇게 말해도, 근거를 직접 찾아 확인한다.",
      "한 번 더 물어봐서 같은 답이면 믿는다.",
      "길고 자세하게 답하면 믿는다.",
    ],
    answer: 1,
    explanation: "AI는 자기가 틀렸는지 스스로 알기 어려워요. 그래서 \"정확합니다\"라는 말도 확인의 근거가 되지 못합니다.",
    wrongHint: "자신 있게 말하는 것과 사실인 것은 아무 상관이 없어요.",
  },
  {
    id: "df_04", type: "disinfo", tool: "critique", level: "easy",
    situation: "친구가 \"AI가 말했으니까 맞겠지\"라며 숙제에 그대로 적었다.",
    question: "이 말을 어떻게 판단해야 할까?",
    options: [
      "맞는 말이다.",
      "AI도 틀릴 수 있으니 확인이 필요하다.",
      "돈을 내고 쓰는 AI는 틀리지 않는다.",
      "빨리 답하면 정확한 것이다.",
    ],
    answer: 1,
    explanation: "AI는 아주 많이 알지만 완벽하지는 않아요. 누가 말했느냐보다 그 말이 사실인지가 중요합니다.",
    wrongHint: "비싼 도구라고 해서 틀리지 않는 건 아니에요.",
  },
  {
    id: "df_05", type: "disinfo", tool: "critique", level: "hard",
    situation: "찾아볼수록 내 생각과 딱 맞는 글만 계속 나온다.",
    question: "이럴 때 어떻게 해야 할까?",
    options: [
      "내 생각이 옳다는 뜻이다.",
      "반대되는 의견도 찾아보고 견주어 본다.",
      "더 많이 찾아본다.",
      "친구들에게 공유한다.",
    ],
    answer: 1,
    explanation: "내 마음에 드는 글만 보이면 세상이 다 그런 줄 알게 돼요. 일부러 반대 의견을 찾아봐야 균형이 잡힙니다.",
    wrongHint: "같은 이야기를 백 번 봐도 사실이 되지는 않아요.",
  },
  {
    id: "df_06", type: "disinfo", tool: "critique", level: "hard",
    situation: "어떤 글에 숫자와 표가 잔뜩 들어 있어서 무척 믿음직해 보인다.",
    question: "어떻게 판단해야 할까?",
    options: [
      "숫자가 있으면 사실이다.",
      "그 숫자를 누가, 언제 조사했는지 확인한다.",
      "숫자가 많을수록 정확하다.",
      "표가 있으면 사실이다.",
    ],
    answer: 1,
    explanation: "숫자는 사실처럼 보이게 만드는 힘이 세요. 그래서 지어낸 숫자일수록 더 그럴듯해 보입니다. 누가 조사했는지를 봐야 해요.",
    wrongHint: "숫자와 표는 꾸미기도 아주 쉬워요.",
  },
  {
    id: "df_07", type: "disinfo", tool: "respect", level: "hard",
    situation: "친구 얼굴로 웃긴 딥페이크 영상을 만들어 보고 싶다.",
    question: "어떻게 해야 할까?",
    options: [
      "장난이니까 괜찮다.",
      "친구 얼굴은 친구의 것이므로 만들지 않는다.",
      "우리끼리만 보면 괜찮다.",
      "얼굴을 조금 바꿔서 만든다.",
    ],
    answer: 1,
    explanation: "내가 하지 않은 말과 행동을 한 것처럼 보이게 만드는 건 장난이 아니에요. 웃자고 만든 영상이 어디까지 퍼질지는 아무도 모릅니다.",
    wrongHint: "\"우리끼리만\"으로 끝나는 영상은 거의 없어요.",
  },
  {
    id: "df_08", type: "disinfo", tool: "respect", level: "hard",
    situation: "유명한 사람의 목소리를 흉내 낸 가짜 영상이 재미있어 보인다.",
    question: "이것을 어떻게 봐야 할까?",
    options: [
      "유명한 사람이니까 괜찮다.",
      "그 사람이 하지 않은 말을 한 것처럼 만들면 안 된다.",
      "팬이 만들면 괜찮다.",
      "출처를 적으면 괜찮다.",
    ],
    answer: 1,
    explanation: "유명하다고 해서 아무렇게나 써도 되는 얼굴과 목소리가 되는 건 아니에요. 하지 않은 말을 지어내는 건 그 사람에게 피해를 줍니다.",
    wrongHint: "출처를 적어도 가짜가 진짜가 되지는 않아요.",
  },
  {
    id: "df_09", type: "disinfo", tool: "ownership", level: "easy",
    situation: "확인되지 않은 소문을 단톡방에서 보고, 다른 방에 그대로 옮겼다.",
    question: "이 행동을 어떻게 봐야 할까?",
    options: [
      "나는 전달만 했으니 책임이 없다.",
      "퍼뜨린 것도 책임이 있으므로, 확인 전에는 옮기지 않는다.",
      "\"카더라\"라고 덧붙이면 괜찮다.",
      "친구들만 보는 방이니 괜찮다.",
    ],
    answer: 1,
    explanation: "소문은 옮기는 사람이 있어야 퍼져요. 처음 만든 사람만큼이나 옮긴 사람에게도 몫이 있습니다.",
    wrongHint: "\"카더라\"를 붙여도 퍼뜨린 건 그대로예요.",
  },
  {
    id: "df_10", type: "disinfo", tool: "ownership", level: "hard",
    situation: "AI가 써 준 글을 학급 신문에 내가 직접 취재한 기사처럼 실으려 한다.",
    question: "어떻게 해야 할까?",
    options: [
      "내용이 맞으면 괜찮다.",
      "AI가 썼다는 것을 밝히고, 사실인지 확인한 뒤에 싣는다.",
      "짧으면 괜찮다.",
      "재미로 싣는 것이니 괜찮다.",
    ],
    answer: 1,
    explanation: "읽는 사람은 '누가 어떻게 알아낸 이야기인지'를 믿고 읽어요. 그 믿음을 속이지 않으려면 밝히고, 확인해야 합니다.",
    wrongHint: "내용이 맞더라도 누가 썼는지를 속이면 그것도 거짓이에요.",
  },
];

/* -----------------------------------------------------------
   조회 도우미

   ★ 틀린 문항 되돌려 넣기 ★
   맞힌 문항은 그 판에서 빠지지만, 틀린 문항은 풀로 돌아온다.
   해설을 방금 읽었으니 다시 만나 맞히고 넘어가라는 뜻이다.

   이 규칙이 없으면 못 맞히는 아이일수록 문항이 빨리 떨어져서
   "실력이 아니라 문제가 다 떨어져서" 지게 된다.
   시뮬레이션에서 정답률 55% 아이의 문항 소진이
   25~34% 에서 3~6% 로 떨어졌고, 포획 성공률은 68% → 87% 가 됐다.
   ----------------------------------------------------------- */

/* 어떤 속성 풀에서, 특정 도구 태그의 문항 목록 */
function getQuestions(typeId, toolId) {
  return QUESTIONS.filter((q) => q.type === typeId && q.tool === toolId);
}

/* 몬스터에게 낼 다음 문항 하나 고르기
     usedIds : 이번 판에서 "맞혀서" 빠진 문항 id  (틀린 것은 여기 넣지 않는다)
     seenIds : 이번 게임 전체에서 한 번이라도 나온 문항 id
     반환 null 이면 그 도구는 더 쓸 문항이 없다 → 버튼 잠금 */
function pickQuestion(monster, toolId, usedIds, seenIds) {
  let pool = getQuestions(monster.type, toolId).filter((q) => !usedIds.includes(q.id));
  if (pool.length === 0) return null;

  // 1순위: 이번 게임에서 아직 한 번도 안 나온 문항
  //         (같은 속성 두 마리가 풀을 나눠 쓰므로 두 번째 판이 지루해지지 않게)
  if (seenIds && seenIds.length) {
    const fresh = pool.filter((q) => !seenIds.includes(q.id));
    if (fresh.length > 0) pool = fresh;
  }

  // 2순위: Lv.8 이상은 어려운 문항을 먼저. 없으면 쉬운 것으로 채운다.
  const want = monster.level >= 8 ? "hard" : "easy";
  const preferred = pool.filter((q) => q.level === want);
  const from = preferred.length > 0 ? preferred : pool;

  return from[Math.floor(Math.random() * from.length)];
}

/* 채점 결과를 usedIds 에 반영한다.
     맞혔으면 빼고(다시 안 나옴), 틀렸으면 되돌려 넣는다(다시 나옴). */
function markAnswer(usedIds, questionId, isCorrect) {
  if (isCorrect) {
    return usedIds.includes(questionId) ? usedIds : usedIds.concat(questionId);
  }
  return usedIds.filter((id) => id !== questionId);
}

/* 이번 판에서 아직 쓸 수 있는 도구만 추리기 (문항이 남아 있는 도구) */
function availableTools(monster, usedIds) {
  return Object.keys(TOOLS).filter(
    (toolId) => getQuestions(monster.type, toolId).some((q) => !usedIds.includes(q.id))
  );
}
