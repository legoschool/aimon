/* ===========================================================
   AI몬스터 — 소리

   음원 파일을 쓰지 않는다. Web Audio 로 그 자리에서 만들어 낸다.
     · 오프라인 교실에서 그대로 돌아간다 (받을 파일이 없음)
     · 남의 음악을 가져오지 않으니 저작권 원칙도 그대로 지킨다

   브라우저는 사용자가 한 번 누르기 전에는 소리를 못 내게 막는다.
   그래서 첫 클릭·첫 키 입력 때 깨운다.

   배경음은 기본이 꺼짐이다.
   교실에서 컴퓨터 서른 대가 동시에 노래를 틀면 수업이 안 된다.
   =========================================================== */

const audio = {
  ctx: null,
  master: null,
  sfxOn: true,
  bgmOn: false,
  bgmTimer: null,
  bgmStep: 0,
  ready: false,
};

const AUDIO_KEY = "aimon_audio_v1";

function initAudio() {
  if (audio.ctx) {
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return; // 소리를 못 내는 환경이어도 게임은 그대로 돌아간다
  try {
    audio.ctx = new AC();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.35;
    audio.master.connect(audio.ctx.destination);
    audio.ready = true;
  } catch (e) {
    audio.ready = false;
  }
}

function loadAudioPrefs() {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (typeof p.sfx === "boolean") audio.sfxOn = p.sfx;
    if (typeof p.bgm === "boolean") audio.bgmOn = p.bgm;
  } catch (e) {
    /* 저장이 막힌 환경이어도 기본값으로 돌아간다 */
  }
}

function saveAudioPrefs() {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify({ sfx: audio.sfxOn, bgm: audio.bgmOn }));
  } catch (e) {
    /* 무시 */
  }
}

/* -----------------------------------------------------------
   음 하나 — 옛날 게임기처럼 네모파·삼각파를 쓴다
   ----------------------------------------------------------- */
function tone(freq, dur, type, vol, delay, sweepTo) {
  if (!audio.ready || !audio.sfxOn) return;
  const ctx = audio.ctx;
  const t0 = ctx.currentTime + (delay || 0);

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || "square";
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(sweepTo, 1), t0 + dur);

  const v = vol === undefined ? 0.25 : vol;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(g);
  g.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/* 지지직 — 오답이나 부딪힘에 쓴다 */
function noise(dur, vol, delay, filterHz) {
  if (!audio.ready || !audio.sfxOn) return;
  const ctx = audio.ctx;
  const t0 = ctx.currentTime + (delay || 0);
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filterHz || 1200;
  const g = ctx.createGain();
  g.gain.value = vol === undefined ? 0.2 : vol;

  src.connect(f);
  f.connect(g);
  g.connect(audio.master);
  src.start(t0);
}

/* -----------------------------------------------------------
   효과음 목록
   ----------------------------------------------------------- */
const SFX = {
  button: function () { tone(660, 0.06, "square", 0.14); },
  step: function () { tone(180, 0.04, "triangle", 0.08); },

  encounter: function () {           // 몬스터 등장 — 놀라는 느낌
    tone(880, 0.1, "square", 0.2, 0);
    tone(660, 0.1, "square", 0.2, 0.11);
    tone(880, 0.1, "square", 0.2, 0.22);
    tone(494, 0.28, "square", 0.22, 0.33);
  },

  correct: function () {             // 정답 — 올라가는 세 음
    tone(523, 0.09, "triangle", 0.26, 0);
    tone(659, 0.09, "triangle", 0.26, 0.09);
    tone(784, 0.18, "triangle", 0.28, 0.18);
  },

  wrong: function () {               // 오답 — 내려가는 두 음
    tone(311, 0.14, "square", 0.2, 0);
    tone(233, 0.26, "square", 0.2, 0.13);
    noise(0.18, 0.1, 0, 700);
  },

  hit: function () { noise(0.12, 0.18, 0, 2200); tone(150, 0.1, "square", 0.14, 0); },

  throwBall: function () { tone(300, 0.3, "sine", 0.2, 0, 900); },
  shake: function () { tone(420, 0.05, "square", 0.16); noise(0.05, 0.08, 0, 1800); },
  escape: function () { tone(500, 0.18, "square", 0.2, 0, 200); noise(0.2, 0.12, 0, 900); },

  caught: function () {              // 잡았다 — 짧은 팡파르
    [523, 659, 784, 1047].forEach(function (f, i) {
      tone(f, i === 3 ? 0.34 : 0.11, "square", 0.26, i * 0.11);
    });
  },

  purify: function () {              // 정화 — 반짝이며 올라간다
    [392, 523, 659, 784, 988, 1319].forEach(function (f, i) {
      tone(f, 0.22, "triangle", 0.2, i * 0.075);
    });
  },

  lose: function () {                // 신뢰도 바닥
    [392, 349, 294, 233].forEach(function (f, i) {
      tone(f, i === 3 ? 0.4 : 0.15, "square", 0.2, i * 0.15);
    });
  },

  dexOpen: function () { tone(784, 0.07, "triangle", 0.16, 0); tone(1047, 0.12, "triangle", 0.16, 0.07); },
};

