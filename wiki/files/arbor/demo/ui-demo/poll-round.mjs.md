# File: demo/ui-demo/poll-round.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/ui-demo/poll-round.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1144 B |
| Lines | 33 |
| Hash | 7183bef77f9e |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 9 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| inboxPath | const | 10 | no | const inboxPath = path.join(here, &#39;feedback&#39;, &#39;inbox.json&#39;); |
| POLL_MS | const | 11 | no | const POLL_MS = 2000; |
| TIMEOUT_MS | const | 12 | no | const TIMEOUT_MS = Number(process.env.VIVIM_POLL_TIMEOUT_MS \|\| 30000); |
| seen | variable | 14 | no | let seen = 0; |
| start | const | 18 | no | const start = Date.now(); |
| tick | function | 20 | no | function tick() { |
| arr | variable | 21 | no | let arr = []; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Node-compatible watcher for the demo feedback inbox.
// Reads demo/ui-demo/feedback/inbox.json, remembers the current round count,
// polls every 2s; when a new round appears prints ONLY that round's JSON to stdout
// and exits 0; on timeout exits 2.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.join(here, 'feedback', 'inbox.json');
const POLL_MS = 2000;
const TIMEOUT_MS = Number(process.env.VIVIM_POLL_TIMEOUT_MS || 30000);

let seen = 0;
try {
  seen = JSON.parse(readFileSync(inboxPath, 'utf8') || '[]').length;
} catch { seen = 0; }
const start = Date.now();

function tick() {
  let arr = [];
  try { arr = JSON.parse(readFileSync(inboxPath, 'utf8') || '[]'); } catch { arr = []; }
  if (arr.length > seen) {
    // Print only the newly appeared round's JSON, then exit.
    process.stdout.write(JSON.stringify(arr[arr.length - 1]) + '\n');
    process.exit(0);
  }
  if (Date.now() - start >= TIMEOUT_MS) {
    process.exit(2);
  }
  setTimeout(tick, POLL_MS);
}
tick();
```

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
