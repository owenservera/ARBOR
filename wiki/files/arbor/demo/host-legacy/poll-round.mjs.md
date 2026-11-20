# File: demo/host-legacy/poll-round.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | demo/host-legacy/poll-round.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5870 B |
| Lines | 113 |
| Hash | affd34919bbf |
| Test | no |
| Generated | no |
| Component | demo |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 30 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| seedJournalPath | const | 31 | no | const seedJournalPath = path.join(here, &#39;journal.jsonl&#39;); |
| hostDataDir | function | 37 | no | function hostDataDir(env = process.env) { |
| platform | const | 38 | no | const platform = process.platform; |
| paths | const | 39 | no | const paths = platform === &#39;win32&#39; ? path.win32 : path.posix; |
| home | const | 40 | no | const home = env.HOME \|\| env.USERPROFILE; |
| liveJournalPath | const | 48 | no | const liveJournalPath = path.join(hostDataDir(), &#39;product-state&#39;, &#39;journal.jsonl&#39;); |
| readJournal | function | 52 | no | function readJournal() { |
| raw | variable | 53 | no | let raw; |
| fail | function | 63 | no | function fail(message) { |
| isPlainObject | function | 68 | no | function isPlainObject(v) { return !!v &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v); } |
| isRoundEntry | function | 69 | no | function isRoundEntry(v) { |
| args | const | 77 | no | const args = process.argv.slice(2); |
| last | variable | 78 | no | let last = null; |
| since | variable | 79 | no | let since = null; |
| a | const | 81 | no | const a = args[i]; |
| raw | const | 95 | no | const raw = readJournal(); |
| lines | const | 96 | no | const lines = raw.split(/\\r?\\n/).filter(line =&gt; line.trim().length &gt; 0); |
| arr | variable | 97 | no | let arr; |
| out | variable | 103 | no | let out = arr.filter(isRoundEntry); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 26 | external |
| node:path | import | 27 | external |
| node:url | import | 28 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
/* @vlang:surface apps/vivim-host/public/demo/poll-round.mjs
   @vlang:surface-desc: One-shot CLI poll of the demo feedback inbox — the reprogrammable
   @vlang:surface-desc: surface is the CLI contract only: filter flags (--last, --since) and
   @vlang:surface-desc: their semantics, stdout JSON formatting, and validation/exit messages.
   @vlang:surface-desc: NL-driven change accepts none of: network fetch (disk read only, C9),
   @vlang:surface-desc: drift of the {round, approveAll, verdicts, receivedAt} entry schema
   @vlang:surface-desc: shared with POST /demo/feedback, or watcher/daemon modes (one-shot by
   @vlang:surface-desc: design). node:fs/path/url only; no other imports.
   @vlang:surface-desc: NLCL linkage: no action in control/action-catalog.v1.json v7 targets
   @vlang:surface-desc: this file yet — actionIds stays empty until one is catalogued.
   @vlang:id: arg-parser round-entry-schema output-format exit-codes
   @vlang:action: */

// Demo feedback inbox poll — one-shot CLI, disk read only (C9).
// Usage: bun apps/vivim-host/public/demo/poll-round.mjs [--last N | --since ROUND]
// Reads the live product journal (dataRoot/product-state/journal.jsonl — the file
// POST /demo/feedback appends to and GET /demo/journal.jsonl serves read-through),
// falling back to the committed demo seed (public/demo/journal.jsonl) when no Host
// data journal exists yet. Selects the {round, approveAll, verdicts, receivedAt}
// feedback entries and ignores the other typed records that share that product
// journal, prints matching rounds as JSON to stdout.
//   --last N   print the last N rounds (after --since filter, if given)
//   --since ROUND print rounds with round >= ROUND (inclusive)
// Exit 0 on success; exit 1 if the journal is missing, unreadable or invalid,
// or the arguments are invalid. node:fs only. No watcher, no network.
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const seedJournalPath = path.join(here, 'journal.jsonl');

// Host data directory, mirroring server.mjs studioDataDir() (env overrides,
// then the platform default). Product mutations live here, never in the
// committed public/demo parcel. The CLI imports node:fs/path/url only, so the
// resolution is duplicated here instead of importing server.mjs.
function hostDataDir(env = process.env) {
  const platform = process.platform;
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const home = env.HOME || env.USERPROFILE;
  if (env.VIVIM_HOST_DATA_DIR) return paths.resolve(env.VIVIM_HOST_DATA_DIR);
  if (env.CAPTURE_STUDIO_HOME) return paths.resolve(env.CAPTURE_STUDIO_HOME);
  if (platform === 'win32') return paths.join(env.LOCALAPPDATA || paths.join(home, 'AppData', 'Local'), 'AION', 'capture-studio');
  if (platform === 'darwin') return paths.join(home, 'Library', 'Application Support', 'AION', 'capture-studio');
  return paths.join(env.XDG_DATA_HOME && paths.isAbsolute(env.XDG_DATA_HOME) ? env.XDG_DATA_HOME : paths.join(home, '.local', 'share'), 'aion-capture-studio');
}

const liveJournalPath = path.join(hostDataDir(), 'product-state', 'journal.jsonl');

// Read the live product journal; fall back to the committed demo seed snapshot
// when no Host data journal exists yet (bare checkout, nothing submitted).
function readJournal() {
  let raw;
  try { raw = readFileSync(liveJournalPath, 'utf8'); }
  catch (liveError) {
    if (liveError?.code !== 'ENOENT') throw liveError;
    try { raw = readFileSync(seedJournalPath, 'utf8'); }
    catch { fail('Missing or unreadable journal: ' + liveJournalPath); }
  }
  return raw;
}

function fail(message) {
  process.stderr.write(String(message === undefined || message === null ? 'poll-round failed' : message) + '\n');
  process.exit(1);
}

function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function isRoundEntry(v) {
  return isPlainObject(v)
    && (typeof v.round === 'string' || typeof v.round === 'number')
    && typeof v.approveAll === 'boolean'
    && Array.isArray(v.verdicts)
    && typeof v.receivedAt === 'string';
}

const args = process.argv.slice(2);
let last = null;
let since = null;
for (let i = 0; i < args.length; i++) {
```

_First 80 of 114 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
