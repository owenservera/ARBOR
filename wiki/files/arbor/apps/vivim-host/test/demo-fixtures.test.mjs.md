# File: apps/vivim-host/test/demo-fixtures.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/demo-fixtures.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 22711 B |
| Lines | 371 |
| Hash | 83c55f19bbfc |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| testDir | const | 30 | no | const testDir = typeof __dirname === &#39;string&#39; |
| demoDir | const | 33 | no | const demoDir = path.resolve(testDir, &#39;..&#39;, &#39;..&#39;, &#39;..&#39;, &#39;demo&#39;, &#39;host-legacy&#39;); |
| fixtureDir | const | 34 | no | const fixtureDir = path.join(demoDir, &#39;fixture&#39;); |
| controllerSrc | const | 35 | no | const controllerSrc = readFileSync(path.join(demoDir, &#39;controller.js&#39;), &#39;utf8&#39;); |
| index | const | 37 | no | const index = JSON.parse(readFileSync(path.join(fixtureDir, &#39;index.json&#39;), &#39;utf8&#39;)); |
| TAB_ORDER | const | 38 | no | const TAB_ORDER = [&#39;today&#39;, &#39;talk&#39;, &#39;build&#39;, &#39;world&#39;, &#39;me&#39;, &#39;control&#39;]; // mobile-relay TABS order |
| ids | const | 45 | no | const ids = index.steps.map(s =&gt; s.itemId); |
| filePath | const | 59 | no | const filePath = path.join(fixtureDir, step.file); |
| stepJson | const | 60 | no | const stepJson = JSON.parse(readFileSync(filePath, &#39;utf8&#39;)); |
| stepJson | const | 74 | no | const stepJson = JSON.parse(readFileSync(path.join(fixtureDir, step.file), &#39;utf8&#39;)); |
| raw | const | 79 | no | const raw = readFileSync(path.join(fixtureDir, step.file), &#39;utf8&#39;); |
| files | const | 86 | no | const files = readdirSync(fixtureDir).sort(); |
| expected | const | 87 | no | const expected = [&#39;index.json&#39;, ...index.steps.map(s =&gt; s.file)].sort(); |
| model | const | 92 | no | const model = await import(pathToFileURL(path.resolve(testDir, &#39;..&#39;, &#39;..&#39;, &#39;mobile-relay&#39;, &#39;ux&#39;, &#39;model.mjs&#39;))); |
| na | const | 95 | no | const na = controllerSrc.match(/const NOT_AVAILABLE = &#39;([^&#39;]*)&#39;/); |
| block | const | 100 | no | const block = controllerSrc.match(/const LIVE_STATE_LABELS = Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\)/); |
| expected | const | 102 | no | const expected = Object.entries(model.LIVE_STATE_LABELS); |
| m | const | 105 | no | const m = block[1].match(new RegExp(key + &quot;:\\\\s*&#39;([^&#39;]*)&#39;&quot;)); |
| script | const | 112 | no | const script = path.join(demoDir, &#39;poll-round.mjs&#39;); |
| out | const | 115 | no | const out = execFileSync(&#39;bun&#39;, [script, &#39;--last&#39;, &#39;1&#39;], { encoding: &#39;utf8&#39; }); |
| failed | variable | 120 | no | let failed = false; |
| SPEC_DOTTED_KEYS | const | 133 | no | const SPEC_DOTTED_KEYS = [ |
| dig | function | 140 | no | const dig = (obj, dotted) =&gt; dotted.split(&#39;.&#39;).reduce((o, k) =&gt; (o &amp;&amp; typeof o === &#39;object&#39; &amp;&amp; k in o) ? o[k] : undefined, obj); |
| specKeyViolations | function | 141 | no | function specKeyViolations(md, prefix = &#39;&#39;) { |
| hits | const | 142 | no | const hits = []; |
| full | const | 144 | no | const full = prefix + k; |
| stepMockData | function | 150 | no | const stepMockData = id =&gt; |
| today | const | 154 | no | const today = stepMockData(&#39;tab-today&#39;); |
| talk | const | 161 | no | const talk = stepMockData(&#39;tab-talk&#39;); |
| build | const | 169 | no | const build = stepMockData(&#39;tab-build&#39;); |
| world | const | 176 | no | const world = stepMockData(&#39;tab-world&#39;); |
| me | const | 187 | no | const me = stepMockData(&#39;tab-me&#39;); |
| control | const | 193 | no | const control = stepMockData(&#39;tab-control&#39;); |
| md | const | 202 | no | const md = JSON.parse(readFileSync(path.join(fixtureDir, s.file), &#39;utf8&#39;)).mockData; |
| control | const | 208 | no | const control = stepMockData(&#39;tab-control&#39;); |
| talk | const | 228 | no | const talk = stepMockData(&#39;tab-talk&#39;); |
| today | const | 237 | no | const today = stepMockData(&#39;tab-today&#39;); |
| build | const | 242 | no | const build = stepMockData(&#39;tab-build&#39;); |
| world | const | 250 | no | const world = stepMockData(&#39;tab-world&#39;); |
| me | const | 260 | no | const me = stepMockData(&#39;tab-me&#39;); |
| vmById | const | 277 | no | const vmById = {}; |
| FakeEl | class | 278 | no | class FakeEl { |
| constructor | method | 279 | yes | constructor() { this.children = []; this.attrs = {}; this.listeners = {}; this.value = &#39;&#39;; this._text = &#39;&#39;; this._class = &#39;&#39;; this.disabled = false; } |
| appendChild | method | 280 | yes | appendChild(c) { this.children.push(c); return c; } |
| setAttribute | method | 281 | yes | setAttribute(k, v) { this.attrs[k] = String(v); } |
| addEventListener | method | 282 | yes | addEventListener(t, fn) { (this.listeners[t] ??= []).push(fn); } |
| click | method | 289 | yes | click() { (this.listeners.click ?? []).forEach(f =&gt; f()); } |
| body | const | 301 | no | const body = JSON.parse(readFileSync(path.join(fixtureDir, url.slice(&#39;/demo/fixture/&#39;.length)), &#39;utf8&#39;)); |
| strip | const | 310 | no | const strip = vmById[&#39;demo-strip&#39;]; |
| MUST | const | 315 | no | const MUST = { |
| STEP_IDS | const | 361 | no | const STEP_IDS = index.steps.map(s =&gt; s.itemId); |
| text | const | 365 | no | const text = vmById[&#39;demo-phone&#39;].textContent; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 20 | external |
| node:assert/strict | import | 21 | external |
| node:child_process | import | 22 | external |
| node:fs | import | 23 | external |
| node:path | import | 24 | external |
| node:url | import | 25 | external |
| node:vm | import | 26 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// C11 acceptance — demo fixture layer (backend-zero data reads).
// Every demo data read comes from demo/host-legacy/fixture/* synthetic records
// (schema vivim.demo-steps/1 index + vivim.demo-step/1 per tab). The browser
// controller's honest-gap strings must stay in lockstep with the phone PWA
// wording (C6 truthfulness), and poll-round.mjs stays a disk-read-only CLI.
//
// C5 ownership (fixture-shape ↔ controller coupling): the SPEC wrote mockData
// with raw dotted app-state keys ('S.statusObj.snapshot.live', 'S.convs',
// 'S.cmds'); the DELIVERED parcel (committed at bf6287a) ships per-tab flat
// mockData keys exactly as controller.js views()/RENDERERS consume them
// (tab-build: intent/compiled/proposal/approvalRequired; tab-world/A02:
// revision/built/running/queue/undoAvailable/changeHint; tab-me:
// statusObj.snapshot + bare device/manifest/commands/ctx; …). The C5 tests
// below pin that DELIVERED shape — a re-flatten back to the raw SPEC dotted
// keys false-fails here instead of silently re-coupling the fixture shape —
// pin the SPEC values that survived field-for-field (tab-control
// plan.planDigest exact, as read from tab-control.json), and run the REAL
// controller.js against the REAL parcel files to prove views() parsing renders
// every indexed step (all 9, including the A02/A04/A05 queue steps).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInContext, createContext } from 'node:vm';

// This test's directory. bun's import.meta.url loses the filename, so prefer
// __dirname (bun ESM has it) and fall back to fileURLToPath for node.
const testDir = typeof __dirname === 'string'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.resolve(testDir, '..', '..', '..', 'demo', 'host-legacy');
const fixtureDir = path.join(demoDir, 'fixture');
const controllerSrc = readFileSync(path.join(demoDir, 'controller.js'), 'utf8');

const index = JSON.parse(readFileSync(path.join(fixtureDir, 'index.json'), 'utf8'));
const TAB_ORDER = ['today', 'talk', 'build', 'world', 'me', 'control']; // mobile-relay TABS order

test('fixture index is a vivim.demo-steps/1 manifest covering the six phone tabs in order plus queue steps A02/A04/A05', () => {
  assert.equal(index.schema, 'vivim.demo-steps/1');
  assert.equal(typeof index.demoTitle, 'string');
  assert.ok(index.demoTitle.length > 0);
  assert.equal(Array.isArray(index.steps), true);
  const ids = index.steps.map(s => s.itemId);
  assert.deepEqual(ids, ['tab-today', 'tab-talk', 'tab-build', 'tab-world', 'tab-me', 'tab-control', 'A02', 'A04', 'A05']);
  assert.deepEqual(ids.slice(0, TAB_ORDER.length), TAB_ORDER.map(t => 'tab-' + t));
  assert.deepEqual(ids.slice(TAB_ORDER.length), ['A02', 'A04', 'A05']);
  for (const step of index.steps) {
    assert.equal(typeof step.screen, 'string');
    assert.ok(step.screen.length > 0);
    assert.equal(typeof step.file, 'string');
    assert.match(step.file, /^tab-[a-z]+(-[a-z0-9]+)*\.json$/);
  }
});

test('every indexed step file exists in the fixture dir and is a vivim.demo-step/1 record', () => {
  for (const step of index.steps) {
    const filePath = path.join(fixtureDir, step.file);
    const stepJson = JSON.parse(readFileSync(filePath, 'utf8'));
    assert.equal(stepJson.schema, 'vivim.demo-step/1', step.file);
    assert.equal(stepJson.itemId, step.itemId, step.file);
    assert.equal(stepJson.screen, step.screen, step.file);
    assert.equal(typeof stepJson.currentState, 'string');
    assert.ok(stepJson.currentState.length > 0, step.file);
    assert.equal(typeof stepJson.acceptanceQuestion, 'string');
    assert.ok(stepJson.acceptanceQuestion.length > 0, step.file);
    assert.equal(typeof stepJson.proposedUpgrade, 'string', step.file);
  }
});

test('each step carries non-empty mockData — every read is a fixture field, no live data', () => {
  for (const step of index.steps) {
    const stepJson = JSON.parse(readFileSync(path.join(fixtureDir, step.file), 'utf8'));
    assert.equal(stepJson.mockData != null && typeof stepJson.mockData, 'object', step.file);
    assert.equal(Array.isArray(stepJson.mockData), false, step.file);
    assert.ok(Object.keys(stepJson.mockData).length > 0, step.file + ' mockData empty');
    // Synthetic records only: fixture files must not embed network endpoints.
    const raw = readFileSync(path.join(fixtureDir, step.file), 'utf8');
    assert.doesNotMatch(raw, /https?:\/\//, step.file + ' embeds a URL');
```

_First 80 of 372 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
