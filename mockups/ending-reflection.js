(function () {
/* 독립 목업. 실제 게임 저장본, 학생 기록, 시트 API를 사용하지 않는다. */
const $ = id => document.getElementById(id);
const session = createReflectionSession();
if (session && session.blocked) {
  const main = document.querySelector('main'); main.replaceChildren();
  const message = document.createElement('p'); message.textContent = session.error;
  const back = document.createElement('a'); back.href='../index.html'; back.textContent='게임 첫 화면으로';
  main.append(message,back); $('example').hidden=true; return;
}
const fields = ['choice', 'reason', 'condition', 'when', 'promise'];
const companions = [
  {name:'동의지기',topic:'허락을 기다리는 선택',scenario:'친구가 나온 사진을 AI로 재미있게 바꿨어요. 학급 단체방에 보내고 싶지만, 친구에게는 아직 묻지 않았어요.'},
  {name:'스스로지기',topic:'내 판단을 남기는 선택',scenario:'AI가 독서 감상문을 써줬어요. 그럴듯하지만 내가 읽은 책과 다른 부분이 있어요. 제출 시간은 얼마 남지 않았어요.'},
  {name:'기다림지기',topic:'함께 갈 방법을 찾는 선택',scenario:'AI 도구로 모둠 과제를 하고 있어요. 한 친구는 기기가 없어서 계속 구경만 해요. 다른 친구들은 빨리 끝내자고 해요.'}
];
let step = 0, selected = 0, complete = false, saveError = false;
function persistReflection(done) {
  if (!session) return true;
  const values = {}; fields.forEach(id => values[id] = $(id).value.trim());
  const result = session.store(values, selected, done);
  saveError = !result.ok;
  if (!result.ok) { $('message').textContent = result.error; return false; }
  return true;
}
function sprite(monster) { return spriteToDataURL(monster.purified.sprite,paletteFor(monster.type),4); }
function findPartner(name) { return MONSTERS.find(m=>m.purified.name===name); }
function renderPartners() {
  $('companions').replaceChildren();
  companions.forEach((c,i)=>{
    const m=findPartner(c.name),button=document.createElement('button');
    button.className='companion';button.type='button';button.setAttribute('aria-pressed',String(i===selected));
    const img=document.createElement('img');img.src=sprite(m);img.alt='';
    const title=document.createElement('span');title.textContent=c.name;
    const label=document.createElement('small');label.textContent=['허락','내 판단','함께하기'][i];
    button.append(img,title,label);button.onclick=()=>{selected=i;invalidate();renderPartners();if (!saveError) $('message').textContent='장면을 바꿨어요. 적은 글이 새 장면과 맞는지 확인해 주세요.';};
    $('companions').append(button);
  });
  const c=companions[selected];$('scenario').textContent=c.scenario;
  $('partnerName').textContent=c.name;$('partnerImage').src=sprite(findPartner(c.name));$('partnerImage').alt=c.name;
}
function updatePreview() {
  fields.forEach(id=>{const text=$(id).value.trim(),out=$(id+'Text');out.textContent=text||out.dataset.empty;out.classList.toggle('placeholder',!text);});
  $('ownerText').textContent=$('nickname').value.trim()||'탐험가';
}
function invalidate() {
  complete=false;$('certificate').classList.remove('sealed');$('state').textContent='작성 중';$('print').disabled=true;
  $('writtenBadge').classList.remove('earned');$('badgeStatus').textContent='기록장을 완성하면 받아요';
  $('message').textContent='';updatePreview();persistReflection(false);
}
function showStep(n) {
  step=n;document.querySelectorAll('[data-page]').forEach(e=>e.hidden=Number(e.dataset.page)!==step);
  document.querySelectorAll('[data-step]').forEach(e=>{e.classList.toggle('active',Number(e.dataset.step)===step);e.setAttribute('aria-current',Number(e.dataset.step)===step?'step':'false');});
  $('stepLabel').textContent=(step+1)+' / 3';$('back').disabled=step===0;
  $('next').textContent=['이유 생각하기 →','약속 정하기 →','내 기록장 완성하기'][step];$('message').textContent='';
}
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>showStep(Number(b.dataset.step)));
$('back').onclick=()=>showStep(step-1);
$('next').onclick=()=>{
  const required=[['choice'],['reason','condition'],fields][step];
  const missing=required.find(id=>!$(id).value.trim());
  if(missing){showStep(missing==='choice'?0:['reason','condition'].includes(missing)?1:2);$('message').textContent='빈 칸에 내 생각을 적어 주세요. 짧게 써도 괜찮아요.';$(missing).focus();return;}
  if(step<2){showStep(step+1);return;}
  if (!persistReflection(true)) return;
  complete=true;$('certificate').classList.add('sealed');$('state').textContent='기록장 완성';$('print').disabled=false;
  $('writtenBadge').classList.add('earned');$('badgeStatus').textContent='획득 완료 · 약속 작성';
  $('message').textContent='‘약속의 문장’을 받았어요. 기록장을 인쇄해 보관할 수 있어요.';
  $('certificate').scrollIntoView({behavior:'smooth',block:'start'});
};
fields.forEach(id=>$(id+'Text').dataset.empty=$(id+'Text').textContent);
[...fields,'nickname'].forEach(id=>$(id).addEventListener('input',invalidate));
$('example').onclick=()=>{
  if(fields.some(id=>$(id).value.trim())&&!confirm('작성한 글을 예시로 바꿀까요? 현재 글은 지워집니다.'))return;
  selected=0;
  const example={choice:'사진을 보내기 전에 친구에게 보여주고, 보내도 괜찮다는 답을 기다리겠어요.',reason:'나는 웃기다고 생각해도 친구는 놀림받는 기분이 들 수 있어요. 단체방에 퍼지면 다시 거두기도 어려워요.',condition:'친구가 괜찮다고 해도 다른 사람이 함께 나왔다면, 그 사람에게도 물어보겠어요.',when:'다음에 학급 단체방에 친구 사진을 보낼 때',promise:'사진에 나온 친구에게 먼저 묻고, 괜찮다는 답을 받은 뒤 보내겠어요.'};
  fields.forEach(id=>$(id).value=example[id]);$('nickname').value='생각하는 새싹';invalidate();renderPartners();showStep(2);
};
$('print').onclick=()=>{if(complete)window.print();};
['동의지기','스스로지기','그래도지기','기다림지기','울타리지기'].forEach(name=>{const img=document.createElement('img');img.src=sprite(findPartner(name));img.alt=name;$('parade').append(img);});
if (session) {
  $('example').hidden=true;
  document.querySelector('.prototype').textContent='내 저장 기록';
  document.querySelector('.teacher-note').hidden=true;
  document.querySelector('.locked small').textContent='후속 회고 기능 준비 중';
  document.querySelector('.footnote').textContent='약속 작성 배지는 첫 화면에도 남아요. 후속 실천 회고는 아직 준비 중이에요.';
  const saved=session.student.reflection || {};
  selected=Number.isInteger(saved.selected) && saved.selected>=0 && saved.selected<companions.length ? saved.selected : 0;
  fields.forEach(id => $(id).value=typeof (saved.fields || {})[id] === 'string' ? saved.fields[id].slice(0,$(id).maxLength) : '');
  $('nickname').value=session.student.nick || session.student.name; $('nickname').readOnly=true;
  document.querySelector('[data-page="2"] .coach').textContent='입력한 글은 이 브라우저에 저장해요. 첫 화면의 내 배지에서 다시 열 수 있어요.';
  document.querySelector('.certificate footer span:last-child').textContent='내 저장 기록';
  if (completedReflection(session.student)) {
    complete=true;showStep(2);$('state').textContent='저장 완료';$('print').disabled=false;
    $('certificate').classList.add('sealed');$('writtenBadge').classList.add('earned');$('badgeStatus').textContent='획득 완료 · 약속 작성';
  }
}
renderPartners();updatePreview();

})();
