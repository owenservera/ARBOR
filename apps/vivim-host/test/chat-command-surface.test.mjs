import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { resolveDesktopDestination, resolveProductRoute } from '../../mobile-relay/control-language.mjs';
import { mountComposerAssist } from '../../mobile-relay/composer-assist.mjs';
import { randomBytes } from 'node:crypto';
import { createHostServer } from '../server.mjs';

const src = readFileSync(fileURLToPath(new URL('../public/pages/chat.js', import.meta.url)), 'utf8');
const ownerToken = randomBytes(32).toString('hex');
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(testFn) {
  for (let i = 0; i < 150; i++) {
    if (testFn()) return;
    await tick();
  }
  assert.fail('Timed out waiting for the Chat UI to render');
}
function dom() {
  class Node {
    constructor(tag = 'div') {
      this.tagName = tag.toUpperCase();
      this.textContent = '';
      this.className = '';
      this.disabled = false;
      this.hidden = false;
      this.value = '';
      this.children = [];
      this.listeners = {};this.attributes={};this.dataset={};
      this.scrollHeight = 0;
      this.scrollTop = 0;
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = [...children]; }
    addEventListener(kind, handler) { (this.listeners[kind] ||= []).push(handler); }
    async fire(kind, event = {}) {
      await Promise.all((this.listeners[kind] || []).map(fn => fn({
        preventDefault() {}, ...event
      })));
    }
    focus() {}
    setAttribute(name,value){this.attributes[name]=value;}
  }
  const elements = new Map(['log', 'rev', 'f', 't', 'send', 'control-status',
    'control-result', 'control-recent', 'control-logout','composer-assist'].map(id => [id, new Node()]));
  const all = root => [root, ...root.children.flatMap(child => all(child))];
  const text = id => all(elements.get(id)).map(n => n.textContent).join(' ');
  const buttons = id => all(elements.get(id)).filter(n => n.tagName === 'BUTTON');
  const document={getElementById:id=>elements.get(id)||null,createElement:tag=>new Node(tag),addEventListener(){}};
  for(const node of elements.values())node.ownerDocument=document;
  return {elements,text,buttons,document};
}
async function withHost(fn) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vivim-chat-command-'));
  let server = createHostServer({ dataRoot: root, ownerToken });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let base = 'http://127.0.0.1:' + server.address().port;
  const send = (route, body, headers = {}) => fetch(base + route, {
    method: 'POST', headers: { origin: base, 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  // Restart the actual Host on the same data directory, not a mocked projection.
  const restart = async () => {
    await new Promise(resolve => server.close(resolve));
    server = createHostServer({ dataRoot: root, ownerToken });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
    return { base, send };
  };
  try { await fn({ base, send, restart }); }
  finally {
    await new Promise(resolve => server.close(resolve));
    try { rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 250 }); }
    catch { /* Windows SQLite handles can close after the Host listener */ }
  }
}
async function openSession(send) {
  const issued = await send('/api/host/control/ui-session', {}, {
    authorization: 'Bearer ' + ownerToken, 'x-vivim-control': '1'
  });
  assert.equal(issued.status, 201);
  return (await issued.json()).code;
}
function browser(base, code = '', shared = { cookie: '', executeCount: 0, loseResponse: false }) {
  const ui = dom();
  const window = {
    location: { hash: code ? '#control-session=' + code : '', pathname: '/chat', search: '' },
    history: { replaceState(_a, _b, url) { this.lastUrl = url; window.location.hash = ''; } }
  };
  async function browserFetch(route, opts = {}) {
    const h = new Headers(opts.headers || {});
    if (opts.method === 'POST') h.set('origin', base);
    if (shared.cookie) h.set('cookie', shared.cookie);
    if (route === '/api/host/control/execute') shared.executeCount++;
    const response = await fetch(base + route, { ...opts, headers: h });
    if (route === '/api/host/control/ui-exchange' && response.ok) {
      shared.cookie = response.headers.get('set-cookie').split(';')[0];
      shared.csrf = (await response.clone().json()).csrf;
    }
    if (route === '/api/host/control/execute' && shared.loseResponse) {
      shared.loseResponse = false;
      throw new Error('Simulated response lost after Host write');
    }
    return response;
  }
  const entry=src.replace("import { resolveDesktopDestination, resolveProductRoute } from '/mobile/control-language.mjs';",'')
    .replace("import { mountComposerAssist } from '/mobile/composer-assist.mjs';",'');
  vm.runInNewContext(entry, { resolveDesktopDestination, resolveProductRoute, mountComposerAssist, document: ui.document, window, fetch: browserFetch,
    setInterval: () => 1, Date, console, encodeURIComponent });
  return { ui, window, shared };
}
const findButton = (ui, text) => ui.buttons('control-result').find(b => b.textContent.includes(text));

