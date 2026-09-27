const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {loadGame, ROOT} = require('./load');
const g = loadGame();
const disk = {};
g.localStorage = {getItem:k=>disk[k]||null, setItem:(k,v)=>{disk[k]=v;}};
const run = file => vm.runInContext(fs.readFileSync(path.join(ROOT,file),'utf8'),g);
run('src/dex.js'); run('src/story.js');
const scenes = g.get('STORY');
assert.equal(scenes.length,18);
assert.equal(new Set(scenes.map(s=>s.id)).size,18);
scenes.forEach(s=>{assert.equal(s.pages.length,2);s.pages.forEach(p=>assert.ok(p.who && p.text.length>30));});
for (let stage=1;stage<=3;stage++) {
  const regular=g.regularMonsters(stage), final=g.finalBossMonster(stage);
  for (const n of [0,1,2,3,4,5,6,7]) {
    const caught=regular.slice(0,Math.min(n,6)).map(m=>m.id);
    if(n===7)caught.push(final.id);
    const s={caught,storySeen:[]};
    const expected=n===7?'clear':n===6?'ready':n>=3?'middle':n>=1?'first':'arrive';
    const pending=g.storyPending(s,stage,false);
    assert.equal(pending.id,`s${stage}_${expected}`);
    s.storySeen.push(pending.id);
    assert.equal(g.storyPending(s,stage,false),null,'no backlog on old save');
    assert.equal(!!g.storyPending(s,stage,true),n>=6);
    assert.ok(g.storyAvailable(s,stage).every(x=>x.stage===stage && x.count<=n));
  }
}
g.applySave({name:'story-test',stage:1});
assert.equal(g.get('save.storySeen.length'),0,'legacy save gets story default');
// Minimal DOM and clock verify the actual dialog lifecycle, without real browser storage.
let timer, callbacks=0;
const nodes={};
function node(){return {classList:{add(){},remove(){},toggle(){},contains(){return opened;}},dataset:{},innerHTML:'',textContent:'',disabled:false,hidden:false,isConnected:true,focus(){},appendChild(){}};}
let opened=true;
g.document={activeElement:node(),getElementById:id=>nodes[id]||(nodes[id]=node()),querySelector:()=>node(),querySelectorAll:()=>[],createElement:()=>node()};
g.setTimeout=fn=>{timer=fn;return 1;};g.clearTimeout=()=>{timer=null;};g.sfx=()=>{};
g.spriteToDataURL=()=>'';
g.escapeHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
run('src/tutorial.js');
g.playStory([scenes[0]],()=>callbacks++);
assert.equal(g.get('save.storySeen.length'),0,'opening is not completing');
g.tutorialNext();assert.equal(g.get('tutorial.index'),0,'reading delay blocks accidental advance');
timer();g.tutorialNext();assert.equal(g.get('tutorial.index'),1);
g.tutorialPrev();assert.equal(g.get('tutorial.index'),0);
g.tutorialNext();g.tutorialNext();
assert.equal(callbacks,1);
assert.equal(g.get('save.storySeen[0]'),'s1_arrive');
g.applySave(JSON.parse(disk.aimon_roster_v1)['story-test']);
assert.equal(g.get('save.storySeen[0]'),'s1_arrive','completed scene survives reload');
g.applySave({name:'other',stage:1});assert.equal(g.get('save.storySeen.length'),0,'student isolation');
console.log('이야기 검사 통과: 18장면·36쪽, 단계별 해금, 구형 진도, 중복 방지, 읽기 대기, 이전 쪽, 완료 후 저장, 학생 분리');
