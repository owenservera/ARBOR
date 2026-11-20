# File: apps/vivim-host/control/hvi-source-grant.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/hvi-source-grant.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7569 B |
| Lines | 148 |
| Hash | 908bd4586651 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HVI_SOURCE_GRANT_KEY | const | 19 | yes | export const HVI_SOURCE_GRANT_KEY = &#39;grant.hvi.development-source&#39;; |
| HVI_SOURCE_GRANT_REVOKED_KEY | const | 20 | yes | export const HVI_SOURCE_GRANT_REVOKED_KEY = &#39;grant.hvi.development-source.revoked&#39;; |
| HVI_SOURCE_GRANT_MAX_REPOS | const | 21 | yes | export const HVI_SOURCE_GRANT_MAX_REPOS = 16; |
| HVI_SOURCE_GRANT_REASONS | const | 23 | yes | export const HVI_SOURCE_GRANT_REASONS = Object.freeze({ revoked: &#39;HVI_SOURCE_GRANT_REVOKED&#39;, notGranted: &#39;HVI_SOURCE_GRANT_REQUIRED&#39;, expired: &#39;HVI_SOURCE_GRANT_EXPIRED&#39;, scope: &#39;HVI_SOURCE_GRANT_SCO… |
| fail | function | 31 | no | const fail = code =&gt; { const e = new Error(&#39;HVI_SOURCE_GRANT_&#39; + code); e.code = code; throw e; }; |
| refuse | function | 32 | no | const refuse = (code, message) =&gt; ({ ok: false, code, message }); |
| createHviSourceGrantStore | function | 42 | yes | export function createHviSourceGrantStore({ ledger, now = () =&gt; new Date().toISOString() } = {}) { |
| current | function | 45 | no | const current = () =&gt; readGrant(ledger, HVI_SOURCE_GRANT_KEY); |
| tombstone | function | 46 | no | const tombstone = () =&gt; readGrant(ledger, HVI_SOURCE_GRANT_REVOKED_KEY); |
| issue | function | 49 | no | function issue({ actorId, repoIdentities, expiresInMs = GRANT_MAX_EXPIRY_MS } = {}) { |
| repos | const | 55 | no | const repos = [...new Set(repoIdentities.map(repo =&gt; canonicalRepo(repo, &#39;github&#39;)))]; |
| issuedAt | const | 56 | no | const issuedAt = new Date(now()).toISOString(); |
| issuedMs | const | 57 | no | const issuedMs = Date.parse(issuedAt); |
| revoke | function | 76 | no | function revoke({ actorId } = {}) { |
| prior | const | 77 | no | const prior = current(); |
| revokedAt | const | 78 | no | const revokedAt = new Date(now()).toISOString(); |
| verify | function | 96 | no | function verify({ repoIdentity } = {}) { |
| nowMs | const | 97 | no | const nowMs = Date.parse(now()); |
| grant | const | 101 | no | const grant = current(); |
| expiry | const | 106 | no | const expiry = grantExpiryMs(grant); |
| repo | variable | 110 | no | let repo; |
| status | function | 120 | no | function status() { |
| grant | const | 121 | no | const grant = current(); |
| tomb | const | 122 | no | const tomb = tombstone(); |
| expiry | const | 123 | no | const expiry = grant ? grantExpiryMs(grant) : null; |
| nowMs | const | 124 | no | const nowMs = Date.parse(now()); |
| createHviSourceGrantVerifier | function | 145 | yes | export function createHviSourceGrantVerifier(store) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 15 | external |
| ../../../hq/version-intelligence/sources/common.mjs | import | 16 | [hq/version-intelligence/sources/common.mjs](../../../hq/version-intelligence/sources/common.mjs.md) |
| ../bootstrap/service.mjs | import | 17 | [apps/vivim-host/bootstrap/service.mjs](../bootstrap/service.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/development-read-port.mjs](./development-read-port.mjs.md) | ./hvi-source-grant.mjs |
| [apps/vivim-host/test/hvi-source-grant.test.mjs](../test/hvi-source-grant.test.mjs.md) | ../control/hvi-source-grant.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// HVI development-source grant.
//
// Reuses the Host's EXISTING bounded-grant vocabulary and the EXISTING bootstrap
// ledger `meta` store. This file creates no new authority, no new store, no new
// endpoint, no scheduler, no second effect writer and no new bearer credential.
//
// A development-source grant names WHICH repositories the owner authorised, FOR HOW
// LONG, and can be revoked. Absence, expiry and revocation all fail closed and each
// refusal has its own machine-readable code. The evaluation order is fixed and
// mirrors the existing bootstrap grant: revoked -> not granted -> expired -> scope.
//
// The grant authorises REPOSITORIES, not identities: who the caller is stays the
// Host owner's business (see createHviLocalOwnerGate in ./hvi-capability.mjs). A
// valid owner session alone never grants repository access.
import { randomUUID } from 'node:crypto';
import { canonicalRepo } from '../../../hq/version-intelligence/sources/common.mjs';
import { readGrant, writeGrant, grantExpiryMs, GRANT_MAX_EXPIRY_MS } from '../bootstrap/service.mjs';

export const HVI_SOURCE_GRANT_KEY = 'grant.hvi.development-source';
export const HVI_SOURCE_GRANT_REVOKED_KEY = 'grant.hvi.development-source.revoked';
export const HVI_SOURCE_GRANT_MAX_REPOS = 16;

export const HVI_SOURCE_GRANT_REASONS = Object.freeze({
  revoked: 'HVI_SOURCE_GRANT_REVOKED',
  notGranted: 'HVI_SOURCE_GRANT_REQUIRED',
  expired: 'HVI_SOURCE_GRANT_EXPIRED',
  scope: 'HVI_SOURCE_GRANT_SCOPE',
  invalid: 'HVI_SOURCE_GRANT_INVALID',
});

const fail = code => { const e = new Error('HVI_SOURCE_GRANT_' + code); e.code = code; throw e; };
const refuse = (code, message) => ({ ok: false, code, message });

/**
 * A development-source grant store over the Host's existing ledger `meta` table.
 *
 * `ledger` is the EXISTING bootstrap ledger handle (apps/vivim-host/bootstrap/ledger.mjs).
 * The grant occupies its own meta key so it never widens or shadows the existing
 * bootstrap grant, and a revocation tombstone lives under a second key so "revoked"
 * stays distinguishable from "never granted".
 */
export function createHviSourceGrantStore({ ledger, now = () => new Date().toISOString() } = {}) {
  if (!ledger || typeof ledger.meta?.get !== 'function' || typeof ledger.meta?.set !== 'function'
      || typeof ledger.transaction !== 'function') fail('INVALID');
  const current = () => readGrant(ledger, HVI_SOURCE_GRANT_KEY);
  const tombstone = () => readGrant(ledger, HVI_SOURCE_GRANT_REVOKED_KEY);

  /** Owner action. Names the repositories, bounds the lifetime, clears any tombstone. */
  function issue({ actorId, repoIdentities, expiresInMs = GRANT_MAX_EXPIRY_MS } = {}) {
    if (typeof actorId !== 'string' || !actorId.trim()) fail('INVALID');
    if (!Array.isArray(repoIdentities) || repoIdentities.length < 1
        || repoIdentities.length > HVI_SOURCE_GRANT_MAX_REPOS) fail('INVALID');
    if (!Number.isInteger(expiresInMs) || expiresInMs < 1 || expiresInMs > GRANT_MAX_EXPIRY_MS) fail('INVALID');
    // canonicalRepo lowercases and rejects traversal, so the stored set is canonical.
    const repos = [...new Set(repoIdentities.map(repo => canonicalRepo(repo, 'github')))];
    const issuedAt = new Date(now()).toISOString();
    const issuedMs = Date.parse(issuedAt);
    if (!Number.isFinite(issuedMs)) fail('INVALID');
    const record = {
      id: 'hsg-' + randomUUID(),
      actorId: actorId.trim(),
      repoIdentities: repos,
      at: issuedAt,
      // Every NEW grant carries an absolute expiry, exactly like the bootstrap grant.
      expiresAt: new Date(issuedMs + expiresInMs).toISOString(),
      source: 'owner',
    };
    ledger.transaction(() => {
      writeGrant(ledger, record, HVI_SOURCE_GRANT_KEY);
      writeGrant(ledger, null, HVI_SOURCE_GRANT_REVOKED_KEY);
    });
    return { ...record, repoIdentities: [...record.repoIdentities] };
  }

  /** Owner action. Removes the grant and leaves a revocation tombstone behind. */
  function revoke({ actorId } = {}) {
    const prior = current();
    const revokedAt = new Date(now()).toISOString();
    ledger.transaction(() => {
      writeGrant(ledger, null, HVI_SOURCE_GRANT_KEY);
```

_First 80 of 149 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