test('real Chat UI → owner exchange → typed plan → explicit approval → bootstrap theme → recovered Host receipt', async () =>
  withHost(async ({ base, send }) => {
    const grant = await send('/api/host/bootstrap/grant', { scope: 'onboarding-visual' }, {
      authorization: 'Bearer ' + ownerToken, 'x-vivim-bootstrap': '1'
    });
    assert.equal(grant.status, 200);
    const code = await openSession(send);
    const shared = { cookie: '', executeCount: 0, loseResponse: false };
    const { ui, window } = browser(base, code, shared);
    await until(() => ui.text('control-status').includes('Owner session active'));
    assert.equal(window.location.hash, '', 'launch fragment removed before HTTP');
    ui.elements.get('t').value = 'set my theme to dusk';
    await ui.elements.get('f').fire('submit');
    assert.match(ui.text('control-result'), /Approve exactly this Host action/);
    assert.match(ui.text('control-result'), /ui.theme.set_preset/);
    const readTheme = async () => {
      const res = await send('/api/host/control/plan',
        { actionId: 'ui.theme.show', args: {} }, {
          authorization: 'Bearer ' + ownerToken, 'x-vivim-control': '1'
        });
      assert.equal(res.status, 200);
      return (await res.json()).result;
    };
    assert.notEqual((await readTheme()).preset, 'dusk', 'preview never applies');
    const approve = findButton(ui, 'Approve & apply on PC');
    assert.ok(approve);
    await Promise.all([approve.fire('click'), approve.fire('click')]);
    await until(() => ui.text('control-result').includes('Applied by Host'));
    assert.equal((await readTheme()).preset, 'dusk');
    assert.equal(shared.executeCount, 1, 'double tap invokes execute at most once');
    assert.match(ui.text('control-result'), /Host readback: theme dusk/);
    assert.match(ui.text('log'), /Interpretation only/);
    const entries = await (await fetch(base + '/api/journal')).json();
    assert.deepEqual(entries.map(row => row.kind), ['chat-send'],
      'chat record remains independent from the Control effect receipt');
    const reload = browser(base, '', shared);
    await until(() => reload.ui.text('control-result').includes('Applied by Host'));
    assert.match(reload.ui.text('control-result'), /Host receipt: ctl-/);
    assert.equal(shared.executeCount, 1, 'history restores original receipt without applying again');
  }));

test('locked browser may record a chat message but cannot plan or execute a Host mutation', async () =>
  withHost(async ({ base }) => {
    const shared = { cookie: '', executeCount: 0, loseResponse: false };
    const { ui } = browser(base, '', shared);
    await until(() => ui.text('control-status').includes('Commands locked'));
    ui.elements.get('t').value = 'set my theme to ink';
    await ui.elements.get('f').fire('submit');
    assert.match(ui.text('control-result'), /Host commands are locked/);
    assert.equal(shared.executeCount, 0);
    const state = await (await fetch(base + '/api/state')).json();
    assert.equal(state.chat.length, 1);
    assert.equal((await fetch(base + '/api/host/control/catalog')).status, 401);
  }));

test('lost execution response exposes original plan inspection, never auto retries', async () =>
  withHost(async ({ base, send }) => {
    assert.equal((await send('/api/host/bootstrap/grant', { scope: 'onboarding-visual' }, {
      authorization: 'Bearer ' + ownerToken, 'x-vivim-bootstrap': '1' })).status, 200);
    const shared = { cookie: '', executeCount: 0, loseResponse: false };
    const { ui } = browser(base, await openSession(send), shared);
    await until(() => ui.text('control-status').includes('Owner session active'));
    ui.elements.get('t').value = 'set my theme to ink';
    await ui.elements.get('f').fire('submit');
    assert.ok(findButton(ui, 'Approve & apply on PC'));
    shared.loseResponse = true;
    await findButton(ui, 'Approve & apply on PC').fire('click');
    await until(() => ui.text('control-result').includes('Execution response unconfirmed'));
    assert.equal(shared.executeCount, 1);
    await findButton(ui, 'Check original plan').fire('click');
    await until(() => ui.text('control-result').includes('Applied by Host'));
    assert.equal(shared.executeCount, 1);
    assert.match(ui.text('control-result'), /Host receipt: ctl-/);
  }));


