import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { worldModel, meModel, todayModel } from '../ux/model.mjs';
import { renderToday, renderWorld, renderMe } from '../ux/render.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const modelSrc = readFileSync(new URL('../ux/model.mjs', import.meta.url), 'utf8');
const renderSrc = readFileSync(new URL('../ux/render.mjs', import.meta.url), 'utf8');

/* ---------- a small DOM the renderer can be driven with ---------- */
class FakeNode {
  constructor(tag, ownerDocument) {
    this.tag = tag; this.ownerDocument = ownerDocument; this.style = {};
    this.children = []; this.attrs = {}; this.events = {}; this.className = ''; this.textContent = '';
    this.hidden = false; this.type = '';
  }
  appendChild(x) { this.children.push(x); return x; }
  append(...xs) { for (const x of xs) this.children.push(x); }
  replaceChildren(...xs) { this.children = xs; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, fn) { this.events[k] = fn; }
}
function fakeHost() {
  const doc = { createElement(tag) { return new FakeNode(tag, doc); } };
  const host = new FakeNode('section', doc);
  host.ownerDocument = doc;
  return host;
}
function findAll(node, predicate, out = []) {
  if (!node) return out;
  if (predicate(node)) out.push(node);
  for (const child of node.children || []) findAll(child, predicate, out);
  return out;
}
function byClass(node, cls) {
  return findAll(node, n => String(n.className || '').split(/\s+/).includes(cls));
}
function textOf(node) {
  if (!node) return '';
  let out = node.textContent ? String(node.textContent) : '';
  for (const child of node.children || []) out += ' ' + textOf(child);
  return out;
}

