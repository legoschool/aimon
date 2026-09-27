/* 회고 페이지에서만 사용. 매번 최신 명부를 읽고 해당 학생의 회고만 갱신한다. */
function createReflectionSession() {
  const params = new URLSearchParams(location.search);
  if (params.get('mode') !== 'game') return null;
  const key = params.get('student');
  const rosterKey = 'aimon_roster_v1';
  function read() {
    const roster = JSON.parse(localStorage.getItem(rosterKey) || '{}');
    const student = key && Object.prototype.hasOwnProperty.call(roster, key) ? roster[key] : null;
    if (!student || (student.caught || []).indexOf('eochapi') === -1) {
      throw new Error('이 브라우저에서 마지막 보스를 정화한 학생 기록을 찾지 못했어요. 게임 첫 화면에서 다시 열어 주세요.');
    }
    return { roster:roster, student:student };
  }
  try {
    const original = read().student;
    let revision = Number((original.reflection || {}).updatedAt) || 0;
    return {
      student: original,
      store: function (fields, selected, completed) {
        try {
          const latest = read(), student = latest.student;
          if ((Number((student.reflection || {}).updatedAt) || 0) !== revision) {
            throw new Error('다른 창에서 약속을 수정했어요. 지금 쓴 글을 복사한 뒤 새로고침해 주세요.');
          }
          const now = Math.max(Date.now(), revision + 1);
          student.reflection = { version:1, fields:fields, selected:selected, updatedAt:now, completedAt:completed ? now : 0 };
          awardPersonalBadges(student);
          localStorage.setItem(rosterKey, JSON.stringify(latest.roster));
          revision = now;
          return { ok:true };
        } catch (e) { return { ok:false, error:e.message || '저장하지 못했어요. 이 창을 닫지 말고 글을 복사해 주세요.' }; }
      }
    };
  } catch (e) { return { blocked:true, error:e.message }; }
}
