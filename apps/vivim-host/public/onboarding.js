// VIVIM guided setup. Every value from the Host API is inserted with textContent; no innerHTML.
const API = '/api/onboarding';
const $ = id => document.getElementById(id);
const STEPS = [
  { id: 'computer', rail: 'This computer', eyebrow: 'STEP 1 OF 5', title: 'Set up VIVIM on this PC', sub: 'VIVIM keeps your data in one folder and uses its own browser profile, so your everyday Chrome is never touched.' },
  { id: 'accounts', rail: 'Your AI accounts', eyebrow: 'STEP 2 OF 5', title: 'Sign in to the AIs you use', sub: 'Sign in once in the VIVIM browser. VIVIM never sees your passwords and never uses API keys.' },
  { id: 'main', rail: 'Your main AI', eyebrow: 'STEP 3 OF 5', title: 'Choose your main AI', sub: 'This is where VIVIM starts. It can learn your style in the background while you set up your phone.' },
  { id: 'phone', rail: 'Your phone', eyebrow: 'STEP 4 OF 5', title: 'Connect your phone', sub: 'Your phone is where you build your personal AI app. Setup continues there.' },
  { id: 'ready', rail: 'All set', eyebrow: 'STEP 5 OF 5', title: 'Your VIVIM is getting ready', sub: 'Here is where things stand and what you can do next.' }
];
const CHECK_LABEL = { ready: 'Signed in', signed_out: 'Needs sign-in', needs_attention: 'Needs attention', unknown: 'Not sure yet', studio_unavailable: 'Studio not running' };
const CHECK_HELP = {
  signed_out: 'Sign in in the VIVIM browser, then check again.',
  needs_attention: 'Open it in the VIVIM browser: there may be an unsent draft or a verification step.',
  unknown: 'VIVIM could not tell. Open it in the VIVIM browser, then check again.',
  studio_unavailable: 'Start VIVIM in step 1, then check again.'
};
const PASS_LABEL = { queued: 'Waiting', dispatching: 'Asking', awaiting: 'Waiting for reply', ingesting: 'Saving', complete: 'Done', blocked: 'Stopped', failed: 'Stopped', cancelled: 'Cancelled', uncertain: 'Not sure' };
let model = null, step = -1, userMoved = false, review = null, busy = new Set(), form = { workspaceRoot: null, chromeExe: null };
let pairContext = null;
async function registerPhoneApk() {
  await post('/apk/register', { apkPath: 'studio/android/build/vivim-release.apk' });
}
async function mintPhoneCode() {
  const phone = model?.onboarding?.phone;
  if (!phone?.mobileUrl) { say('Set up a private Tailscale HTTPS address before pairing this phone.'); return; }
  await run('pair', async () => {
    const result = await post('/pair/register', { platform: 'android', app: 'vivim-mobile' });
    if (!/^[a-f0-9]{64}$/.test(String(result.token || ''))) throw new Error('The pairing code could not be prepared.');
    pairContext = { url: phone.mobileUrl.replace(/\/$/, '') + '/#' + result.token,
                    expiresAt: new Date(result.expiresAt).toISOString() };
  });
}


function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (k === 'text') el.textContent = v; else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
async function call(route, options = {}) {
  const response = await fetch(API + route, { cache: 'no-store', headers: { 'content-type': 'application/json' }, ...options });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok || body?.ok === false) throw Object.assign(new Error(body?.error || `Request failed (${response.status})`), { code: body?.code });
  return body;
}
const post = (route, data = {}) => call(route, { method: 'POST', body: JSON.stringify(data) });
function say(message) { const n = $('notice'); n.hidden = !message; n.textContent = message || ''; }
async function run(key, task) {
  if (busy.has(key)) return;
  busy.add(key); say(''); render();
  try { await task(); } catch (error) { say(error.message); }
  busy.delete(key); await refresh();
}

