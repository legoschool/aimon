/* ===========================================================
   AI몬스터 — 설정

   구글 시트 연동을 쓰려면 MY_SHEET_ENDPOINT 에 주소를 넣으세요.
   설정 방법은 `구글시트연동.md` 를 보시면 됩니다.

   비워 두면 연동이 꺼지고, 게임은 그 컴퓨터에만
   기록을 저장하며 잘 돌아갑니다.
   =========================================================== */

/* 내 시트 창구 주소 (Apps Script 웹 앱 주소, …/exec 로 끝나야 합니다)
   사본을 가져가신 선생님은 여기에만 붙여 넣으시면 됩니다. */
const MY_SHEET_ENDPOINT = "";

/* 원본(레고학교) 창구. 원본 공개 주소 legoschool.github.io/aimon 에서만 쓰이고,
   사본·USB·다른 주소에서는 쓰이지 않습니다. 다른 학교 학생 기록이
   원본 시트로 들어오지 않게 하려는 장치이니 그대로 두셔도 됩니다. */
const ORIGIN_SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbw3WZQ0wFQSXtl9nQBwOjfyESB8z5KwoYO3cvZ83gSI6PtL7TGavxXenDPyDLyAZKfk/exec";
const ORIGIN_HOST = "legoschool.github.io";
const ORIGIN_PATH = "/aimon";

function isOriginSite() {
  try {
    return location.hostname === ORIGIN_HOST && location.pathname.indexOf(ORIGIN_PATH) === 0;
  } catch (e) {
    return false;
  }
}

/* 실제로 쓰는 주소: 내 주소가 있으면 내 주소, 없으면 원본 공개 주소에서만 원본 창구 */
const SHEET_ENDPOINT = MY_SHEET_ENDPOINT || (isOriginSite() ? ORIGIN_SHEET_ENDPOINT : "");

/* 연동을 잠시 끄고 싶을 때 false 로 바꾸세요 */
const SHEET_ENABLED = true;

/* 시작 화면에서 반·번호를 받을지
   false 로 두면 닉네임만 받습니다 (연동을 안 쓸 때) */
const ASK_CLASS_NUMBER = true;

function sheetReady() {
  return SHEET_ENABLED && typeof SHEET_ENDPOINT === "string" && SHEET_ENDPOINT.indexOf("http") === 0;
}
