// Focused acceptance for VERIFY:CONSOLIDATE:apps/vivim-host/public.
// Owner UI must render the Host's live typed snapshot (not a hardcoded green pill)
// and must surface the actual failure reason instead of a generic message.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const read = name => readFileSync(fileURLToPath(new URL('../public/' + name, import.meta.url)), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.listeners = new Map(); this.dataset = {};
    this.value = ''; this.disabled = false; this.hidden = false; this.textContent = '';
    this.type = ''; this.className = ''; this.id = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(name, cb) { this.listeners.set(name, cb); }
  async trigger(name, event = {}) { return this.listeners.get(name)?.(event); }
  setAttribute(key, value) { this[key] = String(value); }
  focus() {}
}
const text = node => !node ? '' : [node.textContent, ...node.children.map(text)].join(' ');

const at = offset => new Date(1700000000000 + offset).toISOString();
const record = (id, offset, status = 'cloud_update_accepted', currentStage = 'cloudUpdateAccepted') =>
  ({ id, consumer: 'harness', status, updatedAt: at(offset), currentStage, evidence: { cloudUpdateAccepted: true } });
const snapshot = (offset, { host = 'online', relay = 'online', recent = [record('cmd-0123456789ab', offset - 1000)] } = {}) => ({
  schema: 'vivim.host-status/1', observedAt: at(offset),
  host: { state: host, evidence: 'local HTTP request reached this process' },
  services: {
    relay: { state: relay, lastHeartbeatAt: at(offset - 5000) },
    chatWorker: { state: 'online' },
    harness: { state: 'unknown', reason: 'No read-only harness probe connected yet' },
    chrome: { state: 'unknown', reason: 'Chrome session intentionally not inspected by preview' }
  },
  bridge: { state: 'observed' },
  journey: { state: 'observed', recent },
  diagnosis: { severity: 'info', code: 'ALL_STEPS_VERIFIED', title: 'Local path verified',
    detail: 'Every observed stage is backed by a committed local record.', nextAction: 'Nothing to do.' }
});

const hostIds = ['host-pill','refresh','connection-strip','diagnosis','diagnosis-label','diagnosis-title',
  'diagnosis-detail','diagnosis-action','cards','bridge-count','activity','activity-detail','updated',
  'copy-report','heading','page-subtitle','control-view','world-view','world-title','world-copy'];