// ---- derived progress (the page never trusts its own memory over the Host) ----
function progress() {
  const o = model?.onboarding;
  const verified = (o?.providers ?? []).filter(p => p.check?.verified);
  return {
    computer: Boolean(model?.manifest?.complete),
    accounts: verified.length > 0,
    main: Boolean(o?.primary),
    phone: Boolean(o?.phone?.paired),
    verified
  };
}
function firstOpen(p) { const i = [p.computer, p.accounts, p.main, p.phone].findIndex(done => !done); return i === -1 ? 4 : i; }
function canContinue(p) { return step === 4 ? false : step === 3 ? true : [p.computer, p.accounts, p.main][step] === true; }

// ---- steps ----
function stepComputer() {
  const env = model, ok = env.node?.ok, browser = env.chrome;
  form.workspaceRoot ??= env.defaultWorkspaceRoot; form.chromeExe ??= env.defaultChromeExe;
  const done = env.manifest.complete;
  const row = (good, label, detail) => h('li', { class: 'check ' + (good ? 'is-ok' : 'is-open') }, h('span', { class: 'check-mark', 'aria-hidden': 'true' }, good ? '✓' : ''), h('div', {}, h('strong', { text: label }), detail ? h('small', { text: detail }) : null));
  const field = (id, label, key, hint, readonly) => h('label', { class: 'field', for: id }, h('span', { text: label }),
    h('input', { id, type: 'text', value: form[key] ?? '', readonly: readonly || done, spellcheck: 'false', oninput: e => { form[key] = e.target.value; } }), hint ? h('small', { text: hint }) : null);
  return [
    h('ul', { class: 'checks' },
      row(ok, 'Node.js ' + (env.node?.version ?? ''), ok ? 'Ready' : 'VIVIM needs Node.js 22 or newer.'),
      row(browser.found, browser.found ? browser.name + ' found' : 'No Chrome or Edge found', browser.found ? browser.path : 'Install Google Chrome, or type where it is below.')),
    h('div', { class: 'fields' },
      field('f-root', 'Where VIVIM keeps your data', 'workspaceRoot', 'One folder. Nothing leaves your PC.'),
      field('f-exe', 'Browser VIVIM will use', 'chromeExe', 'VIVIM opens its own profile in this browser.')),
    h('div', { class: 'actions' },
      h('button', { class: 'btn' + (done ? '' : ' primary'), type: 'button', disabled: done || busy.has('setup') || !ok || !form.chromeExe, onclick: () => run('setup', async () => {
        await post('/setup', { workspaceRoot: form.workspaceRoot, chromeExe: form.chromeExe, chromeProfile: `${form.workspaceRoot}${env.platform === 'win32' ? '\\' : '/'}chrome-profile`, cdpPort: env.defaultCdpPort });
      }), text: done ? 'VIVIM is set up on this PC' : busy.has('setup') ? 'Setting up…' : 'Set up VIVIM here' }),
      done && env.canLaunchFromHere ? h('button', { class: 'btn primary', type: 'button', disabled: busy.has('start'), onclick: () => run('start', () => post('/start')), text: busy.has('start') ? 'Opening…' : 'Open the VIVIM browser' }) : null,
      done && !env.canLaunchFromHere ? h('p', { class: 'help' }, 'Open a terminal and run ', h('code', { text: 'vivim start' }), ' to open the VIVIM browser.') : null),
    done ? h('p', { class: 'help' }, model.onboarding.studio.reachable ? 'The VIVIM browser is running. Continue to sign in to your AIs.' : 'Next, open the VIVIM browser. Then continue to sign in to your AIs.') : null
  ];
}

