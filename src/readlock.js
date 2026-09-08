/* ===========================================================
   AI몬스터 — 읽는 동안 잠그기 (전투·복습이 함께 쓴다)

   문제가 뜨자마자 아무 보기나 누르는 걸 막는다.
   막대가 다 차면 열린다. 남은 시간을 초 단위로 보여 줘서
   "고장 났나?" 하는 오해가 없게 한다.

   한 번에 하나만 돌아가므로 상태를 이 파일에 모아 둔다.
   =========================================================== */

let activeLockTimer = null;
let lastUnlockAt = 0; // 마지막으로 잠금이 풀린 시각 (문제 화면에서만 기록)

function clearLock() {
  if (activeLockTimer) {
    clearInterval(activeLockTimer);
    activeLockTimer = null;
  }
}

/* 잠금이 풀린 뒤 얼마나 지났는가 (한 번도 안 풀렸으면 아주 큰 값) */
function msSinceUnlock() {
  return lastUnlockAt ? Date.now() - lastUnlockAt : 99999;
}

function resetUnlock() {
  lastUnlockAt = 0;
}

/* container    : 막대를 붙일 자리
   targets      : 잠가 둘 버튼 목록
   ms           : 잠글 시간
   text         : 잠긴 동안 보여 줄 말
   trackInstant : 열린 뒤 얼마 만에 눌렀는지 잴지 (문제 화면에서만 true)

   해설 잠금까지 시각을 기록하면 그 값이 다음 문제까지 남아,
   실제로는 읽고 눌렀는데도 "튕겨 눌렀다"고 잘못 볼 수 있다.
   그래서 재는 화면을 문제로 한정하고, 잠글 때마다 값을 비운다. */
function lockUntilRead(container, targets, ms, text, trackInstant) {
  clearLock();
  lastUnlockAt = 0;

  const bar = document.createElement("div");
  bar.className = "read-lock";
  bar.innerHTML = '<i></i><span class="rl-text"></span>';
  container.appendChild(bar);

  const fill = bar.querySelector("i");
  const label = bar.querySelector(".rl-text");

  targets.forEach(function (b) {
    b.disabled = true;
    b.classList.add("waiting");
  });

  const start = Date.now();
  function tick() {
    const passed = Date.now() - start;
    const left = Math.max(0, ms - passed);
    fill.style.width = Math.min(100, (passed / ms) * 100) + "%";
    label.textContent = text + "  " + (Math.ceil(left / 100) / 10).toFixed(1) + "초";

    if (left <= 0) {
      clearLock();
      bar.classList.add("done");
      label.textContent = "이제 고를 수 있어요";
      if (trackInstant) lastUnlockAt = Date.now();
      targets.forEach(function (b) {
        b.disabled = false;
        b.classList.remove("waiting");
      });
      const first = targets[0];
      if (first) first.focus();
    }
  }

  tick();
  activeLockTimer = setInterval(tick, 100);
}
