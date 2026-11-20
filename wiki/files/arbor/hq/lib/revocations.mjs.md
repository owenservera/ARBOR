# File: hq/lib/revocations.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/revocations.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9201 B |
| Lines | 234 |
| Hash | a2a5ccfce938 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REVOCATION_SCHEMA | const | 17 | yes | export const REVOCATION_SCHEMA = &#39;vivim.revocation/1&#39;; |
| VIEW_SCHEMA | const | 18 | yes | export const VIEW_SCHEMA = &#39;vivim.revocation-view/1&#39;; |
| LEDGER_NAME | const | 19 | yes | export const LEDGER_NAME = &#39;revocations.jsonl&#39;; |
| DEFAULT_REVOCATIONS_DIR | const | 22 | yes | export const DEFAULT_REVOCATIONS_DIR = &#39;C:/VIVIM/channel/revocations&#39;; |
| KINDS | const | 25 | yes | export const KINDS = /** @type {const} */ ([&#39;scope&#39;, &#39;seat&#39;, &#39;send&#39;]); |
| SECRET_PATTERNS | const | 27 | no | const SECRET_PATTERNS = [ |
| RevocationError | class | 42 | yes | export class RevocationError extends Error { |
| constructor | method | 47 | yes | constructor(code, message) { |
| ledgerPath | function | 60 | yes | export function ledgerPath(target) { |
| p | const | 61 | no | const p = String(target ?? &#39;&#39;).trim(); |
| carriesSecret | function | 66 | yes | export function carriesSecret(text) { |
| revocationId | function | 76 | yes | export function revocationId({ subject, kind, at, reason, seq = 0 } = {}) { |
| stamp | const | 77 | no | const stamp = String(at).replace(/[-:]/g, &#39;&#39;).replace(/\\.\\d+Z$/, &#39;Z&#39;); |
| digest | const | 78 | no | const digest = sha256(`${subject}\|${kind}\|${at}\|${reason}\|${seq}`).slice(0, 8); |
| revoke | function | 94 | yes | export function revoke({ file, subject, kind = &#39;scope&#39;, reason, by = null, at = nowISO() } = /** @type {any} */ ({})) { |
| ledger | const | 95 | no | const ledger = ledgerPath(file); |
| subjectText | const | 96 | no | const subjectText = String(subject ?? &#39;&#39;).trim(); |
| kindText | const | 99 | no | const kindText = String(kind ?? &#39;&#39;).trim().toLowerCase(); |
| reasonText | const | 104 | no | const reasonText = String(reason ?? &#39;&#39;).trim(); |
| atISO | const | 112 | no | const atISO = normalizeAt(at); |
| existing | const | 113 | no | const existing = readLedger(ledger); |
| revoked | function | 137 | yes | export function revoked({ file, subject, kind = &#39;scope&#39; } = /** @type {any} */ ({})) { |
| subjectText | const | 138 | no | const subjectText = String(subject ?? &#39;&#39;).trim(); |
| kindText | const | 140 | no | const kindText = String(kind ?? &#39;&#39;).trim().toLowerCase(); |
| rows | const | 141 | no | const rows = readLedger(ledgerPath(file)).filter((r) =&gt; r.subject === subjectText &amp;&amp; r.kind === kindText); |
| best | variable | 143 | no | let best = null; |
| view | function | 156 | yes | export function view({ file } = /** @type {any} */ ({})) { |
| ledger | const | 157 | no | const ledger = ledgerPath(file); |
| rows | const | 158 | no | const rows = readLedger(ledger); |
| counts | const | 160 | no | const counts = { scope: 0, seat: 0, send: 0 }; |
| ordered | const | 162 | no | const ordered = rows |
| isRevoked | function | 182 | yes | export function isRevoked({ file, subject, kind = &#39;scope&#39;, at = nowISO() } = /** @type {any} */ ({})) { |
| subjectText | const | 183 | no | const subjectText = String(subject ?? &#39;&#39;).trim(); |
| kindText | const | 185 | no | const kindText = String(kind ?? &#39;&#39;).trim().toLowerCase(); |
| cutoff | const | 186 | no | const cutoff = timeOf(normalizeAt(at)); |
| readLedger | function | 197 | no | function readLedger(ledger) { |
| lines | const | 199 | no | const lines = readFileSync(ledger, &#39;utf8&#39;).split(/\\r?\\n/); |
| rows | const | 201 | no | const rows = []; |
| text | const | 203 | no | const text = line.trim(); |
| doc | variable | 206 | no | let doc; |
| normalizeAt | function | 221 | no | function normalizeAt(at) { |
| parsed | const | 222 | no | const parsed = at instanceof Date ? at : new Date(String(at)); |
| timeOf | function | 230 | no | function timeOf(at) { |
| t | const | 231 | no | const t = Date.parse(String(at)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 13 | external |
| node:path | import | 14 | external |
| ./util.mjs | import | 15 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/lib/comms-roof.mjs](./comms-roof.mjs.md) | ./revocations.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 3 | context | — | — | Revocation ledger — append-only record of a revoked scope, seat or send, with a stated reason, and the time-bound query that reads it back |
| 4 | owner | channel-manager | — | channel-manager |
| 5 | task | — | — | channel-revocation |
| 6 | invariant | — | — | a revocation without a stated reason is refused (NO_REASON): an unauditable revocation is not a revocation |
| 7 | invariant | — | — | the ledger is append-only: revoking again supersedes the earlier row and never rewrites it |
| 8 | invariant | — | — | a revocation applies from its recorded `at`, never to a moment before it |
| 9 | invariant | — | — | this module owns one file (`revocations.jsonl`) in the directory it is handed; nothing here sends, approves, or touches receipts |
| 10 | see | — | docs/integration/STREAM-BOUNDARIES.md | docs/integration/STREAM-BOUNDARIES.md |
| 11 | see | — | docs/CANON-DECISIONS.md | docs/CANON-DECISIONS.md |

## Excerpt

```javascript
// @ts-check
/**
 * @hq:context Revocation ledger — append-only record of a revoked scope, seat or send, with a stated reason, and the time-bound query that reads it back
 * @hq:owner channel-manager
 * @hq:task channel-revocation
 * @hq:invariant a revocation without a stated reason is refused (NO_REASON): an unauditable revocation is not a revocation
 * @hq:invariant the ledger is append-only: revoking again supersedes the earlier row and never rewrites it
 * @hq:invariant a revocation applies from its recorded `at`, never to a moment before it
 * @hq:invariant this module owns one file (`revocations.jsonl`) in the directory it is handed; nothing here sends, approves, or touches receipts
 * @hq:see docs/integration/STREAM-BOUNDARIES.md
 * @hq:see docs/CANON-DECISIONS.md
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { nowISO, sha256 } from './util.mjs';

export const REVOCATION_SCHEMA = 'vivim.revocation/1';
export const VIEW_SCHEMA = 'vivim.revocation-view/1';
export const LEDGER_NAME = 'revocations.jsonl';

/** The channel's revocation directory, passed in explicitly — never a silent write target. */
export const DEFAULT_REVOCATIONS_DIR = 'C:/VIVIM/channel/revocations';

/** The three things a revocation can take away. */
export const KINDS = /** @type {const} */ (['scope', 'seat', 'send']);

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{10,}/,
  /\bbearer\s+[A-Za-z0-9._-]{20,}/i,
  /\bapi[_-]?key\s*[:=]\s*\S{8,}/i,
  /\bpassword\s*[:=]\s*\S{4,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

/**
 * A refusal the caller can act on. Every rejection carries a code so a UI can
 * branch without matching on prose.
 */
export class RevocationError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'RevocationError';
    this.code = code;
  }
}

/**
 * Where the ledger is. A directory keeps the ledger inside it — the channel
 * hands over `C:/VIVIM/channel/revocations`, not a file — and a path that
 * already names the ledger file is used as given. There is no default: the
 * caller states the directory, so nothing writes to C:/VIVIM by omission.
 */
export function ledgerPath(target) {
  const p = String(target ?? '').trim();
  if (!p) throw new RevocationError('NO_FILE', 'a revocation ledger path is required; pass the revocations directory or its .jsonl file');
  return /\.jsonl?$/i.test(p) ? p : join(p, LEDGER_NAME);
}

export function carriesSecret(text) {
  return SECRET_PATTERNS.some((re) => re.test(String(text ?? '')));
}

/**
 * A stable, collision-resistant name for one row. `seq` is the ledger length
 * before the append, so two revocations in the same millisecond still differ.
 *
 * @param {{subject?: string, kind?: string, at?: string, reason?: string, seq?: number}} [opts]
 */
export function revocationId({ subject, kind, at, reason, seq = 0 } = {}) {
  const stamp = String(at).replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const digest = sha256(`${subject}|${kind}|${at}|${reason}|${seq}`).slice(0, 8);
  return `RV-${stamp}-${kind}-${digest}`;
}
```

_First 80 of 235 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