function chip(state, text) { return h('span', { class: 'pill ' + (state === 'ready' ? 'online' : state === 'signed_out' || state === 'needs_attention' ? 'stale' : 'unknown'), text }); }
function stepAccounts() {
  const o = model.onboarding, studioUp = o.studio.reachable;
  return [
    studioUp ? null : h('div', { class: 'banner is-warn' }, h('strong', { text: "The VIVIM browser isn't running yet." }), h('span', { text: ' Go back to step 1 and open it. Nothing can be checked until it is.' })),
    h('ul', { class: 'providers' }, o.providers.map(p => {
      const check = p.check, state = check?.state;
      const busyOpen = busy.has('open:' + p.id), busyCheck = busy.has('check:' + p.id);
      return h('li', { class: 'provider' + (check?.verified ? ' is-ready' : '') },
        h('div', { class: 'provider-main' }, h('strong', { text: p.label }),
          h('small', { text: p.supported === false ? "VIVIM can't use this one yet." : check ? (check.verified ? 'Signed in and ready.' : CHECK_HELP[state] ?? '') : 'Not checked yet.' })),
        check ? chip(state, CHECK_LABEL[state] ?? 'Not sure yet') : h('span', { class: 'pill unknown', text: 'Not checked' }),
        h('div', { class: 'row-actions' },
          h('button', { class: 'btn sm', type: 'button', disabled: !studioUp || p.supported === false || busyOpen, 'aria-label': 'Open ' + p.label + ' to sign in', onclick: () => run('open:' + p.id, () => post('/provider/open', { provider: p.id })), text: busyOpen ? 'Opening…' : 'Open to sign in' }),
          h('button', { class: 'btn sm', type: 'button', disabled: !studioUp || p.supported === false || busyCheck, 'aria-label': 'Check ' + p.label + ' sign-in', onclick: () => run('check:' + p.id, () => post('/provider/check', { provider: p.id })), text: busyCheck ? 'Checking…' : 'Check' })));
    })),
    h('p', { class: 'help' }, 'Sign in to at least one. VIVIM checks by opening a fresh tab of its own, and closes it again. It never reads your messages here.')
  ];
}

