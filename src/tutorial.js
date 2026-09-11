/* ===========================================================
   AI몬스터 — 처음 하는 아이를 위한 안내

   맵에 그냥 떨어뜨려 놓으면 뭘 해야 할지 모른다.
   연구소 박사님이 세 번만 말을 건다.
     1) 시작할 때  — 무엇을 하는 게임인지, 어디로 가야 하는지
     2) 첫 전투    — 도구와 상성이 무엇인지
     3) 첫 포획 기회 — 왜 지금 던질 수 있게 됐는지

   한 번 본 안내는 그 학생 저장본에 표시해 두고 다시 띄우지 않는다.
   =========================================================== */

const tutorial = {
  steps: [],
  index: 0,
  onDone: null,
};

function tutorialOpen(steps, onDone) {
  tutorial.steps = steps;
  tutorial.index = 0;
  tutorial.onDone = onDone || null;
  document.getElementById("tutorial").classList.add("on");
  tutorialRender();
}

function tutorialRender() {
  const s = tutorial.steps[tutorial.index];
  const body = document.getElementById("tutorialBody");
  const btn = document.getElementById("tutorialNext");
  const dots = document.getElementById("tutorialDots");

  body.innerHTML =
    (s.title ? '<p class="tut-title">' + s.title + "</p>" : "") +
    '<p class="tut-text">' + s.text + "</p>";

  dots.innerHTML = tutorial.steps
    .map(function (_, i) {
      return '<i class="' + (i === tutorial.index ? "on" : "") + '"></i>';
    })
    .join("");

  const last = tutorial.index === tutorial.steps.length - 1;
  btn.textContent = last ? (s.done || "알겠어요!") : "다음";
  btn.focus();
}

function tutorialNext() {
  sfx("button");
  if (tutorial.index < tutorial.steps.length - 1) {
    tutorial.index++;
    tutorialRender();
    return;
  }
  tutorialClose();
}

function tutorialClose() {
  document.getElementById("tutorial").classList.remove("on");
  const done = tutorial.onDone;
  tutorial.onDone = null;
  if (done) done();
}

function tutorialIsOpen() {
  return document.getElementById("tutorial").classList.contains("on");
}

/* -----------------------------------------------------------
   1) 게임을 처음 켰을 때
   ----------------------------------------------------------- */
function tutorialIntro(onDone) {
  if (save.tutorial.intro) {
    if (onDone) onDone();
    return;
  }
  save.tutorial.intro = true;
  writeSave();

  tutorialOpen(
    [
      {
        title: "AI 연구소 박사님",
        text:
          "어서 와요, <b>" + escapeHtml(save.nick || save.name) + "</b> 탐험가!<br><br>" +
          "요즘 사람들이 AI를 쓰다가 무심코 저지르는 잘못이 <b>그림자몬</b>이 되어 떠돌고 있어요.",
      },
      {
        title: "무엇을 하면 되나요?",
        text:
          "그림자몬은 힘으로 이기는 게 아니에요.<br>" +
          "<b>상황 문제를 풀어</b> 정체를 밝혀야 힘이 빠집니다.<br><br>" +
          "충분히 약해지면 <b>가치볼</b>로 붙잡아 정화해 주세요.",
      },
      {
        title: "어디로 가야 하나요?",
        text:
          "지도에 <b>색깔이 다른 풀숲</b>이 세 군데 있어요.<br>" +
          "<span class='tut-chip c'>파랑 저작권</span> " +
          "<span class='tut-chip p'>주황 개인정보</span> " +
          "<span class='tut-chip d'>보라 허위정보</span><br><br>" +
          "그 풀숲 위를 걸어 다니면 그림자몬이 나타나요.",
        done: "가볼게요!",
      },
    ],
    onDone
  );
}

/* -----------------------------------------------------------
   2) 첫 전투에서 도구를 고르기 직전
   ----------------------------------------------------------- */
function tutorialBattle(monster, onDone) {
  if (save.tutorial.battle) {
    if (onDone) onDone();
    return;
  }
  save.tutorial.battle = true;
  writeSave();

  const typeName = TYPES[monster.type].name;
  const strong = Object.keys(TOOLS).filter(function (id) {
    return getTypeMultiplier(id, monster.type) === 1.5;
  })[0];
  const weak = Object.keys(TOOLS).filter(function (id) {
    return getTypeMultiplier(id, monster.type) === 0.5;
  })[0];

  tutorialOpen(
    [
      {
        title: "무엇을 따져볼까?",
        text:
          "아래 <b>네 가지 질문</b> 중 하나를 고르면, 그 질문으로 풀어야 하는 문제가 나와요.<br><br>" +
          "🔍 진짜일까?<br>" +
          "⚖️ 누구의 것일까?<br>" +
          "🤝 누가 다칠까?<br>" +
          "🧠 나는 왜 이걸 하려 하지?<br><br>" +
          "<b>답을 알려주는 게 아니라, 무엇을 살펴볼지 정하는 거예요.</b>",
      },
      {
        title: "도구마다 잘 통하는 상대가 달라요",
        text:
          "이 몬스터는 <b>" + typeName + "</b> 속성이에요.<br><br>" +
          "<b>" + TOOLS[strong].icon + " " + TOOLS[strong].name + "</b> 으로 맞히면 " +
          "<span class='tut-good'>효과가 굉장</span>해서 1.5배로 약해지고,<br>" +
          "<b>" + TOOLS[weak].icon + " " + TOOLS[weak].name + "</b> 은 " +
          "<span class='tut-bad'>효과가 별로</span>예요.<br><br>" +
          "버튼에 적혀 있으니 보고 고르면 돼요.",
      },
      {
        title: "틀려도 괜찮아요",
        text:
          "틀리면 내 <b>신뢰도</b>가 조금 깎이지만, <b>해설</b>이 나와요.<br>" +
          "그리고 <b>틀린 문제는 다시 나옵니다.</b><br><br>" +
          "해설을 읽었으니 그때 맞히면 돼요.<br>" +
          "🧠 <b>나는 왜 이걸 하려 하지?</b> 는 틀려도 절반만 깎여요. " +
          "내 마음을 들여다보는 일은 틀려도 괜찮으니까요.",
        done: "해볼게요!",
      },
    ],
    onDone
  );
}

