# File: harness/src/provenance/ledger.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/provenance/ledger.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5296 B |
| Lines | 162 |
| Hash | 8b6487d4d30a |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REQUEST_ID | const | 8 | no | const REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/; |
| ProvenanceError | class | 10 | yes | export class ProvenanceError extends Error { |
| constructor | method | 11 | yes | constructor(code, message) { |
| resolveInRoot | function | 18 | no | function resolveInRoot(root, filePath) { |
| abs | const | 19 | no | const abs = resolve(root, filePath); |
| rel | const | 20 | no | const rel = relative(root, abs); |
| readBytes | function | 27 | no | async function readBytes(abs) { |
| digestAndLines | function | 36 | no | function digestAndLines(bytes) { |
| sha256 | const | 37 | no | const sha256 = createHash(&#39;sha256&#39;).update(bytes).digest(&#39;hex&#39;); |
| lines | variable | 38 | no | let lines = 0; |
| readLedger | function | 46 | no | async function readLedger(ledgerPath) { |
| text | variable | 47 | no | let text; |
| out | const | 54 | no | const out = []; |
| recordArtifact | function | 66 | yes | export async function recordArtifact({ ledgerPath, journalDir, requestId, filePath, root = process.cwd() }) { |
| journal | variable | 71 | no | let journal; |
| bytes | const | 91 | no | const bytes = await readBytes(abs); |
| report | function | 108 | yes | export async function report({ ledgerPath, root = process.cwd(), scope }) { |
| latest | const | 112 | no | const latest = new Map(); |
| paths | const | 115 | no | const paths = [...new Set(scope)]; |
| files | const | 116 | no | const files = []; |
| rec | const | 119 | no | const rec = latest.get(rel) ?? null; |
| bytes | variable | 120 | no | let bytes = null; |
| status | variable | 127 | no | let status; |
| lines | variable | 128 | no | let lines = 0; |
| current | const | 132 | no | const current = digestAndLines(bytes); |
| count | function | 147 | no | const count = s =&gt; files.filter(f =&gt; f.status === s).length; |
| sumLines | function | 148 | no | const sumLines = s =&gt; files.filter(f =&gt; f.status === s).reduce((n, f) =&gt; n + f.lines, 0); |
| totalLines | const | 149 | no | const totalLines = files.reduce((n, f) =&gt; n + f.lines, 0); |
| attributedLines | const | 150 | no | const attributedLines = sumLines(&#39;attributed&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| node:fs/promises | import | 5 | external |
| node:path | import | 6 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [harness/bin/prov.mjs](../../bin/prov.mjs.md) | ../src/provenance/ledger.mjs |
| [harness/test/provenance/ledger.test.mjs](../../test/provenance/ledger.test.mjs.md) | ../../src/provenance/ledger.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Provenance ledger: records which solution files were built from approved
// webapp AI replies. Stores ONLY metadata and digests. Never stores file
// contents, prompts, or reply bodies.
import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const REQUEST_ID = /^[A-Za-z0-9_-]{1,128}$/;

export class ProvenanceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProvenanceError';
    this.code = code;
  }
}

function resolveInRoot(root, filePath) {
  const abs = resolve(root, filePath);
  const rel = relative(root, abs);
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new ProvenanceError('PROVENANCE_PATH_OUTSIDE_ROOT', 'path resolves outside root');
  }
  return { abs, rel: rel.split(sep).join('/') };
}

async function readBytes(abs) {
  try {
    return await readFile(abs);
  } catch (err) {
    if (err.code === 'ENOENT') throw new ProvenanceError('PROVENANCE_FILE_MISSING', 'file does not exist');
    throw err;
  }
}

function digestAndLines(bytes) {
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  let lines = 0;
  if (bytes.length > 0) {
    for (const b of bytes) if (b === 0x0a) lines++;
    if (bytes[bytes.length - 1] !== 0x0a) lines++;
  }
  return { sha256, lines };
}

async function readLedger(ledgerPath) {
  let text;
  try {
    text = await readFile(ledgerPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  const out = [];
  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try {
      out.push(JSON.parse(line));
    } catch {
      throw new ProvenanceError('PROVENANCE_LEDGER_CORRUPT', `ledger line ${i + 1} is not valid JSON`);
    }
  });
  return out;
}

export async function recordArtifact({ ledgerPath, journalDir, requestId, filePath, root = process.cwd() }) {
  if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) {
    throw new ProvenanceError('PROVENANCE_BAD_REQUEST_ID', 'requestId has invalid format');
  }

  let journal;
  try {
    journal = JSON.parse(await readFile(join(journalDir, `${requestId}.json`), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new ProvenanceError('PROVENANCE_JOURNAL_UNVERIFIED', 'journal record not found');
    }
    throw err;
  }
  if (journal.submitted !== 'yes') {
```

_First 80 of 163 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
