# File: hq/lib/wiki-runtime/rust-comment-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | hq/lib/wiki-runtime/rust-comment-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 10275 B |
| Lines | 173 |
| Hash | 522a7adb88f7 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RUST_COMMENT_PROGRAM_SCHEMA | const | 11 | yes | export const RUST_COMMENT_PROGRAM_SCHEMA = &#39;hq.comment-program/0.1&#39;; |
| EVENT_MAP | const | 12 | no | const EVENT_MAP = Object.freeze({ open: &#39;click&#39;, click: &#39;click&#39;, select: &#39;click&#39;, submit: &#39;submit&#39;, change: &#39;change&#39; }); |
| isObject | function | 14 | no | const isObject = x =&gt; x !== null &amp;&amp; typeof x === &#39;object&#39; &amp;&amp; !Array.isArray(x); |
| isHex | function | 15 | no | const isHex = x =&gt; typeof x === &#39;string&#39; &amp;&amp; /^[a-f0-9]{64}$/.test(x); |
| keysOnly | function | 16 | no | const keysOnly = (x, allow) =&gt; Object.keys(x).every(k =&gt; allow.includes(k)); |
| fail | function | 17 | no | const fail = (code, path = &#39;&#39;) =&gt; ({ ok: false, errors: [{ code, path }] }); |
| SAFE_SOURCE | const | 18 | no | const SAFE_SOURCE = /^(?![./])[a-zA-Z0-9_][a-zA-Z0-9_.\\/-]{0,239}$/; |
| SECRET_SEGMENT | const | 19 | no | const SECRET_SEGMENT = /^(?:\\.env.*\|.*\\.env\|.*\\.(?:pem\|p12\|keystore)\|cookies\|login data\|session\\.json\|storage-state\\.json)$/i; |
| verifyRustCommentSource | function | 26 | yes | export function verifyRustCommentSource(doc, { sourceRoot } = {}) { |
| root | const | 36 | no | const root = realpathSync(sourceRoot); |
| cursor | variable | 38 | no | let cursor = root; |
| segments | const | 39 | no | const segments = path.split(&#39;/&#39;); |
| info | const | 42 | no | const info = lstatSync(cursor); |
| canonical | const | 46 | no | const canonical = realpathSync(cursor); |
| inside | const | 47 | no | const inside = relative(root, canonical); |
| fd | const | 52 | no | const fd = openSync(canonical, constants.O_RDONLY \| (constants.O_NOFOLLOW ?? 0)); |
| bytes | variable | 53 | no | let bytes; |
| info | const | 55 | no | const info = fstatSync(fd); |
| actual | const | 61 | no | const actual = createHash(&#39;sha256&#39;).update(bytes).digest(&#39;hex&#39;); |
| lines | const | 65 | no | const lines = bytes.toString(&#39;utf8&#39;).split(/\\r?\\n/); |
| loc | const | 67 | no | const loc = program?.sourceMap; |
| marker | const | 68 | no | const marker = `@hq:wiki ${program.id}@${program.declarationVersion}`; |
| line | const | 69 | no | const line = lines[loc?.line - 1]; |
| loadRustCommentPrograms | function | 84 | yes | export function loadRustCommentPrograms(input, options = {}) { |
| doc | variable | 85 | no | let doc; |
| all | const | 99 | no | const all = []; const seen = new Set(); |
| p | const | 101 | no | const p = doc.programs[i]; const path = `programs[${i}]`; |
| converted | const | 126 | no | const converted = { |
| checked | const | 135 | no | const checked = validateCommentProgram(converted, options); |
| previewRustCommentPrograms | function | 145 | yes | export function previewRustCommentPrograms(db, raw, options = {}) { |
| loaded | const | 146 | no | const loaded = loadRustCommentPrograms(raw, { ...options, db }); |
| verified | const | 148 | no | const verified = verifyRustCommentSource({ source: loaded.source, programs: JSON.parse(typeof raw === &#39;string&#39; ? raw : JSON.stringify(raw)).programs }, options); |
| previews | const | 151 | no | const previews = loaded.programs.map(p =&gt; previewCommentProgram(db, p, options)); |
| activateRustCommentProgram | function | 159 | yes | export function activateRustCommentProgram(db, raw, programId, options = {}) { |
| loaded | const | 161 | no | const loaded = loadRustCommentPrograms(raw, { ...options, db }); |
| verified | const | 163 | no | const verified = verifyRustCommentSource({ source: loaded.source, programs: typeof raw === &#39;string&#39; ? JSON.parse(raw).programs : raw.programs, }, options); |
| found | const | 168 | no | const found = loaded.programs.find(p =&gt; p.config.id === programId); |
| rollbackRustCommentProgram | export | 173 | yes | export { rollbackCommentProgram as rollbackRustCommentProgram } |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 2 | external |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| ../comment-wiki-bridge.mjs | import | 6 | [hq/lib/comment-wiki-bridge.mjs](../comment-wiki-bridge.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/test/comment-program-integration.test.mjs](../../test/comment-program-integration.test.mjs.md) | ../lib/wiki-runtime/rust-comment-adapter.mjs |
| [hq/test/comment-wiki-bridge.test.mjs](../../test/comment-wiki-bridge.test.mjs.md) | ../lib/wiki-runtime/rust-comment-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Trusted read-only source-byte gate. Never accepts a compiler's claimed digest as proof.
import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
// Rust Lane 2 -> JS Lane 3: adapters only; never executes or grants authority.
import {
  COMMENT_PROGRAM_SCHEMA, validateCommentProgram, previewCommentProgram,
  activateCommentProgram, rollbackCommentProgram,
} from '../comment-wiki-bridge.mjs';

export const RUST_COMMENT_PROGRAM_SCHEMA = 'hq.comment-program/0.1';
const EVENT_MAP = Object.freeze({ open: 'click', click: 'click', select: 'click',
  submit: 'submit', change: 'change' });
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const isHex = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
const keysOnly = (x, allow) => Object.keys(x).every(k => allow.includes(k));
const fail = (code, path = '') => ({ ok: false, errors: [{ code, path }] });
const SAFE_SOURCE = /^(?![./])[a-zA-Z0-9_][a-zA-Z0-9_.\/-]{0,239}$/;
const SECRET_SEGMENT = /^(?:\.env.*|.*\.env|.*\.(?:pem|p12|keystore)|cookies|login data|session\.json|storage-state\.json)$/i;

/**
 * Verify the original source bytes with an EXPLICIT caller-owned project root.
 * Walk all components without following symlinks; canonical root containment is
 * checked before reading. No comment value is interpreted as executable content.
 */
export function verifyRustCommentSource(doc, { sourceRoot } = {}) {
  if (!isObject(doc) || !isObject(doc.source)
      || typeof sourceRoot !== 'string' || !isAbsolute(sourceRoot))
    return fail('trusted_source_root_required', 'sourceRoot');
  const { path, digest } = doc.source;
  if (typeof path !== 'string' || !SAFE_SOURCE.test(path) || path.includes('\\')
      || path.includes('//') || path.includes(':')
      || path.split('/').some(p => !p || p === '.' || p === '..' || SECRET_SEGMENT.test(p))
      || !isHex(digest)) return fail('unsafe_source_path', 'source.path');
  try {
    const root = realpathSync(sourceRoot);
    if (!lstatSync(root).isDirectory()) return fail('unsafe_source_root', 'sourceRoot');
    let cursor = root;
    const segments = path.split('/');
    for (const [index, segment] of segments.entries()) {
      cursor = join(cursor, segment);
      const info = lstatSync(cursor);
      if (info.isSymbolicLink() || (index < segments.length - 1 && !info.isDirectory()))
        return fail('unsafe_source_path', 'source.path');
    }
    const canonical = realpathSync(cursor);
    const inside = relative(root, canonical);
    if (!inside || inside === '..' || inside.startsWith('..' + sep) || isAbsolute(inside)
        || !lstatSync(canonical).isFile()) return fail('unsafe_source_path', 'source.path');
    // Open with O_NOFOLLOW when provided by the OS: a replaced final symlink
    // must not bypass the earlier lstat check.
    const fd = openSync(canonical, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    let bytes;
    try {
      const info = fstatSync(fd);
      if (!info.isFile() || info.size > 1048576)
        return fail('source_too_large_or_invalid', 'source.path');
      bytes = readFileSync(fd);
    } finally { closeSync(fd); }
    if (bytes.length > 1048576) return fail('source_too_large', 'source.path');
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== digest) return fail('source_digest_mismatch', 'source.digest');
    // A sourceMap location must name the actual declaration line. This checks
    // provenance, not comment grammar; Rust alone is the comment parser.
    const lines = bytes.toString('utf8').split(/\r?\n/);
    for (const [i, program] of (doc.programs ?? []).entries()) {
      const loc = program?.sourceMap;
      const marker = `@hq:wiki ${program.id}@${program.declarationVersion}`;
      const line = lines[loc?.line - 1];
      if (!Number.isSafeInteger(loc?.line) || loc.line < 1 || !line ||
          !line.includes(marker)) return fail('source_position_mismatch', `programs[${i}].sourceMap.line`);
    }
    return { ok: true, path, digest: actual, bytes: bytes.length };
  } catch {
    return fail('source_unavailable_or_symlinked', 'source.path');
  }
}

/**
 * Convert the real Rust CLI's *collection* manifest into per-program validation
```

_First 80 of 174 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