/* -----------------------------------------------------------
   3) 처음으로 볼을 던질 수 있게 됐을 때
   ----------------------------------------------------------- */
/* -----------------------------------------------------------
   데이터 도시에 처음 도착했을 때

   여기서 시점이 뒤집힌다는 것을 분명히 말해 준다.
   마을에서는 내가 하는 쪽이었고, 도시에서는 당하는 쪽이다.
   ----------------------------------------------------------- */
function tutorialCity(onDone) {
  if (save.tutorial.city) {
    if (onDone) onDone();
    return;
  }
  save.tutorial.city = true;
  writeSave();

  tutorialOpen(
    [
      {
        title: "데이터 도시에 도착했어요",
        text:
          "AI 마을을 깨끗하게 만들어 줘서 고마워요, <b>" +
          escapeHtml(save.nick || save.name) + "</b> 탐험가.<br><br>" +
          "그런데 이 도시의 그림자는 <b>마을과 다릅니다.</b>",
      },
      {
        title: "이번엔 내가 당하는 쪽이에요",
        text:
          "마을의 그림자는 <b>내가 남에게 하는 잘못</b>이었어요.<br>" +
          "베끼고, 함부로 올리고, 안 알아보고 퍼뜨리는 것들이었죠.<br><br>" +
          "도시의 그림자는 달라요. <b>내가 아무것도 안 해도</b> " +
          "나에게 조용히 일어나는 일들입니다.",
      },
      {
        title: "세 구역이 있어요",
        text:
          "<span class='tut-chip x'>추천의 거리 · 편향</span> " +
          "AI가 누구를 빼놓는지<br>" +
          "<span class='tut-chip y'>자동응답 구역 · 의존</span> " +
          "판단을 AI에게 넘기지 않는지<br>" +
          "<span class='tut-chip z'>알림 광장 · 조작</span> " +
          "나를 붙잡아 두려는 설계인지",
      },
      {
        title: "다섯 번째 질문이 열렸어요",
        text:
          "🎯 <b>이건 누구를 위한 걸까?</b><br><br>" +
          "네 가지 질문으로는 안 풀리는 것이 있어요.<br>" +
          "추천 화면, 자동 재생, 끝없는 알림 같은 것들이요.<br><br>" +
          "<b>누가 다칠까?</b> 는 내 행동의 피해자를 묻고,<br>" +
          "<b>나는 왜 이걸 하려 하지?</b> 는 내 마음을 묻지만,<br>" +
          "여기서 따져야 할 건 <b>만든 사람의 속셈</b>이에요.",
      },
      {
        title: "여기는 더 어려워요",
        text:
          "속성이 <b>둘</b>인 몬스터가 있어요. 상성이 반쪽만 맞습니다.<br>" +
          "잡으려면 정답률 <b>" + accPct() + "% 이상</b>, " +
          "문제 <b>" + bal("minAskedToCatch") + "개 이상</b>이 필요해요.<br><br>" +
          "천천히 읽으세요. 여기서는 <b>급하게 고르는 것</b>이 제일 위험합니다.",
        done: "가볼게요!",
      },
    ],
    onDone
  );
}

function tutorialCatch(onDone) {
  if (save.tutorial.catchTip) {
    if (onDone) onDone();
    return;
  }
  save.tutorial.catchTip = true;
  writeSave();

  tutorialOpen(
    [
      {
        title: "이제 가치볼을 던질 수 있어요",
        text:
          "세 가지를 모두 채워야 던질 수 있어요.<br><br>" +
          "① 몬스터의 <b>장악력이 " + gripPctLimit() + "% 이하</b><br>" +
          "② 내 <b>정답률이 " + accPct() + "% 이상</b><br>" +
          "③ 문제를 <b>" + bal("minAskedToCatch") + "개 이상</b> 풀었을 것<br><br>" +
          "<b>충분히 이해했을 때만 잡을 수 있다</b>는 뜻이에요.",
      },
      {
        title: "문제를 더 풀면 더 잘 잡혀요",
        text:
          "장악력을 더 낮출수록 성공 확률이 쑥 올라가요.<br>" +
          "지금 던져서 튀어나와도 괜찮아요. 문제를 더 풀고 다시 던지면 돼요.<br><br>" +
          "<b>근거볼</b>과 <b>확신볼</b>은 더 잘 잡히니, 어려운 상대에게 아껴 두세요.",
        done: "던져볼게요!",
      },
    ],
    onDone
  );
}
