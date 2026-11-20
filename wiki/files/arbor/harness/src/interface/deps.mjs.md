# File: harness/src/interface/deps.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/deps.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1845 B |
| Lines | 31 |
| Hash | d94ce757936d |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| pinchtabConnect | function | 7 | no | async function pinchtabConnect({ host, port } = {}) { |
| target | const | 8 | no | const target = resolveTarget(); |
| baseUrl | const | 10 | no | const baseUrl = process.env.PINCHTAB_BASE_URL \|\| &#39;http://127.0.0.1:9867&#39;; |
| instanceId | const | 11 | no | const instanceId = process.env.PINCHTAB_INSTANCE_ID; |
| token | const | 12 | no | const token = process.env.PINCHTAB_TOKEN; |
| dependencies | function | 17 | yes | export async function dependencies(overrides = {}) { |
| modules | const | 18 | no | const modules = { |
| result | const | 25 | no | const result = { ...overrides }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./target.mjs | import | 2 | [harness/src/interface/target.mjs](./target.mjs.md) |
| ../core/pinchtab.mjs | import | 3 | [harness/src/core/pinchtab.mjs](../core/pinchtab.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/deps.mjs |
| [harness/bin/wh.mjs](../../bin/wh.mjs.md) | ../src/interface/deps.mjs |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./deps.mjs |
| [harness/test/interface/deps-pinchtab.test.mjs](../../test/interface/deps-pinchtab.test.mjs.md) | ../../src/interface/deps.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// All cross-lane dependencies enter through this injectable adapter.
import { resolveTarget } from './target.mjs';
import { connectPinchtab, verifyAttachedInstance } from '../core/pinchtab.mjs';

// PinchTab driver: the harness's only CDP endpoint is 127.0.0.1:9333 (never 9222, never non-loopback).
// Env is read at call time; values are never logged.
async function pinchtabConnect({ host, port } = {}) {
  const target = resolveTarget();
  if (host !== '127.0.0.1' || Number(port) !== target.port) throw Object.assign(new Error('CDP endpoint refused'), { code: 'CDP_PORT_REFUSED' });
  const baseUrl = process.env.PINCHTAB_BASE_URL || 'http://127.0.0.1:9867';
  const instanceId = process.env.PINCHTAB_INSTANCE_ID;
  const token = process.env.PINCHTAB_TOKEN;
  await verifyAttachedInstance({ baseUrl, instanceId, token, expectPort: target.port });
  return connectPinchtab({ baseUrl, instanceId, token });
}

export async function dependencies(overrides = {}) {
  const modules = {
    connect: ['../core/cdp.mjs', 'connect'], createJournal: ['../core/journal.mjs', 'createJournal'],
    digestPayload: ['../core/journal.mjs', 'digestPayload'], threadKeyFor: ['../core/journal.mjs', 'threadKeyFor'],
    sendOnce: ['../core/send.mjs', 'sendOnce'], readReply: ['../core/reply.mjs', 'readReply'],
    listProviders: ['../providers/index.mjs', 'listProviders'], getProvider: ['../providers/index.mjs', 'getProvider'],
    providerForUrl: ['../providers/index.mjs', 'providerForUrl']
  };
  const result = { ...overrides };
  for (const [name, [path, key]] of Object.entries(modules)) {
    if (!(name in result)) result[name] = (...args) => import(path).then(m => m[key](...args));
  }
  if (process.env.WH_DRIVER === 'pinchtab' && !('connect' in overrides)) result.connect = pinchtabConnect;
  return result;
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
