(() => {
  'use strict';
  if (window.FunRank) return;
  const tag = document.currentScript, base = new URL('.', tag.src);
  const defaultGame = tag.dataset.game, defaultName = tag.dataset.name || '게임';
  const API = 'https://oawbzsdjkzucxlcyhgdr.supabase.co/rest/v1/rpc/';
  const KEY = 'sb_publishable_ZgTRFJinUZSekn_Uzn1REg_s7wFF_xg';
  const providers = [], sessions = new Map(), RAM = new Map();
  let C, host, shadow, dialog, current, returnFocus, lastTick = performance.now(), lastInput = -Infinity;
  let selected = 'seconds', period = 'week', selectedGame = defaultGame, loading = false, renderSerial = 0;
  let status = '기록은 플레이를 시작하면 쌓여요.', catalog = [], boardCache = new Map(), providerError = '';
  const storage = {
    get(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return RAM.get(k) ?? fallback; } },
    set(k, v) { RAM.set(k, v); try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
  };
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  const secret = () => [...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function profile(player) {
    // Local account identifiers never leave this browser.
    const all = storage.get('fun-rank:profiles:v1', {});
    const key = defaultGame + ':' + player + ':' + (player === 'device' ? storage.get('fun-rank:guest-slot', 0) : 0);
    if (!all[key]) { all[key] = {secret: secret(), alias: ''}; storage.set('fun-rank:profiles:v1', all); }
    return {...all[key], localKey: key};
  }
  function saveAlias(p, alias) {
    const all = storage.get('fun-rank:profiles:v1', {});
    if (all[p.localKey]) { all[p.localKey].alias = alias; storage.set('fun-rank:profiles:v1', all); }
    p.alias = alias;
  }
  async function rpc(name, body) {
    const ctl = new AbortController(), timer = setTimeout(()=>ctl.abort(), 8000);
    try {
      const res = await fetch(API + name, {method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctl.signal,keepalive:true});
      if (!res.ok) throw Error('HTTP '+res.status);
      return await res.json();
    } finally { clearTimeout(timer); }
  }
  function sample() {
    let latest = null;
    for (const fn of providers) {
      try { const v = fn(); if (v?.player && (!latest || (v.active?2:v.ended?1:0) > (latest.active?2:latest.ended?1:0))) latest = v; } catch (e) { providerError = String(e.message); }
    }
    return latest ? {...latest, game: latest.game || defaultGame} : null;
  }
  function sessionFor(s) {
    const day = new Date(Date.now()+9*3600000).toISOString().slice(0,10);
    const p = profile(s.player), key = p.localKey+':'+s.game+':'+day;
    if (!sessions.has(key)) {
      const tracker = new C.Tracker();
      const session = {id:uuid(),game:s.game,profile:p,tracker,registered:false,lastSent:'',busy:false,day};
      tracker.best = localStats(session).best || 0;
      sessions.set(key,session);
    }
    return sessions.get(key);
  }
  function localStats(s) {
    if (!s) return C.zero();
    const records=new Map(), out=C.zero();
    try { for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith('fun-rank:record:')){const r=storage.get(key,null);if(r&&r.localKey===s.profile.localKey&&r.game===s.game)records.set(key.slice(16),r.stats);}} } catch {}
    for(const v of sessions.values())if(v.profile.localKey===s.profile.localKey&&v.game===s.game)records.set(v.id,v.tracker.snapshot());
    records.set(s.id,s.tracker.snapshot());
    for(const stats of records.values())for(const k of Object.keys(C.metrics))out[k]=k==='best'?Math.max(out[k],stats[k]||0):out[k]+(stats[k]||0);
    return out;
  }
  function persist(s) {
    storage.set('fun-rank:record:'+s.id,{localKey:s.profile.localKey,game:s.game,stats:s.tracker.snapshot()});
    storage.set('fun-rank:pending:'+s.id,{id:s.id,game:s.game,profile:s.profile,stats:s.tracker.snapshot(),day:s.day,registered:s.registered});
  }
  async function flush(s) {
    if (!s || s.busy || location.protocol === 'file:' || window.FUN_RANK_OFFLINE) return;
    const data = s.tracker.snapshot(), serialized = JSON.stringify(data);
    if (serialized === s.lastSent && s.registered) return;
    s.busy = true;
    try {
      if (!s.registered) {
        if(data.seconds>65){
          status='연결 전의 기록은 이 기기에 남아 있어요.';persist(s);
          for(const [key,value] of sessions)if(value===s)sessions.delete(key);
          if(current===s)current=null;
          return;
        }
        const r = await rpc('fun_rank_submit',{p_secret:s.profile.secret,p_session:s.id,p_game:s.game,p_stats:C.zero()});
        saveAlias(s.profile,r.alias); s.registered=true;
      }
      await rpc('fun_rank_submit',{p_secret:s.profile.secret,p_session:s.id,p_game:s.game,p_stats:data});
      s.lastSent=serialized; status='랭킹에 저장했어요.'; boardCache.clear();
      try { localStorage.removeItem('fun-rank:pending:'+s.id); } catch {}
    } catch { status='이 기기에 기록했어요. 연결되면 다시 저장해요.'; }
    finally { s.busy=false; if (dialog?.open) updateStatus(); }
  }
  function tick() {
    if(!C)return;
    const now=performance.now(), elapsed=now-lastTick; lastTick=now;
    const s=sample();
    if (!s) { if(current){persist(current);void flush(current);current.tracker.prev=null;}current=null;return; }
    const next=sessionFor(s);
    if (current && current!==next) { persist(current); void flush(current);current.tracker.prev=null;next.tracker.prev=null; }
    current=next; const before=JSON.stringify(current.tracker.snapshot());current.tracker.observe(s);
    if(before!==JSON.stringify(current.tracker.snapshot())){persist(current);if(s.ended)void flush(current);}
    current.tracker.tick(elapsed,C.eligible(s,{now,lastInput,hidden:document.hidden,focused:document.hasFocus(),panelOpen:!!dialog?.open}));
    if (s.active && !current.registered && now-(current.lastAttempt||0)>15000) { current.lastAttempt=now; void flush(current); }
  }
  function format(k,n) {
    if (k==='seconds') { const m=Math.floor(n/60); return m>=60 ? `${Math.floor(m/60)}시간 ${m%60}분` : m ? `${m}분 ${n%60}초` : `${n}초`; }
    return Number(n).toLocaleString('ko-KR')+C.metrics[k].unit;
  }
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10v6c0 4-2 6-5 6s-5-2-5-6V3zm0 2H3v3c0 3 2 4 5 4m9-7h4v3c0 3-2 4-5 4m-4 3v5m-4 1h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function updateStatus() { const e=shadow.querySelector('#sync'); if(e)e.textContent=status; }
  function render() {
    const mine=localStats(current), cfg=catalog.find(g=>g.id===selectedGame);
    const available=cfg?.metrics || ['seconds','clears','best','improvements'];
    if(!available.includes(selected))selected=available[0];
    const description=C.metrics[selected];
    dialog.innerHTML=`<div class="wrap"><header><div class="eyebrow">우리들의 별난 기록실</div><button id="close" aria-label="랭킹 닫기">닫기</button><h1>잘해도, 넘어져도<br><em>기록은 남으니까.</em></h1><p>누구에게나 빛나는 기록 한 칸.</p></header>
      <div class="toolbar"><label>게임<select id="game">${catalog.map(g=>`<option value="${esc(g.id)}" ${g.id===selectedGame?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label><div class="period" role="group" aria-label="랭킹 기간"><button data-period="week" aria-pressed="${period==='week'}">이번 주</button><button data-period="all" aria-pressed="${period==='all'}">전체</button></div></div>
      <nav aria-label="기록 종목">${available.map(k=>`<button class="category ${selected===k?'chosen':''}" data-metric="${k}" aria-pressed="${selected===k}"><span>${C.metrics[k].mark}</span>${C.metrics[k].name}</button>`).join('')}</nav>
      <section class="record"><div><span class="label">${description.mark}</span><h2>${description.name}</h2><p>${description.hint}</p></div><div class="personal"><small>이 기기의 내 누적 기록</small><strong>${selectedGame===current?.game?format(selected,mine[selected]):'기록 보기'}</strong></div></section>
      <div class="notice">${selected==='deaths'?'넘어진 기록도 웃으며 남겨요. 다음에는 다시 일어난 기록도!':selected==='seconds'?'다른 탭을 보거나 1분 동안 조작하지 않으면 시간 기록을 쉬어요.':'동점이면 같은 등수예요. 내 기록은 아래에서 따로 볼 수 있어요.'}</div>
      <section id="board" aria-live="polite"><p class="empty">친구들의 기록을 불러오고 있어요.</p></section>
      <footer><p id="sync">${esc(status)}</p><p>랭킹 이름: <b>${esc(current?.profile.alias||'플레이를 시작하면 생겨요')}</b></p><p>이름·학번 대신 자동으로 만든 별명을 써요. 새 기록부터 모아요.</p><p>랭킹은 게임·브라우저별로 쌓여요. 다른 기기의 기록과 자동으로 합쳐지지 않아요.</p><div class="actions"><button id="refresh">기록 새로고침</button>${sample()?.player==='device'?'<button id="newPlayer">다른 사람이 할게요</button>':''}</div></footer></div>`;
    shadow.querySelector('#close').onclick=()=>dialog.close();
    shadow.querySelector('#game').onchange=e=>{selectedGame=e.target.value;render();void loadBoard();};
    shadow.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=b.dataset.period;render();void loadBoard();});
    shadow.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>{selected=b.dataset.metric;render();void loadBoard();});
    shadow.querySelector('#refresh').onclick=async()=>{if(loading)return;await flush(current);boardCache.clear();void loadBoard();};
    const newPlayer=shadow.querySelector('#newPlayer');
    if(newPlayer)newPlayer.onclick=()=>{if(current){persist(current);void flush(current);}storage.set('fun-rank:guest-slot',storage.get('fun-rank:guest-slot',0)+1);current=null;tick();render();void loadBoard();};
  }
  async function loadBoard() {
    const serial=++renderSerial, game=selectedGame, metric=selected, key=game+':'+metric+':'+period+':'+(current?.profile.localKey||'');
    loading=true;
    try {
      let result=boardCache.get(key);
      if(!result || Date.now()-result.at>60000){result={at:Date.now(),data:await rpc('fun_rank_board',{p_game:game,p_metric:metric,p_period:period,p_secret:current?.profile.secret||null})};boardCache.set(key,result);}
      if(serial!==renderSerial||!dialog.open)return;
      const data=result.data, board=shadow.querySelector('#board');
      const rows=data.rows||[];
      board.innerHTML=rows.length?`<div class="boardhead"><span>${period==='week'?'월요일부터 모은 기록':'처음부터 모은 기록'}</span><span>${data.participants}명 참여</span></div><ol>${rows.map(r=>`<li class="${r.me?'me':''}"><span class="place">${r.place}</span><span class="alias">${esc(r.alias)}${r.me?'<b>나</b>':''}</span><strong>${format(metric,r.value)}</strong></li>`).join('')}</ol>`:'<div class="empty"><h3>아직 빈 자리예요.</h3><p>한 판 즐기고 첫 기록을 남겨요.</p></div>';
      if(data.mine)board.insertAdjacentHTML('beforeend',`<div class="myrank"><span>나의 자리 · ${esc(data.mine.alias)}</span><strong>${data.mine.place}위 · ${format(metric,data.mine.value)}</strong></div>`);
      else board.insertAdjacentHTML('beforeend','<p class="footnote">아직 이 종목에 남긴 내 기록이 없어요.</p>');
    } catch {
      if(serial===renderSerial&&dialog.open)shadow.querySelector('#board').innerHTML='<div class="empty"><h3>잠깐 쉬는 기록실</h3><p>연결을 확인하고 새로고침해 주세요.<br>내 기록은 이 기기에 계속 쌓여요.</p></div>';
    } finally { if(serial===renderSerial)loading=false; }
  }
  async function open() {
    if(!dialog||dialog.open)return;
    document.exitPointerLock?.();
    tick();selectedGame=current?.game||defaultGame;render();dialog.showModal();void loadBoard();
    shadow.querySelector('#close').focus();
  }
  // Keep a full-size entry inside each game's own start screen. The compact launcher remains available during play.
  const entryAnchors = {
    'aimon': ['#screen-title .title-box h1'],
    'science-world': ['.game-login .gl-title'],
    'haessal-season': ['#title .tbox h1'],
    'nanoho-body': ['#title .panel h1'],
    'bulkkot-escape': ['#title .tbox h1'],
    'banjjak-village': ['#title .tcard h1'],
    'pureum-island': ['#title .tcard .lobby-heading'],
    'bitnaru-village': ['#title .tcard h1'],
    'science-stack': ['#s-title h1'],
    'word-stack': ['#s-title h1'],
    'digital-village': ['#intro .intro-copy h2'],
    'three-kingdoms': ['#intro .intro-copy h2', '#playerForm', '.hub-heading h1', '.entry-layout h1'],
    'haedong-heroes': ['#login-title', '#lobby > .brand'],
    'pulse-arena': ['#menu > .home-top'],
    'newport-plan': ['#lobby > .lobby-header'],
    'moyeora-playground': ['#welcome .welcome-card h1', '#welcome .welcome-card h2'],
    'brain-playground': ['.room-greeting', '#game-tabs']
  };
  const entries = new WeakMap();
  function installEntries() {
    if(tag.dataset.auto==='1')return;
    for(const selector of entryAnchors[defaultGame]||[]){
      const anchor=document.querySelector(selector);if(!anchor)continue;
      const previous=entries.get(anchor), hidden=selector==='#game-tabs'&&document.body.classList.contains('room-open');
      if(previous?.isConnected){previous.hidden=hidden;continue;}
      const entry=document.createElement('div');entry.className='fun-rank-main-entry';entry.dataset.entry='';
      entry.hidden=hidden;if(selector==='.room-greeting')entry.dataset.compact='';
      const root=entry.attachShadow({mode:'open'});
      root.innerHTML=`<link rel="stylesheet" href="${new URL('ranking.css',base)}"><button type="button" class="main-entry" aria-label="별난 랭킹 보기">${icon}<span><strong>별난 랭킹 보기</strong><small>점수도, 도전도! 친구들의 기록은?</small></span><span class="entry-arrow" aria-hidden="true">→</span></button>`;
      const button=root.querySelector('button');button.onclick=e=>{e.preventDefault();e.stopPropagation();returnFocus=button;void open();};
      entry.addEventListener('keydown',e=>e.stopPropagation());entry.addEventListener('keyup',e=>e.stopPropagation());
      if(selector==='#playerForm')anchor.before(entry);else anchor.after(entry);
      entries.set(anchor,entry);
    }
  }
  window.FunRank={register:fn=>providers.push(fn),capture:tick,open,version:'1.0.0',inspect:()=>({providers:providers.length,providerError,active:!!sample()?.active,game:sample()?.game||defaultGame,stats:C?localStats(current):null})};
  window.dispatchEvent(new Event('fun-rank:ready'));
  async function init() {
    C=window.FunRankCore;
    if(!C){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('core.js',base);s.onload=resolve;s.onerror=reject;document.head.append(s);});C=window.FunRankCore;}
    try {catalog=await (await fetch(new URL('catalog.json',base))).json();} catch {catalog=[{id:defaultGame,name:defaultName,metrics:['seconds','clears','best','improvements']}];}
    if(!catalog.some(g=>g.id===defaultGame))catalog.unshift({id:defaultGame,name:defaultName,metrics:['seconds']});
    host=document.createElement('div');host.id='fun-rank-widget';shadow=host.attachShadow({mode:'open'});
    shadow.innerHTML=`<link rel="stylesheet" href="${new URL('ranking.css',base)}"><button class="launcher" aria-label="별난 랭킹 열기">${icon}<span>별난 랭킹</span></button><dialog aria-label="우리들의 별난 기록실"></dialog>`;
    document.body.append(host);dialog=shadow.querySelector('dialog');shadow.querySelector('.launcher').onclick=()=>{returnFocus=shadow.querySelector('.launcher');void open();};
    dialog.addEventListener('close',()=>{renderSerial++;(returnFocus?.isConnected?returnFocus:shadow.querySelector('.launcher')).focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    host.addEventListener('keydown',e=>{if(dialog.open)e.stopPropagation();});
    host.addEventListener('keyup',e=>{if(dialog.open)e.stopPropagation();});
    document.addEventListener('fullscreenchange',()=>{(document.fullscreenElement||document.body).append(host);});
    for(const event of ['pointerdown','keydown','wheel','touchstart','pointermove'])window.addEventListener(event,e=>{if(e.isTrusted&&!e.composedPath().includes(host))lastInput=performance.now();},{passive:true});
    setInterval(tick,1000);
    installEntries();setInterval(installEntries,1000);
    setInterval(()=>{for(const s of sessions.values()){persist(s);void flush(s);}},60000);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const s of sessions.values()){persist(s);void flush(s);}}lastTick=performance.now();});
    window.addEventListener('pagehide',()=>{for(const s of sessions.values()){persist(s);void flush(s);}});
    window.addEventListener('online',()=>{for(const s of sessions.values())void flush(s);});
    if(tag.dataset.auto==='1')void open();
    // Retry previously registered sessions after a reload; each session remains idempotent.
    if(!window.FUN_RANK_OFFLINE&&location.protocol!=='file:') {
      const pending=[];
      try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('fun-rank:pending:')){const v=storage.get(k,null);if(v?.registered)pending.push(v);}}}catch{}
      for(const p of pending.slice(0,30)){try{await rpc('fun_rank_submit',{p_secret:p.profile.secret,p_session:p.id,p_game:p.game,p_stats:p.stats});localStorage.removeItem('fun-rank:pending:'+p.id);}catch{break;}}
    }
  }
  const boot=()=>init().catch(()=>{ /* Ranking failure must never prevent game play. */ });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else void boot();
})();
