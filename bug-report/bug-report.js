/* LEGO SCHOOL shared bug reporter. No cookies, account storage, or credentials are collected. */
(() => {
  'use strict';
  if (window.LegoschoolBugReport) return;
  const script = document.currentScript;
  const base = new URL('.', script && script.src ? script.src : location.href);
  const options = { ...((script && script.dataset) || {}) };
  const VERSION = '1.1.0';
  const MAX_EDGE = 1920;
  const contextProviders = new Set();
  let host, root, dialog, canvas, baseImage, opened = false, busy = false, capturing = false;
  let actions = [], activeAction = null, tool = 'pen', previousFocus, reportId, receiptToken;
  let captureInfo = {}, environment = {}, capturedContext = {}, submitted = false;
  let libraryPromise, configurationPromise, submitPromise;
  let lastPayload = null, receiptLocked = false;
  let activeGameModal = null;
  let placementTimer, placementFrame, placementLastRun = 0, launcherHovered = false;
  let launcherPosition = null;
  const rewardedHere = new Set();
  const pendingRewards = new Map();
  const claimingRewards = new Map();
  const REWARD_PENDING_KEY = 'legoschool.bugReport.pendingRewards.v1';
  const REWARD_RPC = 'https://oawbzsdjkzucxlcyhgdr.supabase.co/rest/v1/rpc/hub_report_reward';
  const REWARD_PUBLIC_KEY = 'sb_publishable_ZgTRFJinUZSekn_Uzn1REg_s7wFF_xg';

  const $ = (selector) => root.querySelector(selector);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2, '0')).join(''));
  const secret = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const status = (message, error = false) => { $('#status').textContent = message; $('#status').dataset.error = String(error); };
  const safeUrl = raw => { try { const url = new URL(raw, location.href); return url.origin === 'null' ? url.pathname.split('/').pop() : url.origin + url.pathname; } catch (_) { return ''; } };
  const match = query => window.matchMedia ? window.matchMedia(query).matches : null;

  function collectEnvironment() {
    return {
      reporterVersion: VERSION,
      capturedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform,
      language: navigator.language,
      languages: Array.from(navigator.languages || []).slice(0, 5),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: { width: screen.width, height: screen.height, availableWidth: screen.availWidth, availableHeight: screen.availHeight, colorDepth: screen.colorDepth, orientation: screen.orientation ? screen.orientation.type : null },
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio: devicePixelRatio, visualScale: visualViewport ? visualViewport.scale : null, scrollX, scrollY },
      preferences: { darkMode: match('(prefers-color-scheme: dark)'), reducedMotion: match('(prefers-reduced-motion: reduce)'), highContrast: match('(prefers-contrast: more)'), forcedColors: match('(forced-colors: active)'), pointer: match('(pointer: coarse)') ? 'touch' : 'fine' },
      capabilities: { touchPoints: navigator.maxTouchPoints || 0, online: navigator.onLine, cookieEnabled: navigator.cookieEnabled, hardwareConcurrency: navigator.hardwareConcurrency || null, deviceMemoryGB: navigator.deviceMemory || null },
      network: navigator.connection ? { effectiveType: navigator.connection.effectiveType, saveData: navigator.connection.saveData } : null,
      fullscreen: Boolean(document.fullscreenElement),
      embedded: window !== window.top
    };
  }

  function cleanContext(value, depth = 0) {
    if (depth > 4) return '[생략]';
    if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') return value.slice(0, 300);
    if (Array.isArray(value)) return value.slice(0, 20).map(v => cleanContext(v, depth + 1));
    if (typeof value === 'object') {
      const result = {};
      Object.entries(value).slice(0, 30).forEach(([key, item]) => {
        if (!/token|secret|password|passwd|cookie|session|authorization|access.?code|email|phone/i.test(key)) result[key.slice(0, 60)] = cleanContext(item, depth + 1);
      });
      return result;
    }
    return undefined;
  }

  function collectContext() {
    const result = {};
    contextProviders.forEach(provider => { try { Object.assign(result, cleanContext(provider()) || {}); } catch (_) { /* One game adapter cannot break reporting. */ } });
    return result;
  }

  async function configuration() {
    if (!configurationPromise) configurationPromise = (async () => {
      if (options.endpoint) return options;
      try {
        const response = await fetch(new URL('config.json', base), { credentials: 'omit', cache: 'no-cache' });
        if (!response.ok) throw new Error('config');
        const config = await response.json();
        return { ...config, ...options, endpoint: options.endpoint || config.endpoint };
      } catch (_) { return options; }
    })();
    return configurationPromise;
  }

  function loadCaptureLibrary() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (!libraryPromise) libraryPromise = new Promise((resolve, reject) => {
      const loader = document.createElement('script');
      loader.src = options.captureUrl || new URL('vendor/html2canvas.min.js', base).href;
      loader.async = true;
      if (script && script.nonce) loader.nonce = script.nonce;
      loader.onload = () => window.html2canvas ? resolve(window.html2canvas) : reject(new Error('캡처 도구를 불러오지 못했습니다.'));
      loader.onerror = () => { libraryPromise = null; reject(new Error('캡처 도구를 불러오지 못했습니다.')); };
      document.head.append(loader);
    });
    return libraryPromise;
  }

  function fitImage(source) {
    const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
    const result = document.createElement('canvas');
    result.width = Math.max(1, Math.round(source.width * scale));
    result.height = Math.max(1, Math.round(source.height * scale));
    result.getContext('2d').drawImage(source, 0, 0, result.width, result.height);
    return result;
  }

  function canvasSnapshots() {
    const snapshots = [];
    const warnings = [];
    document.querySelectorAll('canvas').forEach((element, index) => {
      if (element.closest('[data-legoschool-report-private], [data-html2canvas-ignore]')) return;
      const bounds = element.getBoundingClientRect();
      if (!element.width || !element.height || bounds.bottom <= 0 || bounds.top >= innerHeight || bounds.right <= 0 || bounds.left >= innerWidth) return;
      try {
        const snapshot = document.createElement('canvas');
        snapshot.width = element.width; snapshot.height = element.height;
        const context = snapshot.getContext('2d', { willReadFrequently: true });
        context.drawImage(element, 0, 0);
        const samples = context.getImageData(0, 0, Math.min(element.width, 8), Math.min(element.height, 8)).data;
        if (!samples.some((value, i) => i % 4 !== 3 && value > 8)) warnings.push('게임 그림 일부가 검게 보일 수 있어요. 미리보기를 확인해 주세요.');
        const dataUrl = snapshot.toDataURL('image/png');
        const marker = uuid() + '-' + index, previousMarker = element.getAttribute('data-lsbr-canvas-marker');
        element.setAttribute('data-lsbr-canvas-marker', marker);
        snapshots.push({ marker, element, previousMarker, dataUrl });
      } catch (_) { warnings.push('브라우저가 게임 그림 일부의 캡처를 허용하지 않았어요.'); }
    });
    return { snapshots, warnings };
  }

  function modalSnapshots() {
    const items = [];
    document.querySelectorAll('dialog').forEach((element, index) => {
      if (element.closest('[data-legoschool-report-private], [data-html2canvas-ignore]')) return;
      let modal;
      try { modal = element.matches(':modal'); } catch (_) { modal = element.open; }
      if (!modal) return;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const computed = getComputedStyle(element);
      const style = Array.from(computed, name => [name, computed.getPropertyValue(name)]);
      const backdrop = getComputedStyle(element, '::backdrop');
      const marker = uuid() + '-' + index, previousMarker = element.getAttribute('data-lsbr-modal-marker');
      element.setAttribute('data-lsbr-modal-marker', marker);
      items.push({ marker, previousMarker, element, rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, style, backdrop: { backgroundColor: backdrop.backgroundColor, opacity: backdrop.opacity }, scrollTop: element.scrollTop, scrollLeft: element.scrollLeft });
    });
    // The most recently opened dialog belongs above any earlier dialog.
    return items.sort((a, b) => (a.element === activeGameModal ? 1 : 0) - (b.element === activeGameModal ? 1 : 0));
  }

  function restoreModalLayers(cloned, snapshots) {
    snapshots.forEach((item, order) => {
      const original = cloned.querySelector('[data-lsbr-modal-marker="' + item.marker + '"]');
      if (!original) return;
      // HTML dialog cloning preserves `open`, but loses the modal top layer. Without
      // this conversion the browser lays it out below the game and omits it entirely.
      const layer = cloned.createElement('div');
      layer.setAttribute('aria-hidden', 'true');
      Object.assign(layer.style, { position: 'fixed', inset: '0', zIndex: String(2147483600 + order * 2), pointerEvents: 'none', backgroundColor: item.backdrop.backgroundColor || 'rgba(0,0,0,.1)', opacity: item.backdrop.opacity || '1' });
      cloned.body.append(layer);
      original.setAttribute('open', '');
      item.style.forEach(([name, value]) => original.style.setProperty(name, value));
      Object.assign(original.style, {
        position: 'fixed', inset: 'auto', left: item.rect.left + 'px', top: item.rect.top + 'px',
        width: item.rect.width + 'px', height: item.rect.height + 'px', minWidth: '0', minHeight: '0',
        maxWidth: 'none', maxHeight: 'none', margin: '0', transform: 'none',
        boxSizing: 'border-box', zIndex: String(2147483601 + order * 2)
      });
      cloned.body.append(original);
      original.scrollTop = item.scrollTop; original.scrollLeft = item.scrollLeft;
    });
  }

  async function capture() {
    if (capturing) return;
    capturing = true;
    $('#recapture').disabled = true;
    $('#submit').disabled = true;
    status('현재 화면을 캡처하고 있어요…');
    const wasModal = dialog.open;
    let markedCanvases = [], markedModals = [];
    if (wasModal) dialog.close();
    host.style.visibility = 'hidden';
    try {
      const render = await loadCaptureLibrary();
      await frame();
      environment = collectEnvironment();
      capturedContext = collectContext();
      const { snapshots, warnings } = canvasSnapshots();
      markedCanvases = snapshots;
      const modals = modalSnapshots();
      markedModals = modals;
      const result = await render(document.documentElement, {
        backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
        x: scrollX, y: scrollY, width: innerWidth, height: innerHeight,
        windowWidth: innerWidth, windowHeight: innerHeight,
        scrollX, scrollY, scale: Math.min(devicePixelRatio || 1, 2, MAX_EDGE / Math.max(innerWidth, innerHeight)),
        logging: false, useCORS: true, allowTaint: false, imageTimeout: 8000,
        ignoreElements: element => element === host || element.hasAttribute('data-legoschool-report-private'),
        onclone: cloned => {
          cloned.querySelectorAll('input[type="password"], [data-legoschool-report-private]').forEach(el => { el.style.visibility = 'hidden'; });
          snapshots.forEach(({ marker, dataUrl }) => {
            const original = cloned.querySelector('[data-lsbr-canvas-marker="' + marker + '"]');
            if (!original) return;
            const image = cloned.createElement('img');
            Array.from(original.attributes).forEach(attribute => image.setAttribute(attribute.name, attribute.value));
            image.src = dataUrl; image.width = original.width; image.height = original.height;
            original.replaceWith(image);
          });
          restoreModalLayers(cloned, modals);
        }
      });
      result.toDataURL('image/png'); // Explicitly reject a tainted result.
      baseImage = fitImage(result);
      actions = []; activeAction = null;
      captureInfo = { method: 'html2canvas', warnings: Array.from(new Set(warnings)) };
      draw();
      $('#empty').hidden = true; canvas.hidden = false;
      $('#capture-note').textContent = warnings.length ? Array.from(new Set(warnings)).join(' ') + ' 비어 있으면 사진을 직접 첨부할 수 있어요.' : '캡처가 실제 화면과 같은지 확인해 주세요. 빠진 그림이 있으면 사진을 직접 첨부할 수 있어요.';
      status('사진에 표시하고 어떤 문제가 있었는지 적어 주세요.');
    } catch (error) {
      if (!baseImage) { $('#empty').hidden = false; $('#empty').textContent = '캡처할 수 없어요. 사진을 첨부할 수 있어요.'; canvas.hidden = true; }
      captureInfo = { method: 'failed', warnings: [String(error.message).slice(0, 200)] };
      status('화면을 캡처하지 못했어요. 사진을 첨부하거나 설명만 보낼 수 있어요.', true);
    } finally {
      [[markedCanvases, 'data-lsbr-canvas-marker'], [markedModals, 'data-lsbr-modal-marker']].forEach(([items, attribute]) => items.forEach(item => {
        if (item.element.getAttribute(attribute) !== item.marker) return;
        if (item.previousMarker == null) item.element.removeAttribute(attribute); else item.element.setAttribute(attribute, item.previousMarker);
      }));
      host.style.visibility = '';
      capturing = false;
      $('#recapture').disabled = false;
      $('#submit').disabled = busy || submitted;
      if (opened && !dialog.open) dialog.showModal();
      updateEnvironmentPreview();
      $('#description').focus();
    }
  }

  function updateEnvironmentPreview() {
    const e = environment;
    const lines = [
      ['게임', options.gameName || options.gameId || document.title],
      ['페이지', safeUrl(location.href)],
      ['기기 / 운영체제', e.platform || '확인할 수 없음'],
      ['브라우저', e.userAgent || navigator.userAgent],
      ['화면 해상도', e.screen ? `${e.screen.width} × ${e.screen.height}` : ''],
      ['게임 화면 크기', e.viewport ? `${e.viewport.width} × ${e.viewport.height} / 배율 ${e.viewport.devicePixelRatio}` : ''],
      ['언어 / 시간대', `${e.language || ''} / ${e.timeZone || ''}`],
      ['표시 설정', e.preferences ? `어두운 화면 ${e.preferences.darkMode ? '켬' : '끔'}, 동작 줄이기 ${e.preferences.reducedMotion ? '켬' : '끔'}, ${e.preferences.pointer === 'touch' ? '터치 조작' : '마우스 조작'}` : ''],
      ['인터넷', navigator.onLine ? '연결됨' : '연결 안 됨']
    ];
    if (Object.keys(capturedContext).length) lines.push(['게임 설정 / 현재 위치', JSON.stringify(capturedContext, null, 2)]);
    $('#environment').textContent = lines.map(([key, value]) => `${key}: ${value}`).join('\n');
  }

  function renderAction(ctx, item) {
    ctx.strokeStyle = item.color; ctx.fillStyle = item.color;
    ctx.lineWidth = item.width; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (item.tool === 'text') {
      ctx.font = `bold ${Math.max(18, canvas.width / 35)}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(3, item.width);
      ctx.strokeText(item.text, item.x, item.y); ctx.fillText(item.text, item.x, item.y); return;
    }
    const start = item.points[0], end = item.points[item.points.length - 1];
    if (!start || !end) return;
    ctx.beginPath();
    if (item.tool === 'rect') ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
    else { ctx.moveTo(start.x, start.y); item.points.forEach(point => ctx.lineTo(point.x, point.y)); }
    ctx.stroke();
    if (item.tool === 'arrow') {
      const angle = Math.atan2(end.y - start.y, end.x - start.x), length = item.width * 5;
      ctx.beginPath(); ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - length * Math.cos(angle - Math.PI / 6), end.y - length * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(end.x, end.y); ctx.lineTo(end.x - length * Math.cos(angle + Math.PI / 6), end.y - length * Math.sin(angle + Math.PI / 6)); ctx.stroke();
    }
  }

  function draw() {
    if (!baseImage) return;
    canvas.width = baseImage.width; canvas.height = baseImage.height;
    const context = canvas.getContext('2d');
    context.drawImage(baseImage, 0, 0);
    actions.forEach(item => renderAction(context, item));
    if (activeAction) renderAction(context, activeAction);
    $('#undo').disabled = !actions.length;
    $('#clear').disabled = !actions.length;
  }

  function point(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(canvas.width, (event.clientX - bounds.left) * canvas.width / bounds.width)), y: Math.max(0, Math.min(canvas.height, (event.clientY - bounds.top) * canvas.height / bounds.height)) };
  }

  function annotate(event) {
    if (!baseImage || busy || submitted || receiptLocked) return;
    event.preventDefault();
    const position = point(event);
    const color = $('#color').value, width = Math.max(3, canvas.width / 320);
    if (tool === 'text') {
      const text = $('#annotation-text').value.trim();
      if (!text) { status('사진에 쓸 글을 먼저 적은 뒤 사진을 눌러 주세요.', true); $('#annotation-text').focus(); return; }
      actions.push({ tool, ...position, color, width, text: text.slice(0, 120) }); draw(); return;
    }
    activeAction = { tool, color, width, points: [position] };
    canvas.setPointerCapture(event.pointerId);
    draw();
  }

  async function attach(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 12 * 1024 * 1024) { status('PNG, JPG, WEBP 사진을 12MB 이하로 첨부해 주세요.', true); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (image.width * image.height > 40000000) throw new Error('사진이 너무 큽니다.');
      baseImage = fitImage(image); actions = []; activeAction = null;
      captureInfo = { method: 'attachment', warnings: [] };
      canvas.hidden = false; $('#empty').hidden = true;
      $('#capture-note').textContent = '첨부한 사진 위에 표시할 수 있어요.';
      draw(); status('사진을 첨부했어요. 설명을 적고 보내 주세요.');
    } catch (_) { status('사진을 열지 못했어요. 다른 사진을 첨부해 주세요.', true); }
    finally { URL.revokeObjectURL(url); $('#attachment').value = ''; }
  }

  function screenshot() {
    if (!baseImage) return null;
    let dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length > 2400000) dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    if (dataUrl.length > 3600000) throw new Error('사진 용량이 너무 커요. 작은 사진을 첨부해 주세요.');
    return { dataUrl, width: canvas.width, height: canvas.height, ...captureInfo };
  }

  function jsonp(endpoint, id, token) {
    return new Promise((resolve, reject) => {
      const callback = '__lsbr_' + uuid().replace(/-/g, '_');
      const url = new URL(endpoint);
      url.searchParams.set('action', 'status'); url.searchParams.set('reportId', id); url.searchParams.set('receiptToken', token); url.searchParams.set('callback', callback);
      const element = document.createElement('script');
      let timer;
      const cleanup = () => { clearTimeout(timer); element.remove(); delete window[callback]; };
      window[callback] = result => { cleanup(); resolve(result); };
      element.src = url.href; element.referrerPolicy = 'no-referrer';
      if (script && script.nonce) element.nonce = script.nonce;
      element.onerror = () => { cleanup(); reject(new Error('접수 확인 서버에 연결하지 못했어요.')); };
      timer = setTimeout(() => { cleanup(); reject(new Error('접수 확인 응답이 늦어지고 있어요.')); }, 10000);
      document.head.append(element);
    });
  }

  async function transport(endpoint, payload) {
    const target = 'lsbr_' + uuid().replace(/-/g, '');
    const iframe = document.createElement('iframe');
    iframe.name = target; iframe.hidden = true; iframe.title = '오류 제보 전송'; iframe.setAttribute('data-html2canvas-ignore', '');
    const form = document.createElement('form');
    form.method = 'POST'; form.action = endpoint; form.target = target; form.hidden = true; form.setAttribute('data-html2canvas-ignore', '');
    const field = document.createElement('input');
    field.type = 'hidden'; field.name = 'payload'; field.value = JSON.stringify(payload); form.append(field);
    let fastAck = null;
    const receive = event => {
      // HtmlService may nest a sandbox frame; such replies are deliberately ignored.
      // Authenticated receipt polling below handles that case without relaxing source checks.
      const data = event.data;
      if (event.source !== iframe.contentWindow || event.origin !== new URL(endpoint).origin) return;
      if (!data || data.type !== 'legoschool:bug-report-result' || data.reportId !== payload.reportId || data.receiptToken !== payload.receiptToken) return;
      if (data.ok === true || data.ok === false) fastAck = data;
    };
    window.addEventListener('message', receive);
    document.body.append(iframe, form);
    try {
      form.submit();
      const deadline = Date.now() + 40000;
      let lastError;
      while (Date.now() < deadline) {
        await sleep(2000);
        if (fastAck) return fastAck;
        try {
          const result = await jsonp(endpoint, payload.reportId, payload.receiptToken);
          if (result && (result.ok === true || result.ok === false)) return result;
        } catch (error) { lastError = error; }
      }
      throw new Error(lastError ? '접수 확인이 늦어지고 있어요. 같은 내용으로 다시 확인·전송하면 중복 접수되지 않아요.' : '접수 완료를 확인하지 못했어요. 다시 확인·전송해 주세요.');
    } finally {
      window.removeEventListener('message', receive);
      iframe.remove(); form.remove();
    }
  }

  function setEditingDisabled(disabled) {
    root.querySelectorAll('#editor button, #editor input, #description, #attachment, #recapture, #attach-button').forEach(el => { el.disabled = disabled; });
    if (!disabled) { $('#undo').disabled = !actions.length; $('#clear').disabled = !actions.length; }
  }

  function savePendingReward(result, remove = false) {
    const id = String(result.receiptId || reportId);
    let pending = {};
    try { pending = JSON.parse(localStorage.getItem(REWARD_PENDING_KEY) || '{}'); } catch (_) { /* Keep an in-memory retry when storage is unavailable. */ }
    if (!pending || typeof pending !== 'object' || Array.isArray(pending)) pending = {};
    if (remove) { delete pending[id]; pendingRewards.delete(id); }
    else {
      const receipt = { receiptId: id, rewardStars: 1, reward: { ban: result.reward.ban, num: result.reward.num, proof: result.reward.proof } };
      pending[id] = receipt; pendingRewards.set(id, receipt);
    }
    try { localStorage.setItem(REWARD_PENDING_KEY, JSON.stringify(pending)); } catch (_) { /* The receipt remains in memory until this page closes. */ }
  }

  function claimReward(result) {
    const id = String(result.receiptId || reportId);
    if (claimingRewards.has(id)) return claimingRewards.get(id);
    const operation = (async () => {
      savePendingReward(result);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(REWARD_RPC, {
          method: 'POST', credentials: 'omit', signal: controller.signal,
          headers: { apikey: REWARD_PUBLIC_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_receipt: id, p_ban: result.reward.ban, p_num: result.reward.num, p_proof: result.reward.proof })
        });
        if (!response.ok) throw new Error('reward-http');
        const receipt = await response.json();
        if (!receipt || receipt.status !== 'ok' || Number(receipt.stars) !== 1) throw new Error('reward-not-confirmed');
        savePendingReward(result, true);
        return receipt;
      } finally { clearTimeout(timer); }
    })();
    claimingRewards.set(id, operation);
    operation.finally(() => claimingRewards.delete(id)).catch(() => {});
    return operation;
  }

  async function retryPendingRewards() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(REWARD_PENDING_KEY) || '{}'); } catch (_) { /* In-memory records can still be retried. */ }
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) Object.values(stored).slice(0, 50).forEach(value => {
      if (value && typeof value.receiptId === 'string' && value.reward && typeof value.reward.proof === 'string') pendingRewards.set(value.receiptId, value);
    });
    for (const result of Array.from(pendingRewards.values()).slice(0, 5)) await showReward(result, true);
  }

  async function showReward(result, previous = false) {
    if (Number(result.rewardStars) !== 1) return;
    const id = String(result.receiptId || reportId);
    let walletReceipt = null;
    if (result.reward) {
      try { walletReceipt = await claimReward(result); }
      catch (_) {
        if (opened) {
          $('#reward').hidden = false;
          $('#reward').textContent = '제보는 접수됐어요. 별 지급을 기다리고 있어요. 다음에 제보 창을 열면 다시 확인할게요.';
        }
        return;
      }
    }
    const grant = () => {
      if (rewardedHere.has(id)) return false;
      let ledger = {};
      try { ledger = JSON.parse(localStorage.getItem('legoschool.bugReport.rewardReceipts.v1') || '{}'); } catch (_) { /* Storage can be disabled by the browser. */ }
      if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) ledger = {};
      if (Object.prototype.hasOwnProperty.call(ledger, id)) return false;
      rewardedHere.add(id);
      ledger[id] = 1;
      try { localStorage.setItem('legoschool.bugReport.rewardReceipts.v1', JSON.stringify(ledger)); } catch (_) { /* The server receipt still prevents duplicate report creation. */ }
      window.dispatchEvent(new CustomEvent('legoschool:bug-report-reward', { detail: { receiptId: id, stars: 1, creditedTo: result.reward ? 'hub' : 'local', already: Boolean(walletReceipt && walletReceipt.already) } }));
      return true;
    };
    let granted;
    try { granted = navigator.locks ? await navigator.locks.request('legoschool.bugReport.reward', grant) : grant(); }
    catch (_) { granted = grant(); }
    if (!opened) return;
    $('#reward').hidden = false;
    $('#reward').textContent = granted ? (previous ? '이전 제보의 별이 지급됐어요! ⭐ +1' : '제보해 줘서 고마워요! ⭐ +1') : '고마워요! 이 제보의 별 1개는 이미 받았어요.';
    if (!granted || match('(prefers-reduced-motion: reduce)')) return;
    const burst = $('#burst');
    for (let i = 0; i < 18; i++) {
      const star = document.createElement('span'); star.textContent = '⭐';
      const angle = Math.PI * 2 * i / 18;
      star.style.setProperty('--tx', `${Math.round(Math.cos(angle) * (90 + i % 3 * 28))}px`);
      star.style.setProperty('--ty', `${Math.round(Math.sin(angle) * (60 + i % 4 * 18) - 35)}px`);
      star.style.setProperty('--turn', `${(i % 2 ? 1 : -1) * 70}deg`);
      burst.append(star);
    }
    setTimeout(() => burst.replaceChildren(), 1600);
  }

  async function submit() {
    if (busy || capturing || submitted) return;
    const description = $('#description').value.trim();
    if (!description) { status('어떤 문제가 있었는지 적어 주세요.', true); $('#description').focus(); return; }
    const config = await configuration();
    if (busy || submitted) return;
    if (!config.endpoint) { status('아직 접수 서버가 연결되지 않았어요. 작성한 내용을 내려받아 선생님께 전달해 주세요.', true); return; }
    let endpoint;
    try {
      endpoint = new URL(config.endpoint, location.href);
      if (endpoint.protocol !== 'https:' && !(endpoint.origin === location.origin && /^(localhost|127\.0\.0\.1)$/.test(endpoint.hostname))) throw new Error('endpoint');
    } catch (_) { status('접수 주소를 확인하지 못했어요. 작성한 내용을 내려받아 주세요.', true); return; }
    busy = true; $('#submit').disabled = true; $('#close').disabled = true;
    setEditingDisabled(true);
    status('오류 제보를 보내고 접수 결과를 확인하고 있어요…');
    try {
      if (!lastPayload) lastPayload = { schemaVersion: 1, reportId, receiptToken, gameId: options.gameId || 'unknown-game', gameName: options.gameName || document.title, pageUrl: safeUrl(location.href), pageTitle: document.title.slice(0, 200), description: description.slice(0, 4000), screenshot: screenshot(), environment, context: capturedContext };
      receiptLocked = true;
      submitPromise = transport(endpoint.href, lastPayload);
      const result = await submitPromise;
      if (result.ok !== true) throw new Error(result.error || '접수하지 못했어요. 다시 시도해 주세요.');
      submitted = true;
      status('접수했어요. 알려 주셔서 고마워요! 접수 번호: ' + String(result.receiptId || reportId).slice(0, 80));
      $('#submit').textContent = '접수 완료';
      window.dispatchEvent(new CustomEvent('legoschool:bug-report-submitted', { detail: { reportId, receiptId: result.receiptId || reportId } }));
      await showReward(result);
    } catch (error) {
      status(error.message || '전송하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.', true);
      $('#submit').textContent = '다시 확인·전송';
    } finally {
      busy = false; submitPromise = null; $('#submit').disabled = submitted; $('#close').disabled = false;
      setEditingDisabled(receiptLocked);
    }
  }

  function download() {
    try {
      const payload = lastPayload || { schemaVersion: 1, reportId, gameId: options.gameId, gameName: options.gameName || document.title, pageUrl: safeUrl(location.href), description: $('#description').value.trim(), screenshot: screenshot(), environment, context: capturedContext };
      const safe = { ...payload }; delete safe.receiptToken;
      const url = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `오류제보-${reportId}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
      status('작성한 내용을 내려받았어요. 접수는 전송 후 완료 안내가 나와야 끝나요.');
    } catch (error) { status(error.message, true); }
  }

  async function open() {
    if (opened || busy) return;
    opened = true; previousFocus = document.activeElement;
    if (!reportId || submitted) {
      reportId = uuid(); receiptToken = secret(); baseImage = null; actions = []; activeAction = null;
      lastPayload = null; receiptLocked = false; submitted = false;
      $('#description').value = ''; $('#annotation-text').value = '';
      $('#reward').hidden = true; $('#burst').replaceChildren();
      $('#submit').textContent = '오류 제보 보내기'; $('#submit').disabled = false;
      setEditingDisabled(false);
      environment = collectEnvironment(); capturedContext = collectContext();
      window.dispatchEvent(new CustomEvent('legoschool:bug-report-open'));
      await capture();
      retryPendingRewards().catch(() => {});
    } else {
      dialog.showModal(); $('#description').focus();
      window.dispatchEvent(new CustomEvent('legoschool:bug-report-open'));
      retryPendingRewards().catch(() => {});
    }
  }

  function close() {
    if (busy || capturing) return;
    opened = false; dialog.close();
    placeHost();
    window.dispatchEvent(new CustomEvent('legoschool:bug-report-close'));
    if (previousFocus && previousFocus.isConnected) previousFocus.focus(); else $('#launcher').focus();
  }

  // Keep the reporter away from the game's controls AND readable HUD content.
  // Broad game surfaces are backgrounds; games can reserve canvas HUD regions
  // with data-legoschool-report-avoid on a positioned DOM element.
  function launcherObstacles(view) {
    const scope = activeGameModal || document.fullscreenElement || document.body;
    const controls = 'button,a[href],input,select,textarea,summary,[role="button"],[role="tab"],[role="slider"],[role="dialog"],[role="toolbar"],[role="alert"],[role="status"],[tabindex],[onclick],[data-legoschool-report-avoid],nav,header,footer,aside,dialog[open],img,video,iframe';
    const obstacles = [];
    const add = (rect, essential = true) => {
      if (rect.width > 0 && rect.height > 0 && rect.right > view.left && rect.left < view.right && rect.bottom > view.top && rect.top < view.bottom) {
        obstacles.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, essential });
      }
    };
    const range = document.createRange();
    for (const element of [scope, ...scope.querySelectorAll('*')]) {
      if (element === host || element.closest('#legoschool-bug-report') || /^(SCRIPT|STYLE|LINK|META|NOSCRIPT|OPTION)$/.test(element.tagName)) continue;
      const explicit = element.hasAttribute('data-legoschool-report-avoid');
      const control = element.matches(controls);
      const textNodes = Array.from(element.childNodes).filter(node => node.nodeType === 3 && node.textContent.trim());
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= view.top || rect.top >= view.bottom || rect.right <= view.left || rect.left >= view.right) continue;
      const style = getComputedStyle(element);
      if (style.visibility !== 'visible' || Number(style.opacity) === 0 || element.closest('[hidden],[inert]')) continue;
      if (element.checkVisibility && !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const broad = rect.width > view.width * .8 && rect.height > view.height * .75;
      const panel = ['fixed', 'sticky', 'absolute'].includes(style.position);
      const touchControl = /joystick|touch[-_](stick|button|btn|control)/i.test(element.id + ' ' + element.getAttribute('class'));
      if (explicit || (!broad && (control || touchControl || style.cursor === 'pointer'))) add(rect);
      else {
        // A panel may fill the screen while containing plenty of blank space.
        // Its text stays protected even if that blank interior is needed later.
        if (!broad && panel) add(rect, false);
        for (const node of textNodes) {
          range.selectNode(node);
          for (const line of range.getClientRects()) add(line);
        }
      }
    }
    return obstacles;
  }

  function positionLauncher() {
    placementTimer = null; placementFrame = null; placementLastRun = performance.now();
    if (!host || opened || capturing || document.hidden) return;
    const launcher = $('#launcher');
    const viewport = window.visualViewport;
    const safe = getComputedStyle($('#safe-area'));
    const inset = side => Math.max(10, parseFloat(safe.getPropertyValue('padding-' + side)) || 0);
    const view = {
      left: (viewport ? viewport.offsetLeft : 0) + inset('left'),
      top: (viewport ? viewport.offsetTop : 0) + inset('top'),
      right: (viewport ? viewport.offsetLeft + viewport.width : document.documentElement.clientWidth) - inset('right'),
      bottom: (viewport ? viewport.offsetTop + viewport.height : innerHeight) - inset('bottom')
    };
    view.width = view.right - view.left; view.height = view.bottom - view.top;
    const current = launcher.getBoundingClientRect();
    const withinView = current.left >= view.left - 1 && current.top >= view.top - 1 && current.right <= view.right + 1 && current.bottom <= view.bottom + 1;
    // Do not move the click target under a pointer or a keyboard user. A viewport
    // change is allowed to bring an otherwise off-screen button back into view.
    if (launcherPosition && withinView && (launcherHovered || root.activeElement === launcher)) return;
    const allObstacles = launcherObstacles(view);
    let obstacles = allObstacles;
    const gap = 8;
    const overlap = (x, y, width, height) => obstacles.reduce((area, rect) => area + Math.max(0, Math.min(x + width + gap, rect.right) - Math.max(x - gap, rect.left)) * Math.max(0, Math.min(y + height + gap, rect.bottom) - Math.max(y - gap, rect.top)), 0);
    let best = null;
    // Prefer the labelled button. Only use the 44px icon when a labelled button
    // cannot fit anywhere. Keep the accessible name in both layouts.
    for (const { compact, panels } of [{ compact: false, panels: true }, { compact: true, panels: true }, { compact: false, panels: false }, { compact: true, panels: false }]) {
      obstacles = panels ? allObstacles : allObstacles.filter(rect => rect.essential);
      if (!panels && !compact) best = null;
      launcher.classList.toggle('compact', compact);
      const { width, height } = launcher.getBoundingClientRect();
      if (width > view.width || height > view.height) continue;
      const right = view.right - width, bottom = view.bottom - height;
      const xs = new Set([right, view.left]);
      const ys = new Set([bottom, view.top]);
      for (const rect of obstacles) {
        for (const x of [rect.left - gap - width, rect.right + gap]) if (x >= view.left && x <= right) xs.add(Math.round(x));
        for (const y of [rect.top - gap - height, rect.bottom + gap]) if (y >= view.top && y <= bottom) ys.add(Math.round(y));
      }
      const candidates = [];
      const push = (x, y) => candidates.push({ x, y, width, height, compact, distance: Math.abs(right - x) + Math.abs(bottom - y) });
      if (launcherPosition && launcherPosition.compact === compact && withinView) {
        if (overlap(current.left, current.top, width, height) === 0) { best = { x: current.left, y: current.top, width, height, compact, area: 0 }; break; }
      }
      // Start near the familiar lower-right corner, then try both side edges.
      for (const y of ys) { push(right, y); push(view.left, y); }
      for (const x of xs) { push(x, bottom); push(x, view.top); }
      candidates.sort((a, b) => a.distance - b.distance);
      let fit = null;
      for (const candidate of candidates) {
        candidate.area = overlap(candidate.x, candidate.y, width, height);
        if (!best || candidate.area < best.area) best = candidate;
        if (candidate.area === 0) { fit = candidate; break; }
      }
      // Find a horizontal gap for each possible row, without an expensive
      // all-X by all-Y by all-obstacles search on dense game screens.
      if (!fit) for (const y of [...ys].sort((a, b) => b - a)) {
        const blocked = obstacles.filter(rect => rect.top < y + height + gap && rect.bottom > y - gap).sort((a, b) => b.right - a.right);
        let x = right;
        for (const rect of blocked) {
          if (x < rect.right + gap && x + width + gap > rect.left) x = rect.left - gap - width;
        }
        if (x >= view.left) { fit = { x, y, width, height, compact, area: 0 }; break; }
      }
      if (fit) { best = fit; break; }
    }
    if (!best) return;
    launcher.classList.toggle('compact', best.compact);
    launcher.style.left = Math.round(best.x) + 'px';
    launcher.style.top = Math.round(best.y) + 'px';
    launcher.style.right = 'auto'; launcher.style.bottom = 'auto';
    launcher.dataset.placement = best.area === 0 ? 'clear' : 'crowded';
    launcherPosition = best;
  }

  function scheduleLauncherPlacement() {
    if (placementTimer || placementFrame || opened || capturing) return;
    // Game HUDs can change every animation frame. Coalesce changes and limit
    // geometry work to five passes/second instead of measuring every mutation.
    placementTimer = setTimeout(() => {
      placementTimer = null;
      placementFrame = requestAnimationFrame(positionLauncher);
    }, Math.max(0, 200 - (performance.now() - placementLastRun)));
  }

  function placeHost() {
    if (!host || opened) return;
    const gameDialogs = Array.from(document.querySelectorAll('dialog')).filter(element => {
      try { return element.matches(':modal'); } catch (_) { return element.open; }
    });
    if (!activeGameModal || !gameDialogs.includes(activeGameModal)) activeGameModal = gameDialogs[gameDialogs.length - 1] || null;
    const target = activeGameModal || document.fullscreenElement || document.body;
    if (typeof host.showPopover === 'function') {
      // Modal dialogs and fullscreen make everything outside their subtree inert.
      // Move into that subtree before raising the launcher in the top layer.
      if (host.parentElement !== target) {
        if (host.matches(':popover-open')) host.hidePopover();
        target.append(host);
      }
      if (!host.matches(':popover-open')) host.showPopover();
    } else if (!/^(CANVAS|VIDEO|IMG)$/.test(target.tagName) && host.parentElement !== target) target.append(host);
    scheduleLauncherPlacement();
  }

  function mount() {
    host = document.createElement('div'); host.id = 'legoschool-bug-report'; host.setAttribute('data-html2canvas-ignore', '');
    root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `

      <div id="safe-area" aria-hidden="true"></div>
      <button id="launcher" type="button" aria-haspopup="dialog" aria-label="⚑ 오류 제보" title="오류 제보"><span aria-hidden="true">⚑</span><span class="launcher-label" aria-hidden="true"> 오류 제보</span></button>
      <dialog aria-labelledby="title">
        <header><h2 id="title">어떤 문제가 있었나요?</h2><button id="close" type="button" aria-label="오류 제보 닫기">닫기</button></header>
        <div class="content">
          <section class="stack" aria-label="화면 캡처와 표시">
            <div id="editor"><h3>문제가 있는 곳을 표시해 주세요</h3>
              <div class="toolbar" role="group" aria-label="사진 표시 도구">
                <button type="button" data-tool="pen" aria-pressed="true">펜</button><button type="button" data-tool="rect" aria-pressed="false">네모</button><button type="button" data-tool="arrow" aria-pressed="false">화살표</button><button type="button" data-tool="text" aria-pressed="false">글쓰기</button>
                <input id="color" type="color" value="#e52b38" aria-label="표시 색"><button id="undo" type="button" disabled>실행 취소</button><button id="clear" type="button" disabled>표시 지우기</button>
              </div>
              <input id="annotation-text" type="text" maxlength="120" placeholder="사진에 쓸 글을 적고, 사진에서 위치를 눌러 주세요" aria-label="사진에 쓸 글" hidden>
              <div class="picture"><div id="empty">화면을 캡처하고 있어요…</div><canvas id="canvas" aria-label="캡처 사진. 펜이나 표시 도구를 선택하고 사진 위에 표시하세요." hidden></canvas></div>
              <p id="capture-note" class="hint">비밀번호 입력 칸은 캡처에서 가려집니다.</p>
            </div>
            <div class="row"><button id="recapture" type="button">다시 캡처</button><button id="attach-button" type="button">사진 첨부</button><input id="attachment" type="file" accept="image/png,image/jpeg,image/webp" hidden></div>
          </section>
          <section class="stack" aria-label="제보 설명">
            <div><label for="description">어떤 문제가 생겼나요? *</label><textarea id="description" maxlength="4000" placeholder="어느 화면에서 무엇을 하다가 문제가 생겼는지 적어 주세요." required></textarea><p class="hint">이름이나 연락처는 적지 않아도 돼요.</p></div>
            <details><summary>함께 보내는 기기·화면 정보</summary><pre id="environment"></pre><p class="hint">기기, 브라우저, 해상도와 표시 설정이 함께 전달됩니다. 비밀번호나 로그인 저장 정보는 읽지 않습니다.</p></details>
          </section>
        </div>
        <footer><div id="reward" role="status" hidden></div><div id="burst" aria-hidden="true"></div><p id="status" role="status" aria-live="polite"></p><div class="row"><button id="download" type="button">작성 내용 내려받기</button><button id="submit" type="button">오류 제보 보내기</button></div></footer>
      </dialog>`;
    const styles = document.createElement('link'); styles.rel = 'stylesheet'; styles.href = options.cssUrl || new URL('bug-report.css', base).href; root.prepend(styles);
    document.body.append(host);
    // A manual popover keeps the launcher in the browser top layer, including canvas fullscreen.
    if (typeof host.showPopover === 'function') { host.setAttribute('popover', 'manual'); host.showPopover(); }
    dialog = $('dialog'); canvas = $('#canvas');
    styles.addEventListener('load', scheduleLauncherPlacement);
    $('#launcher').addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') launcherHovered = true; });
    $('#launcher').addEventListener('pointerleave', () => { launcherHovered = false; scheduleLauncherPlacement(); });
    $('#launcher').addEventListener('blur', scheduleLauncherPlacement);
    $('#launcher').addEventListener('click', open);
    $('#close').addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    root.addEventListener('keydown', event => { if (opened) event.stopPropagation(); });
    root.addEventListener('keyup', event => { if (opened) event.stopPropagation(); });
    root.addEventListener('pointerdown', event => event.stopPropagation());
    root.addEventListener('pointerup', event => event.stopPropagation());
    root.addEventListener('click', event => event.stopPropagation());
    $('#recapture').addEventListener('click', capture);
    $('#attach-button').addEventListener('click', () => $('#attachment').click());
    $('#attachment').addEventListener('change', event => attach(event.target.files[0]));
    $('#submit').addEventListener('click', submit); $('#download').addEventListener('click', download);
    root.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => { tool = button.dataset.tool; root.querySelectorAll('[data-tool]').forEach(other => other.setAttribute('aria-pressed', String(other === button))); $('#annotation-text').hidden = tool !== 'text'; if (tool === 'text') $('#annotation-text').focus(); }));
    $('#undo').addEventListener('click', () => { actions.pop(); draw(); });
    $('#clear').addEventListener('click', () => { actions = []; activeAction = null; draw(); });
    canvas.addEventListener('pointerdown', annotate);
    canvas.addEventListener('pointermove', event => { if (!activeAction) return; const p = point(event); if (activeAction.tool === 'pen') activeAction.points.push(p); else activeAction.points[1] = p; draw(); });
    const finish = () => { if (activeAction) { actions.push(activeAction); activeAction = null; draw(); } };
    canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish);
    document.addEventListener('fullscreenchange', placeHost);
    window.addEventListener('resize', scheduleLauncherPlacement, { passive: true });
    document.addEventListener('scroll', scheduleLauncherPlacement, { capture: true, passive: true });
    document.addEventListener('transitionend', scheduleLauncherPlacement, true);
    document.addEventListener('animationend', scheduleLauncherPlacement, true);
    document.addEventListener('visibilitychange', scheduleLauncherPlacement);
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', scheduleLauncherPlacement, { passive: true });
      visualViewport.addEventListener('scroll', scheduleLauncherPlacement, { passive: true });
    }
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(scheduleLauncherPlacement);
      observer.observe(document.body); observer.observe(document.documentElement);
    }
    if (document.fonts) document.fonts.ready.then(scheduleLauncherPlacement);
    new MutationObserver(records => {
      let changed = false;
      let layoutChanged = false;
      for (const record of records) {
        if (record.target === host || host.contains(record.target)) continue;
        if (record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].every(node => node === host)) continue;
        layoutChanged = true;
        if (record.type === 'attributes' && record.target.tagName === 'DIALOG') {
          changed = true;
          if (record.target.open) activeGameModal = record.target;
        } else if (record.type === 'childList') {
          const nodes = [...record.addedNodes, ...record.removedNodes];
          if (nodes.some(node => node.nodeType === 1 && (node.tagName === 'DIALOG' || node.querySelector('dialog')))) changed = true;
        }
      }
      if (changed) placeHost();
      if (layoutChanged) scheduleLauncherPlacement();
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['open', 'hidden', 'class', 'style', 'inert', 'data-legoschool-report-avoid'] });
    placeHost();
    window.dispatchEvent(new CustomEvent('legoschool:bug-report-ready'));
    configuration();
  }

  window.LegoschoolBugReport = Object.freeze({
    version: VERSION,
    open: () => host ? open() : undefined,
    registerContext: provider => { if (typeof provider !== 'function') throw new TypeError('Context provider must be a function'); contextProviders.add(provider); return () => contextProviders.delete(provider); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
