# File: hq/lib/kb-bind.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/kb-bind.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10524 B |
| Lines | 243 |
| Hash | 1278a30b5188 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| KB_BINDING_SCHEMA | const | 26 | yes | export const KB_BINDING_SCHEMA = &#39;hq.kb-binding/1&#39;; |
| KB_BINDING_VERSION | const | 27 | yes | export const KB_BINDING_VERSION = 1; |
| KB_BINDING_REL_PATH | const | 28 | yes | export const KB_BINDING_REL_PATH = &#39;hq/registry/kb-binding.v1.json&#39;; |
| CANONICAL_TAXONOMY_REL_PATH | const | 29 | yes | export const CANONICAL_TAXONOMY_REL_PATH = &#39;hq/registry/canonical-taxonomy.v1.json&#39;; |
| EXTENSION_PREFIX | const | 30 | yes | export const EXTENSION_PREFIX = &#39;hq.ext.&#39;; |
| BINDING_STATUS | const | 31 | yes | export const BINDING_STATUS = &#39;provisional&#39;; |
| BINDING_AUTHORITY | const | 32 | yes | export const BINDING_AUTHORITY = &#39;project_observed&#39;; |
| BINDING_KIND | const | 33 | yes | export const BINDING_KIND = &#39;extension&#39;; |
| TARGET_KINDS | const | 35 | yes | export const TARGET_KINDS = Object.freeze([&#39;canonical&#39;, &#39;extension&#39;, &#39;unbound&#39;]); |
| MODULE_DIR | const | 37 | no | const MODULE_DIR = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 38 | no | const REPO_ROOT = resolve(MODULE_DIR, &#39;..&#39;, &#39;..&#39;); |
| str | function | 40 | no | const str = (value) =&gt; String(value ?? &#39;&#39;).trim(); |
| cmpStr | function | 41 | no | const cmpStr = (a, b) =&gt; (a === b ? 0 : a &lt; b ? -1 : 1); |
| repoPath | function | 44 | no | function repoPath(value) { |
| path | const | 45 | no | const path = str(value); |
| extensionTarget | function | 50 | yes | export function extensionTarget(kbId) { |
| loadCanonicalIds | function | 62 | yes | export function loadCanonicalIds(options = {}) { |
| path | const | 63 | no | const path = options.root |
| doc | const | 67 | no | const doc = JSON.parse(readFileSync(path, &#39;utf8&#39;)); |
| ids | const | 68 | no | const ids = new Set(); |
| validateKbBinding | function | 86 | yes | export function validateKbBinding(binding) { |
| errors | const | 87 | no | const errors = []; |
| generated | const | 97 | no | const generated = binding.generatedFrom; |
| seen | const | 106 | no | const seen = new Set(); |
| at | const | 108 | no | const at = `bindings[${index}]`; |
| kbId | const | 110 | no | const kbId = str(entry.kbId); |
| target | const | 118 | no | const target = str(entry.target); |
| loadKbBinding | function | 134 | yes | export function loadKbBinding(options = {}) { |
| path | const | 135 | no | const path = repoPath(options.path ?? KB_BINDING_REL_PATH); |
| doc | variable | 136 | no | let doc; |
| errors | const | 142 | no | const errors = validateKbBinding(doc); |
| bindingCounts | function | 149 | yes | export function bindingCounts(binding) { |
| counts | const | 150 | no | const counts = { total: 0, canonical: 0, extension: 0, unbound: 0 }; |
| findRow | function | 162 | no | function findRow(db, id) { |
| conflict | function | 166 | no | function conflict(kbId, target, reason, detail) { |
| bindKbTypes | function | 182 | yes | export function bindKbTypes(db, binding, options = {}) { |
| result | const | 183 | no | const result = { inserted: 0, existing: 0, conflicts: [] }; |
| errors | const | 188 | no | const errors = validateKbBinding(binding); |
| ownerConfirmed | const | 194 | no | const ownerConfirmed = options.ownerConfirmed === true; |
| canonicalIds | variable | 195 | no | let canonicalIds = options.canonicalIds; |
| rows | const | 198 | no | const rows = [...binding.bindings].sort((a, b) =&gt; cmpStr(a.kbId, b.kbId)); |
| kbId | const | 200 | no | const kbId = str(entry.kbId); |
| target | const | 201 | no | const target = str(entry.target); |
| existing | const | 205 | no | const existing = findRow(db, target); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 20 | external |
| node:path | import | 21 | external |
| node:url | import | 22 | external |
| ./util.mjs | import | 24 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/test/kb-bind.test.mjs](../test/kb-bind.test.mjs.md) | ../lib/kb-bind.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 2 | context | — | — | Bind the VIVIM KB type registry to HQ&#39;s semantic vocabulary: |
| 5 | owner | hq | — | hq |
| 6 | task | — | — | kb-binding-v1 |
| 7 | invariant | — | — | The KB owns the domain model. Binding never renames a KB id and |
| 9 | invariant | — | — | Every KB id appears exactly once. Extension targets are |
| 11 | invariant | — | — | A canonical row is never overwritten, promoted or created here. |
| 13 | invariant | — | — | Rows land `provisional` with `authority: project_observed`. |
| 15 | invariant | — | — | No network, no timers, no secret material. Idempotent by target id. |
| 16 | see | — | docs/KB-BINDING-MAP.md | docs/KB-BINDING-MAP.md |
| 17 | see | — | docs/AGENTIC-RULEBOOK.md | docs/AGENTIC-RULEBOOK.md |
| 18 | see | — | hq/lib/semantic-registry.mjs | hq/lib/semantic-registry.mjs |

## Excerpt

```javascript
/**
 * @hq:context Bind the VIVIM KB type registry to HQ's semantic vocabulary:
 *   KB ids become namespaced extension entries, canonical HQ ids are only
 *   verified, and an explicit unbound list keeps personal or authority data out.
 * @hq:owner hq
 * @hq:task kb-binding-v1
 * @hq:invariant The KB owns the domain model. Binding never renames a KB id and
 *   never creates a canonical HQ id; it maps each KB type to one HQ target.
 * @hq:invariant Every KB id appears exactly once. Extension targets are
 *   `hq.ext.<lowercase-kb-id>`; an unbound entry carries a reason and writes nothing.
 * @hq:invariant A canonical row is never overwritten, promoted or created here.
 *   A collision is reported as a conflict and leaves the row untouched.
 * @hq:invariant Rows land `provisional` with `authority: project_observed`.
 *   Promotion stays an explicit owner action in the CANON register.
 * @hq:invariant No network, no timers, no secret material. Idempotent by target id.
 * @hq:see docs/KB-BINDING-MAP.md
 * @hq:see docs/AGENTIC-RULEBOOK.md
 * @hq:see hq/lib/semantic-registry.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { nowISO } from './util.mjs';

export const KB_BINDING_SCHEMA = 'hq.kb-binding/1';
export const KB_BINDING_VERSION = 1;
export const KB_BINDING_REL_PATH = 'hq/registry/kb-binding.v1.json';
export const CANONICAL_TAXONOMY_REL_PATH = 'hq/registry/canonical-taxonomy.v1.json';
export const EXTENSION_PREFIX = 'hq.ext.';
export const BINDING_STATUS = 'provisional';
export const BINDING_AUTHORITY = 'project_observed';
export const BINDING_KIND = 'extension';

export const TARGET_KINDS = Object.freeze(['canonical', 'extension', 'unbound']);

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(MODULE_DIR, '..', '..');

const str = (value) => String(value ?? '').trim();
const cmpStr = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

/** Absolute path of a repo-relative file, tolerating an already-absolute path. */
function repoPath(value) {
  const path = str(value);
  return isAbsolute(path) ? path : join(REPO_ROOT, path);
}

/** Extension target for one KB id: `hq.ext.<lowercase-kb-id>`. */
export function extensionTarget(kbId) {
  return `${EXTENSION_PREFIX}${str(kbId).toLowerCase()}`;
}

// ---------------------------------------------------------------------------
// canonical vocabulary (declared ids only; never invented here)
// ---------------------------------------------------------------------------

/**
 * Canonical ids HQ already declares in `hq/registry/canonical-taxonomy.v1.json`
 * (id grammars plus contract schema ids). An extension may never collide with one.
 */
export function loadCanonicalIds(options = {}) {
  const path = options.root
    ? join(repoPath(options.root), CANONICAL_TAXONOMY_REL_PATH)
    : repoPath(options.canonicalPath ?? CANONICAL_TAXONOMY_REL_PATH);
  try {
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    const ids = new Set();
    for (const entry of Array.isArray(doc.idGrammar) ? doc.idGrammar : []) {
      if (str(entry?.id)) ids.add(str(entry.id));
    }
    for (const entry of Array.isArray(doc.schemaIds) ? doc.schemaIds : []) {
      if (str(entry?.id)) ids.add(str(entry.id));
    }
    return ids;
  } catch {
    return new Set();
  }
}
```

_First 80 of 244 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
