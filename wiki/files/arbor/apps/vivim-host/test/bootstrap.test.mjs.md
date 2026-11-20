# File: apps/vivim-host/test/bootstrap.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/bootstrap.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 20616 B |
| Lines | 366 |
| Hash | 8f90f6344492 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TOKEN | const | 12 | no | const TOKEN = &#39;test-owner-token-0123456789abcdef0123456789abcdef&#39;; |
| F02 | const | 13 | no | const F02 = { |
| F01 | const | 22 | no | const F01 = { |
| D03 | const | 33 | no | const D03 = { |
| service | function | 42 | no | function service(scope = &#39;full-bootstrap&#39;) { |
| ledger | const | 43 | no | const ledger = openLedger(); |
| svc | const | 44 | no | const svc = createBootstrapService({ ledger, now: () =&gt; &#39;2026-10-31T10:00:00.000Z&#39; }); |
| first | const | 51 | no | const first = svc.ingestF02({ response: F02, requestId: &#39;req-f02-a&#39; }); |
| vars | const | 54 | no | const vars = first.plan.cssVariables; |
| second | const | 60 | no | const second = svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: &#39;#0b0f14&#39; } }, requestId: &#39;req-f02-b&#39; }); |
| undone | const | 65 | no | const undone = svc.undoTheme({ requestId: &#39;req-undo-a&#39; }); |
| preset | const | 80 | no | const preset = svc.choosePreset({ preset: &#39;grove&#39;, requestId: &#39;req-owner-a&#39; }); |
| inferred | const | 82 | no | const inferred = svc.ingestF02({ response: F02, requestId: &#39;req-f02-after&#39; }); |
| first | const | 90 | no | const first = svc.ingestF02({ response: F02, requestId: &#39;req-f02-replay&#39;, generationId: &#39;gen-f02-1&#39; }); |
| again | const | 91 | no | const again = svc.ingestF02({ response: F02, requestId: &#39;req-f02-replay&#39;, generationId: &#39;gen-f02-1&#39; }); |
| nextGen | const | 102 | no | const nextGen = svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: &#39;#0b0f14&#39; } }, requestId: &#39;req-f02-replay&#39;, generationId: &#39;gen-f02-2&#39; }); |
| un | const | 108 | no | const un = service(null).svc; |
| visualOnly | const | 110 | no | const visualOnly = service(&#39;onboarding-visual&#39;).svc; |
| before | const | 120 | no | const before = ledger.themes.list(&#39;world-local&#39;, 50).length; |
| out | const | 135 | no | const out = svc.ingestF01({ response: F01, requestId: &#39;req-f01-a&#39; }); |
| cards | const | 138 | no | const cards = svc.cards(); |
| projection | const | 142 | no | const projection = svc.projection(); |
| hardNos | const | 146 | no | const hardNos = svc.projection().hardNos; |
| owner | const | 159 | no | const owner = svc.setHardNo({ trait: &#39;silent background sends&#39; }); |
| cleared | const | 161 | no | const cleared = svc.clearHardNo({ id: owner.id }); |
| provider | const | 164 | no | const provider = svc.ledger.preferences.list(&#39;world-local&#39;).find(p =&gt; p.source === &#39;provider&#39;); |
| a | const | 170 | no | const a = svc.ingestPass({ response: D03, requestId: &#39;req-d03-a&#39; }); |
| b | const | 171 | no | const b = svc.ingestPass({ response: D03, requestId: &#39;req-d03-b&#39; }); |
| proposals | const | 175 | no | const proposals = svc.ledger.schemaProposals.list(&#39;world-local&#39;); |
| payload | const | 193 | no | const payload = svc.projection(); |
| dir | const | 200 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-bootstrap-&#39;)); |
| runtime | const | 201 | no | const runtime = createBootstrapRuntime({ dataRoot: dir, file: &#39;:memory:&#39; }); |
| server | const | 202 | no | const server = createHostServer({ dataRoot: dir, bootstrap: runtime, ownerToken: TOKEN }); |
| base | const | 204 | no | const base = `http://127.0.0.1:${server.address().port}`; |
| auth | const | 205 | no | const auth = { authorization: &#39;Bearer &#39; + TOKEN }; |
| post | function | 206 | no | const post = (route, body, headers = {}) =&gt; fetch(base + route, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-bootstrap&#39;: &#39;1&#39;, ...auth, ...headers }, body: JSON.stringify(… |
| status | const | 212 | no | const status = await fetch(base + &#39;/api/host/status&#39;); |
| snapshot | const | 214 | no | const snapshot = await status.json(); |
| noToken | const | 219 | no | const noToken = await fetch(base + &#39;/api/host/bootstrap/f02&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-bootstrap&#39;: &#39;1&#39; }, body: JSON.stringify({ response: F02, reques… |
| wrongToken | const | 221 | no | const wrongToken = await post(&#39;/api/host/bootstrap/f02&#39;, { response: F02, requestId: &#39;req-http-a&#39; }, { authorization: &#39;Bearer wrong-owner-token-0123456789abcdef0123456789abcdef&#39; }); |
| noHeader | const | 225 | no | const noHeader = await post(&#39;/api/host/bootstrap/f02&#39;, { response: F02, requestId: &#39;req-http-a&#39; }, { &#39;x-vivim-bootstrap&#39;: &#39;&#39; }); |
| wrongType | const | 228 | no | const wrongType = await fetch(base + &#39;/api/host/bootstrap/f02&#39;, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;text/plain&#39;, &#39;x-vivim-bootstrap&#39;: &#39;1&#39;, ...auth }, body: JSON.stringify({ response: F02, r… |
| crossOrigin | const | 231 | no | const crossOrigin = await post(&#39;/api/host/bootstrap/f02&#39;, { response: F02, requestId: &#39;req-http-a&#39; }, { origin: &#39;https://evil.example&#39; }); |
| grant | const | 235 | no | const grant = await post(&#39;/api/host/bootstrap/grant&#39;, {}); |
| outOfScope | const | 237 | no | const outOfScope = await post(&#39;/api/host/bootstrap/f01&#39;, { response: F01, requestId: &#39;req-http-f01&#39; }); |
| apply | const | 241 | no | const apply = await post(&#39;/api/host/bootstrap/f02&#39;, { response: F02, requestId: &#39;req-http-a&#39;, generationId: &#39;gen-http-1&#39; }); |
| applied | const | 243 | no | const applied = await apply.json(); |
| replay | const | 247 | no | const replay = await post(&#39;/api/host/bootstrap/f02&#39;, { response: F02, requestId: &#39;req-http-a&#39;, generationId: &#39;gen-http-1&#39; }); |
| conflict | const | 252 | no | const conflict = await post(&#39;/api/host/bootstrap/f02&#39;, { response: { ...F02, visual: { ...F02.visual, background: &#39;#0b0f14&#39; } }, requestId: &#39;req-http-a&#39;, generationId: &#39;gen-http-1&#39; }); |
| after | const | 256 | no | const after = await (await fetch(base + &#39;/api/host/bootstrap/projection&#39;)).json(); |
| bad | const | 260 | no | const bad = await post(&#39;/api/host/bootstrap/f02&#39;, { response: { ...F02, pass: &#39;D99&#39; }, requestId: &#39;req-http-b&#39; }); |
| oversized | const | 263 | no | const oversized = await post(&#39;/api/host/bootstrap/f02&#39;, { response: F02, requestId: &#39;req-http-c&#39;, filler: &#39;x&#39;.repeat(300 * 1024) }); |
| records | const | 273 | no | const records = new Map(); |
| store | const | 274 | no | const store = { |
| r | const | 280 | no | const r = records.get(id); |
| next | const | 283 | no | const next = { ...r, status: &#39;claimed&#39;, claimToken: token, rev: r.rev + 1 }; |
| runtime | const | 294 | no | const runtime = { |
| worker | const | 297 | no | const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime, store }); |
| done | const | 298 | no | const done = worker.tick(); |
| records | const | 308 | no | const records = new Map(); |
| stolen | variable | 309 | no | let stolen = false; |
| store | const | 310 | no | const store = { |
| r | const | 315 | no | const r = records.get(id); |
| next | const | 319 | no | const next = { ...r, claimedBy: &#39;grokbot&#39;, claimToken: &#39;someone-else&#39;, rev: r.rev + 1 }; |
| r | const | 326 | no | const r = records.get(id); |
| next | const | 328 | no | const next = { ...r, status: &#39;claimed&#39;, claimedBy: &#39;bootstrap&#39;, claimToken: token, rev: r.rev + 1 }; |
| undos | variable | 335 | no | let undos = 0; |
| runtime | const | 336 | no | const runtime = { undoTheme: () =&gt; { undos += 1; return { undone: 0, active: 0 }; } }; |
| worker | const | 337 | no | const worker = createBootstrapCommandWorker({ root: os.tmpdir(), runtime, store }); |
| first | const | 344 | no | const first=svc.ingestF02({response:F02,requestId:&#39;req-qualified-f02&#39;}); |
| reordered | const | 347 | no | const reordered={pass:&#39;F02&#39;,schema:&#39;vivim.bootstrap-f02/2&#39;,provisional:false, |
| replay | const | 351 | no | const replay=svc.ingestF02({response:reordered,requestId:&#39;req-qualified-f02&#39;}); |
| first | const | 360 | no | const first=svc.undoTheme({requestId:&#39;undo-fixed&#39;}); |
| again | const | 362 | no | const again=svc.undoTheme({requestId:&#39;undo-fixed&#39;}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:os | import | 4 | external |
| node:path | import | 5 | external |
| ../bootstrap/runtime.mjs | import | 6 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../bootstrap/command-worker.mjs | import | 7 | [apps/vivim-host/bootstrap/command-worker.mjs](../bootstrap/command-worker.mjs.md) |
| ../server.mjs | import | 8 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../bootstrap/ledger.mjs | import | 9 | [apps/vivim-host/bootstrap/ledger.mjs](../bootstrap/ledger.mjs.md) |
| ../bootstrap/service.mjs | import | 10 | [apps/vivim-host/bootstrap/service.mjs](../bootstrap/service.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createBootstrapCommandWorker } from '../bootstrap/command-worker.mjs';
import { createHostServer } from '../server.mjs';
import { openLedger } from '../bootstrap/ledger.mjs';
import { createBootstrapService } from '../bootstrap/service.mjs';

const TOKEN = 'test-owner-token-0123456789abcdef0123456789abcdef';
const F02 = {
  schema: 'vivim.bootstrap-f02/2', pass: 'F02',
  visual: { background: '#101820', secondary: '#1d2b3a', accent: '#e8b04b', appearance: 'dark',
    texture: 'aurora', mood: 'cinematic', fontFamily: 'editorial', fontSizePx: 16, headingSizePx: 32,
    radiusPx: 18, spacingScale: 1.05, density: 'comfortable', motion: 'slow' },
  preferences: [{ trait: 'warm amber highlights', basis: 'recurring', confidence: 0.7, scope: 'global' }],
  dislikes: [{ trait: 'neon green', basis: 'explicit', confidence: 0.9, scope: 'global' }],
  unknowns: ['exact favourite typeface'], provisional: false
};
const F01 = {
  schema: 'vivim.bootstrap-fast/1', generationId: 'gen-f01-1', passId: 'F01',
  communication: { language: 'English', tone: 'direct', responseStyle: 'short answers first' },
  focus: [
    { label: 'VIVIM local-first harness', kind: 'project', freshness: 'current', basis: 'explicitly_stated', explanation: 'Building a local-first provider harness.' },
    { label: 'Bootstrap autonomy', kind: 'goal', freshness: 'current', basis: 'provider_memory_report', explanation: 'Wants VIVIM to personalise itself.' }
  ],
  unknowns: ['preferred working hours'],
  suggestedCards: [{ title: 'VIVIM project', focus: 'VIVIM local-first harness' }],
  boundaries: [{ trait: 'auto-sending messages', basis: 'explicitly_stated', hard: true }]
};
const D03 = {
  schema: 'vivim.bootstrap-output/1', generationId: 'gen-d03-1', passId: 'D03',
  observations: [{ category: 'interest', text: 'Reads systems-design essays', confidence: 0.6, sensitive: false }],
  assertions: [{ section: 'interest', label: 'Systems design', value: 'Reads systems-design essays', basis: 'provider_memory_report', confidence: 0.6, freshness: 'current', scope: 'personal' }],
  unknowns: [], viewProposals: [{ kind: 'collection', title: 'Reading', reason: 'Recurring interest' }],
  schemaProposals: [{ type: 'interest_log', fields: [{ name: 'topic', type: 'text' }], reason: 'Track topics' }],
  coverage: { areas: [{ name: 'interests', state: 'partial' }] }
};

function service(scope = 'full-bootstrap') {
  const ledger = openLedger();
  const svc = createBootstrapService({ ledger, now: () => '2026-10-31T10:00:00.000Z' });
  if (scope) svc.grantBootstrap({ scope });
  return { ledger, svc };
}

test('F02 becomes one active, executable, append-only revision', () => {
  const { svc } = service();
  const first = svc.ingestF02({ response: F02, requestId: 'req-f02-a' });
  assert.equal(first.active, true);
  assert.equal(first.revision, 0);
  const vars = first.plan.cssVariables;
  for (const key of ['--bg', '--s1', '--tx', '--ac', '--vivim-background-image', '--vivim-font-family', '--vivim-base-font-size', '--vivim-heading-font-size', '--vivim-corner-radius', '--vivim-spacing-scale']) {
    assert.equal(typeof vars[key], 'string', key);
  }
  assert.match(vars['--vivim-base-font-size'], /^\d+px$/);
  assert.match(vars['--vivim-corner-radius'], /^\d+px$/);
  const second = svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: '#0b0f14' } }, requestId: 'req-f02-b' });
  assert.equal(second.revision, 1);
  assert.equal(svc.projection().revision, 1);
  assert.equal(svc.projection().cssVariables['--bg'], '#0b0f14');
  // Undo is append-only history, never deletion.
  const undone = svc.undoTheme({ requestId: 'req-undo-a' });
  assert.equal(undone.active, 0);
  assert.equal(svc.projection().revision, 0);
  assert.equal(svc.ledger.themes.list('world-local', 50).length, 2);
});

test('an invalid provider reply is rejected without creating a revision', () => {
  const { svc } = service();
  assert.throws(() => svc.ingestF02({ response: { ...F02, visual: { ...F02.visual, background: 'cornflowerblue' } }, requestId: 'req-bad' }), /#RRGGBB/);
  assert.equal(svc.ledger.themes.list('world-local', 50).length, 0);
  assert.equal(svc.projection().source, 'provisional');
});

test('owner preset outranks a later provider inference', () => {
  const { svc } = service();
  const preset = svc.choosePreset({ preset: 'grove', requestId: 'req-owner-a' });
```

_First 80 of 367 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
