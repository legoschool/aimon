(function (root) {
  'use strict';
  const metrics = {
    seconds: { name: '단골 모험가', hint: '직접 움직이고 도전한 시간', unit: '초', mark: 'TIME' },
    deaths: { name: '바닥 탐험대', hint: '쓰러진 횟수도 우리 모험의 기록', unit: '회', mark: 'DOWN' },
    retries: { name: '오뚝이', hint: '쓰러졌다가 다시 일어난 횟수', unit: '회', mark: 'UP' },
    clears: { name: '도전 수집가', hint: '끝까지 마친 판과 해결한 의뢰', unit: '회', mark: 'CLEAR' },
    wins: { name: '승리의 주인공', hint: '끝까지 겨뤄 이긴 경기', unit: '승', mark: 'WIN' },
    best: { name: '나의 최고 한 판', hint: '이 게임에서 남긴 가장 높은 점수', unit: '점', mark: 'BEST' },
    improvements: { name: '어제의 나를 넘었다', hint: '내 최고 점수를 다시 높인 횟수', unit: '회', mark: 'NEW' },
    healing: { name: '우리 팀 구급대', hint: '동료에게 돌려준 체력', unit: 'HP', mark: 'HELP' }
  };
  const zero = () => Object.fromEntries(Object.keys(metrics).map(k => [k, 0]));
  const num = x => Number.isFinite(Number(x)) ? Math.max(0, Math.min(1e8, Math.floor(Number(x)))) : 0;
  class Tracker {
    constructor() { this.stats = zero(); this.prev = null; this.best = 0; }
    observe(s) {
      if (!s || !s.player) { this.prev = null; return; }
      const p = this.prev;
      this.prev = s;
      if (!p || p.player !== s.player || p.game !== s.game) return;
      const same = p.run === s.run;
      const engaged = s.active || p.active;
      if (!engaged && !s.ended) return;
      for (const k of ['deaths', 'clears', 'wins', 'healing']) {
        if (s.totals && p.totals && k in s.totals && k in p.totals) {
          // A reset/new round establishes a baseline; loading a save is never a new achievement.
          const diff = num(s.totals[k]) - num(p.totals[k]);
          if (same && diff > 0) this.stats[k] += diff;
        }
      }
      if (same && s.dead === true && p.dead === false && !('deaths' in (s.totals || {}))) this.stats.deaths++;
      if (same && p.dead === true && s.dead === false && s.active && !s.ended) this.stats.retries++;
      const finished = same && s.ended && !p.ended;
      if (finished) {
        if (!('clears' in (s.totals || {}))) this.stats.clears++;
        if (s.won && !('wins' in (s.totals || {}))) this.stats.wins++;
      }
      const clearDelta = same && num(s.totals?.clears) > num(p.totals?.clears);
      if (finished || clearDelta) {
        const score = num(s.score);
        if (score > this.best) {
          if (this.best > 0) this.stats.improvements++;
          this.best = score;
          this.stats.best = Math.max(this.stats.best, score);
        }
      }
    }
    tick(ms, eligible) { if (eligible) this.stats.seconds += Math.max(0, Math.min(2000, ms)) / 1000; }
    snapshot() { return Object.fromEntries(Object.entries(this.stats).map(([k, v]) => [k, num(v)])); }
  }
  function eligible(s, env) {
    return !!s?.player && !!s.active && !s.ended && !env.hidden && env.focused && !env.panelOpen && env.now - env.lastInput < 60000;
  }
  const api = { metrics, zero, num, Tracker, eligible };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FunRankCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
