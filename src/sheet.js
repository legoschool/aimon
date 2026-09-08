/* ===========================================================
   AI몬스터 — 구글 시트로 기록 보내기

   이 게임에는 서버가 없다. GitHub Pages 는 파일을 보내주기만 한다.
   그래서 구글 Apps Script 로 만든 "쓰기 전용 창구"에 기록을 보낸다.

   지켜야 할 것
     1) 실패해도 게임은 그대로 돌아가야 한다.
        시트가 막혀 있든 인터넷이 끊겼든 아이는 계속 놀 수 있어야 한다.
        그래서 모든 호출을 try/catch 로 감싸고 결과를 기다리지 않는다.
     2) 이름은 보내지 않는다. 반·번호·닉네임만 보낸다.
        개인정보를 조심하라고 가르치는 게임이므로 스스로 지킨다.
     3) 읽기는 선생님 암호가 있어야 한다.
        암호는 코드에 넣지 않는다. 선생님이 그때그때 입력한다.
   =========================================================== */

let lastSentAt = 0;
const SEND_COOLDOWN_MS = 3000; // 너무 자주 보내지 않게

/* 구글 시트는 "5-3" 을 5월 3일로 바꿔 버린다.
   앞에 작은따옴표를 붙이면 "이건 글자다"라는 뜻이 되고,
   시트에는 따옴표 없이 5-3 으로 그대로 남는다. */
function asText(v) {
  const s = String(v === undefined || v === null ? "" : v).trim();
  return s === "" ? "" : "'" + s;
}

/* 지금 저장본에서 보낼 내용을 만든다 */
function buildRecord() {
  const all = overallAccuracy();
  return {
    action: "submit",
    klass: asText(save.klass),
    number: asText(save.number),
    nick: asText(save.nick || save.name),
    caught: dexCaughtCount(),
    badges: typeof badgeCount === "function" ? badgeCount() : 0,
    asked: all.asked,
    right: all.right,
    stats: save.stats,
    hints: (save.hintIds || []).length,
    wrongs: (save.wrongIds || []).length,
    battles: save.battles || 0,
  };
}

/* 기록 보내기 — 보내고 잊는다. 결과를 기다리지 않는다. */
function sendRecord(force) {
  if (!sheetReady()) return false;

  const now = Date.now();
  if (!force && now - lastSentAt < SEND_COOLDOWN_MS) return false;
  lastSentAt = now;

  try {
    // Content-Type 을 따로 정하지 않아야 브라우저가 미리 묻지 않는다.
    fetch(SHEET_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(buildRecord()),
    }).catch(function () {
      /* 못 보내도 그만. 게임은 계속된다. */
    });
    return true;
  } catch (e) {
    return false;
  }
}

/* -----------------------------------------------------------
   선생님 화면 — 암호를 넣어야 읽을 수 있다
   ----------------------------------------------------------- */
function fetchClassRecords(password) {
  if (!sheetReady()) {
    return Promise.reject(new Error("시트 주소가 설정되지 않았어요. data/config.js 를 보세요."));
  }
  const url =
    SHEET_ENDPOINT +
    "?action=list&pw=" + encodeURIComponent(password) +
    "&t=" + Date.now(); // 캐시 피하기

  return fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.ok) {
        throw new Error(
          data && data.error === "wrong password"
            ? "암호가 맞지 않아요."
            : "기록을 불러오지 못했어요."
        );
      }
      return data.rows || [];
    });
}
