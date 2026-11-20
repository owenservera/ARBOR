# File: studio/src/store/integrity.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/store/integrity.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 9479 B |
| Lines | 278 |
| Hash | b0efbcb7007f |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| FORMAT | const | 19 | yes | export const FORMAT = &#39;aion-integrity/1&#39;; |
| MANIFEST_NAME | const | 20 | no | const MANIFEST_NAME = &#39;MANIFEST.json&#39;; |
| canonicalJson | function | 23 | yes | export function canonicalJson(value) { |
| seen | const | 24 | no | const seen = new Set(); |
| walk | function | 26 | no | function walk(v) { |
| t | const | 28 | no | const t = typeof v; |
| items | const | 43 | no | const items = v.map((item) =&gt; { const encoded = walk(item); return encoded === undefined ? &#39;null&#39; : encoded; }); |
| encoded | const | 44 | no | const encoded = walk(item); |
| keys | const | 49 | no | const keys = Object.keys(v).sort(); |
| parts | const | 50 | no | const parts = []; |
| encoded | const | 52 | no | const encoded = walk(v[key]); |
| out | const | 62 | no | const out = walk(value); |
| sha256Hex | function | 68 | yes | export function sha256Hex(input) { |
| toPosix | function | 72 | no | function toPosix(p) { |
| walkFiles | function | 76 | no | function walkFiles(dir, ignore = []) { |
| skip | const | 77 | no | const skip = new Set(ignore.map(toPosix)); |
| out | const | 78 | no | const out = []; |
| visit | function | 80 | no | function visit(absDir, relDir) { |
| entries | const | 81 | no | const entries = readdirSync(absDir, { withFileTypes: true }).sort((a, b) =&gt; a.name &lt; b.name ? -1 : a.name &gt; b.name ? 1 : 0, ); |
| childAbs | const | 85 | no | const childAbs = join(absDir, entry.name); |
| childRel | const | 86 | no | const childRel = relDir ? `${relDir}/${entry.name}` : entry.name; |
| readRel | function | 97 | no | function readRel(root, rel) { |
| refuseSymlinkPath | function | 103 | no | function refuseSymlinkPath(root, rel) { |
| current | variable | 104 | no | let current = root; |
| buildManifest | function | 121 | yes | export function buildManifest(dir, { ignore = [MANIFEST_NAME] } = {}) { |
| root | const | 122 | no | const root = resolve(dir); |
| files | const | 123 | no | const files = walkFiles(root, ignore).map((path) =&gt; { const buf = readRel(root, path); return { path, bytes: buf.length, sha256: sha256Hex(buf) }; }); |
| buf | const | 124 | no | const buf = readRel(root, path); |
| manifest | const | 127 | no | const manifest = { |
| verifyManifest | function | 140 | yes | export function verifyManifest(dir) { |
| root | const | 141 | no | const root = resolve(dir); |
| manifestPath | const | 142 | no | const manifestPath = join(root, MANIFEST_NAME); |
| manifest | variable | 146 | no | let manifest; |
| listed | const | 156 | no | const listed = new Set(); |
| missing | const | 157 | no | const missing = []; |
| changed | const | 158 | no | const changed = []; |
| checked | variable | 159 | no | let checked = 0; |
| path | const | 163 | no | const path = assertSafeRelPath(entry.path); |
| abs | const | 169 | no | const abs = join(root, ...path.split(&#39;/&#39;)); |
| buf | const | 175 | no | const buf = readFileSync(abs); |
| extra | const | 179 | no | const extra = walkFiles(root, [MANIFEST_NAME]).filter((path) =&gt; !listed.has(path)); |
| rootOk | const | 180 | no | const rootOk = sha256Hex(canonicalJson(manifest.files)) === manifest.rootSha256; |
| exportSnapshot | function | 200 | yes | export function exportSnapshot(dir) { |
| root | const | 201 | no | const root = resolve(dir); |
| files | const | 202 | no | const files = walkFiles(root, [MANIFEST_NAME]).map((path) =&gt; { const buf = readRel(root, path); return { path, b64: buf.toString(&#39;base64&#39;), sha256: sha256Hex(buf) }; }); |
| buf | const | 203 | no | const buf = readRel(root, path); |
| assertSafeRelPath | function | 210 | no | function assertSafeRelPath(value) { |
| raw | const | 211 | no | const raw = String(value ?? &#39;&#39;); |
| segments | const | 217 | no | const segments = raw.split(&#39;/&#39;); |
| importSnapshot | function | 233 | yes | export function importSnapshot(json, destDir, { overwrite = false } = {}) { |
| snapshot | const | 234 | no | const snapshot = typeof json === &#39;string&#39; ? JSON.parse(json) : json; |
| dest | const | 238 | no | const dest = resolve(destDir); |
| plan | const | 239 | no | const plan = []; |
| seen | const | 240 | no | const seen = new Set(); |
| rel | const | 243 | no | const rel = assertSafeRelPath(entry &amp;&amp; entry.path); |
| buf | const | 250 | no | const buf = Buffer.from(String(entry.b64 ?? &#39;&#39;), &#39;base64&#39;); |
| abs | const | 254 | no | const abs = join(dest, ...rel.split(&#39;/&#39;)); |
| relFromDest | const | 255 | no | const relFromDest = relative(dest, abs); |
| written | variable | 262 | no | let written = 0; |
| skipped | variable | 263 | no | let skipped = 0; |
| buildManifest | export | 278 | yes | export default buildManifest; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 8 | external |
| node:fs | import | 9 | external |
| node:path | import | 17 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/capture/acceptance.mjs](../capture/acceptance.mjs.md) | ../store/integrity.mjs |
| [studio/src/intel/platform.mjs](../intel/platform.mjs.md) | ../store/integrity.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * Directory integrity manifests and byte-identical snapshots.
 *
 * Format marker: 'aion-integrity/1'. Everything is sorted + canonical so two
 * runs over identical input produce identical bytes.
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  lstatSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';

export const FORMAT = 'aion-integrity/1';
const MANIFEST_NAME = 'MANIFEST.json';

/** Stable, whitespace-free JSON. Rejects NaN/Infinity and cycles. */
export function canonicalJson(value) {
  const seen = new Set();

  function walk(v) {
    if (v === null) return 'null';
    const t = typeof v;
    if (t === 'number') {
      if (!Number.isFinite(v)) throw new TypeError('canonicalJson: non-finite number');
      return JSON.stringify(v);
    }
    if (t === 'string' || t === 'boolean') return JSON.stringify(v);
    if (t === 'bigint') throw new TypeError('canonicalJson: bigint is not JSON-safe');
    if (t === 'undefined' || t === 'function' || t === 'symbol') return undefined;
    if (t !== 'object') throw new TypeError(`canonicalJson: unsupported type ${t}`);

    if (seen.has(v)) throw new TypeError('canonicalJson: circular reference');
    seen.add(v);
    try {
      if (typeof v.toJSON === 'function') return walk(v.toJSON());
      if (Array.isArray(v)) {
        const items = v.map((item) => {
          const encoded = walk(item);
          return encoded === undefined ? 'null' : encoded;
        });
        return `[${items.join(',')}]`;
      }
      const keys = Object.keys(v).sort();
      const parts = [];
      for (const key of keys) {
        const encoded = walk(v[key]);
        if (encoded === undefined) continue;
        parts.push(`${JSON.stringify(key)}:${encoded}`);
      }
      return `{${parts.join(',')}}`;
    } finally {
      seen.delete(v);
    }
  }

  const out = walk(value);
  if (out === undefined) throw new TypeError('canonicalJson: value is not JSON-serialisable');
  return out;
}

/** sha256 hex digest of a Buffer / Uint8Array / string (utf8). */
export function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}

function toPosix(p) {
  return String(p).replace(/\\/g, '/');
}

function walkFiles(dir, ignore = []) {
  const skip = new Set(ignore.map(toPosix));
  const out = [];

  function visit(absDir, relDir) {
```

_First 80 of 279 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
