// NEXT:D14.device-pairing — native-panel boundary and revoked-grant acceptance.
// Every behavioral assertion below executes the *committed* app.js function
// (extracted from ../app.js and run in a vm sandbox), not a copy of it, so the
// same source that index.html loads is the source under test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

/* ---------- source extraction (same approach as wiki-live-context.test.mjs) ---------- */

function declSource(source, name) {
  const re = new RegExp(
    '(?:async[ \\t]+)?function[ \\t]+' + name + '[ \\t]*\\(' +
    '|(?:const|let|var)[ \\t]+' + name + '[ \\t]*=[ \\t]*(?:async[ \\t]*)?\\([^)]*\\)[ \\t]*=>');
  const m = re.exec(source);
  assert.ok(m, name + ' must exist in the committed PWA source (app.js)');
  const from = source.indexOf('{', m.index + m[0].length - 1);
  assert.notEqual(from, -1, name + ' must have a block body');
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(m.index, i + 1);
  }
  throw new Error('Unbalanced ' + name);
}

function callersOf(symbol) {
  const re = /(?:^|\n)[ \t]*(?:async[ \t]+)?function[ \t]+([A-Za-z_$][\w$]*)[ \t]*\(/g;
  const names = [];
  let m;
  while ((m = re.exec(app))) {
    const from = app.indexOf('{', m.index + m[0].length - 1);
    let depth = 0, end = -1;
    for (let i = from; i < app.length; i++) {
      if (app[i] === '{') depth++;
      else if (app[i] === '}' && --depth === 0) { end = i; break; }
    }
    if (end > 0 && app.slice(from, end).includes(symbol)) names.push(m[1]);
  }
  return names.sort();
}

/* ---------- tiny DOM / storage shims ---------- */

function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    keys: () => [...map.keys()]
  };
}

function makeNode(tag) {
  return {
    tagName: tag, children: [], className: '', textContent: '', value: '', hidden: false,
    style: {}, attrs: {}, scrollHeight: 1000, scrollTop: 0, clientHeight: 100,
    append(...n) { this.children.push(...n); },
    setAttribute(k, v) { this.attrs[k] = v; },
    replaceChildren(...n) { this.children = n; },
    classList: { add() {}, remove() {}, toggle() {} }
  };
}

function textOf(node) {
  let out = String(node.textContent || '');
  for (const c of node.children || []) out += '|' + textOf(c);
  return out;
}

function makeDom(ids) {
  const reg = {};
  for (const id of ids) reg[id] = makeNode('div#' + id);
  const document = {
    hidden: false,
    body: makeNode('body'),
    createDocumentFragment: () => makeNode('#fragment'),
    getElementById: id => reg[id]
  };
  return { $: id => reg[id], document, reg };
}