function passList(passes) {
  return h('ol', { class: 'passes' }, passes.map(p => h('li', { class: 'pass is-' + p.status },
    h('span', { class: 'pass-mark', 'aria-hidden': 'true' }, p.status === 'complete' ? '✓' : ''),
    h('div', {}, h('strong', { text: p.title }), p.reason ? h('small', { text: p.reason }) : null),
    h('span', { class: 'pill ' + (p.status === 'complete' ? 'online' : ['blocked', 'failed', 'uncertain'].includes(p.status) ? 'stale' : 'unknown'), text: PASS_LABEL[p.status] ?? p.status }))));
}
function stepMain() {
  const o = model.onboarding, pz = o.personalization, verified = progress().verified;
  const pick = h('fieldset', { class: 'choices' }, h('legend', { text: 'Your main AI' }),
    ...o.providers.map(p => {
      const ready = Boolean(p.check?.verified), id = 'main-' + p.id;
      return h('label', { class: 'choice' + (ready ? '' : ' is-off'), for: id },
        h('input', { id, type: 'radio', name: 'main', value: p.id, checked: o.primary === p.id, disabled: !ready || busy.has('primary'), onchange: () => run('primary', async () => { review = null; await post('/primary', { provider: p.id }); }) }),
        h('span', {}, h('strong', { text: p.label }), h('small', { text: ready ? 'Signed in' : 'Sign in first (step 2)' })));
    }));
  if (!verified.length) return [h('div', { class: 'banner is-warn' }, h('strong', { text: 'Sign in to an AI first.' }), h('span', { text: ' Go back to step 2.' })), pick];
  const out = [pick];
  if (!o.primary) return out;
  if (pz.phase === 'unsupported') {
    out.push(h('div', { class: 'panel-soft' }, h('h2', { text: 'Personalizing your style' }),
      h('p', { text: 'VIVIM learns your style from ChatGPT today. You can still use ' + (o.providers.find(p => p.id === o.primary)?.label ?? 'your AI') + ' for everything else, and sign in to ChatGPT later to personalize.' })));
    return out;
  }
  const card = h('div', { class: 'panel-soft' }, h('span', { class: 'eyebrow', text: 'IN THE BACKGROUND' }), h('h2', { text: 'Build your private Oracle corpus' }),
    h('p', { text: 'VIVIM will ask ChatGPT seven bounded questions, one at a time, about presentation, projects, interests, workflows, values and unknowns. It uses only information ChatGPT can actually recall, not your complete chat archive. Nothing is sent until you review and approve each exact question here; uncertain information stays provisional.' }));
  if (pz.corpus) {
    card.append(h('p', { class: 'help', text:
      'Oracle corpus: ' + pz.corpus.claims + ' source-backed claim records, ' +
      pz.corpus.observations + ' observations, and ' + pz.corpus.contradictions +
      ' unresolved conflict records. These are provider-reported until independently verified.' }));
  }
  if (['review', 'ready', 'attention', 'uncertain'].includes(pz.phase) && !review) {
    if (pz.passes.length) card.append(passList(pz.passes));
    card.append(h('div', { class: 'actions' }, h('button', { class: 'btn primary', type: 'button', disabled: busy.has('review'), onclick: () => run('review', async () => { review = await post('/personalize/review'); }), text: pz.passes.length ? 'Review another authorized discovery run' : 'Review seven discovery questions' })));
  } else if (review) {
    card.append(h('div', { class: 'prompts' }, review.passes.map(p => h('details', { class: 'prompt' }, h('summary', {}, h('strong', { text: p.title }), h('span', { class: 'fineprint', text: ' · exact text, fingerprint ' + p.digest.slice(0, 8) })), h('pre', { class: 'log', text: p.prompt })))),
      h('div', { class: 'actions' },
        h('button', { class: 'btn primary', type: 'button', disabled: busy.has('approve'), onclick: () => run('approve', async () => { await post('/personalize/approve', { generationId: review.generationId }); review = null; }), text: 'Approve and start' }),
        h('button', { class: 'btn', type: 'button', onclick: () => { review = null; render(); }, text: 'Not now' })),
      h('p', { class: 'help', text: 'Approval lasts 30 minutes and covers only these seven exact questions. Studio never automatically retries an uncertain send.' }));
  } else if (pz.passes.length) {
    card.append(passList(pz.passes));
    if (pz.phase === 'running') card.append(h('p', { class: 'help', text: 'This runs in the background. You can continue; VIVIM keeps going and never sends the same question twice.' }));
    if (pz.phase === 'done') card.append(h('p', { class: 'help', text: 'Done. Your phone will pick up the new look the first time it connects.' }));
  }
  out.push(card);
  return out;
}