function sfx(name) {
  const f = SFX[name];
  if (f) {
    try { f(); } catch (e) { /* 소리 하나 못 냈다고 게임이 멈추면 안 된다 */ }
  }
}

/* -----------------------------------------------------------
   배경음 — 5음 음계로 짠 짧은 반복 가락

   도·레·미·솔·라 만 쓰면 어느 음을 겹쳐도 안 어긋나서
   단순한 반복인데도 귀에 거슬리지 않는다.
   ----------------------------------------------------------- */
const BGM_MELODY = [
  0, 4, 7, 4, 9, 7, 4, 2,
  0, 4, 7, 11, 9, 7, 4, 0,
  5, 9, 12, 9, 7, 4, 2, 0,
  2, 7, 11, 7, 9, 4, 2, 0,
];
const BGM_BASS = [0, null, 7, null, 5, null, 7, null];
const BGM_ROOT = 220; // A3

function noteHz(semi) {
  return BGM_ROOT * Math.pow(2, semi / 12);
}

function bgmTick() {
  if (!audio.ready || !audio.bgmOn) return;
  const i = audio.bgmStep;

  // 가락
  const m = BGM_MELODY[i % BGM_MELODY.length];
  if (m !== null) {
    const g = audio.ctx.createGain();
    const osc = audio.ctx.createOscillator();
    const t0 = audio.ctx.currentTime;
    osc.type = "triangle";
    osc.frequency.value = noteHz(m + 12);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);
    osc.connect(g); g.connect(audio.master);
    osc.start(t0); osc.stop(t0 + 0.3);
  }

  // 베이스
  const b = BGM_BASS[i % BGM_BASS.length];
  if (b !== null) {
    const g = audio.ctx.createGain();
    const osc = audio.ctx.createOscillator();
    const t0 = audio.ctx.currentTime;
    osc.type = "square";
    osc.frequency.value = noteHz(b - 12);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
    osc.connect(g); g.connect(audio.master);
    osc.start(t0); osc.stop(t0 + 0.4);
  }

  audio.bgmStep++;
}

function startBgm() {
  if (!audio.ready || !audio.bgmOn || audio.bgmTimer) return;
  audio.bgmStep = 0;
  audio.bgmTimer = setInterval(bgmTick, 280);
}

function stopBgm() {
  if (audio.bgmTimer) {
    clearInterval(audio.bgmTimer);
    audio.bgmTimer = null;
  }
}

function setSfx(on) {
  audio.sfxOn = on;
  saveAudioPrefs();
  if (on) sfx("button");
}

function setBgm(on) {
  audio.bgmOn = on;
  saveAudioPrefs();
  if (on) { initAudio(); startBgm(); } else stopBgm();
}

/* 탭을 가리면 배경음을 멈춘다 (교실에서 창을 바꿔도 계속 울리면 곤란) */
document.addEventListener("visibilitychange", function () {
  if (document.hidden) stopBgm();
  else if (audio.bgmOn) startBgm();
});
