# File: hq/version-intelligence/sources/common.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/version-intelligence/sources/common.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3777 B |
| Lines | 75 |
| Hash | c2eb59beab5c |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| SOURCE_SCHEMA | const | 4 | yes | export const SOURCE_SCHEMA = &#39;arbor.hvi.source/1&#39;; |
| MANIFEST_SCHEMA | const | 5 | yes | export const MANIFEST_SCHEMA = &#39;arbor.hvi.manifest/1&#39;; |
| SHA_RE | const | 6 | yes | export const SHA_RE = /^[a-f0-9]{40}$/; |
| SourceError | class | 8 | yes | export class SourceError extends Error { |
| constructor | method | 9 | yes | constructor(code, detail = &#39;&#39;) { |
| fail | function | 17 | yes | export function fail(code, detail = &#39;&#39;) { throw new SourceError(code, detail); } |
| assertSha | function | 18 | yes | export function assertSha(value) { |
| canonicalRepo | function | 22 | yes | export function canonicalRepo(repo, provider = &#39;github&#39;) { |
| safePath | function | 33 | yes | export function safePath(path, { allowEmpty = false } = {}) { |
| safeRef | function | 42 | yes | export function safeRef(ref) { |
| canonicalJson | function | 50 | yes | export function canonicalJson(value) { |
| keys | const | 53 | no | const keys = Object.keys(value).filter(k =&gt; value[k] !== undefined).sort(); |
| digest | function | 56 | yes | export function digest(value) { |
| gitBlobSha | function | 59 | yes | export function gitBlobSha(data) { |
| b | const | 60 | no | const b = Buffer.isBuffer(data) ? data : Buffer.from(data); |
| sensitivePath | function | 68 | yes | export function sensitivePath(path) { |
| checkCancel | function | 73 | yes | export function checkCancel(signal) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/development-read-port.mjs](../../../apps/vivim-host/control/development-read-port.mjs.md) | ../../../hq/version-intelligence/sources/common.mjs |
| [apps/vivim-host/control/hvi-capability.mjs](../../../apps/vivim-host/control/hvi-capability.mjs.md) | ../../../hq/version-intelligence/sources/common.mjs |
| [apps/vivim-host/control/hvi-source-grant.mjs](../../../apps/vivim-host/control/hvi-source-grant.mjs.md) | ../../../hq/version-intelligence/sources/common.mjs |
| [hq/test/hvi-live-source-composition.test.mjs](../../test/hvi-live-source-composition.test.mjs.md) | ../version-intelligence/sources/common.mjs |
| [hq/version-intelligence/compare/index.mjs](../compare/index.mjs.md) | ../sources/common.mjs |
| [hq/version-intelligence/integration/comparison-report-adapter.mjs](../integration/comparison-report-adapter.mjs.md) | ../sources/common.mjs |
| [hq/version-intelligence/integration/host-inspector-projection.mjs](../integration/host-inspector-projection.mjs.md) | ../sources/common.mjs |
| [hq/version-intelligence/integration/source-manifest-adapter.mjs](../integration/source-manifest-adapter.mjs.md) | ../sources/common.mjs |
| [hq/version-intelligence/sources/adapters.mjs](./adapters.mjs.md) | ./common.mjs |
| [hq/version-intelligence/sources/fixtures.mjs](./fixtures.mjs.md) | ./common.mjs |
| [hq/version-intelligence/sources/index.mjs](./index.mjs.md) | ./common.mjs |
| [hq/version-intelligence/sources/snapshots.mjs](./snapshots.mjs.md) | ./common.mjs |
| [hq/version-intelligence/sources/snapshots.test.mjs](./snapshots.test.mjs.md) | ./common.mjs |
| [tests/hq-version-intelligence/g2-host-ui.test.mjs](../../../tests/hq-version-intelligence/g2-host-ui.test.mjs.md) | ../../hq/version-intelligence/sources/common.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// HVI immutable source primitives. No checkout, network, provider or Host effects.
import { createHash } from 'node:crypto';

export const SOURCE_SCHEMA = 'arbor.hvi.source/1';
export const MANIFEST_SCHEMA = 'arbor.hvi.manifest/1';
export const SHA_RE = /^[a-f0-9]{40}$/;

export class SourceError extends Error {
  constructor(code, detail = '') {
    super(code);
    this.name = 'SourceError';
    this.code = code;
    // Never add attacker-controlled Git paths, source bytes or credentials to errors.
    this.detail = detail;
  }
}
export function fail(code, detail = '') { throw new SourceError(code, detail); }
export function assertSha(value) {
  if (typeof value !== 'string' || !SHA_RE.test(value)) fail('PIN_NOT_FOUND', 'invalid_sha');
  return value;
}
export function canonicalRepo(repo, provider = 'github') {
  if (provider !== 'github') fail('SOURCE_UNAUTHORIZED', 'unsupported_provider');
  if (typeof repo !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(repo)) {
    fail('SOURCE_UNAUTHORIZED', 'invalid_repo_identity');
  }
  const [owner, name] = repo.toLowerCase().split('/');
  if (owner === '.' || owner === '..' || name === '.' || name === '..' || name.endsWith('.git')) {
    fail('SOURCE_UNAUTHORIZED', 'invalid_repo_identity');
  }
  return owner + '/' + name;
}
export function safePath(path, { allowEmpty = false } = {}) {
  if (path === '' && allowEmpty) return '';
  if (typeof path !== 'string' || !path || path.length > 4096 ||
      path.startsWith('/') || path.includes('\\') || path.includes('\0') ||
      /[\x00-\x1f\x7f]/.test(path) || /(^|\/)\.{1,2}(\/|$)/.test(path) ||
      path.split('/').some(part => !part || part === '.git') ||
      /^[A-Za-z]:/.test(path)) fail('SCOPE_ESCAPE', 'invalid_git_relative_path');
  return path;
}
export function safeRef(ref) {
  if (typeof ref !== 'string' || !ref || ref.length > 255 ||
      ref.startsWith('-') || ref.startsWith('/') || ref.endsWith('/') ||
      ref.includes('..') || ref.includes('@{') || ref.includes('//') ||
      /[\x00-\x20~^:?*\\[\]]/.test(ref) ||
      !/^[A-Za-z0-9_./-]+$/.test(ref)) fail('SOURCE_UNAUTHORIZED', 'unsafe_ref');
  return ref;
}
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(value).filter(k => value[k] !== undefined).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}
export function digest(value) {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}
export function gitBlobSha(data) {
  const b = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
}
/**
 * One source-read denylist, including lower-level readPinnedBlob and A->C
 * manifests. The C bridge applies its own independent, fail-closed filter.
 * Matching is per path segment so innocuous suffixes cannot hide credentials.
 */
export function sensitivePath(path) {
  if (typeof path !== 'string') return true;
  return path.replaceAll('\\', '/').split('/').some(part =>
    /^(?:\.git|\.ssh|\.aws|\.env[^/]*|\.npmrc|\.pypirc|\.netrc|id_rsa|id_ed25519|id_ecdsa|id_dsa|credentials?(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|tokens?(?:\.[^/]*)?|cookies?(?:\.[^/]*)?|sessions?(?:\.[^/]*)?|login[ -]?data|storage-state\.json|release-profile\.json|private|personal|profiles?|.*\.(?:pem|p12|pfx|key|keystore))$/i.test(part));
}
export function checkCancel(signal) {
  if (signal?.aborted) fail('RESOURCE_LIMIT', 'cancelled');
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