function drawQr(url) {
  const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
  const n = qr.getModuleCount(), ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `-2 -2 ${n + 4} ${n + 4}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'QR code for ' + url); svg.setAttribute('shape-rendering', 'crispEdges');
  const bg = document.createElementNS(ns, 'rect'); bg.setAttribute('x', -2); bg.setAttribute('y', -2); bg.setAttribute('width', n + 4); bg.setAttribute('height', n + 4); bg.setAttribute('fill', '#ffffff'); svg.append(bg);
  const path = document.createElementNS(ns, 'path'); let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  path.setAttribute('d', d); path.setAttribute('fill', '#121212'); svg.append(path);
  return svg;
}
function stepPhone() {
  const phone = model.onboarding.phone, url = phone.mobileUrl, apk = phone.apk;
  const number = (n, title, body) => h('li', {}, h('span', { class:'num', 'aria-hidden':true, text:n }), h('div', {}, h('strong', { text:title }), body));
  const copy = (label, value) => h('button', { class:'btn sm', type:'button', onclick:async e => {
    try { await navigator.clipboard.writeText(value); e.currentTarget.textContent='Copied'; }
    catch { say('Copy is unavailable. Select the address and copy it manually.'); }
  }, text: label });
  const paired = Boolean(phone.paired);
  const result = [
    h('div', { class:'banner '+ (paired ? 'is-ok':'is-wait'), role:'status' },
      h('strong', { text: paired ? 'This phone has been enrolled.' : 'Your phone is not yet paired.' }),
      h('span', { text: paired ? (phone.connected ? ' Connected to this PC now.' : ' Paired; waiting for the app to connect.') : ' Install the app, then pair it below.' }))
  ];
  if (!url) {
    result.push(h('div', { class:'panel-soft' },
      h('h2', { text:'Private phone connection needed' }),
      h('p', { text:'VIVIM Direct needs your private Tailscale HTTPS address. Configure VIVIM_DIRECT_ORIGIN and VIVIM_DIRECT_USER for the Host, then reopen this step. Your PC setup and personalization are saved.' })));
    return result;
  }
  const steps = h('ol', { class:'numbered' },
    number('1', 'Install the Android app', apk
      ? h('div', {}, h('p', { text:'Version '+ (apk.versionName || 'available') +' is ready. Download the APK on Android, then approve installation through Android.' }),
          h('p', {}, h('a', { href:apk.downloadUrl, target:'_blank', rel:'noopener', text:'Download VIVIM APK' })),
          h('code', { class:'qr-url', text:apk.downloadUrl }), copy('Copy APK link', apk.downloadUrl))
      : h('div', {}, h('p', { text:'No Android app is registered with this PC. If it was built here, register it using the button below.' }),
          h('button', { class:'btn pri', type:'button', disabled:busy.has('apk'), onclick:() => run('apk', registerPhoneApk), text:'Find built Android app' }))),
    number('2', 'Pair the installed app', h('p', { text:'Open VIVIM on Android, paste the pairing link, and tap Connect. The code expires in ten minutes; it is never sent in a URL request.' })),
    number('3', 'Continue your personal World', h('p', { text:'The PC recognizes this device. Welcome, Talk and Build open while personalization continues.' }))
  );
  result.push(h('div', { class:'phone-grid' },
    steps,
    h('div', { class:'phone-links' },
      apk ? h('section', { class:'phone-code' }, h('span', { class:'eyebrow', text:'INSTALL APK' }),
        drawQr(apk.downloadUrl), h('p', { class:'fineprint', text:'Scan this code first to download and install the Android app.' })) : null,
      h('section', { class:'phone-code' }, h('span', { class:'eyebrow', text:'PAIR THIS DEVICE' }),
        paired ? h('p', { text:'Device ID: '+(phone.deviceId || 'enrolled') }) :
        pairContext && Date.parse(pairContext.expiresAt) > Date.now()
          ? h('div', {}, drawQr(pairContext.url),
              h('code', { class:'qr-url', text:pairContext.url.replace(/#[\s\S]*$/, '#[one-use-code]') }),
              copy('Copy private pairing link', pairContext.url),
              h('small', { text:'Keep the link private. If it expires, create another code.' }))
          : h('p', { class:'fineprint', text:'Create a one-use code when the app is installed.' }),
        !paired ? h('button', { class:'btn pri', type:'button', disabled:busy.has('pair'),
          onclick:mintPhoneCode, text:pairContext ? 'Create a new pairing code' : 'Create pairing code' }) : null)
    )
  ));
  return result;
}

function stepReady() {
  const o = model.onboarding, p = progress(), pz = o.personalization;
  const line = (done, text) => h('li', { class: done ? 'is-ok' : 'is-open' }, h('span', { class: 'check-mark', 'aria-hidden': 'true' }, done ? '✓' : ''), text);
  const next = (title, body) => h('li', {}, h('strong', { text: title }), h('span', { text: body }));
  return [
    h('ul', { class: 'checks' },
      line(p.computer, 'VIVIM is set up on this PC'),
      line(p.accounts, p.verified.length ? 'Signed in to ' + p.verified.map(v => v.label).join(', ') : 'Sign in to an AI'),
      line(p.main, o.primary ? 'Main AI: ' + o.providers.find(v => v.id === o.primary)?.label : 'Choose a main AI'),
      line(pz.phase === 'done', pz.phase === 'done' ? 'Your style is learned' : pz.phase === 'running' ? 'Learning your style in the background…' : pz.phase === 'unsupported' ? 'Personalizing starts once ChatGPT is your main AI' : 'Personalization not started'),
      line(p.phone, p.phone ? 'Your phone is paired' : 'Pair your phone (step 4)')),
    h('h2', { class: 'subhead', text: 'What you can do next, on your phone' }),
    h('ul', { class: 'next-list' },
      next('Build your app', 'Open Build and say what you want in your own words. VIVIM proposes it; you choose what becomes real.'),
      next('Talk to every AI in one place', 'Pick any AI you signed in to. You always see which one answered.'),
      next('See your World', 'What VIVIM knows about you, where it came from, and a way to correct it.'),
      next('Stay in control', 'Every send needs your approval. History shows what changed, and Undo puts it back.')),
    h('div', { class: 'actions' }, h('a', { class: 'btn primary', href: '/', text: 'Open Host Control' }))
  ];
}

// ---- shell ----
function renderRail(p) {
  const done = [p.computer, p.accounts, p.main, p.phone, false];
  $('rail').replaceChildren(...STEPS.map((s, i) => h('li', { class: (i === step ? 'is-current ' : '') + (done[i] ? 'is-done' : '') },
    h('button', { type: 'button', 'aria-current': i === step ? 'step' : null, onclick: () => { step = i; userMoved = true; render(); } },
      h('span', { class: 'rail-mark', 'aria-hidden': 'true' }, done[i] ? '✓' : String(i + 1)), h('span', { text: s.rail })))));
}
function renderStrip() {
  const pz = model.onboarding.personalization, strip = $('bg-strip');
  const text = { running: 'Learning your style…', done: 'Your style is learned', attention: 'Personalizing needs you', uncertain: 'Personalizing paused' }[pz.phase];
  strip.hidden = !text;
  if (!text) return;
  strip.className = 'bg-strip is-' + pz.phase;
  strip.replaceChildren(h('span', { class: 'strip-dot', 'aria-hidden': 'true' }), h('span', { text }), h('small', { text: pz.passes.filter(x => x.status === 'complete').length + ' of ' + pz.passes.length + ' done' }));
}
function render() {
  if (!model) return;
  const p = progress();
  if (step < 0 || (!userMoved && step !== firstOpen(p))) step = firstOpen(p);
  const s = STEPS[step];
  $('eyebrow').textContent = s.eyebrow; $('heading').textContent = s.title; $('subtitle').textContent = s.sub;
  renderRail(p); renderStrip();
  const builders = [stepComputer, stepAccounts, stepMain, stepPhone, stepReady];
  const focusId = document.activeElement?.id;
  $('panel').replaceChildren(...builders[step]().filter(Boolean));
  if (focusId) $(focusId)?.focus?.();
  $('back').hidden = step === 0; $('next').hidden = step === 4;
  $('next').disabled = !canContinue(p);
  $('next').textContent = step === 3 ? (p.phone ? 'Continue' : 'Skip for now') : 'Continue';
  $('hint').textContent = step === 3 && !p.phone ? 'You can connect your phone any time.' : '';
}
async function refresh() {
  try { model = await call('/state'); } catch (error) { say('Cannot reach VIVIM on this PC: ' + error.message); return; }
  render();
}
$('back').addEventListener('click', () => { step = Math.max(0, step - 1); userMoved = true; render(); });
$('next').addEventListener('click', () => { step = Math.min(4, step + 1); userMoved = true; render(); });
refresh();
setInterval(() => { if (!document.hidden && !busy.size) refresh(); }, 3000);
