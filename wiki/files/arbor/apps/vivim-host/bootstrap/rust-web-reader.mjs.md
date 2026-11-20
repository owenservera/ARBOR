# File: apps/vivim-host/bootstrap/rust-web-reader.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/bootstrap/rust-web-reader.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3013 B |
| Lines | 58 |
| Hash | ad3c226dbe13 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| execFile | const | 9 | no | const execFile = promisify(execFileCb); |
| error | function | 10 | no | const error = code =&gt; Object.assign(new Error(code), { code }); |
| createRustWebReader | function | 12 | yes | export function createRustWebReader({ dataRoot, env = process.env, execute = execFile } = {}) { |
| binary | const | 15 | no | const binary = env.VIVIM_WEB_MEMORY_BIN ?? resolveBundledRustBinary(&#39;hqkg-web-feed&#39;); |
| journal | const | 16 | no | const journal = env.VIVIM_WEB_MEMORY_JOURNAL \|\| |
| stdout | variable | 24 | no | let stdout; |
| e | const | 31 | no | const e = error(&#39;WEB_RUST_QUERY_FAILED&#39;); |
| response | variable | 37 | no | let response; |
| items | const | 46 | no | const items = response.results.map(r =&gt; { if (r?.source !== &#39;vivim.browser-companion&#39; \|\| r.provenance !== &#39;browser:&#39; + r.installationId + &#39;:&#39; + r.id \|\| r.verified !== true) throw error(&#39;WEB_RUST_SOUR… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 3 | external |
| node:child_process | import | 4 | external |
| node:util | import | 5 | external |
| ./web-memory.mjs | import | 6 | [apps/vivim-host/bootstrap/web-memory.mjs](./web-memory.mjs.md) |
| ../chat/rust-context.mjs | import | 7 | [apps/vivim-host/chat/rust-context.mjs](../chat/rust-context.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/runtime.mjs](./runtime.mjs.md) | ./rust-web-reader.mjs |
| [apps/vivim-host/bootstrap/rust-web-reader.test.mjs](./rust-web-reader.test.mjs.md) | ./rust-web-reader.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Host-only Rust HQKG query adapter. Runs the existing read-only CLI, not a
// browser, Studio ingress, provider API, or secondary storage engine.
import path from 'node:path';
import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';
import { WEB_MEMORY_SCHEMA } from './web-memory.mjs';
import { resolveBundledRustBinary } from '../chat/rust-context.mjs';

const execFile = promisify(execFileCb);
const error = code => Object.assign(new Error(code), { code });

export function createRustWebReader({ dataRoot, env = process.env, execute = execFile } = {}) {
  if (typeof dataRoot !== 'string' || !path.isAbsolute(dataRoot))
    throw error('WEB_ROOT_REQUIRED');
  const binary = env.VIVIM_WEB_MEMORY_BIN ?? resolveBundledRustBinary('hqkg-web-feed');
  const journal = env.VIVIM_WEB_MEMORY_JOURNAL ||
    path.join(dataRoot, 'browser-companion', 'web-memory.hqj');

  return async function readRustPage(cursor = 0) {
    if (typeof binary !== 'string' || !path.isAbsolute(binary))
      throw error('WEB_RUST_QUERY_UNAVAILABLE');
    if (!path.isAbsolute(journal) || !Number.isSafeInteger(cursor) || cursor < 0)
      throw error('WEB_RUST_CURSOR_INVALID');
    let stdout;
    try {
      ({ stdout } = await execute(binary, [journal, 'query',
        '--after-cursor', String(cursor), '--limit', '32'], {
        encoding: 'utf8', shell: false, windowsHide: true, timeout: 8000, maxBuffer: 65536
      }));
    } catch (cause) {
      const e = error('WEB_RUST_QUERY_FAILED');
      e.cause = cause;
      throw e;
    }
    if (typeof stdout !== 'string' || Buffer.byteLength(stdout) > 65536)
      throw error('WEB_RUST_OUTPUT_INVALID');
    let response;
    try { response = JSON.parse(stdout); } catch { throw error('WEB_RUST_OUTPUT_INVALID'); }
    if (response?.schema !== WEB_MEMORY_SCHEMA || !Array.isArray(response.results) ||
        response.results.length > 32 || !Number.isSafeInteger(response.nextCursor) ||
        response.nextCursor < cursor || typeof response.hasMore !== 'boolean' ||
        !Number.isSafeInteger(response.cursor) || response.cursor < response.nextCursor)
      throw error('WEB_RUST_OUTPUT_INVALID');
    if (response.hasMore && (response.results.length === 0 || response.nextCursor === cursor))
      throw error('WEB_RUST_CURSOR_STALLED');
    const items = response.results.map(r => {
      if (r?.source !== 'vivim.browser-companion' ||
          r.provenance !== 'browser:' + r.installationId + ':' + r.id ||
          r.verified !== true) throw error('WEB_RUST_SOURCE_UNVERIFIED');
      return { eventId: r.id, installationId: r.installationId, site: r.site,
        url: r.url, observedAt: r.observedAt, sourceRef: r.provenance, verified: true };
    });
    return {
      schema: WEB_MEMORY_SCHEMA, authority: 'hqkg', cursor: String(response.nextCursor),
      coverage: response.hasMore ? 'partial' : 'complete', items, hasMore: response.hasMore
    };
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
