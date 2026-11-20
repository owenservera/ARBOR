# File: studio/scripts/objective-source-crosswalk.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | studio/scripts/objective-source-crosswalk.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4489 B |
| Lines | 96 |
| Hash | 312af9eea607 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 14 | no | const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), &#39;..&#39;); |
| MAP | const | 15 | no | const MAP = &#39;docs/agents/CHATGPT-100-SOURCE-MAP.md&#39;; |
| SYMBOLS | const | 16 | no | const SYMBOLS = &#39;docs/agents/CHATGPT-100-SOURCE-INDEX.json&#39;; |
| OUTPUT | const | 17 | no | const OUTPUT = &#39;docs/agents/CHATGPT-100-OBJECTIVE-SOURCE-INDEX.json&#39;; |
| pad | function | 18 | no | const pad = (n) =&gt; String(n).padStart(3, &#39;0&#39;); |
| buildObjectiveSourceCrosswalk | function | 20 | yes | export function buildObjectiveSourceCrosswalk(markdown, symbolIndex) { |
| objectives | const | 24 | no | const objectives = []; |
| ids | const | 25 | no | const ids = new Set(); |
| distinctKeys | const | 26 | no | const distinctKeys = new Set(); |
| counts | const | 27 | no | const counts = { mapped: 0, supported: 0, partial: 0, unsupported: 0, distinctSourceKeys: 0 }; |
| tick | const | 28 | no | const tick = String.fromCharCode(96); |
| keyPattern | const | 29 | no | const keyPattern = new RegExp(tick + &#39;([^&#39; + tick + &#39;]+)&#39; + tick, &#39;g&#39;); |
| columns | const | 32 | no | const columns = line.split(&#39;\|&#39;).slice(1, -1).map((value) =&gt; value.trim()); |
| sourceKeys | const | 41 | no | const sourceKeys = [...new Set([...sourceCell.matchAll(keyPattern)].map((match) =&gt; match[1]))]; |
| missing | const | 59 | no | const missing = Array.from({ length: 100 }, (_, i) =&gt; pad(i + 1)).filter((id) =&gt; !ids.has(id)); |
| main | function | 74 | no | function main() { |
| mode | const | 75 | no | const mode = process.argv[2]; |
| map | const | 79 | no | const map = fs.readFileSync(path.join(ROOT, MAP), &#39;utf8&#39;); |
| index | const | 80 | no | const index = JSON.parse(fs.readFileSync(path.join(ROOT, SYMBOLS), &#39;utf8&#39;)); |
| result | const | 81 | no | const result = buildObjectiveSourceCrosswalk(map, index); |
| json | const | 82 | no | const json = JSON.stringify(result, null, 2) + &#39;\\n&#39;; |
| destination | const | 83 | no | const destination = path.join(ROOT, OUTPUT); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 10 | external |
| node:path | import | 11 | external |
| node:url | import | 12 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
/**
 * Derive a deterministic objective-to-source crosswalk from the canonical
 * Markdown map and symbol index. This is source evidence, NOT live verification.
 *
 * Usage:
 *   node scripts/objective-source-crosswalk.mjs
 *   node scripts/objective-source-crosswalk.mjs --check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP = 'docs/agents/CHATGPT-100-SOURCE-MAP.md';
const SYMBOLS = 'docs/agents/CHATGPT-100-SOURCE-INDEX.json';
const OUTPUT = 'docs/agents/CHATGPT-100-OBJECTIVE-SOURCE-INDEX.json';
const pad = (n) => String(n).padStart(3, '0');

export function buildObjectiveSourceCrosswalk(markdown, symbolIndex) {
  if (typeof markdown !== 'string' || !symbolIndex?.keys || typeof symbolIndex.keys !== 'object') {
    throw new TypeError('A Markdown source map and a symbol index with keys are required');
  }
  const objectives = [];
  const ids = new Set();
  const distinctKeys = new Set();
  const counts = { mapped: 0, supported: 0, partial: 0, unsupported: 0, distinctSourceKeys: 0 };
  const tick = String.fromCharCode(96);
  const keyPattern = new RegExp(tick + '([^' + tick + ']+)' + tick, 'g');
  for (const [offset, line] of markdown.split(/\r?\n/).entries()) {
    if (!/^\|\s*\d{3}\s*\|/.test(line)) continue;
    const columns = line.split('|').slice(1, -1).map((value) => value.trim());
    if (columns.length !== 6) throw new Error('Malformed objective row at line ' + (offset + 1));
    const [id, title, classification, sourceCell, missingLink] = columns;
    if (Number(id) < 1 || Number(id) > 100 || ids.has(id)) {
      throw new Error('Out-of-range or duplicate objective ' + id + ' at line ' + (offset + 1));
    }
    if (!['supported', 'partial', 'unsupported'].includes(classification)) {
      throw new Error('Invalid source classification for ' + id + ': ' + classification);
    }
    const sourceKeys = [...new Set([...sourceCell.matchAll(keyPattern)].map((match) => match[1]))];
    if (!title || !sourceKeys.length) throw new Error('Missing title or source keys for ' + id);
    for (const key of sourceKeys) {
      if (!Object.hasOwn(symbolIndex.keys, key)) {
        throw new Error('Unresolved source reference ' + id + ': ' + key);
      }
      distinctKeys.add(key);
    }
    ids.add(id);
    counts[classification]++;
    objectives.push({
      id,
      title,
      sourceClassification: classification,
      sourceKeys,
      firstMissingLink: missingLink === '—' ? null : missingLink,
    });
  }
  const missing = Array.from({ length: 100 }, (_, i) => pad(i + 1)).filter((id) => !ids.has(id));
  if (missing.length) throw new Error('Missing objective IDs: ' + missing.join(', '));
  objectives.sort((a, b) => a.id.localeCompare(b.id));
  counts.mapped = objectives.length;
  counts.distinctSourceKeys = distinctKeys.size;
  return {
    schemaVersion: 1,
    sourceMap: MAP,
    symbolIndex: SYMBOLS,
    evidence: 'Source-map references only. Unsupported/partial citations may identify an adjacent primitive or gap; none establish live provider behavior.',
    counts,
    objectives,
  };
}

function main() {
  const mode = process.argv[2];
  if (mode && mode !== '--check') {
    throw new Error('Usage: node scripts/objective-source-crosswalk.mjs [--check]');
  }
  const map = fs.readFileSync(path.join(ROOT, MAP), 'utf8');
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, SYMBOLS), 'utf8'));
```

_First 80 of 97 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
