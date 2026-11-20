# File: studio/src/export/outcome-packet.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/export/outcome-packet.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14043 B |
| Lines | 200 |
| Hash | 33eecc211cab |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| MAX_INPUT_BYTES | const | 9 | no | const MAX_INPUT_BYTES = 2 * 1024 * 1024; |
| MAX_TEXT_CHARS | const | 10 | no | const MAX_TEXT_CHARS = 200_000; |
| MAX_LINE_CHARS | const | 11 | no | const MAX_LINE_CHARS = 4000; |
| sha | function | 12 | no | const sha = (s) =&gt; createHash(&#39;sha256&#39;).update(s).digest(&#39;hex&#39;); |
| secret | const | 13 | no | const secret = /(?:\\b(?:api[_-]?key\|password\|secret\|access[_-]?token\|authorization)\\s*[:=]\\s*\\S+\|\\bsk-[A-Za-z0-9_-]{8,}\\b\|\\bgh[pousr]_[A-Za-z0-9_]{8,}\\b)/i; |
| clean | function | 14 | no | const clean = (s) =&gt; String(s).trim(); |
| code | function | 15 | no | const code = (name, details) =&gt; Object.assign(new Error(details), { code: name }); |
| pointer | function | 16 | no | const pointer = (parts) =&gt; &#39;#&#39; + parts.map((part) =&gt; &#39;/&#39; + String(part).replace(/~/g, &#39;~0&#39;).replace(/\\//g, &#39;~1&#39;)).join(&#39;&#39;); |
| generatePacket | function | 18 | yes | export function generatePacket(input, sourceFile = &#39;saved-session.json&#39;) { |
| sessionId | const | 22 | no | const sessionId = input.meta.id; |
| observations | const | 24 | no | const observations = []; |
| total | variable | 25 | no | let total = 0; |
| t | const | 27 | no | const t = input.turns[i]; |
| stream | const | 35 | no | const stream = input.streams[i]; |
| t | const | 38 | no | const t = stream.texts[j]; |
| entries | const | 46 | no | const entries = { summary: [], decision: [], action: [], question: [], unknown: [] }; |
| evidence | const | 47 | no | const evidence = []; |
| byKey | const | 48 | no | const byKey = new Map(); |
| redacted | variable | 49 | no | let redacted = 0, oversizedLines = 0; |
| matcher | const | 50 | no | const matcher = /^\\s*(?:[-*]\\s*)?(summary\|decision\|next action\|action\|unknown\|question)\\s*:\\s*(\\S.*)$/i; |
| reference | function | 51 | no | function reference(o, line, quote) { |
| id | const | 52 | no | const id = `ev-${sha(`${sessionId}\|${o.location}\|${line}\|${quote}`).slice(0, 16)}`; |
| lines | const | 57 | no | const lines = o.text.split(/\\r?\\n/); |
| raw | const | 59 | no | const raw = lines[n]; |
| m | const | 61 | no | const m = raw.match(matcher); |
| value | const | 63 | no | const value = clean(m[2]); |
| category | const | 65 | no | const category = m[1].toLowerCase() === &#39;next action&#39; ? &#39;action&#39; : m[1].toLowerCase(); |
| evidenceId | const | 66 | no | const evidenceId = reference(o, n + 1, raw); |
| key | const | 67 | no | const key = `${category}\|${value.toLowerCase()}`; |
| replies | const | 78 | no | const replies = []; |
| lastUser | variable | 79 | no | let lastUser = null; |
| unknowns | const | 88 | no | const unknowns = []; |
| packet | const | 97 | no | const packet = { |
| renderMarkdown | function | 113 | yes | export function renderMarkdown(p) { |
| refs | function | 114 | no | const refs = (r) =&gt; r.source_refs.map((id) =&gt; ` [${id}]`).join(&#39;&#39;); |
| section | function | 115 | no | const section = (title, records, empty) =&gt; [ |
| verifyPacket | function | 139 | yes | export function verifyPacket(input, p) { |
| value | variable | 141 | no | let value = input; |
| key | const | 143 | no | const key = part.replace(/~1/g, &#39;/&#39;).replace(/~0/g, &#39;~&#39;); |
| value | variable | 151 | no | let value = input; |
| key | const | 153 | no | const key = part.replace(/~1/g, &#39;/&#39;).replace(/~0/g, &#39;~&#39;); |
| writeOutputs | function | 162 | yes | export function writeOutputs(packet, input, outDir, startedAt, sourceSha = null) { |
| stamp | const | 165 | no | const stamp = new Date().toISOString(); |
| save | function | 166 | no | const save = (p, obj) =&gt; writeFileSync(path.join(outDir, p), typeof obj === &#39;string&#39; ? obj : JSON.stringify(obj, null, 2) + &#39;\\n&#39;, { flag: &#39;w&#39; }); |
| qa | const | 169 | no | const qa = path.join(outDir, &#39;qa-v1&#39;, &#39;round-L4&#39;); |
| runId | const | 171 | no | const runId = `value-oracle-${packet.session}`; |
| stepId | const | 172 | no | const stepId = `${runId}/round-L4/outcome-packet`; |
| writeQa | function | 173 | no | const writeQa = (name, data) =&gt; writeFileSync(path.join(qa, name), typeof data === &#39;string&#39; ? data : JSON.stringify(data, null, 2) + &#39;\\n&#39;); |
| runCli | function | 182 | yes | export function runCli(args = process.argv.slice(2)) { |
| startedAt | const | 183 | no | const startedAt = new Date().toISOString(); |
| demo | const | 184 | no | const demo = args.includes(&#39;--demo&#39;); |
| get | function | 185 | no | const get = (key) =&gt; { const i = args.indexOf(key); return i &gt;= 0 ? args[i + 1] : null; }; |
| here | const | 186 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| inputFile | const | 187 | no | const inputFile = demo ? path.join(here, &#39;..&#39;, &#39;..&#39;, &#39;test&#39;, &#39;fixtures&#39;, &#39;value-oracle&#39;, &#39;demo.json&#39;) : get(&#39;--input&#39;); |
| input | const | 190 | no | const input = JSON.parse(readFileSync(inputFile, &#39;utf8&#39;)); |
| packet | const | 191 | no | const packet = generatePacket(input, path.resolve(inputFile)); |
| outDir | const | 192 | no | const outDir = path.resolve(get(&#39;--out&#39;) ?? path.join(process.env.LOCALAPPDATA \|\| os.tmpdir(), &#39;AION&#39;, &#39;capture-studio&#39;, &#39;outcome-packets&#39;, packet.session)); |
| result | const | 193 | no | const result = writeOutputs(packet, input, outDir, startedAt, get(&#39;--source-sha&#39;)); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:os | import | 6 | external |
| node:url | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/export/saved-session-outcome.mjs](./saved-session-outcome.mjs.md) | ./outcome-packet.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Value Oracle V1: conservative, offline consumer of Studio's export transcript --format json.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const MAX_INPUT_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_CHARS = 200_000;
const MAX_LINE_CHARS = 4000;
const sha = (s) => createHash('sha256').update(s).digest('hex');
const secret = /(?:\b(?:api[_-]?key|password|secret|access[_-]?token|authorization)\s*[:=]\s*\S+|\bsk-[A-Za-z0-9_-]{8,}\b|\bgh[pousr]_[A-Za-z0-9_]{8,}\b)/i;
const clean = (s) => String(s).trim();
const code = (name, details) => Object.assign(new Error(details), { code: name });
const pointer = (parts) => '#' + parts.map((part) => '/' + String(part).replace(/~/g, '~0').replace(/\//g, '~1')).join('');

export function generatePacket(input, sourceFile = 'saved-session.json') {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !input.meta || !Array.isArray(input.turns) || !Array.isArray(input.streams)) {
    throw code('INVALID_TRANSCRIPT', 'Expected Studio transcript JSON with meta, turns[] and streams[]');
  }
  const sessionId = input.meta.id;
  if (typeof sessionId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(sessionId)) throw code('INVALID_SESSION', 'Missing/unsafe meta.id');
  const observations = [];
  let total = 0;
  for (let i = 0; i < input.turns.length; i++) {
    const t = input.turns[i];
    if (!t || typeof t.text !== 'string' || !['assistant', 'user'].includes(t.role)) continue;
    total += t.text.length;
    observations.push({ text: t.text, role: t.role, location: pointer(['turns', i, 'text']) });
  }
  // DOM turns are first choice; assembled transport texts are an alternative, not extra evidence.
  if (!observations.some((o) => o.role === 'assistant')) {
    for (let i = 0; i < input.streams.length; i++) {
      const stream = input.streams[i];
      if (!stream || !Array.isArray(stream.texts)) continue;
      for (let j = 0; j < stream.texts.length; j++) {
        const t = stream.texts[j];
        if (typeof t?.text !== 'string') continue;
        total += t.text.length;
        observations.push({ text: t.text, role: 'stream-unattributed', location: pointer(['streams', i, 'texts', j, 'text']) });
      }
    }
  }
  if (total > MAX_TEXT_CHARS) throw code('OVERSIZE_TEXT', 'Transcript text exceeds 200,000 characters; select a smaller saved transcript');
  const entries = { summary: [], decision: [], action: [], question: [], unknown: [] };
  const evidence = [];
  const byKey = new Map();
  let redacted = 0, oversizedLines = 0;
  const matcher = /^\s*(?:[-*]\s*)?(summary|decision|next action|action|unknown|question)\s*:\s*(\S.*)$/i;
  function reference(o, line, quote) {
    const id = `ev-${sha(`${sessionId}|${o.location}|${line}|${quote}`).slice(0, 16)}`;
    evidence.push({ id, session: sessionId, source_file: sourceFile, json_pointer: o.location, line, text_sha256: sha(o.text), quote });
    return id;
  }
  for (const o of observations) {
    const lines = o.text.split(/\r?\n/);
    for (let n = 0; n < lines.length; n++) {
      const raw = lines[n];
      if (raw.length > MAX_LINE_CHARS) { oversizedLines++; continue; }
      const m = raw.match(matcher);
      if (!m) continue;
      const value = clean(m[2]);
      if (secret.test(value)) { redacted++; continue; }
      const category = m[1].toLowerCase() === 'next action' ? 'action' : m[1].toLowerCase();
      const evidenceId = reference(o, n + 1, raw);
      const key = `${category}|${value.toLowerCase()}`;
      if (byKey.has(key)) { byKey.get(key).source_refs.push(evidenceId); continue; }
      const record = { text: value, evidence_class: 'directly-observed-quote', source_role: o.role, source_refs: [evidenceId] };
      if (category === 'decision') record.confirmation = o.role === 'user' ? 'user-stated-in-capture-not-independently-verified' : 'not-user-confirmed';
      if (category === 'action') { record.status = 'proposed-not-executed'; record.assignee = null; record.destination = null; }
      byKey.set(key, record);
      entries[category].push(record);
    }
  }
  // Conversation content, verbatim: each assistant reply with the user prompt that preceded it.
  // No interpretation; the locator (pointer + SHA-256 of the whole source text) is independently checkable.
  const replies = [];
  let lastUser = null;
  for (const o of observations) {
```

_First 80 of 201 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
