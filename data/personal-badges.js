/* 개인 배지 기준. 획득 여부는 학생별 누적 기록에서만 계산한다.
   횟수는 서로 다른 문항 수가 아니라 답한 횟수다. 정답률에는 최소 풀이 수를 둔다. */
function personalTally(s, topic) {
  const t = (s.stats || {})[topic] || {};
  const asked = Math.max(0, Number(t.asked) || 0);
  return { asked: asked, right: Math.min(asked, Math.max(0, Number(t.right) || 0)) };
}
function personalTotal(s) {
  return topicIds().reduce(function (a, k) {
    const t = personalTally(s, k); a.asked += t.asked; a.right += t.right; return a;
  }, { asked: 0, right: 0 });
}
function completedReflection(s) {
  const r = s.reflection;
  return !!(r && r.completedAt && ['choice','reason','condition','when','promise'].every(function (k) {
    return typeof (r.fields || {})[k] === 'string' && r.fields[k].trim();
  }));
}
const PERSONAL_BADGES = [];
topicIds().forEach(function (k) {
  const t = TYPES[k];
  [
    { suffix: 'strength', name: '판단', min: 10, rate: .8, kind: 'strength' },
    { suffix: 'expert', name: '깊은 판단', min: 20, rate: .9, kind: 'strength' },
    { suffix: 'practice', name: '꾸준한 탐구', min: 20, rate: 0, kind: 'effort' }
  ].forEach(function (rule) {
    PERSONAL_BADGES.push({
      id: 'personal_' + k + '_' + rule.suffix,
      name: t.name + ' ' + rule.name,
      topic: k, kind: rule.kind, color: t.accent, sprite: BADGE_SHIELD,
      art: rule.kind === 'strength' ? 'mockups/badge-pledge.svg' : 'mockups/badge-trail.svg',
      desc: t.name + ' 영역 ' + rule.min + '회 이상 풀이' + (rule.rate ? ', 정답률 ' + Math.round(rule.rate * 100) + '% 이상' : ', 정답률과 관계없이 획득'),
      goal: function (s) { const n = personalTally(s, k); return n.asked >= rule.min && (!rule.rate || n.right / n.asked >= rule.rate); }
    });
  });
});
[
  { id:'personal_steps30', name:'차곡차곡 30회', min:30, key:'asked' },
  { id:'personal_steps100', name:'끝까지 100회', min:100, key:'asked' },
  { id:'personal_review5', name:'다시 풀어 5번 성공', min:5, key:'reviewCleared' },
  { id:'personal_review15', name:'다시 풀어 15번 성공', min:15, key:'reviewCleared' }
].forEach(function (r) {
  PERSONAL_BADGES.push({ id:r.id, name:r.name, kind:'effort', color:'#809b51', sprite:BADGE_SPROUT,
    art:'mockups/badge-trail.svg', desc:r.key === 'asked' ? '전체 영역 누적 ' + r.min + '회 풀이' : '틀렸던 문제를 복습에서 다시 맞힌 횟수 ' + r.min + '회',
    goal:function (s) { return (r.key === 'asked' ? personalTotal(s).asked : Number(s.reviewCleared) || 0) >= r.min; }
  });
});
PERSONAL_BADGES.push({ id:'personal_pledge', name:'약속의 문장', kind:'pledge', color:'#c9a14b', sprite:BADGE_BOOK,
  art:'mockups/badge-pledge.svg', desc:'마지막 보스를 정화하고 행동·이유·조건·실천 약속을 작성했어요.',
  goal:function(s) { return (s.caught || []).indexOf('eochapi') !== -1 && completedReflection(s); }
});
BADGES.push.apply(BADGES, PERSONAL_BADGES);

/* 저장 직전 호출. 기존 배지는 유지하며, 처음 얻은 근거를 별도로 남긴다. */
function awardPersonalBadges(s) {
  if (!Array.isArray(s.badges)) s.badges = [];
  if (!s.badgeEvidence || typeof s.badgeEvidence !== 'object') s.badgeEvidence = {};
  const added = [];
  PERSONAL_BADGES.forEach(function (b) {
    if (s.badges.indexOf(b.id) !== -1 || !b.goal(s)) return;
    s.badges.push(b.id); added.push(b.id);
    const t = b.topic ? personalTally(s, b.topic) : personalTotal(s);
    s.badgeEvidence[b.id] = { at: Date.now(), asked:t.asked, right:t.right, reviewCleared:Number(s.reviewCleared) || 0 };
  });
  return added;
}
