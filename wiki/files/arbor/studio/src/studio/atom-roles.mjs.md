# File: studio/src/studio/atom-roles.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/atom-roles.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4774 B |
| Lines | 107 |
| Hash | 0405ae4ffb84 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROLE_IDS | const | 12 | yes | export const ROLE_IDS = [&#39;browser&#39;, &#39;tab&#39;, &#39;account&#39;, &#39;provider&#39;]; |
| ROLES | const | 14 | yes | export const ROLES = { |
| accountFamily | const | 46 | no | const accountFamily = new Set([&#39;auth&#39;, &#39;state&#39;]); |
| providerFamily | const | 47 | no | const providerFamily = new Set([&#39;consent&#39;]); |
| tabFamily | const | 48 | no | const tabFamily = new Set([&#39;frame&#39;]); |
| tabVerbs | const | 49 | no | const tabVerbs = new Set([&#39;goto&#39;, &#39;back&#39;, &#39;forward&#39;, &#39;reload&#39;, &#39;open&#39;, &#39;close&#39;, &#39;list&#39;, &#39;switch&#39;]); |
| accountTargets | const | 50 | no | const accountTargets = new Set([&#39;loginwall&#39;, &#39;authwall&#39;, &#39;captcha&#39;, &#39;twofactor&#39;, &#39;signedin&#39;, &#39;signedout&#39;, &#39;sessionexpired&#39;, &#39;wrongaccount&#39;, &#39;profile&#39;, &#39;session&#39;]); |
| providerTargets | const | 51 | no | const providerTargets = new Set([&#39;paywall&#39;, &#39;planlimit&#39;, &#39;ratelimit&#39;, &#39;errorpage&#39;, &#39;transcript&#39;, &#39;messages&#39;, &#39;lastmessage&#39;, &#39;composer&#39;]); |
| roleOf | function | 57 | yes | export function roleOf(atom) { |
| target | const | 58 | no | const target = String(atom.target ?? &#39;&#39;).toLowerCase(); |
| verb | const | 59 | no | const verb = String(atom.verb ?? &#39;&#39;).toLowerCase(); |
| partitionByRole | function | 67 | yes | export function partitionByRole(atoms) { |
| byRole | const | 68 | no | const byRole = Object.fromEntries(ROLE_IDS.map((r) =&gt; [r, []])); |
| validateRoles | function | 77 | yes | export function validateRoles(atoms) { |
| problems | const | 78 | no | const problems = []; |
| counts | const | 79 | no | const counts = Object.fromEntries(ROLE_IDS.map((r) =&gt; [r, 0])); |
| ids | const | 80 | no | const ids = new Set(); |
| role | const | 82 | no | const role = roleOf(atom); |
| total | const | 98 | no | const total = Object.values(counts).reduce((a, b) =&gt; a + b, 0); |
| managerFor | function | 104 | yes | export function managerFor(atom) { |
| role | const | 105 | no | const role = roleOf(atom); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/atoms.mjs](../../bin/commands/atoms.mjs.md) | ../../src/studio/atom-roles.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./atom-roles.mjs |
| [studio/src/studio/system-wrap.mjs](./system-wrap.mjs.md) | ./atom-roles.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Role layer: which manager owns each atomic capability, and what that manager may do. |
| 3 | owner | atlas | — | atlas |
| 4 | task | — | — | VC-21 |
| 5 | invariant | — | — | every atom has exactly one owning role; an unowned atom cannot be scheduled. |
| 6 | invariant | — | — | only the provider role may hold a provider-send; the account role never exposes values. |

## Excerpt

```javascript
/**
 * @hq:context Role layer: which manager owns each atomic capability, and what that manager may do.
 * @hq:owner atlas
 * @hq:task VC-21
 * @hq:invariant every atom has exactly one owning role; an unowned atom cannot be scheduled.
 * @hq:invariant only the provider role may hold a provider-send; the account role never exposes values.
 */
// One node, four managers. The 2000 atoms are partitioned so authority is not one flat grant:
// browser owns page mechanics, tab owns targets and frames, account owns identity and storage,
// provider owns site-specific and quota-bearing behaviour. A scheduler asks the role first.

export const ROLE_IDS = ['browser', 'tab', 'account', 'provider'];

export const ROLES = {
  browser: {
    id: 'browser',
    seat: 'browser-manager',
    purpose: 'Owns the single browser process: launch, profile, viewport, page mechanics.',
    may: ['page-write', 'read', 'browser-navigation'],
    mayNot: ['provider-send'],
  },
  tab: {
    id: 'tab',
    seat: 'tab-manager',
    purpose: 'Owns targets: which tab, which frame, which window. Never opens a second browser.',
    may: ['browser-navigation', 'read', 'page-write'],
    mayNot: ['provider-send'],
  },
  account: {
    id: 'account',
    seat: 'account-manager',
    purpose: 'Owns identity and session state: sign-in status, storage keys, consent of the owner.',
    may: ['read', 'page-write'],
    mayNot: ['provider-send', 'secret-value'],
  },
  provider: {
    id: 'provider',
    seat: 'provider-manager',
    purpose: 'Owns site behaviour and quota: composers, transcripts, walls, rate limits, sends.',
    may: ['read', 'page-write', 'provider-send'],
    mayNot: [],
  },
};

/** Ordered predicates. First match wins, so the partition is deterministic and total. */
const accountFamily = new Set(['auth', 'state']);
const providerFamily = new Set(['consent']);
const tabFamily = new Set(['frame']);
const tabVerbs = new Set(['goto', 'back', 'forward', 'reload', 'open', 'close', 'list', 'switch']);
const accountTargets = new Set(['loginwall', 'authwall', 'captcha', 'twofactor', 'signedin', 'signedout', 'sessionexpired', 'wrongaccount', 'profile', 'session']);
const providerTargets = new Set(['paywall', 'planlimit', 'ratelimit', 'errorpage', 'transcript', 'messages', 'lastmessage', 'composer']);

/**
 * Which role owns this atom. Unknown shapes fall to `browser`, which is the least privileged
 * manager that can still be told no: it cannot send.
 */
export function roleOf(atom) {
  const target = String(atom.target ?? '').toLowerCase();
  const verb = String(atom.verb ?? '').toLowerCase();
  if (accountFamily.has(atom.family) || accountTargets.has(target)) return 'account';
  if (providerFamily.has(atom.family) || providerTargets.has(target)) return 'provider';
  if (tabFamily.has(atom.family) || (atom.family === 'nav' && tabVerbs.has(verb))) return 'tab';
  return 'browser';
}

/** Attach the owning role to every atom, and report the partition. */
export function partitionByRole(atoms) {
  const byRole = Object.fromEntries(ROLE_IDS.map((r) => [r, []]));
  for (const atom of atoms) byRole[roleOf(atom)].push(atom);
  return byRole;
}

/**
 * Validate the partition: total, exclusive, and authority-honest. A provider-send held outside the
 * provider role, or a secret-shaped argument anywhere, is a defect rather than a warning.
 */
export function validateRoles(atoms) {
  const problems = [];
  const counts = Object.fromEntries(ROLE_IDS.map((r) => [r, 0]));
  const ids = new Set();
```

_First 80 of 108 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
