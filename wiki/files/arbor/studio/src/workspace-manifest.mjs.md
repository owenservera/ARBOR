# File: studio/src/workspace-manifest.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/src/workspace-manifest.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9837 B |
| Lines | 169 |
| Hash | 57e4af185d2b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MANIFEST_SCHEMA | const | 9 | yes | export const MANIFEST_SCHEMA = &#39;vivim.workspace-manifest&#39;; |
| MANIFEST_VERSION | const | 10 | yes | export const MANIFEST_VERSION = 1; |
| MANIFEST_FILE | const | 11 | yes | export const MANIFEST_FILE = &#39;vivim-workspace.json&#39;; |
| DENIED_CDP_PORTS | const | 13 | yes | export const DENIED_CDP_PORTS = Object.freeze(new Set([9222])); |
| OWNER_POLICY | const | 14 | no | const OWNER_POLICY = &#39;studio-owner&#39;; |
| SECRET_KEY | const | 15 | no | const SECRET_KEY = /secret\|token\|password\|cookie\|credential\|api_?key/i; |
| pathImpl | function | 17 | no | const pathImpl = platform =&gt; (platform === &#39;win32&#39; ? path.win32 : path.posix); |
| coded | function | 18 | no | const coded = (code, message, extra = {}) =&gt; Object.assign(new Error(message), { code, ...extra }); |
| sameProfile | function | 19 | no | const sameProfile = (a, b, platform) =&gt; { |
| p | const | 20 | no | const p = pathImpl(platform); |
| x | const | 21 | no | const x = p.resolve(a), y = p.resolve(b); |
| findInlineSecrets | function | 27 | yes | export function findInlineSecrets(node, trail = &#39;&#39;) { |
| hits | const | 28 | no | const hits = []; |
| here | const | 31 | no | const here = trail ? `${trail}.${key}` : key; |
| validateManifest | function | 40 | yes | export function validateManifest(manifest, { platform = process.platform, exists = existsSync } = {}) { |
| p | const | 41 | no | const p = pathImpl(platform); |
| problems | const | 42 | no | const problems = []; |
| bad | function | 43 | no | const bad = (code, field, message) =&gt; problems.push({ code, field, message }); |
| absolute | function | 53 | no | const absolute = (field, value) =&gt; { |
| port | const | 59 | no | const port = manifest.chrome?.port; |
| check | function | 74 | no | const check = (code, field, value) =&gt; { |
| readManifest | function | 87 | yes | export function readManifest(file, opts = {}) { |
| manifest | variable | 89 | no | let manifest; |
| writeManifest | function | 98 | yes | export function writeManifest(file, manifest, opts = {}) { |
| temp | const | 103 | no | const temp = `${file}.${process.pid}.${randomBytes(8).toString(&#39;hex&#39;)}.tmp`; |
| resolveStartConfig | function | 115 | yes | export function resolveStartConfig(manifest, { requestedProfile, platform = process.platform, exists = existsSync } = {}) { |
| diagnoseWorkspace | function | 135 | yes | export function diagnoseWorkspace(file, { platform = process.platform, exists = existsSync } = {}) { |
| checks | const | 136 | no | const checks = []; |
| add | function | 137 | no | const add = (name, status, detail, remedy) =&gt; checks.push({ name, status, detail, ...(remedy ? { remedy } : {}) }); |
| finish | function | 138 | no | const finish = () =&gt; ({ ok: checks.every(c =&gt; c.status !== &#39;fail&#39;), checks }); |
| manifest | variable | 143 | no | let manifest; |
| complete | const | 149 | no | const complete = manifest.setupComplete === true; |
| buildManifest | function | 160 | yes | export function buildManifest({ workspaceRoot, chrome, relay = { enabled: false }, setupComplete = false }) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 5 | external |
| node:fs | import | 6 | external |
| node:crypto | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/server.mjs](../../apps/vivim-host/server.mjs.md) | ../../studio/src/workspace-manifest.mjs |
| [studio/bin/commands/setup.mjs](../bin/commands/setup.mjs.md) | ../../src/workspace-manifest.mjs |
| [studio/bin/commands/system.mjs](../bin/commands/system.mjs.md) | ../../src/workspace-manifest.mjs |
| [studio/scripts/windows/resolve-start-config.mjs](../scripts/windows/resolve-start-config.mjs.md) | ../../src/workspace-manifest.mjs |
| [studio/src/config.mjs](./config.mjs.md) | ./workspace-manifest.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// START01: persisted workspace setup manifest and single profile resolver.
// Contract: docs/design/ONE-COMMAND-WORKSPACE-STARTUP.md (ERA 1 and START01).
// The manifest records explicit paths and protected secret-file references only.
// It never stores secret values, and the resolver never falls back to another profile.
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

export const MANIFEST_SCHEMA = 'vivim.workspace-manifest';
export const MANIFEST_VERSION = 1;
export const MANIFEST_FILE = 'vivim-workspace.json';
// Matches the CDP ports already denied by harness/src/interface/target.mjs.
export const DENIED_CDP_PORTS = Object.freeze(new Set([9222]));
const OWNER_POLICY = 'studio-owner';
const SECRET_KEY = /secret|token|password|cookie|credential|api_?key/i;

const pathImpl = platform => (platform === 'win32' ? path.win32 : path.posix);
const coded = (code, message, extra = {}) => Object.assign(new Error(message), { code, ...extra });
const sameProfile = (a, b, platform) => {
  const p = pathImpl(platform);
  const x = p.resolve(a), y = p.resolve(b);
  return platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
};

// Returns the dotted paths of any key that looks secret but holds a value inline.
// Keys ending in File or Ref are permitted because they only point at a protected file.
export function findInlineSecrets(node, trail = '') {
  const hits = [];
  if (!node || typeof node !== 'object') return hits;
  for (const [key, value] of Object.entries(node)) {
    const here = trail ? `${trail}.${key}` : key;
    if (SECRET_KEY.test(key) && !/(File|Ref)$/.test(key) && value !== null && value !== undefined) hits.push(here);
    hits.push(...findInlineSecrets(value, here));
  }
  return hits;
}

// Returns { ok, problems[] }. Structural checks always run. Existence checks run only when
// setupComplete is true, because a partial wizard save may legitimately reference paths not yet created.
export function validateManifest(manifest, { platform = process.platform, exists = existsSync } = {}) {
  const p = pathImpl(platform);
  const problems = [];
  const bad = (code, field, message) => problems.push({ code, field, message });
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { ok: false, problems: [{ code: 'MANIFEST_INVALID', field: '', message: 'manifest must be a JSON object' }] };
  }
  if (manifest.schema !== MANIFEST_SCHEMA || manifest.version !== MANIFEST_VERSION) {
    bad('MANIFEST_INVALID', 'schema', `expected ${MANIFEST_SCHEMA} version ${MANIFEST_VERSION}`);
  }
  for (const field of findInlineSecrets(manifest)) {
    bad('SECRET_INLINE', field, 'store secret values in a protected file and reference the file instead');
  }
  const absolute = (field, value) => {
    if (typeof value !== 'string' || !p.isAbsolute(value)) bad('PATH_NOT_ABSOLUTE', field, 'must be an absolute path');
  };
  absolute('workspaceRoot', manifest.workspaceRoot);
  absolute('chrome.executable', manifest.chrome?.executable);
  absolute('chrome.profileDir', manifest.chrome?.profileDir);
  const port = manifest.chrome?.port;
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || DENIED_CDP_PORTS.has(port)) {
    bad('PORT_INVALID', 'chrome.port', `must be an integer from 1024 to 65535, excluding ${[...DENIED_CDP_PORTS].join(', ')}`);
  }
  if (manifest.chrome?.ownerPolicy !== OWNER_POLICY) bad('OWNER_POLICY', 'chrome.ownerPolicy', `must be "${OWNER_POLICY}"`);
  if (manifest.relay?.enabled === true) {
    absolute('relay.hostSecretFile', manifest.relay.hostSecretFile);
    if (typeof manifest.relay.origin !== 'string' || !/^https:\/\/[^/\s]+/.test(manifest.relay.origin)) {
      bad('RELAY_ORIGIN', 'relay.origin', 'must be an https origin when relay is enabled');
    }
  } else if (manifest.relay?.enabled !== false) {
    bad('RELAY_FLAG', 'relay.enabled', 'must be true or false');
  }
  if (typeof manifest.setupComplete !== 'boolean') bad('SETUP_FLAG', 'setupComplete', 'must be true or false');
  if (manifest.setupComplete === true) {
    const check = (code, field, value) => {
      if (typeof value === 'string' && p.isAbsolute(value) && !exists(value)) bad(code, field, `does not exist: ${value}`);
    };
    check('MISSING_WORKSPACE', 'workspaceRoot', manifest.workspaceRoot);
    check('MISSING_CHROME', 'chrome.executable', manifest.chrome?.executable);
    check('MISSING_PROFILE', 'chrome.profileDir', manifest.chrome?.profileDir);
    if (manifest.relay?.enabled === true) check('MISSING_SECRET_FILE', 'relay.hostSecretFile', manifest.relay.hostSecretFile);
```

_First 80 of 170 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
