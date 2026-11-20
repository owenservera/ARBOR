# File: apps/mobile-relay/test/host-static-allowlist-contract.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/test/host-static-allowlist-contract.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 979 B |
| Lines | 20 |
| Hash | 74580eae48e7 |
| Test | yes |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| hostFile | const | 8 | no | const hostFile = new URL(&#39;../../vivim-host/direct-phone.mjs&#39;, import.meta.url); |
| hostLanded | const | 9 | no | const hostLanded = existsSync(fileURLToPath(hostFile)); |
| source | const | 14 | no | const source = readFileSync(hostFile, &#39;utf8&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:fs | import | 3 | external |
| node:url | import | 4 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// This check becomes mandatory as soon as Host lane B is combined by G.
// On the isolated lane E branch Host intentionally does not exist yet.
const hostFile = new URL('../../vivim-host/direct-phone.mjs', import.meta.url);
const hostLanded = existsSync(fileURLToPath(hostFile));

test('in-repo Host Direct static whitelist serves the browser signer as a shell script', {
  skip: hostLanded ? false : 'Host B not yet incorporated into this isolated branch'
}, () => {
  const source = readFileSync(hostFile, 'utf8');
  assert.match(source,
    /'browser-device-key\.mjs'\s*:\s*\['browser-device-key\.mjs',\s*'text\/javascript; charset=utf-8'\]/);
  assert.match(source, /'connection\.json'/);
  assert.match(source, /directOnly:\s*true/);
  assert.match(source, /cloudEnabled:\s*false/);
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
