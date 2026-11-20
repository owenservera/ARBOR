# File: harness/src/onboarding/grant.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/onboarding/grant.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7712 B |
| Lines | 128 |
| Hash | 63038be037b7 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FILE | const | 12 | no | const FILE = &#39;onboarding-grant.json&#39;; |
| DIGEST | const | 13 | no | const DIGEST = /^[a-f0-9]{64}$/; |
| PORT_REFUSED | const | 14 | no | const PORT_REFUSED = 9222; |
| MAX_SENDS | const | 15 | no | const MAX_SENDS = 20; |
| MAX_EXPIRY_MS | const | 16 | no | const MAX_EXPIRY_MS = 24 * 3600000; |
| coded | function | 18 | no | const coded = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| deny | function | 19 | no | const deny = reason =&gt; ({ ok: false, reason, remaining: null }); |
| writeAtomic | function | 21 | no | async function writeAtomic(file, data) { |
| tmp | const | 23 | no | const tmp = `${file}.${randomUUID()}.tmp`; |
| ttyConfirm | function | 30 | yes | export async function ttyConfirm({ summary, stdin = process.stdin, stdout = process.stderr } = {}) { |
| phrase | const | 32 | no | const phrase = `ISSUE ${summary.providers.join(&#39;,&#39;)}`; |
| rl | const | 33 | no | const rl = createInterface({ input: stdin, output: stdout }); |
| typed | const | 36 | no | const typed = await rl.question(`Type exactly &quot;${phrase}&quot; to confirm: `); |
| createGrantStore | function | 41 | yes | export function createGrantStore({ dir, now = Date.now, confirm = null, stdin = process.stdin, stdout = process.stderr } = {}) { |
| file | const | 43 | no | const file = join(dir, FILE); |
| slot | function | 44 | no | const slot = (id, k) =&gt; join(dir, `${id}.slot-${k}.json`); |
| read | function | 47 | no | async function read() { |
| exists | function | 50 | no | const exists = async p =&gt; { try { await access(p); return true; } catch { return false; } }; |
| used | function | 51 | no | async function used(r) { |
| n | variable | 52 | no | let n = 0; |
| wellFormed | function | 56 | no | const wellFormed = r =&gt; typeof r.id === &#39;string&#39; &amp;&amp; Array.isArray(r.providers) &amp;&amp; typeof r.profile === &#39;string&#39; &amp;&amp; typeof r.port === &#39;number&#39; |
| rules | function | 60 | no | function rules(req, r, t) { |
| gate | function | 72 | no | async function gate(req) { |
| r | const | 73 | no | const r = await read(); |
| t | const | 74 | no | const t = req.now ?? now(); |
| d | const | 75 | no | const d = rules(req, r, t); |
| n | const | 77 | no | const n = await used(r); |
| summary | const | 93 | no | const summary = { providers: [...providers], profile, port, maxSends, expiresInMs, fresh: true }; |
| ask | const | 94 | no | const ask = confirmOpt ?? confirm ?? (opts =&gt; ttyConfirm({ ...opts, stdin, stdout })); |
| issuedAt | const | 97 | no | const issuedAt = now(); |
| g | const | 103 | no | const g = await gate(req); |
| g | const | 108 | no | const g = await gate(req); |
| r | const | 120 | no | const r = await read(); |
| exists | variable | 121 | no | let exists = true; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 1 | external |
| node:path | import | 2 | external |
| node:crypto | import | 3 | external |
| node:readline/promises | import | 4 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/onboarding/compare-runner.test.mjs](../../test/onboarding/compare-runner.test.mjs.md) | ../../src/onboarding/grant.mjs |
| [harness/test/onboarding/grant.test.mjs](../../test/onboarding/grant.test.mjs.md) | ../../src/onboarding/grant.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { mkdir, readFile, writeFile, rename, unlink, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

// Onboarding grant: an OWNER-issued, bounded permission for the worker to CONSUME sends on fresh threads.
// The worker never issues or approves for itself: issue() needs a confirm callback that returns exactly true,
// and the default confirm needs an interactive TTY plus a typed phrase, so no automated process can issue one.
// Each send claims one exclusive slot file (wx), so consumption is atomic across processes and one-shot per send.
// Records hold no prompt text, no reply, no thread URL and no token: only promptDigest (sha256 hex).

const FILE = 'onboarding-grant.json';
const DIGEST = /^[a-f0-9]{64}$/;
const PORT_REFUSED = 9222;
const MAX_SENDS = 20;
const MAX_EXPIRY_MS = 24 * 3600000;

const coded = (code, message) => Object.assign(new Error(message), { code });
const deny = reason => ({ ok: false, reason, remaining: null });

async function writeAtomic(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(tmp, file);
}

// Default confirm: requires an interactive terminal on stdin and stdout, then a typed phrase.
// Throws GRANT_NO_TTY when there is no terminal, so a piped or automated process cannot issue a grant.
export async function ttyConfirm({ summary, stdin = process.stdin, stdout = process.stderr } = {}) {
  if (!stdin?.isTTY || !stdout?.isTTY) throw coded('GRANT_NO_TTY', 'Onboarding grants can only be issued from an interactive terminal');
  const phrase = `ISSUE ${summary.providers.join(',')}`;
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    stdout.write(`Issue onboarding grant: providers=${summary.providers.join(',')} profile=${summary.profile} port=${summary.port} maxSends=${summary.maxSends} expiresInMs=${summary.expiresInMs} (fresh threads only)\n`);
    const typed = await rl.question(`Type exactly "${phrase}" to confirm: `);
    return typed === phrase;
  } finally { rl.close(); }
}

export function createGrantStore({ dir, now = Date.now, confirm = null, stdin = process.stdin, stdout = process.stderr } = {}) {
  if (typeof dir !== 'string' || !dir.trim()) throw new TypeError('grant dir required');
  const file = join(dir, FILE);
  const slot = (id, k) => join(dir, `${id}.slot-${k}.json`);

  // Unreadable or corrupt records are treated as "no grant" (deny by default).
  async function read() {
    try { const r = JSON.parse(await readFile(file, 'utf8')); return r && typeof r === 'object' ? r : null; } catch { return null; }
  }
  const exists = async p => { try { await access(p); return true; } catch { return false; } };
  async function used(r) {
    let n = 0;
    for (let k = 0; k < r.maxSends; k++) if (await exists(slot(r.id, k))) n++;
    return n;
  }
  const wellFormed = r => typeof r.id === 'string' && Array.isArray(r.providers) && typeof r.profile === 'string' && typeof r.port === 'number'
    && typeof r.promptDigest === 'string' && Number.isInteger(r.maxSends) && typeof r.expiresAt === 'number';

  // Pure ordering of denials. Returns a deny result or null when every rule passes.
  function rules(req, r, t) {
    if (r && r.revoked === true) return deny('REVOKED');
    if (!r || !wellFormed(r)) return deny('NO_GRANT');
    if (t >= r.expiresAt) return deny('EXPIRED');
    if (req.port === PORT_REFUSED || req.port !== r.port) return deny('PORT_MISMATCH');
    if (!r.providers.includes(req.provider)) return deny('PROVIDER_NOT_GRANTED');
    if (req.profile !== r.profile) return deny('PROFILE_MISMATCH');
    if (req.promptDigest !== r.promptDigest) return deny('DIGEST_MISMATCH');
    if (req.threadUrl !== 'new') return deny('NEW_THREAD_REQUIRED');
    return null;
  }

  async function gate(req) {
    const r = await read();
    const t = req.now ?? now();
    const d = rules(req, r, t);
    if (d) return { denied: d };
    const n = await used(r);
    if (n >= r.maxSends) return { denied: deny('EXHAUSTED') };
    return { grant: r, remaining: r.maxSends - n };
  }
```

_First 80 of 129 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
