# File: apps/vivim-host/bootstrap/runtime.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/runtime.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7116 B |
| Lines | 128 |
| Hash | 4b661b820697 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RUNTIME_SCHEMA | const | 12 | yes | export const RUNTIME_SCHEMA = &#39;vivim.bootstrap-runtime/1&#39;; |
| bootstrapPaths | function | 14 | yes | export function bootstrapPaths(dataRoot) { |
| dir | const | 15 | no | const dir = path.join(dataRoot, &#39;bootstrap&#39;); |
| createBootstrapRuntime | function | 19 | yes | export function createBootstrapRuntime({ dataRoot, worldId = WORLD_DEFAULT, file = null, now } = {}) { |
| paths | const | 21 | no | const paths = bootstrapPaths(dataRoot); |
| ledgerFile | const | 22 | no | const ledgerFile = file ?? paths.ledger; |
| ledger | variable | 24 | no | let ledger = null, service = null, error = null; |
| webMemory | const | 33 | no | const webMemory = ledger ? createWebMemory({ ledger, worldId, ...(now ? { now } : {}) }) : null; |
| rustReadPage | const | 34 | no | const rustReadPage = createRustWebReader({ dataRoot: path.resolve(dataRoot) }); |
| refreshPromise | variable | 35 | no | let refreshPromise = null, nextAttemptAt = 0, sourceError = null; |
| readWebMemory | function | 36 | no | async function readWebMemory(args = {}) { |
| prior | const | 45 | no | const prior = ledger.webVisits.status(worldId); |
| cursor | const | 46 | no | const cursor = prior?.source_kind === &#39;rust-cli&#39; ? Number(prior.cursor ?? 0) : 0; |
| batch | const | 47 | no | const batch = await rustReadPage(cursor); |
| view | const | 56 | no | const view = webMemory.recent(args); |
| memoryUnavailable | function | 62 | no | const memoryUnavailable = () =&gt; ({ schema: &#39;vivim.web-memory-view/1&#39;, state: &#39;unavailable&#39;, items: [], nextCursor: null, coverage: &#39;unavailable&#39;, note: &#39;Host SQLite ledger unavailable; history cannot… |
| requireService | function | 67 | no | function requireService() { |
| failure | const | 69 | no | const failure = new Error(&#39;Bootstrap ledger unavailable: &#39; + error.reason); |
| projection | function | 75 | no | function projection() { |
| status | function | 80 | no | function status() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 5 | external |
| ./ledger.mjs | import | 6 | [apps/vivim-host/bootstrap/ledger.mjs](./ledger.mjs.md) |
| ./web-memory.mjs | import | 7 | [apps/vivim-host/bootstrap/web-memory.mjs](./web-memory.mjs.md) |
| ./rust-web-reader.mjs | import | 8 | [apps/vivim-host/bootstrap/rust-web-reader.mjs](./rust-web-reader.mjs.md) |
| ./service.mjs | import | 9 | [apps/vivim-host/bootstrap/service.mjs](./service.mjs.md) |
| ../data-intelligence/catalog.mjs | import | 10 | [apps/vivim-host/data-intelligence/catalog.mjs](../data-intelligence/catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/receipt-runner.mjs](../receipt-runner.mjs.md) | ./bootstrap/runtime.mjs |
| [apps/vivim-host/server.mjs](../server.mjs.md) | ./bootstrap/runtime.mjs |
| [apps/vivim-host/test/bootstrap-command-apply.test.mjs](../test/bootstrap-command-apply.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/bootstrap-command.test.mjs](../test/bootstrap-command.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/bootstrap-grant.test.mjs](../test/bootstrap-grant.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/bootstrap.test.mjs](../test/bootstrap.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/control-desktop-surface.test.mjs](../test/control-desktop-surface.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/control-devices.test.mjs](../test/control-devices.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/control-wiki-execution.test.mjs](../test/control-wiki-execution.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/control-wiki-phone.test.mjs](../test/control-wiki-phone.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/data-intelligence.test.mjs](../test/data-intelligence.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/direct-phone.test.mjs](../test/direct-phone.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/host-authorized-mutation.test.mjs](../test/host-authorized-mutation.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/kpi-utc.test.mjs](../test/kpi-utc.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/onboarding.test.mjs](../test/onboarding.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/personal-semantic-host.test.mjs](../test/personal-semantic-host.test.mjs.md) | ../bootstrap/runtime.mjs |
| [apps/vivim-host/test/ui-revision.test.mjs](../test/ui-revision.test.mjs.md) | ../bootstrap/runtime.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host-side bootstrap runtime: one ledger, one trusted writer, one bounded projection.
// The ledger lives beside the existing Host data (never inside the JSON authorities).
// If node:sqlite is unavailable the runtime fails closed: reads report the reason and
// every mutation is refused, so no personalization is silently dropped.
import path from 'node:path';
import { openLedger } from './ledger.mjs';
import { createWebMemory } from './web-memory.mjs';
import { createRustWebReader } from './rust-web-reader.mjs';
import { createBootstrapService, WORLD_DEFAULT } from './service.mjs';
import { readIngressRegistry, projectDataInventory } from '../data-intelligence/catalog.mjs';

export const RUNTIME_SCHEMA = 'vivim.bootstrap-runtime/1';

export function bootstrapPaths(dataRoot) {
  const dir = path.join(dataRoot, 'bootstrap');
  return { dir, ledger: path.join(dir, 'ledger.db') };
}

export function createBootstrapRuntime({ dataRoot, worldId = WORLD_DEFAULT, file = null, now } = {}) {
  if (typeof dataRoot !== 'string' || !dataRoot) throw new TypeError('Bootstrap runtime: dataRoot required');
  const paths = bootstrapPaths(dataRoot);
  const ledgerFile = file ?? paths.ledger;

  let ledger = null, service = null, error = null;
  try {
    ledger = openLedger({ file: ledgerFile });
    service = createBootstrapService({ ledger, worldId, ...(now ? { now } : {}) });
  } catch (cause) {
    error = { code: cause?.code ?? 'LEDGER_OPEN_FAILED', reason: String(cause?.message ?? cause).slice(0, 240) };
  }

  // Shares this Host's existing SQLite writer and world scope, never creates an external KB.
  const webMemory = ledger ? createWebMemory({ ledger, worldId, ...(now ? { now } : {}) }) : null;
  const rustReadPage = createRustWebReader({ dataRoot: path.resolve(dataRoot) });
  let refreshPromise = null, nextAttemptAt = 0, sourceError = null;
  async function readWebMemory(args = {}) {
    if (!webMemory) return memoryUnavailable();
    if (webMemory.optedOut()) return webMemory.recent(args);
    // Coalesce simultaneous desktop/phone reads. A read-only CLI child cannot
    // race with another Host-ledger writer, and failed queries never fabricate visits.
    if (!refreshPromise && Date.now() >= nextAttemptAt) {
      nextAttemptAt = Date.now() + 3000;
      refreshPromise = (async () => {
        try {
          const prior = ledger.webVisits.status(worldId);
          const cursor = prior?.source_kind === 'rust-cli' ? Number(prior.cursor ?? 0) : 0;
          const batch = await rustReadPage(cursor);
          webMemory.project(batch, { sourceKind: 'rust-cli' });
          sourceError = null;
        } catch (cause) {
          sourceError = cause?.code ?? 'WEB_RUST_QUERY_FAILED';
        }
      })().finally(() => { refreshPromise = null; });
    }
    if (refreshPromise) await refreshPromise;
    const view = webMemory.recent(args);
    if (!sourceError) return view;
    return { ...view, state: view.state === 'disabled' ? 'disabled' :
      view.items.some(item => item.sourceOrigin === 'rust-cli') ? 'stale' : 'bridge-unavailable',
      sourceError, note: view.note + ' Rust source read is unavailable (' + sourceError + ').' };
  }
  const memoryUnavailable = () => ({
    schema: 'vivim.web-memory-view/1', state: 'unavailable', items: [], nextCursor: null,
    coverage: 'unavailable', note: 'Host SQLite ledger unavailable; history cannot be read.'
  });

  function requireService() {
    if (service) return service;
    const failure = new Error('Bootstrap ledger unavailable: ' + error.reason);
    failure.code = error.code;
    throw failure;
  }

  // Bounded read for every surface. Never throws: a broken ledger is a reported state.
  function projection() {
    if (!service) return { state: 'unavailable', code: error.code, reason: error.reason };
    try { return { state: 'ready', ...service.projection() }; }
    catch (cause) { return { state: 'unavailable', code: cause?.code ?? 'PROJECTION_FAILED', reason: String(cause?.message ?? cause).slice(0, 240) }; }
  }
  function status() {
```

_First 80 of 129 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
