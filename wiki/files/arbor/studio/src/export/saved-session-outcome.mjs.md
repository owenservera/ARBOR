# File: studio/src/export/saved-session-outcome.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/export/saved-session-outcome.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7644 B |
| Lines | 96 |
| Hash | 3a6982be60e6 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| here | const | 9 | no | const here = path.dirname(fileURLToPath(import.meta.url)); |
| studioRoot | const | 10 | no | const studioRoot = path.resolve(here, &#39;..&#39;, &#39;..&#39;); |
| digest | function | 11 | no | const digest = (text) =&gt; createHash(&#39;sha256&#39;).update(text).digest(&#39;hex&#39;); |
| error | function | 12 | no | const error = (code, message) =&gt; Object.assign(new Error(message), { code }); |
| ptr | function | 13 | no | const ptr = (p) =&gt; &#39;#/&#39; + p.map((v) =&gt; String(v).replace(/~/g, &#39;~0&#39;).replace(/\\//g, &#39;~1&#39;)).join(&#39;/&#39;); |
| valid | function | 14 | no | const valid = (id) =&gt; typeof id === &#39;string&#39; &amp;&amp; /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(id); |
| safeView | function | 15 | no | const safeView = (id) =&gt; &#39;/#session=&#39; + encodeURIComponent(id); |
| canonicalCore | function | 18 | no | async function canonicalCore() { |
| load | function | 19 | no | const load = (file) =&gt; import(pathToFileURL(path.join(studioRoot, file)).href); |
| packetFromSavedSession | function | 27 | yes | export async function packetFromSavedSession({ sessionId, home, outDir, sourceSha = null, core = null } = {}) { |
| c | const | 29 | no | const c = core \|\| await canonicalCore(); |
| dataHome | const | 30 | no | const dataHome = path.resolve(home \|\| c.defaultDataDir()); |
| s | const | 31 | no | const s = await c.open(path.join(dataHome, &#39;sessions&#39;), sessionId); |
| transcript | const | 34 | no | const transcript = await c.buildTranscript(s); // canonical Studio export transcript shape |
| destination | const | 36 | no | const destination = path.resolve(outDir \|\| path.join(dataHome, &#39;outcome-packets&#39;, sessionId)); |
| sourceSnapshot | const | 38 | no | const sourceSnapshot = path.join(destination, &#39;source-transcript.json&#39;); |
| p | const | 39 | no | const p = generatePacket(transcript, sourceSnapshot); |
| a | variable | 41 | no | let a; |
| verdict | const | 44 | no | const verdict = [&#39;capture_accepted&#39;, &#39;capture_rejected&#39;, &#39;capture_incomplete&#39;].includes(a?.verdict) ? a.verdict : &#39;unassessed&#39;; |
| knowledge | const | 45 | no | const knowledge = s.kv.get(&#39;KNOWLEDGE_STATUS&#39;, null); |
| domTurns | const | 53 | no | const domTurns = s.kv.get(&#39;DOM_TURNS&#39;, []); |
| selected | const | 54 | no | const selected = Array.isArray(domTurns) ? domTurns.map((turn, index) =&gt; ({ turn, index })).filter(({ turn }) =&gt; turn &amp;&amp; (turn.text \|\| turn.role)) : []; |
| canonicalDomFile | const | 55 | no | const canonicalDomFile = path.join(s.dir, &#39;kv&#39;, &#39;DOM_TURNS.json&#39;); |
| domMatch | const | 57 | no | const domMatch = /^#\\/turns\\/(\\d+)\\/text$/.exec(e.json_pointer); |
| entry | const | 59 | no | const entry = selected[Number(domMatch[1])]; |
| good | const | 60 | no | const good = entry &amp;&amp; typeof entry.turn.text === &#39;string&#39; &amp;&amp; digest(entry.turn.text) === e.text_sha256 |
| streamMatch | const | 66 | no | const streamMatch = /^#\\/streams\\/(\\d+)\\/texts\\/(\\d+)\\/text$/.exec(e.json_pointer); |
| stream | const | 67 | no | const stream = streamMatch &amp;&amp; transcript.streams[Number(streamMatch[1])]; |
| sid | const | 68 | no | const sid = typeof stream?.sid === &#39;string&#39; &amp;&amp; stream.sid ? stream.sid : null; |
| receipt | const | 81 | no | const receipt = writeOutputs(p, transcript, destination, new Date().toISOString(), sourceSha); |
| runSavedCli | function | 85 | yes | export async function runSavedCli(args = process.argv.slice(2)) { |
| get | function | 86 | no | const get = (flag) =&gt; { const i = args.indexOf(flag); return i &gt;= 0 ? args[i + 1] : null; }; |
| result | const | 87 | no | const result = await packetFromSavedSession({ sessionId: get(&#39;--session&#39;), home: get(&#39;--home&#39;), outDir: get(&#39;--out&#39;), sourceSha: get(&#39;--source-sha&#39;) }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 3 | external |
| node:fs | import | 4 | external |
| node:path | import | 5 | external |
| node:url | import | 6 | external |
| ./outcome-packet.mjs | import | 7 | [studio/src/export/outcome-packet.mjs](./outcome-packet.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/scripts/value-oracle-demo.mjs](../../scripts/value-oracle-demo.mjs.md) | ../src/export/saved-session-outcome.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// Value Oracle issue #71: read-only canonical saved-session adapter for existing V1.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generatePacket, verifyPacket, writeOutputs } from './outcome-packet.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const studioRoot = path.resolve(here, '..', '..');
const digest = (text) => createHash('sha256').update(text).digest('hex');
const error = (code, message) => Object.assign(new Error(message), { code });
const ptr = (p) => '#/' + p.map((v) => String(v).replace(/~/g, '~0').replace(/\//g, '~1')).join('/');
const valid = (id) => typeof id === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(id);
const safeView = (id) => '/#session=' + encodeURIComponent(id);

// Use first-party session, transcript, and bound acceptance readers rather than reimplementing them.
async function canonicalCore() {
  const load = (file) => import(pathToFileURL(path.join(studioRoot, file)).href);
  const [{ Session }, { buildTranscript }, { readAcceptance }, { defaultDataDir }] = await Promise.all([
    load('src/store/session.mjs'), load('src/export/export.mjs'),
    load('src/capture/acceptance.mjs'), load('src/config.mjs'),
  ]);
  return { open: (dir, id) => Session.open(dir, id), buildTranscript, readAcceptance, defaultDataDir };
}

export async function packetFromSavedSession({ sessionId, home, outDir, sourceSha = null, core = null } = {}) {
  if (!valid(sessionId)) throw error('INVALID_SESSION', 'Provide an exact safe saved-session ID');
  const c = core || await canonicalCore();
  const dataHome = path.resolve(home || c.defaultDataDir());
  const s = await c.open(path.join(dataHome, 'sessions'), sessionId);
  if (!s || s.id !== sessionId || !s.dir || !s.kv?.get) throw error('SESSION_MISMATCH', 'Resolved saved session does not match requested ID');
  if (s.meta?.status === 'recording') throw error('SESSION_NOT_SAVED', 'Recording still active; choose an already saved session');
  const transcript = await c.buildTranscript(s); // canonical Studio export transcript shape
  if (transcript?.meta?.id !== sessionId) throw error('TRANSCRIPT_MISMATCH', 'Core transcript session ID mismatch');
  const destination = path.resolve(outDir || path.join(dataHome, 'outcome-packets', sessionId));
  // A private source snapshot is needed to make V1 JSON Pointers independently resolvable.
  const sourceSnapshot = path.join(destination, 'source-transcript.json');
  const p = generatePacket(transcript, sourceSnapshot);
  if (!verifyPacket(transcript, p)) throw error('EVIDENCE_MISMATCH', 'Generated transcript locators failed');
  let a;
  try { a = await c.readAcceptance(s); }
  catch (e) { a = { verdict: 'unassessed', reasons: ['acceptance-reader-error: ' + e.message] }; }
  const verdict = ['capture_accepted', 'capture_rejected', 'capture_incomplete'].includes(a?.verdict) ? a.verdict : 'unassessed';
  const knowledge = s.kv.get('KNOWLEDGE_STATUS', null);
  p.source = { ...p.source, representation: 'canonical-saved-session-transcript', session_dir: s.dir, export_snapshot: sourceSnapshot };
  p.acceptance = { verdict, reader: 'Core readAcceptance(session) with raw-binding verification', reasons: a?.reasons || [], advisory_only: true };
  p.knowledge = { status: knowledge?.status ?? 'unknown', derived_entity_count: Number.isInteger(knowledge?.entityCount) ? knowledge.entityCount : null };
  if (verdict !== 'capture_accepted') p.unknowns.push('capture-acceptance-' + verdict);
  if (knowledge?.status !== 'complete') p.unknowns.push('knowledge-derive-' + (knowledge?.status || 'unknown'));
  // For a genuine accepted verdict, V1's generic caveat is superseded by Core's bound label.
  if (verdict === 'capture_accepted') p.unknowns = p.unknowns.filter((x) => x !== 'evidence-integrity-and-capture-acceptance-not-independently-verified');
  const domTurns = s.kv.get('DOM_TURNS', []);
  const selected = Array.isArray(domTurns) ? domTurns.map((turn, index) => ({ turn, index })).filter(({ turn }) => turn && (turn.text || turn.role)) : [];
  const canonicalDomFile = path.join(s.dir, 'kv', 'DOM_TURNS.json');
  for (const e of p.evidence) {
    const domMatch = /^#\/turns\/(\d+)\/text$/.exec(e.json_pointer);
    if (domMatch) {
      const entry = selected[Number(domMatch[1])];
      const good = entry && typeof entry.turn.text === 'string' && digest(entry.turn.text) === e.text_sha256
        && entry.turn.text.split(/\r?\n/)[e.line - 1] === e.quote && existsSync(canonicalDomFile);
      e.canonical = good ? { verified: true, local_file: canonicalDomFile, json_pointer: ptr([entry.index, 'text']), exact_source_line: e.line,
        ui_href: safeView(sessionId), ui_precision: 'session-only; DOM line navigation is not supported' }
        : { verified: false, reason: 'DOM original could not be checked against canonical saved kv', ui_href: safeView(sessionId), ui_precision: 'session-only' };
    } else {
      const streamMatch = /^#\/streams\/(\d+)\/texts\/(\d+)\/text$/.exec(e.json_pointer);
      const stream = streamMatch && transcript.streams[Number(streamMatch[1])];
      const sid = typeof stream?.sid === 'string' && stream.sid ? stream.sid : null;
      e.canonical = { verified: false, reason: 'assembled text is a selected excerpt; no checked raw event seq', sid,
        ui_href: sid ? safeView(sessionId) + '&view=streams&sid=' + encodeURIComponent(sid) : safeView(sessionId),
        ui_precision: sid ? 'stream-only; UI must verify SID membership' : 'session-only' };
    }
  }
  if (p.evidence.some((e) => !e.canonical?.verified)) p.unknowns.push('some-original-evidence-locators-unverified-use-local-snapshot');
  p.derivation.original_dom_locators_verified = p.evidence.filter((e) => e.canonical?.verified).length;
  p.derivation.original_dom_locators_unverified = p.evidence.length - p.derivation.original_dom_locators_verified;
  // Validation before any write. Never replace or alter canonical session files.
  if (!verifyPacket(transcript, p)) throw error('EVIDENCE_MISMATCH', 'Source text changed before output');
  mkdirSync(destination, { recursive: true });
  writeFileSync(sourceSnapshot, JSON.stringify(transcript, null, 2) + '\n');
```

_First 80 of 97 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
