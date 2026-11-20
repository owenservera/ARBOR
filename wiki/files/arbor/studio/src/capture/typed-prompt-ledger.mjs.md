# File: studio/src/capture/typed-prompt-ledger.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/capture/typed-prompt-ledger.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8211 B |
| Lines | 150 |
| Hash | 60ad314f6049 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LEDGER_FILE | const | 19 | yes | export const LEDGER_FILE = &#39;typed-prompt-ledger.json&#39;; |
| MIN_MATCH_CHARS | const | 20 | yes | export const MIN_MATCH_CHARS = 40; |
| MAX_ENTRIES | const | 21 | no | const MAX_ENTRIES = 50; |
| MAX_TRACKED_CHARS | const | 22 | no | const MAX_TRACKED_CHARS = 4000; |
| STEP_BYTES | const | 23 | no | const STEP_BYTES = 3; |
| SCHEMA | const | 24 | no | const SCHEMA = &#39;vivim.typed-prompt-ledger.v2&#39;; |
| CHAIN_SEED | const | 25 | no | const CHAIN_SEED = createHash(&#39;sha256&#39;).update(SCHEMA).digest(); |
| LEGACY_PROMPT_STEMS | const | 29 | yes | export const LEGACY_PROMPT_STEMS = Object.freeze([ &#39;You are helping design a small personal mobile app&#39;, // Harness live-test prompt typed by an earlier session before it was ledgered; ChatGPT restor… |
| looseForm | function | 38 | yes | export const looseForm = (text) =&gt; String(text ?? &#39;&#39;) |
| hash | function | 43 | no | const hash = (s) =&gt; createHash(&#39;sha256&#39;).update(s, &#39;utf8&#39;).digest(&#39;hex&#39;).slice(0, 32); |
| ledgerPath | function | 44 | no | const ledgerPath = (root) =&gt; path.join(root, LEDGER_FILE); |
| chain | function | 50 | no | function chain(chars, to, visit) { |
| a | variable | 51 | no | let a = CHAIN_SEED.readUInt32LE(0), b = CHAIN_SEED.readUInt32LE(4); |
| cp | const | 53 | no | const cp = chars[i].codePointAt(0); |
| stepCode | function | 60 | no | const stepCode = (a, b) =&gt; [(a ^ (b &gt;&gt;&gt; 7)) &amp; 0xff, ((a &gt;&gt;&gt; 8) ^ b) &amp; 0xff, ((a &gt;&gt;&gt; 16) ^ (b &gt;&gt;&gt; 19)) &amp; 0xff]; |
| fingerprint | function | 62 | no | function fingerprint(loose) { |
| chars | const | 63 | no | const chars = [...loose]; |
| tracked | const | 64 | no | const tracked = Math.min(chars.length, MAX_TRACKED_CHARS); |
| steps | const | 65 | no | const steps = Buffer.alloc(Math.max(0, tracked - MIN_MATCH_CHARS) * STEP_BYTES); |
| validEntry | function | 70 | no | const validEntry = (e) =&gt; e &amp;&amp; Number.isSafeInteger(e.len) &amp;&amp; e.len &gt;= MIN_MATCH_CHARS &amp;&amp; typeof e.full === &#39;string&#39; |
| readLedger | function | 73 | no | function readLedger(root) { |
| data | const | 75 | no | const data = JSON.parse(readFileSync(ledgerPath(root), &#39;utf8&#39;)); |
| writeLedger | function | 80 | no | function writeLedger(root, entries) { |
| target | const | 82 | no | const target = ledgerPath(root); |
| tmp | const | 83 | no | const tmp = `${target}.${process.pid}.${Date.now().toString(36)}.tmp`; |
| recordTypedPrompt | function | 96 | yes | export function recordTypedPrompt(root, prompt) { |
| loose | const | 98 | no | const loose = looseForm(prompt); |
| entry | const | 100 | no | const entry = { ...fingerprint(loose), at: new Date().toISOString() }; |
| entries | const | 101 | no | const entries = readLedger(root).filter((e) =&gt; e.full !== entry.full); |
| entryMatches | function | 107 | no | function entryMatches(e, chars, draft) { |
| n | const | 108 | no | const n = chars.length; |
| steps | const | 114 | no | const steps = Buffer.from(e.steps, &#39;base64&#39;), at = (n - MIN_MATCH_CHARS - 1) * STEP_BYTES; |
| last | variable | 116 | no | let last = null; |
| matchesTypedPrompt | function | 122 | yes | export function matchesTypedPrompt(root, draftText) { |
| draft | const | 123 | no | const draft = looseForm(draftText); |
| chars | const | 124 | no | const chars = [...draft]; |
| SUBSEQ_MIN_CHARS | const | 133 | no | const SUBSEQ_MIN_CHARS = 6; |
| SUBSEQ_MIN_DENSITY | const | 134 | no | const SUBSEQ_MIN_DENSITY = 0.6; |
| isPrefixOfTyped | function | 140 | yes | export const isPrefixOfTyped = (composerText, prompt) =&gt; { |
| draft | const | 141 | no | const draft = [...looseForm(composerText)], typed = [...looseForm(prompt)]; |
| i | variable | 145 | no | let i = 0; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 15 | external |
| node:fs | import | 16 | external |
| node:path | import | 17 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/conversation-browser-adapter.mjs](./conversation-browser-adapter.mjs.md) | ./typed-prompt-ledger.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Ledger of prompts VIVIM itself typed into a provider composer.
//
// Why: rich composers (Claude) persist UNSENT composer text in localStorage and restore it into every
// new chat. If one of VIVIM's own typings fails half way, that residue would block every later send as
// DRAFT_PRESENT forever. The ledger lets VIVIM recognise its OWN residue (and only its own) so it can
// clear it. Text that does not match stays protected: user-typed drafts are never touched.
//
// Storage is fingerprints only (never prompt text), last MAX_ENTRIES prompts. A draft is VIVIM's own only
// when its WHOLE loose form equals a prefix of a ledgered prompt (a typing that died at any character):
//   - `head`: 128-bit hash of the first MIN_MATCH_CHARS loose chars (short drafts never match);
//   - `steps`: a chained checksum over every following char, 24 bits kept per position, so the full draft
//     length is verified - text a user appended to or edited inside VIVIM's residue does not match;
//   - `full`: 128-bit hash of the whole prompt.
// A draft longer than MAX_TRACKED_CHARS (and not the full prompt) is never matched: protection wins.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const LEDGER_FILE = 'typed-prompt-ledger.json';
export const MIN_MATCH_CHARS = 40;
const MAX_ENTRIES = 50;
const MAX_TRACKED_CHARS = 4000;
const STEP_BYTES = 3;
const SCHEMA = 'vivim.typed-prompt-ledger.v2';
const CHAIN_SEED = createHash('sha256').update(SCHEMA).digest();

// Prompt stems VIVIM has authored in earlier releases (before this ledger existed). They identify
// residue left behind by those versions. Compared on the loose form.
export const LEGACY_PROMPT_STEMS = Object.freeze([
  'You are helping design a small personal mobile app',
  // Harness live-test prompt typed by an earlier session before it was ledgered; ChatGPT restored it
  // into every new chat as DRAFT_PRESENT (seen 2026-10-30, 108 characters).
  'Multiline fidelity retest',
]);

// Quotes, nbsp, zero-width characters and markdown/code-block structure are exactly what rich editors
// rewrite between "typed" and "read back". Loose = lowercase letters and digits only.
export const looseForm = (text) => String(text ?? '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

const hash = (s) => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 32);
const ledgerPath = (root) => path.join(root, LEDGER_FILE);

// Chained 64-bit (two 32-bit lanes, FNV-1a style) state over the code points, from a fixed schema seed.
// Not adversarial: it only has to tell "exactly VIVIM's prefix" from "VIVIM's prefix edited by a user"
// once the 128-bit head already matched. (Per-char sha256 costs ~1 s for a long prompt on a loaded PC.)
// Calls visit(position, a, b) after each char past the head (position = chars consumed).
function chain(chars, to, visit) {
  let a = CHAIN_SEED.readUInt32LE(0), b = CHAIN_SEED.readUInt32LE(4);
  for (let i = 0; i < to; i++) {
    const cp = chars[i].codePointAt(0);
    a = Math.imul(a ^ cp, 0x01000193) >>> 0;
    b = Math.imul((b ^ cp) + 0x9e3779b9, 0x85ebca6b) >>> 0;
    b = (b ^ (b >>> 13) ^ a) >>> 0;
    if (i + 1 > MIN_MATCH_CHARS) visit(i + 1, a, b);
  }
}
const stepCode = (a, b) => [(a ^ (b >>> 7)) & 0xff, ((a >>> 8) ^ b) & 0xff, ((a >>> 16) ^ (b >>> 19)) & 0xff];

function fingerprint(loose) {
  const chars = [...loose];
  const tracked = Math.min(chars.length, MAX_TRACKED_CHARS);
  const steps = Buffer.alloc(Math.max(0, tracked - MIN_MATCH_CHARS) * STEP_BYTES);
  chain(chars, tracked, (pos, a, b) => steps.set(stepCode(a, b), (pos - MIN_MATCH_CHARS - 1) * STEP_BYTES));
  return { len: chars.length, full: hash(loose), head: hash(chars.slice(0, MIN_MATCH_CHARS).join('')), steps: steps.toString('base64') };
}

const validEntry = (e) => e && Number.isSafeInteger(e.len) && e.len >= MIN_MATCH_CHARS && typeof e.full === 'string'
  && ((typeof e.head === 'string' && typeof e.steps === 'string') || (e.marks && typeof e.marks === 'object'));

function readLedger(root) {
  try {
    const data = JSON.parse(readFileSync(ledgerPath(root), 'utf8'));
    return Array.isArray(data?.entries) ? data.entries.filter(validEntry).slice(-MAX_ENTRIES) : [];
  } catch { return []; } // missing or corrupt: start over (fewer matches is the safe direction)
}

function writeLedger(root, entries) {
```

_First 80 of 151 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
