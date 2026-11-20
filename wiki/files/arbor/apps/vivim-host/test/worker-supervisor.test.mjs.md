# File: apps/vivim-host/test/worker-supervisor.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/worker-supervisor.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3534 B |
| Lines | 90 |
| Hash | 9b6683b7870b |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| tmp | function | 8 | no | const tmp = () =&gt; mkdtempSync(join(tmpdir(), &#39;sup-&#39;)); |
| dir | const | 11 | no | const dir = tmp(); |
| s | const | 13 | no | const s = createWorkerSupervisor({ dataRoot: dir }); |
| dir | const | 19 | no | const dir = tmp(); |
| s | const | 21 | no | const s = createWorkerSupervisor({ dataRoot: dir }); |
| out | const | 22 | no | const out = s.takeover(&#39;bootstrap&#39;, process.pid); |
| st | const | 26 | no | const st = s.status(&#39;bootstrap&#39;); |
| dir | const | 33 | no | const dir = tmp(); |
| s | const | 35 | no | const s = createWorkerSupervisor({ dataRoot: dir }); |
| out | const | 37 | no | const out = s.stop(&#39;bootstrap&#39;); |
| dir | const | 44 | no | const dir = tmp(); |
| s | const | 46 | no | const s = createWorkerSupervisor({ dataRoot: dir }); |
| out | const | 49 | no | const out = s.recover(&#39;bootstrap&#39;); |
| dir | const | 57 | no | const dir = tmp(); |
| s | const | 59 | no | const s = createWorkerSupervisor({ dataRoot: dir }); |
| out | const | 61 | no | const out = s.takeover(&#39;bootstrap&#39;, 99999); |
| dir | const | 68 | no | const dir = tmp(); |
| s | const | 70 | no | const s = createWorkerSupervisor({ dataRoot: dir }); |
| dir | const | 79 | no | const dir = tmp(); |
| s | const | 81 | no | const s = createWorkerSupervisor({ dataRoot: dir }); |
| first | const | 83 | no | const first = s.status(&#39;bootstrap&#39;); |
| second | const | 86 | no | const second = s.status(&#39;bootstrap&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| node:os | import | 5 | external |
| ../bootstrap/worker-supervisor.mjs | import | 6 | [apps/vivim-host/bootstrap/worker-supervisor.mjs](../bootstrap/worker-supervisor.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createWorkerSupervisor } from '../bootstrap/worker-supervisor.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'sup-'));

test('supervisor reports not_started for an unknown role', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    assert.equal(s.status('bootstrap').state, 'not_started');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('takeover starts an in-process worker with a valid lease', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    const out = s.takeover('bootstrap', process.pid);
    assert.equal(out.state, 'started');
    assert.equal(out.pid, process.pid);
    assert.equal(out.inProcess, true);
    const st = s.status('bootstrap');
    assert.equal(st.state, 'online');
    assert.equal(st.pid, process.pid);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('stop removes the lease and reports stopped', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    s.takeover('bootstrap', process.pid);
    const out = s.stop('bootstrap');
    assert.equal(out.state, 'stopped');
    assert.equal(s.status('bootstrap').state, 'not_started');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('recover marks an unknown worker as not_started and a stale one as blocked', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    assert.equal(s.recover('bootstrap').state, 'not_started');
    s.takeover('bootstrap', process.pid);
    const out = s.recover('bootstrap');
    assert.equal(out.state, 'blocked');
    assert.equal(out.reason, 'owner_recovered_no_resend');
    assert.equal(s.status('bootstrap').state, 'not_started');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('second takeover of same role returns already_running', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    s.takeover('bootstrap', process.pid);
    const out = s.takeover('bootstrap', 99999);
    assert.equal(out.state, 'already_running');
    assert.equal(out.pid, process.pid);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('roles lists supervised roles', () => {
  const dir = tmp();
  try {
    const s = createWorkerSupervisor({ dataRoot: dir });
    assert.deepEqual(s.roles(), []);
    s.takeover('bootstrap', process.pid);
    s.takeover('relay', process.pid);
    assert.deepEqual(s.roles().sort(), ['bootstrap', 'relay']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('R0 dead-worker status preserves the uncertain lease for authorized recovery', () => {
  const dir = tmp();
  try {
```

_First 80 of 91 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