/* ---------- Host payload fixtures (shapes the Host really sends) ---------- */
const committed = (children) => ({
  schema: 'vivim.ui-surface/1', surfaceId: 'my-space', revision: 3, catalogVersion: 1,
  theme: { background: '#111722', secondary: '#243146', accent: '#78b8f6', appearance: 'dark', texture: 'solid',
    mood: 'focused', density: 'comfortable', motion: 'still', fontFamily: 'system', fontSizePx: 15,
    headingSizePx: 28, radiusPx: 14, spacingScale: 1 },
  tree: { id: 'root', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children }
});
const cardNode = (id, title, description) => ({ id, type: 'card', props: { title, description }, children: [] });
const uiRevision = (children) => {
  const base = committed(children);
  return { ...base, surface: base, surfaceId: 'my-space', revision: 3, status: 'applied', changeId: 'chg-1', parentRevision: 2 };
};
const statusOf = snapshot => ({ at: '2026-11-05T10:00:00.000Z', snapshot });
// Only the button markup defines the tab strip; the stylesheet also contains
// .tab[data-tab=...] pseudo-element rules that must not count as tabs.
const tabsIn = () => [...html.matchAll(/<button[^>]*\bdata-tab="([^"]+)"/g)].map(m => m[1]);
const stubHiddenTabs = () => {
  const rule = app.match(/\$\('v-soon'\)\.hidden\s*=\s*\[([^\]]*)\]\.includes\(S\.tab\)/);
  assert.ok(rule, 'the retired stub panel must stay explicitly hidden');
  return [...rule[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
};

/* ---------- the tab strip ---------- */
test('the tab strip exposes Today, Talk, Build, World, Me and Control — and no Agents or Self', () => {
  assert.deepEqual(tabsIn(), ['today', 'talk', 'build', 'world', 'me', 'control']);
  assert.ok(!html.includes('data-tab="agents"'), 'the Agents stub tab must be gone');
  assert.ok(!html.includes('data-tab="self"'), 'the Self stub tab must be gone');
  for (const id of ['v-today', 'v-world', 'v-me']) {
    assert.match(html, new RegExp('id="' + id + '"'), id + ' must have its own panel');
    assert.match(app, new RegExp("\\$\\('" + id + "'\\)\\.hidden\\s*=\\s*S\\.tab\\s*!==\\s*'" + id.replace('v-', '') + "'"));
  }
});

test('reintroducing a stub panel for World or Me fails this suite', () => {
  // The retired panel is hidden for every tab in the strip, so no tab can fall back to it.
  assert.deepEqual(stubHiddenTabs().slice().sort(), tabsIn().slice().sort());
  // The stub wording survives nowhere in the phone shell.
  assert.doesNotMatch(html, /coming soon/i, 'index.html must not carry the stub wording');
  assert.doesNotMatch(app, /coming soon/i, 'app.js must not carry the stub wording');
  assert.doesNotMatch(modelSrc, /coming soon/i, 'ux/model.mjs must not carry the stub wording');
  assert.doesNotMatch(renderSrc, /coming soon/i, 'ux/render.mjs must not carry the stub wording');
  // World and Me are real panels, not aliases of the retired one.
  assert.match(app, /\$\('v-world'\)\.hidden\s*=\s*S\.tab\s*!==\s*'world'/);
  assert.match(app, /\$\('v-me'\)\.hidden\s*=\s*S\.tab\s*!==\s*'me'/);
  // The retired panel is referenced exactly once in the shell: only to keep it hidden.
  assert.equal((app.match(/v-soon/g) || []).length, 1, 'the retired panel must never be shown again');
});

/* ---------- World ---------- */
test('World shows exactly what the Host committed as a ui-revision', () => {
  const status = statusOf({
    bootstrap: { schema: 'vivim.bootstrap-phone/1', worldId: 'world-1', observedAt: '2026-11-05T10:00:00.000Z',
      uiRevision: uiRevision([cardNode('research', 'Research', 'Questions and answers in one place.')]) }
  });
  const model = worldModel(status, []);
  assert.equal(model.hostReported, true);
  assert.equal(model.built.length, 1);
  assert.equal(model.built[0].title, 'Research');
  assert.equal(model.built[0].detail, 'Questions and answers in one place.');
  assert.equal(model.revision.revision, 3);
  assert.equal(model.revision.status, 'applied');
});

test('an absent status payload gives World an honest empty state, never invented rows', () => {
  const model = worldModel(null, []);
  assert.equal(model.hostReported, false);
  assert.deepEqual(model.built, []);
  assert.deepEqual(model.running, []);
  assert.deepEqual(model.queued, []);
  assert.equal(model.revision, null);
  assert.equal(model.empty, true);
  assert.match(model.emptyMessage, /Nothing here yet/);
  assert.match(model.emptyMessage, /Build/);
  assert.ok(model.gaps.length > 0, 'a missing capability must be named');
  assert.match(model.gaps.join(' '), /Not available yet/);
});

test('a status payload with no committed revision says so instead of listing things', () => {
  const model = worldModel(statusOf({ bootstrap: { schema: 'vivim.bootstrap-phone/1', worldId: 'w', observedAt: '2026-11-05T10:00:00.000Z' } }), []);
  assert.deepEqual(model.built, []);
  assert.equal(model.revision, null);
  assert.match(model.emptyMessage, /Nothing here yet/);
});

test('World reports only the work the Host says is in flight', () => {
  const status = statusOf({
    live: { schema: 'vivim.world-conversation-timeline/1', state: 'source-backed', worldId: 'w', revision: 4,
      conversations: [{ id: 'c-1', provider: 'chatgpt', model: null, revision: 4,
        messages: [{ id: 'm-1', commandId: 'cmd-1', state: 'waiting_reply', delivered: false, requiresReview: false }] }] }
  });
  const model = worldModel(status, []);
  assert.equal(model.running.length, 1);
  assert.equal(model.running[0].state, 'waiting_reply');
  assert.match(model.running[0].detail, /awaiting reply/i);
});

/* ---------- Me ---------- */
test('Me reports identity, phone connection, permissions and activity only when the Host sent them', () => {
  const status = statusOf({
    personalAgent: { initialized: true, agentId: 'personal-agent', scope: 'local-data-directory',
      identityAssurance: 'local-instance-only; no remote account claim' },
    bootstrap: { schema: 'vivim.bootstrap-phone/1', worldId: 'world-1', observedAt: '2026-11-05T10:00:00.000Z' },
    manifest: { updatedAt: '2026-11-05T10:00:00.000Z', providers: [{ id: 'chatgpt', label: 'ChatGPT', signedIn: true }] }
  });
  const commands = [{ id: 'cmd-1', kind: 'command', consumer: 'harness', mode: 'relay-chat', status: 'done',
    target: { provider: 'chatgpt' }, updatedAt: '2026-11-05T09:00:00.000Z' }];
  const model = meModel(status, commands, { paired: true, mode: 'direct', deviceStatus: 'active', scopes: ['relay:read', 'relay:write'] });
  assert.equal(model.identity.find(r => r.label === 'Personal agent').value, 'personal-agent');
  assert.equal(model.identity.find(r => r.label === 'World').value, 'world-1');
  assert.equal(model.devices.find(r => r.label === 'This phone').value, 'Paired');
  assert.equal(model.permissions.find(r => r.label === 'This phone may').value, 'relay:read, relay:write');
  assert.equal(model.permissions.find(r => r.label === 'Signed-in AI').value, 'chatgpt');
  assert.equal(model.activity.rows.length, 1);
  assert.equal(model.activity.rows[0].label, 'Chat message to chatgpt');
  assert.equal(model.activity.rows[0].status, 'done');
});

test('Me with no Host payload names the missing capabilities instead of inventing rows', () => {
  const model = meModel(null, [], { paired: false, mode: 'cloud' });
  assert.equal(model.hostReported, false);
  assert.equal(model.identity.find(r => r.label === 'Identity').value.match(/Not available yet/) !== null, true);
  assert.equal(model.devices.find(r => r.label === 'Other devices').value.match(/Not available yet/) !== null, true);
  assert.equal(model.permissions.find(r => r.label === 'Permissions').value.match(/Not available yet/) !== null, true);
  assert.deepEqual(model.activity.rows, []);
  assert.match(model.activity.emptyMessage, /Not available yet/);
});

/* ---------- Today ---------- */
test('Today always names one primary next action, even with nothing from the Host', () => {
  const model = todayModel(null, [], { connection: 'Connecting…', connectionTone: 'ok' });
  assert.ok(model.next && model.next.label.length > 0, 'Today must name its next action');
  assert.ok(['talk', 'build', 'world'].includes(model.next.tab), 'the next action must lead to a real surface');
  assert.equal(model.attention.length, 0);
  assert.match(model.attentionEmpty, /Nothing needs you/);
  assert.match(model.gaps.join(' '), /pending-approvals/i);
});

test('Today turns an uncertain send into an attention item that leads to Talk', () => {
  const status = statusOf({
    live: { schema: 'vivim.world-conversation-timeline/1', state: 'source-backed', worldId: 'w', revision: 2,
      conversations: [{ id: 'c-1', provider: 'chatgpt', model: null, revision: 2,
        messages: [{ id: 'm-1', commandId: 'cmd-1', state: 'uncertain', delivered: false, requiresReview: true }] }] }
  });
  const model = todayModel(status, [], { connection: 'Connected to PC' });
  assert.equal(model.attention.length, 1);
  assert.match(model.attention[0].title, /uncertain/i);
  assert.match(model.attention[0].detail, /not.*resent|never resent/i);
  assert.equal(model.next.tab, 'talk');
});

test('Today turns a failed receipt into an attention item and never claims it succeeded', () => {
  const commands = [{ id: 'cmd-9', kind: 'command', consumer: 'harness', mode: 'relay-chat', status: 'failed',
    target: { provider: 'chatgpt' }, updatedAt: '2026-11-05T09:30:00.000Z' }];
  const model = todayModel(statusOf({}), commands, { connection: 'Connected to PC' });
  const failed = model.attention.find(a => a.kind === 'failed');
  assert.ok(failed, 'a failed receipt must reach Today');
  assert.match(failed.title, /failed/i);
  assert.ok(!/\bsucceeded\b|\bdelivered\b/i.test(failed.detail), 'a failed receipt must never read as delivered');
});

test('Today shows the connection state the phone actually has', () => {
  const bad = todayModel(null, [], { connection: 'Relay error: connection refused', connectionTone: 'bad' });
  assert.equal(bad.connection.tone, 'bad');
  assert.match(bad.connection.value, /connection refused/);
  const pending = todayModel(null, [], { connection: 'Connected to PC', pendingSend: true });
  assert.match(pending.connection.detail, /pending/i);
});

/* ---------- rendering ---------- */
test('the World surface renders real content or the honest empty state — never a stub', () => {
  const full = fakeHost();
  renderWorld(full, worldModel(statusOf({
    bootstrap: { schema: 'vivim.bootstrap-phone/1', worldId: 'w', observedAt: '2026-11-05T10:00:00.000Z',
      uiRevision: uiRevision([cardNode('research', 'Research', 'Questions and answers in one place.')]) }
  }), []), {});
  const fullText = textOf(full);
  assert.match(fullText, /Research/);
  assert.match(fullText, /Questions and answers in one place\./);
  assert.doesNotMatch(fullText, /Coming soon/i);

  const empty = fakeHost();
  renderWorld(empty, worldModel(null, []), {});
  const emptyText = textOf(empty);
  assert.match(emptyText, /Nothing here yet/);
  assert.match(emptyText, /Not available yet/);
  assert.doesNotMatch(emptyText, /Coming soon/i);
});

test('the Me surface renders the honest gaps and never a stub', () => {
  const host = fakeHost();
  renderMe(host, meModel(null, [], { paired: false, mode: 'cloud' }), {});
  const text = textOf(host);
  assert.match(text, /Identity/);
  assert.match(text, /Phone Connection/);
  assert.match(text, /Permissions/);
  assert.match(text, /Activity Record/);
  assert.match(text, /Not available yet/);
  assert.doesNotMatch(text, /Coming soon/i);
});

test('every surface keeps one thumb-reachable primary action and issues no other effect', () => {
  const world = fakeHost();
  renderWorld(world, worldModel(null, []), { onNavigate() {} });
  const me = fakeHost();
  renderMe(me, meModel(null, [], {}), { onNavigate() {}, onRefresh() {} });
  const today = fakeHost();
  renderToday(today, todayModel(null, [], { connection: 'Connecting…' }), { onNavigate() {} });

  for (const host of [world, me, today]) {
    const foot = byClass(host, 'ux-foot');
    assert.equal(foot.length, 1, 'each surface has exactly one action footer');
    const primary = byClass(foot[0], 'ux-primary');
    assert.equal(primary.length, 1, 'the footer holds exactly one primary action');
    // No other control: a read-only surface must not offer an effect.
    const buttons = findAll(host, n => n.tag === 'button');
    assert.equal(buttons.length, 1, 'a read-only surface must offer only its primary action');
  }
});

test('the Today primary action leads to a real surface and never claims an effect happened', () => {
  let went = null;
  const host = fakeHost();
  renderToday(host, todayModel(null, [], { connection: 'Connecting…' }), { onNavigate: tab => { went = tab; } });
  byClass(byClass(host, 'ux-foot')[0], 'ux-primary')[0].events.click();
  assert.ok(['talk', 'build', 'world'].includes(went), 'the primary action must navigate to a real surface');
});

test('the model and the renderer survive missing, empty and malformed Host payloads', () => {
  for (const payload of [undefined, null, {}, { snapshot: null }, { snapshot: {} }, { snapshot: { bootstrap: null } },
    { snapshot: { bootstrap: { uiRevision: null } } }, { snapshot: { live: { conversations: null } } }]) {
    assert.doesNotThrow(() => worldModel(payload, undefined));
    assert.doesNotThrow(() => meModel(payload, undefined, {}));
    assert.doesNotThrow(() => todayModel(payload, undefined, {}));
    const host = fakeHost();
    assert.doesNotThrow(() => renderWorld(host, worldModel(payload, undefined), {}));
    assert.doesNotThrow(() => renderMe(host, meModel(payload, undefined, {}), {}));
    assert.doesNotThrow(() => renderToday(host, todayModel(payload, undefined, {}), {}));
    assert.ok(textOf(host).length > 0, 'a surface must always say something');
  }
});

test('a malformed status payload never turns into invented rows', () => {
  const model = worldModel({ snapshot: { bootstrap: { uiRevision: { tree: { id: 'root', type: 'stack', props: {}, children: 'nope' } } } } }, []);
  assert.deepEqual(model.built, []);
  assert.equal(model.empty, true);
});
