/* 진행 판정은 순수 함수로 분리해 구형 저장본과 다시 읽기를 함께 검사한다. */
function storyAvailable(s, stage) {
  const n = monstersOfStage(stage).filter(m => (s.caught || []).includes(m.id)).length;
  return STORY.filter(x => x.stage === stage && x.count <= n);
}
function storyPending(s, stage, gate) {
  const list = storyAvailable(s, stage).filter(x => !!x.gate === !!gate);
  const latest = list[list.length - 1];
  return latest && !(s.storySeen || []).includes(latest.id) ? latest : null;
}
function storyPages(scenes) {
  return scenes.flatMap(scene => scene.pages.map(p => ({
    story: true, title: scene.title, who: p.who, text: escapeHtml(p.text).replace(/\n/g, '<br><br>'),
    stage: scene.stage, portrait: p.portrait, done: '읽었어요. 계속하기'
  })));
}
function playStory(scenes, onDone, replay) {
  if (!scenes.length) { if (onDone) onDone(); return; }
  tutorialOpen(storyPages(scenes), function () {
    if (!replay) {
      if (!Array.isArray(save.storySeen)) save.storySeen = [];
      scenes.forEach(x => { if (!save.storySeen.includes(x.id)) save.storySeen.push(x.id); });
      writeSave();
    }
    if (onDone) onDone();
  });
}
function storyCheckpoint(onDone, gate) {
  const scene = storyPending(save, currentStage(), gate);
  playStory(scene ? [scene] : [], onDone);
}
function storyReplay() {
  if (tutorialIsOpen()) return;
  playStory(storyAvailable(save, currentStage()), null, true);
}
function storyPortrait(step) {
  const m = step.portrait === 'final' ? finalBossMonster(step.stage) :
    MONSTERS.find(x => stageOf(x) === step.stage && (save.caught || []).includes(x.id) && !x.finalBoss);
  if (!step.portrait || !m) return '';
  const pure = step.portrait !== 'final';
  return '<img class="story-portrait" alt="' + escapeHtml(pure ? m.purified.name : m.name) + '" src="' +
    spriteToDataURL(pure ? m.purified.sprite : m.sprite, paletteFor(m.type), 5) + '">';
}
