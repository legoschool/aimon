/* ===========================================================
   AI몬스터 — 설정

   구글 시트 연동을 쓰려면 여기에 주소를 넣으세요.
   설정 방법은 `구글시트연동.md` 를 보시면 됩니다.

   비워 두면 연동이 꺼지고, 게임은 예전처럼
   그 컴퓨터에만 저장하며 잘 돌아갑니다.
   =========================================================== */

/* Apps Script 웹 앱 주소 (…/exec 로 끝나야 합니다) */
const SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbw-YBLSXaAi6JWwQ6LTk2m8HV89r9OXQWgTaOAr5whknUHXnZKC65GJMQxsYZE72EU/exec";

/* 연동을 잠시 끄고 싶을 때 false 로 바꾸세요 */
const SHEET_ENABLED = true;

/* 시작 화면에서 반·번호를 받을지
   false 로 두면 닉네임만 받습니다 (연동을 안 쓸 때) */
const ASK_CLASS_NUMBER = true;

function sheetReady() {
  return SHEET_ENABLED && typeof SHEET_ENDPOINT === "string" && SHEET_ENDPOINT.indexOf("http") === 0;
}
