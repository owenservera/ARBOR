# File: scripts/acceleration/live-host-check.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/acceleration/live-host-check.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3676 B |
| Lines | 57 |
| Hash | 564334b4cf14 |
| Test | yes |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| receipt | const | 8 | no | const receipt = await runHostLoopCheck({ command: &#39;node --test scripts/acceleration/live-host-check.test.mjs&#39; }); |
| runtimeMajor | const | 16 | no | const runtimeMajor = Number(String(receipt.node).match(/^v(\\d+)\\./)[1]); |
| names | const | 26 | no | const names = new Set(receipt.tests.filter(x =&gt; x.pass).map(x =&gt; x.name)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ./live-host-check.mjs | import | 3 | [scripts/acceleration/live-host-check.mjs](./live-host-check.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { runHostLoopCheck } from './live-host-check.mjs';

// Real Host + real loopback HTTP, not a stubbed endpoint or browser screenshot.
// One isolated run shared by the subtests; the receipt remains visible even on failure.
test('Acceleration R002 W1/B: single-command isolated Host acceptance', async t => {
  const receipt = await runHostLoopCheck({
    command: 'node --test scripts/acceleration/live-host-check.test.mjs'
  });
  t.diagnostic('HOST_RECEIPT=' + JSON.stringify(receipt));
  await t.test('runtime and branch pin', () => {
    // Runtime floor, not a pin (owner directive 2026-11-18): this repo runs under bun, whose
    // node-compat reports v26.x; the check itself asserts >=24 semantics or bun.
    assert.match(receipt.node, /^v(\d+)\./, 'receipt must name the runtime version');
    const runtimeMajor = Number(String(receipt.node).match(/^v(\d+)\./)[1]);
    assert.ok(runtimeMajor >= 24 || receipt.environment?.bun, 'A01 acceptance must execute on Node >=24 or bun');
    assert.match(receipt.sha || '', /^[a-f0-9]{40}$/);
    assert.equal(receipt.sourceProbe.exitCode, 0);
  });
  await t.test('real HTTP, refusal and restart checks', () => {
    assert.equal(receipt.ok, true, receipt.failure || JSON.stringify(receipt.tests.filter(x => !x.pass)));
    assert.equal(receipt.exitCode, 0);
    assert.ok(receipt.tests.length >= 30, 'the live loop must exercise negative and replay paths');
    assert.equal(receipt.failedChecks, 0);
    const names = new Set(receipt.tests.filter(x => x.pass).map(x => x.name));
    for (const name of [
      'GET /chat', 'GET /wiki', 'Retired /demo', 'Retired /api/roadmap', 'GET /api/file-surface',
      'cross-origin chat rejected', 'Wiki edit without origin/control refused',
      'Wiki edit without CSRF control refused', 'cross-origin Wiki edit refused',
      'stale Wiki revision refused', 'missing Wiki revision refused',
      'Wiki path traversal target refused', 'canonical API JSON and JSONL match exact private journal bytes',
      'fresh Host restart replays same private journal and state'
    ]) assert.ok(names.has(name), 'missing actual check: ' + name);
    assert.ok(receipt.requests.some(x => x.method === 'POST' && x.route === '/api/mutate' && x.status === 409));
    assert.ok(receipt.requests.some(x => x.method === 'POST' && x.route === '/api/mutate' && x.status === 403));
  });
  await t.test('independent-format script and receipts distinguish source/API from DOM', () => {
    assert.equal(receipt.subprocesses.length, 1, 'Wiki evidence must be a real child process');
    assert.equal(receipt.subprocesses[0].exitCode, 0);
    assert.equal(receipt.subprocesses[0].timedOut, false);
    assert.equal(receipt.wikiEvidence?.exitCode, 0);
    assert.ok(receipt.wikiEvidence?.passedChecks >= 10);
    assert.equal(receipt.wikiEvidence?.scope, 'SOURCE_AND_API_ONLY');
    assert.equal(receipt.wikiEvidence?.independentKeeperAcceptance, 'UNRUN');
    assert.equal(receipt.browserDom, 'UNRUN');
    assert.equal(receipt.physicalDevice, 'UNRUN');
  });
  await t.test('temporary Host state is removed and committed demo journal is unchanged', () => {
    assert.equal(receipt.dataIsolation.ownedTemporaryDirectory, true);
    assert.equal(receipt.dataIsolation.deletedAfterRun, true);
    assert.equal(receipt.dataIsolation.publicDemoJournalUnchanged, true);
    assert.match(receipt.dataIsolation.privateJournalSha256 || '', /^[a-f0-9]{64}$/);
    assert.equal(receipt.realProviderEffects, false);
    assert.equal(receipt.realPhoneActions, false);
  });
});
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