const elStub = (tag, cls, text) => {
  const n = makeNode(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/* ---------- 1. same committed source is what the UI loads and what we execute ---------- */

test('index.html loads the exact committed app.js this test executes', () => {
  assert.match(indexHtml, /<script type="module" src="app\.js"><\/script>/,
    'the PWA shell must load app.js itself — no second implementation');
  assert.ok(app.includes('function clearPrivatePhoneState()'),
    'the revoked-grant guard under test is the committed source');
});

/* ---------- 2. real callers / owners of the six ledger symbols ---------- */

test('saveNativePending has real callers only inside the native phone panel lifecycle', () => {
  assert.deepEqual(callersOf('saveNativePending'),
    ['clearPrivatePhoneState', 'nativeRefresh', 'nativeSend', 'startHostPreview'],
    'the native pending record is owned by the native panel and the revoke guard only');
});

test('saveConvs is owned by conversation management and the single send path only', () => {
  assert.deepEqual(callersOf('saveConvs'),
    ['deleteConv', 'ensureActive', 'mergeServerConvs', 'newConv', 'normalizeConv', 'selectConv', 'send']);
});

test('nativeSend is entered only from the universal composer send()', () => {
  assert.deepEqual(callersOf('nativeSend'), ['send']);
  assert.match(declSource(app, 'send'), /if \(N\.target === 'phone'\) return nativeSend\(\)/);
});

test('renderNative is presentation only, called by the native read model', () => {
  assert.deepEqual(callersOf('renderNative'), ['nativeRefresh', 'nativeSend', 'nativeSessions', 'renderMsgs']);
  const body = declSource(app, 'renderNative');
  assert.doesNotMatch(body, /fetch\(|localStorage|sessionStorage|api\(/,
    'renderNative must consume the existing read model, not do I/O');
  assert.match(body, /if \(!S\.paired\)/, 'unpaired state renders a connect notice, never cached data');
});

test('nativeRefresh/nativeSend do I/O only through the canonical typed Host route (api)', () => {
  for (const name of ['nativeRefresh', 'nativeSend']) {
    const body = declSource(app, name);
    assert.doesNotMatch(body, /fetch\(|localStorage|window\.open|navigator\./,
      name + ' must not do direct native I/O');
    assert.match(body, /api\(/, name + ' must go through transport.request (typed Host route)');
  }
  assert.match(declSource(app, 'nativeRefresh'),
    /api\('sessions\/' \+ encodeURIComponent\(session\) \+ '\/messages'\)/);
  assert.match(declSource(app, 'nativeSend'),
    /api\('sessions\/' \+ encodeURIComponent\(session\) \+ '\/prompt', \{ method: 'POST'/);
});

test('clearPrivatePhoneState is called only from revoke/guard paths', () => {
  const callers = callersOf('clearPrivatePhoneState');
  for (const f of callers) {
    assert.ok(['openMediaPlayer', 'readGraphContext', 'refresh', 'refreshBuildBindings',
      'refreshMedia', 'refreshWiki', 'runStart', 'showOfflineShell']
      .includes(f), f + ' is not a known revoke/guard caller');
  }
  assert.ok(callers.includes('readGraphContext') && callers.includes('runStart'));
});

test('Talk/Wiki/Build context consumers never touch the native pending record or the conv store', () => {
  for (const f of ['readGraphContext', 'renderFocusPanel', 'renderWiki', 'renderWikiContext', 'refreshWiki', 'renderMsgs', 'goTab', 'updateDock']) {
    const body = declSource(app, f);
    assert.ok(!body.includes('saveNativePending'), f + ' must not write the native pending record');
    assert.ok(!body.includes('saveConvs'), f + ' must not write the conversation store');
  }
});

/* ---------- 3. runtime: saveNativePending + saveConvs stay client-local ---------- */

test('saveNativePending persists/erases only the native panel key in sessionStorage', () => {
  const sessionStorage = memStorage();
  const env = { N: { pending: { id: 'm1', text: 'hi' } }, sessionStorage };
  vm.createContext(env);
  vm.runInContext(declSource(app, 'saveNativePending'), env);
  env.saveNativePending();
  assert.deepEqual(sessionStorage.keys(), ['vivim.phone.pending.v1']);
  assert.deepEqual(JSON.parse(sessionStorage.getItem('vivim.phone.pending.v1')), { id: 'm1', text: 'hi' });
  env.N.pending = null;
  env.saveNativePending();
  assert.equal(sessionStorage.getItem('vivim.phone.pending.v1'), null, 'cleared pending erases the key');
});

test('saveConvs persists only the PWA-local conversation projection keys', () => {
  const store = memStorage();
  const env = {
    S: { convs: [{ id: 'c1' }, { id: 'c2' }], active: 'c1' },
    lsSet: (k, v) => store.setItem(k, JSON.stringify(v)), // mirror the real lsSet (app.js:47) which stringifies
    lsGet: (k, d) => (store.getItem(k) == null ? d : JSON.parse(store.getItem(k)))
  };
  vm.createContext(env);
  vm.runInContext(declSource(app, 'saveConvs') + '\nsaveConvs();', env);
  assert.deepEqual(store.keys().sort(), ['relay.active.v1', 'relay.convs.v1']);
  assert.equal(JSON.parse(store.getItem('relay.active.v1')), 'c1');
  assert.deepEqual(JSON.parse(store.getItem('relay.convs.v1')), [{ id: 'c1' }, { id: 'c2' }]);
});

/* ---------- 4. runtime: a revoked grant clears displayed AND persisted native data ---------- */

function revokeEnv() {
  const dom = makeDom(['msgs', 'title', 'native-status', 'text', 'dbg', 'app', 'pairbox']);
  const pendingItem = { id: 'msg_deadbeef', session: 'sess-1', text: 'SECRET-PENDING-TEXT', accepted: true };
  const sessionStorage = memStorage({ 'vivim.phone.pending.v1': JSON.stringify(pendingItem) });
  const clearedTimers = [];
  const env = {
    N: {
      target: 'phone', session: 'sess-1', sessions: [{ id: 'sess-1', title: 'PC chat' }],
      messages: [{ id: 'm0', type: 'assistant', text: 'old reply' }], timer: 77, generation: 1,
      sending: false, note: 'Working · waiting for a reply.', pending: pendingItem
    },
    S: {
      paired: true, cmds: [], statusObj: { snapshot: {} }, manifest: {}, files: [],
      sigs: { ux: null, msgs: null, list: null }, media: {}, timer: 5, tab: 'talk', convs: [], active: null
    },
    transport: { direct: true },
    sessionStorage,
    document: dom.document,
    window: { dispatchEvent() {} },
    CustomEvent: class { constructor(type, opts) { this.type = type; this.detail = opts && opts.detail; } },
    buildBindingSequence: 0, buildPollSequence: 0, phoneRefreshEpoch: 0, mediaGeneration: 0, chatContextEpoch: 0, chatContext: null, dockExpanded: true,
    shellPresentation: { clear() { this.cleared = true; } },
    dockAssist: null, compose: null, capabilityLauncher: null,
    closeFocusPanel() {}, stopMediaPlayer() {}, clearWiki() {}, vivimChat: { redact() {} },
    build: null,
    el: elStub, $: dom.$,
    clearTimeout(t) { clearedTimers.push(t); },
    setTimeout() { return 1; }
  };
  vm.createContext(env);
  vm.runInContext(declSource(app, 'saveNativePending'), env);
  vm.runInContext(declSource(app, 'clearPrivatePhoneState'), env);
  vm.runInContext(declSource(app, 'renderNative'), env);
  return { env, dom, sessionStorage, clearedTimers, pendingItem };
}

test('revoked grant (clearPrivatePhoneState) clears displayed and persisted native pending data', () => {
  const { env, dom, sessionStorage, clearedTimers, pendingItem } = revokeEnv();
  // Simulate the load-time restore (app.js:154) that ran before revocation.
  assert.equal(sessionStorage.getItem('vivim.phone.pending.v1'), JSON.stringify(pendingItem));

  env.clearPrivatePhoneState();

  assert.equal(env.S.paired, false);
  assert.equal(env.N.pending, null, 'in-memory pending record erased on revoke');
  assert.equal(env.N.messages.length, 0, 'native transcript cleared');
  assert.equal(env.N.session, '', 'native session cleared');
  assert.equal(env.N.timer, 0);
  assert.ok(clearedTimers.includes(77), 'the native transcript poll timer is cancelled');
  assert.equal(sessionStorage.getItem('vivim.phone.pending.v1'), null,
    'persisted pending record erased on revoke (real saveNativePending runs inside the guard)');

  // Reload restore path (app.js:154 semantics) now yields nothing private.
  env.N.pending = JSON.parse(sessionStorage.getItem('vivim.phone.pending.v1') || 'null');
  assert.equal(env.N.pending, null);

  // Displayed data after revocation: connect notice only, no private text.
  env.renderNative();
  const shown = textOf(dom.reg.msgs);
  assert.match(shown, /Connect to your PC to read its sessions\./);
  assert.ok(!shown.includes('SECRET-PENDING-TEXT'), 'revoked grant must not display queued native text');
  assert.ok(!shown.includes('old reply'), 'revoked grant must not display cached transcript text');
});

test('renderNative renders the pending bubble from the read model only while it exists (paired)', () => {
  const { env, dom } = revokeEnv();
  env.clearPrivatePhoneState();
  env.S.paired = true;
  env.N.session = 'sess-1';
  env.N.messages = [{ id: 'm0', type: 'assistant', text: 'hi' }];
  env.N.pending = { id: 'msg_x', session: 'sess-1', text: 'QUEUED-TEXT', accepted: true };
  env.renderNative();
  let shown = textOf(dom.reg.msgs);
  assert.ok(shown.includes('QUEUED-TEXT') && shown.includes('Queued · awaiting transcript'),
    'while paired, renderNative presents the pending record from N (read model)');
  env.N.pending = null;
  env.renderNative();
  shown = textOf(dom.reg.msgs);
  assert.ok(!shown.includes('QUEUED-TEXT'), 'once cleared, the bubble is gone from the display');
});

test('host preview start also drops any restored native pending record', () => {
  assert.match(declSource(app, 'startHostPreview'), /N\.pending = null; saveNativePending\(\);/);
});

/* ---------- 5. runtime: nativeSend via the canonical typed Host route ---------- */

function sendEnv(ack) {
  const dom = makeDom(['text', 'msgs', 'title', 'native-status']);
  const sessionStorage = memStorage();
  const calls = [];
  const env = {
    N: { target: 'phone', session: 'sess-1', sessions: [], messages: [], timer: 0, generation: 1, sending: false, note: '', pending: null },
    S: { paired: true },
    transport: { direct: true },
    sessionStorage, document: dom.document, $: dom.$, el: elStub,
    api: async (route, opts) => {
      calls.push({ route, opts });
      if (route === 'sessions/sess-1/prompt') return ack(JSON.parse(opts.body));
      throw new Error('unexpected route ' + route);
    },
    hex16: () => 'aa',
    autogrow() {}, updateSend() {}, renderNative() {}, nativeRefresh() {}
  };
  vm.createContext(env);
  vm.runInContext(declSource(app, 'saveNativePending'), env);
  vm.runInContext(declSource(app, 'nativeSend'), env);
  return { env, dom, sessionStorage, calls };
}

test('nativeSend posts exactly one typed prompt to the Host and persists pending via saveNativePending', async () => {
  const { env, dom, sessionStorage, calls } = sendEnv(b => ({ accepted: true, id: b.id, sessionId: 'sess-1' }));
  dom.reg.text.value = 'hello pc';
  await env.nativeSend();
  assert.equal(calls.length, 1, 'exactly one Host call per send');
  assert.equal(calls[0].route, 'sessions/sess-1/prompt');
  assert.equal(calls[0].opts.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].opts.body), { id: 'msg_aaaa', text: 'hello pc' });
  assert.equal(env.N.pending.accepted, true, 'acknowledged pending is marked accepted');
  assert.ok(sessionStorage.getItem('vivim.phone.pending.v1').includes('hello pc'),
    'the real saveNativePending persists the pending record');
  assert.equal(dom.reg.text.value, '', 'composer cleared after accepted send');
  assert.equal(env.N.sending, false);
});

test('nativeSend never re-sends on an unexpected acknowledgment (uncertain, kept for review)', async () => {
  const { env, dom, calls } = sendEnv(() => ({ accepted: true, id: 'different', sessionId: 'sess-1' }));
  dom.reg.text.value = 'secret2';
  await env.nativeSend();
  assert.equal(calls.length, 1, 'no retry, no second POST');
  assert.match(env.N.note, /Send uncertain/);
  assert.equal(env.N.pending.accepted, false, 'pending stays unaccepted so the PC review path shows it');
  assert.equal(env.N.sending, false);
});

test('nativeSend refuses to run without a paired Direct session selection', async () => {
  const { env, dom, calls } = sendEnv(b => ({ accepted: true, id: b.id, sessionId: 'sess-1' }));
  dom.reg.text.value = 'hello pc';
  env.N.session = '';
  await env.nativeSend();
  env.N.session = 'sess-1';
  env.N.pending = { id: 'blocked' };
  await env.nativeSend();
  assert.equal(calls.length, 0, 'no Host call without a session or while a pending send exists');
});

/* ---------- 6. runtime: nativeRefresh reads only through api and honors revocation ---------- */

function refreshEnv(messages, paired = true) {
  const dom = makeDom(['msgs', 'title', 'native-status']);
  const sessionStorage = memStorage({ 'vivim.phone.pending.v1': JSON.stringify({ id: 'm1', session: 'sess-1', accepted: true }) });
  const calls = [];
  const cleared = [];
  let armed = null;
  const env = {
    N: { target: 'phone', session: 'sess-1', sessions: [], messages: [], timer: 9, generation: 3, sending: false, note: '', pending: { id: 'm1', session: 'sess-1', accepted: true } },
    S: { paired },
    transport: { direct: true },
    sessionStorage, document: dom.document, $: dom.$, el: elStub,
    api: async route => {
      calls.push(route);
      if (route === 'sessions/sess-1/messages') return { messages };
      throw new Error('unexpected route ' + route);
    },
    renderNative() {}, updateSend() {},
    clearTimeout(t) { cleared.push(t); },
    setTimeout(fn, ms) { armed = { fn, ms }; return 42; }
  };
  vm.createContext(env);
  vm.runInContext(declSource(app, 'saveNativePending'), env);
  vm.runInContext(declSource(app, 'nativeRefresh'), env);
  return { env, sessionStorage, calls, cleared, armed: () => armed };
}

test('nativeRefresh reads the transcript through the typed Host route and clears pending on reply', async () => {
  const { env, sessionStorage, calls, armed } = refreshEnv([
    { id: 'm1', type: 'user', text: 'q' },
    { id: 'm2', type: 'assistant', text: 'a', completed: true }
  ]);
  await env.nativeRefresh();
  assert.deepEqual(calls, ['sessions/sess-1/messages']);
  assert.equal(env.N.messages.length, 2);
  assert.equal(env.N.pending, null, 'completed reply clears the pending record');
  assert.equal(sessionStorage.getItem('vivim.phone.pending.v1'), null, 'and erases the persisted key');
  assert.equal(armed().ms, 3000, 'poll re-arms through the existing scheduling path');
});

test('nativeRefresh does not call the Host at all once the grant is revoked/unpaired', async () => {
  const { env, calls, cleared } = refreshEnv([], false);
  await env.nativeRefresh();
  assert.equal(calls.length, 0, 'no Host read after revocation');
  assert.ok(cleared.includes(9), 'the armed poll timer is cancelled');
});
