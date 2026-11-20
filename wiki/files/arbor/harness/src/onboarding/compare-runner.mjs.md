# File: harness/src/onboarding/compare-runner.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/onboarding/compare-runner.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 6778 B |
| Lines | 120 |
| Hash | 1ee4962053cf |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ID | const | 12 | no | const ID = /^[A-Za-z0-9_-]{1,128}$/; |
| coded | function | 13 | no | const coded = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| sha256 | function | 14 | no | const sha256 = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| iso | function | 15 | no | const iso = ms =&gt; new Date(ms).toISOString(); |
| defaultIdFor | function | 16 | no | const defaultIdFor = () =&gt; `cmp-${randomUUID()}`; |
| assertSaveDirAllowed | function | 20 | yes | export function assertSaveDirAllowed(saveDir) { |
| abs | const | 22 | no | const abs = resolve(saveDir); |
| segments | const | 23 | no | const segments = abs.split(/[\\\\/]+/).filter(Boolean).map(s =&gt; s.toLowerCase()); |
| dir | variable | 25 | no | let dir = abs; |
| parent | const | 28 | no | const parent = dirname(dir); |
| threadUrlKind | function | 37 | yes | export function threadUrlKind(url, profile) { |
| u | variable | 40 | no | let u; try { u = new URL(url); } catch { return &#39;base&#39;; } |
| pattern | const | 43 | no | const pattern = new RegExp(profile.threadPattern.source, profile.threadPattern.flags.replace(/[gy]/g, &#39;&#39;)); |
| writeAtomic | function | 47 | no | async function writeAtomic(file, data) { |
| tmp | const | 49 | no | const tmp = `${file}.${randomUUID()}.tmp`; |
| runComparison | function | 54 | yes | export async function runComparison({ providers, prompt, router, grants, saveDir, getRecord, now = Date.now, idFor = defaultIdFor, profileFor = getProvider, profile = &#39;lab&#39;, port = 9333, waitMs = 180… |
| dir | const | 64 | no | const dir = assertSaveDirAllowed(saveDir); |
| promptDigest | const | 67 | no | const promptDigest = sha256(prompt); |
| results | const | 68 | no | const results = []; |
| flush | function | 69 | no | const flush = () =&gt; writeAtomic(join(dir, &#39;results.json&#39;), JSON.stringify(results, null, 2)); |
| seen | const | 70 | no | const seen = new Set(); |
| startedAt | const | 73 | no | const startedAt = iso(now()); |
| finish | function | 74 | no | const finish = (entry) =&gt; { results.push({ ...entry, finishedAt: iso(now()) }); }; |
| profileObj | const | 76 | no | const profileObj = await Promise.resolve().then(() =&gt; profileFor(provider)).catch(() =&gt; null); |
| requestId | const | 82 | no | const requestId = idFor(provider); |
| gate | const | 86 | no | const gate = { provider, profile, port, promptDigest, threadUrl: &#39;new&#39;, now: now() }; |
| checked | const | 87 | no | const checked = await grants.check(gate); |
| consumed | const | 88 | no | const consumed = checked.ok ? await grants.consume({ ...gate, requestId, now: now() }) : checked; |
| status | variable | 94 | no | let status; let reply = null; let error; |
| waited | const | 98 | no | const waited = await router.wait(requestId, waitMs); |
| kind | const | 109 | no | const kind = threadUrlKind(record?.threadUrl ?? null, profileObj); |
| replyChars | variable | 111 | no | let replyChars = 0; let replyDigest = null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs/promises | import | 1 | external |
| node:fs | import | 2 | external |
| node:crypto | import | 3 | external |
| node:path | import | 4 | external |
| ../providers/index.mjs | import | 5 | [harness/src/providers/index.mjs](../providers/index.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/test/onboarding/compare-runner.test.mjs](../../test/onboarding/compare-runner.test.mjs.md) | ../../src/onboarding/compare-runner.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { getProvider } from '../providers/index.mjs';

// Comparison runner: one fresh-thread send per provider, each consuming an owner-issued onboarding grant.
// Never resends: an uncertain, pending, or errored request is recorded and the run moves on.
// Never approves: the router's approval path belongs to the approver the caller injected into the router.
// Privacy: reply text goes only to saveDir/<requestId>.reply.txt; results.json holds metadata only.

const ID = /^[A-Za-z0-9_-]{1,128}$/;
const coded = (code, message) => Object.assign(new Error(message), { code });
const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
const iso = ms => new Date(ms).toISOString();
const defaultIdFor = () => `cmp-${randomUUID()}`;

// Refuses save locations that could sit in a repository or a tracked docs/catalog tree.
// Fail-closed: any '.git', 'catalog' or 'docs' path segment refuses, and so does any directory with a .git entry above it.
export function assertSaveDirAllowed(saveDir) {
  if (typeof saveDir !== 'string' || !saveDir.trim()) throw coded('SAVE_DIR_REFUSED', 'saveDir must be a non-empty path');
  const abs = resolve(saveDir);
  const segments = abs.split(/[\\/]+/).filter(Boolean).map(s => s.toLowerCase());
  if (segments.some(s => s === '.git' || s === 'catalog' || s === 'docs')) throw coded('SAVE_DIR_REFUSED', 'saveDir must not be under .git, catalog/ or docs/');
  let dir = abs;
  for (;;) {
    if (existsSync(join(dir, '.git'))) throw coded('SAVE_DIR_REFUSED', 'saveDir must not be inside a git working tree');
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return abs;
}

// Classifies the journal's thread URL against the provider profile. Only a URL on a profile host whose path matches
// threadPattern is 'native'. A present URL that does not match is 'base' (observed delivery does not prove exact-thread binding).
export function threadUrlKind(url, profile) {
  if (url === null || url === undefined || url === '') return 'none';
  if (typeof url !== 'string') return 'base';
  let u; try { u = new URL(url); } catch { return 'base'; }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return 'base';
  if (!profile || !Array.isArray(profile.hosts) || !profile.hosts.includes(u.hostname) || !(profile.threadPattern instanceof RegExp)) return 'base';
  const pattern = new RegExp(profile.threadPattern.source, profile.threadPattern.flags.replace(/[gy]/g, ''));
  return pattern.test(u.pathname) ? 'native' : 'base';
}

async function writeAtomic(file, data) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, data, { mode: 0o600 });
  await rename(tmp, file);
}

export async function runComparison({
  providers, prompt, router, grants, saveDir, getRecord, now = Date.now, idFor = defaultIdFor,
  profileFor = getProvider, profile = 'lab', port = 9333, waitMs = 180000
} = {}) {
  if (!Array.isArray(providers) || !providers.length || providers.some(p => typeof p !== 'string' || !p.trim())) throw new TypeError('providers must be a non-empty array of strings');
  if (new Set(providers).size !== providers.length) throw new TypeError('providers must not repeat');
  if (typeof prompt !== 'string' || !prompt.length) throw new TypeError('prompt must be a non-empty string');
  if (typeof router?.ask !== 'function' || typeof router?.wait !== 'function') throw new TypeError('router must provide ask and wait');
  if (typeof grants?.check !== 'function' || typeof grants?.consume !== 'function') throw new TypeError('grants must provide check and consume');
  if (typeof getRecord !== 'function') throw new TypeError('getRecord(requestId) is required');
  const dir = assertSaveDirAllowed(saveDir);
  await mkdir(dir, { recursive: true, mode: 0o700 });

  const promptDigest = sha256(prompt);
  const results = [];
  const flush = () => writeAtomic(join(dir, 'results.json'), JSON.stringify(results, null, 2));
  const seen = new Set();

  for (const provider of providers) {
    const startedAt = iso(now());
    const finish = (entry) => { results.push({ ...entry, finishedAt: iso(now()) }); };

    const profileObj = await Promise.resolve().then(() => profileFor(provider)).catch(() => null);
    if (!profileObj) {
      finish({ provider, requestId: null, status: 'skipped', replyChars: 0, replyDigest: null, threadUrlKind: 'none', startedAt, error: 'UNSUPPORTED_PROVIDER' });
      await flush(); continue;
    }
```

_First 80 of 121 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