function hostContext(fetchImpl) {
  const nodes = new Map(hostIds.map(id => { const n = new FakeNode(id === 'refresh' ? 'button' : 'span'); n.id = id; return [id, n]; }));
  const document = {
    getElementById: id => nodes.get(id) || null,
    createElement: tag => new FakeNode(tag),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  const context = {
    document, console, Date, JSON, Map, Object, String, Number, Math, Array,
    window: { addEventListener: () => {} },
    fetch: fetchImpl,
    AbortSignal: { timeout: () => undefined },
    setInterval: () => 0, clearInterval: () => {}, setTimeout, clearTimeout
  };
  vm.runInNewContext(read('host.js'), context, { filename: 'host.js' });
  return { nodes, context, text: id => text(nodes.get(id)) };
}

test('owner UI renders the live typed Host snapshot and the actual status error', async () => {
  const first = snapshot(0);
  const second = snapshot(30000, {
    relay: 'stale',
    recent: [record('cmd-0123456789ab', -1000), record('cmd-9876543210ff', 29000, 'waiting_for_consumer', 'waiting_for_consumer')]
  });
  const third = snapshot(60000, { host: 'blocked' });
  let next = first;
  let mode = 'snapshot';
  const calls = [];
  const ui = hostContext(async url => {
    calls.push(url);
    if (mode === 'http-error') return { ok: false, status: 503, json: async () => ({}) };
    if (mode === 'bad-schema') return { ok: true, status: 200, json: async () => ({ schema: 'vivim.unknown/9', observedAt: at(90000) }) };
    return { ok: true, status: 200, json: async () => next };
  });
  await tick(); await tick(); await tick();

  // Initial load: typed, observed state is rendered, not a placeholder.
  assert.equal(ui.text('host-pill'), 'Host reachable');
  assert.equal(ui.nodes.get('host-pill').className, 'pill online');
  assert.match(ui.text('cards'), /Vercel Relay Worker/);
  assert.match(ui.text('cards'), /Online/);
  assert.match(ui.text('activity'), /cmd-01234567/);
  assert.equal(ui.text('bridge-count'), '1 recent');
  assert.match(ui.text('updated'), /read-only diagnostics/);
  assert.ok(calls.some(url => url === '/api/host/status'));

  // Next poll: the rendered state follows the new committed snapshot (live).
  const updatedBefore = ui.text('updated');
  next = second;
  await ui.nodes.get('refresh').trigger('click');
  assert.match(ui.text('cards'), /Stale/);
  assert.equal(ui.text('bridge-count'), '2 recent');
  assert.match(ui.text('activity'), /cmd-98765432/);
  assert.notEqual(ui.text('updated'), updatedBefore);
  assert.equal(ui.text('host-pill'), 'Host reachable');

  // Host state is rendered from the snapshot, never hardcoded to online.
  next = third;
  await ui.nodes.get('refresh').trigger('click');
  assert.equal(ui.text('host-pill'), 'Blocked');
  assert.equal(ui.nodes.get('host-pill').className, 'pill blocked');

  // HTTP failure: the actual error reaches the owner, not only a generic sentence.
  mode = 'http-error';
  await ui.nodes.get('refresh').trigger('click');
  assert.equal(ui.text('host-pill'), 'Host status unavailable');
  assert.equal(ui.nodes.get('host-pill').className, 'pill blocked');
  assert.match(ui.text('diagnosis-detail'), /HTTP 503/);
  assert.match(ui.text('updated'), /HTTP 503/);
  assert.equal(ui.text('diagnosis-title'), 'Cannot refresh the local Host');

  // A 200 that is not the typed Host snapshot is also an actual, reported error.
  mode = 'bad-schema';
  await ui.nodes.get('refresh').trigger('click');
  assert.match(ui.text('diagnosis-detail'), /Unexpected status payload/);
  assert.match(ui.text('diagnosis-detail'), /vivim\.unknown\/9/);
  assert.notEqual(ui.text('host-pill'), 'Host reachable');
});

const panelIds = ['host-command-form','host-control-unlock','host-control-lock','host-command-text',
  'host-command-submit','host-control-examples','host-control-catalog','host-control-result',
  'host-control-recent','host-control-auth-status','host-control-refresh','host-remember-preference',
  'host-remember-review','host-preferences-list','host-preferences-refresh','device-list','device-status',
  'host-web-memory-items','host-web-memory-status','host-web-memory-site','host-web-memory-more'];

test('control panel renders the Host refusal text and never reaches execute', async () => {
  const nodes = new Map(panelIds.map(id => { const n = new FakeNode(id === 'host-command-form' ? 'form' : 'div'); n.id = id; return [id, n]; }));
  const calls = [];
  const context = {
    document: {
      getElementById: id => nodes.get(id) || null,
      createElement: tag => new FakeNode(tag),
      createTextNode: value => String(value)
    },
    window: { addEventListener: () => {}, location: { hash: '', pathname: '/', search: '' }, history: { replaceState: () => {} } },
    fetch: async url => {
      calls.push(String(url));
      if (String(url).endsWith('/ui-state')) return { ok: true, status: 200, json: async () => ({ csrf: 'b'.repeat(64) }) };
      if (String(url).endsWith('/catalog')) return { ok: false, status: 503, json: async () => ({ error: 'Catalog unavailable', code: 'CONTROL_UNAVAILABLE' }) };
      return { ok: true, status: 200, json: async () => ({}) };
    },
    console, Date, JSON, Map, Object, String, encodeURIComponent, URLSearchParams
  };
  vm.runInNewContext(read('control-panel.js'), context, { filename: 'control-panel.js' });
  for (let i = 0; i < 6; i++) await tick();

  assert.ok(calls.some(url => url.endsWith('/api/host/control/catalog')));
  assert.match(text(nodes.get('host-control-auth-status')), /Desktop authorization unavailable: Catalog unavailable/);
  assert.match(text(nodes.get('host-control-result')), /Nothing has been changed/);
  assert.equal(calls.filter(url => url.endsWith('/api/host/control/execute')).length, 0);
  assert.equal(nodes.get('host-command-submit').disabled, true);
  assert.equal(nodes.get('host-command-text').disabled, true);
});