async function themeFromHost(send) {
  const response = await send('/api/host/control/plan',
    { actionId: 'ui.theme.show', args: {} },
    { authorization: 'Bearer ' + ownerToken, 'x-vivim-control': '1' });
  assert.equal(response.status, 200);
  const plan = await response.json();
  assert.equal(plan.outcome, 'done');
  return plan.result;
}

test('read, ambiguity, cancellation and rejected owner session never trigger execution', async () =>
  withHost(async ({ base, send }) => {
    const shared = { cookie: '', executeCount: 0, loseResponse: false };
    const ui = browser(base, await openSession(send), shared).ui;
    await until(() => ui.text('control-status').includes('Owner session active'));

    ui.elements.get('t').value = 'show my theme';
    await ui.elements.get('f').fire('submit');
    assert.match(ui.text('control-result'), /Host read only/);
    assert.equal(findButton(ui, 'Approve & apply on PC'), undefined);

    ui.elements.get('t').value = 'stop all traffic';
    await ui.elements.get('f').fire('submit');
    assert.match(ui.text('control-result'), /Host interpretation/);
    assert.match(ui.text('control-result'), /No Host effect was executed/);
    assert.equal(findButton(ui, 'Approve & apply on PC'), undefined);

    const before = (await themeFromHost(send)).preset;
    ui.elements.get('t').value = 'set theme to dusk';
    await ui.elements.get('f').fire('submit');
    assert.ok(findButton(ui, 'Approve & apply on PC'));
    const cancel = findButton(ui, 'Cancel · no Host change');
    assert.ok(cancel);
    await cancel.fire('click');
    assert.match(ui.text('control-result'), /Cancelled/);
    assert.equal((await themeFromHost(send)).preset, before);
    assert.equal(shared.executeCount, 0, 'no R0, clarification or cancellation can execute');

    // Revoke the same HttpOnly browser session externally, then try another command.
    const loggedOut = await send('/api/host/control/ui-logout', {}, {
      cookie: shared.cookie, 'x-vivim-control': '1',
      'x-vivim-ui-csrf': shared.csrf
    });
    assert.equal(loggedOut.status, 200);
    ui.elements.get('t').value = 'set theme to ink';
    await ui.elements.get('f').fire('submit');
    assert.match(ui.text('control-status'), /Session expired|Owner session expired/);
    assert.equal(shared.executeCount, 0);
    assert.equal((await themeFromHost(send)).preset, before);
  }));

test('real Host restart preserves theme and prior Control receipt; fresh owner session recovers history', async () =>
  withHost(async ({ base, send, restart }) => {
    assert.equal((await send('/api/host/bootstrap/grant',
      { scope: 'onboarding-visual' },
      { authorization: 'Bearer ' + ownerToken, 'x-vivim-bootstrap': '1' })).status, 200);

    const shared = { cookie: '', executeCount: 0, loseResponse: false };
    const ui = browser(base, await openSession(send), shared).ui;
    await until(() => ui.text('control-status').includes('Owner session active'));
    ui.elements.get('t').value = 'set my theme to dusk';
    await ui.elements.get('f').fire('submit');
    const approve = findButton(ui, 'Approve & apply on PC');
    assert.ok(approve, 'a real typed theme plan must be visible');
    await approve.fire('click');
    await until(() => ui.text('control-result').includes('Applied by Host'));
    assert.equal((await themeFromHost(send)).preset, 'dusk');
    assert.equal(shared.executeCount, 1);

    const afterRestart = await restart();
    assert.equal((await themeFromHost(send)).preset, 'dusk',
      'theme comes from the persisted bootstrap ledger after closing the original Host');
    const previous = await fetch(afterRestart.base + '/api/host/control/recent',
      { headers: { authorization: 'Bearer ' + ownerToken } });
    assert.equal(previous.status, 200);
    const recent = (await previous.json()).items;
    assert.ok(recent.some(item => item.actionId === 'ui.theme.set_preset' && item.state === 'applied'));

    // A new Host has new short-lived browser sessions. Reopen through native owner exchange.
    const reopened = browser(afterRestart.base, await openSession(send),
      { cookie: '', executeCount: 0, loseResponse: false });
    await until(() => reopened.ui.text('control-result').includes('Applied by Host'));
    assert.match(reopened.ui.text('control-result'), /Host receipt: ctl-/);
    assert.equal(reopened.shared.executeCount, 0, 'history recovery must not repeat the theme effect');
  }));
