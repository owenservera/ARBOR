# File: scripts/batch-evidence/WIKI-BASELINE.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/batch-evidence/WIKI-BASELINE.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13365 B |
| Lines | 242 |
| Hash | 030359dfe044 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ROOT | const | 9 | no | const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), &#39;../..&#39;); |
| WIKI_ACTIONS | const | 10 | no | const WIKI_ACTIONS = [&#39;wiki.page.create&#39;, &#39;wiki.section.edit&#39;, &#39;wiki.page.move&#39;, &#39;wiki.pages.link&#39;, &#39;wiki.section.read&#39;, &#39;wiki.pages.list&#39;, &#39;wiki.page.delete&#39;]; |
| BASELINE_CAPS | const | 11 | no | const BASELINE_CAPS = [&#39;send-message&#39;, &#39;read-state&#39;, &#39;execute-intent&#39;, &#39;read-journal&#39;, &#39;get-capabilities&#39;]; |
| hash | function | 12 | no | const hash = value =&gt; createHash(&#39;sha256&#39;).update(value).digest(&#39;hex&#39;); |
| object | function | 13 | no | const object = value =&gt; value !== null &amp;&amp; typeof value === &#39;object&#39; &amp;&amp; !Array.isArray(value); |
| parseJournalResponse | function | 15 | yes | export function parseJournalResponse(body) { |
| entries | const | 16 | no | const entries = JSON.parse(body); |
| parseRawJournal | function | 22 | yes | export function parseRawJournal(body) { |
| lines | const | 24 | no | const lines = body.endsWith(&#39;\\n&#39;) ? body.slice(0, -1).split(&#39;\\n&#39;) : body.split(&#39;\\n&#39;); |
| value | variable | 27 | no | let value; |
| assertIsolatedLive | function | 35 | yes | export function assertIsolatedLive(baseUrl, isolated) { |
| url | variable | 36 | no | let url; |
| rendererSourceContract | function | 45 | yes | export function rendererSourceContract(html, js, css) { |
| makeTransport | function | 56 | no | function makeTransport(baseUrl, fetchImpl) { |
| request | function | 57 | no | async function request(route, options) { |
| response | const | 58 | no | const response = await fetchImpl(baseUrl + route, { ...options, signal: AbortSignal.timeout(5000) }); |
| runWikiEvidence | function | 70 | yes | export async function runWikiEvidence({ root = ROOT, live = false, isolated = false, baseUrl = &#39;&#39;, transport = null, ownerToken = null, fetchImpl = globalThis.fetch } = {}) { |
| checks | const | 79 | no | const checks = []; |
| check | function | 80 | no | const check = (name, pass, detail) =&gt; checks.push({ name, pass: Boolean(pass), detail: String(detail) }); |
| safe | function | 81 | no | const safe = async (name, fn) =&gt; { |
| read | function | 85 | no | const read = file =&gt; readFileSync(resolve(root, file), &#39;utf8&#39;); |
| seedBytes | variable | 86 | no | let seedBytes = null; |
| catalog | const | 88 | no | const catalog = JSON.parse(read(&#39;apps/vivim-host/control/action-catalog.v1.json&#39;)); |
| ids | const | 89 | no | const ids = (catalog.actions \|\| catalog).map(a =&gt; a.id \|\| a.actionId); |
| missing | const | 90 | no | const missing = [...WIKI_ACTIONS, ...BASELINE_CAPS].filter(id =&gt; !ids.includes(id)); |
| name | const | 95 | no | const name = &#39;apps/vivim-host/data/demo-baseline/file-surface.v1.json&#39;; |
| seed | const | 101 | no | const seed = JSON.parse(seedBytes); |
| io | const | 108 | no | const io = transport \|\| makeTransport(baseUrl, fetchImpl); |
| response | function | 109 | no | const response = async (route, type) =&gt; { |
| out | const | 110 | no | const out = await io.get(route); |
| json | function | 115 | no | const json = async route =&gt; JSON.parse(await response(route, /application\\/json/i)); |
| retired | const | 116 | no | const retired = await safe(&#39;historical-roadmap-retired&#39;, async () =&gt; { const result = await io.get(&#39;/api/roadmap&#39;); if (result.status !== 404) throw Error(&#39;Historical roadmap endpoint was not retired… |
| result | const | 117 | no | const result = await io.get(&#39;/api/roadmap&#39;); |
| wikiBefore | const | 121 | no | const wikiBefore = await safe(&#39;wiki-api-before&#39;, async () =&gt; { const value = await json(&#39;/api/wiki&#39;); if (!Number.isSafeInteger(value?.revision) \|\| !object(value?.pages?.Main?.sections) \|\| typeof val… |
| value | const | 122 | no | const value = await json(&#39;/api/wiki&#39;); |
| journalBefore | const | 127 | no | const journalBefore = await safe(&#39;journal-json-array-before&#39;, async () =&gt; parseJournalResponse(await response(&#39;/api/journal&#39;, /application\\/json/i))); |
| rawBefore | const | 129 | no | const rawBefore = await safe(&#39;journal-jsonl-integrity-before&#39;, async () =&gt; parseRawJournal(await response(&#39;/api/journal?format=jsonl&#39;, /application\\/jsonl/i))); |
| html | const | 133 | no | const html = await safe(&#39;wiki-html-shell&#39;, () =&gt; response(&#39;/wiki&#39;, /text\\/html/i)); |
| js | const | 134 | no | const js = await safe(&#39;wiki-external-js&#39;, () =&gt; response(&#39;/wiki.js&#39;, /javascript/i)); |
| css | const | 135 | no | const css = await safe(&#39;wiki-external-css&#39;, () =&gt; response(&#39;/wiki.css&#39;, /text\\/css/i)); |
| edit | const | 142 | no | const edit = { kind: &#39;wiki-edit&#39;, actor: &#39;owner-browser&#39;, schemaVersion: 1, |
| trusted | const | 146 | no | const trusted = { origin: baseUrl, &#39;x-vivim-control&#39;: &#39;1&#39;, |
| negatives | const | 148 | no | const negatives = [ |
| out | const | 157 | no | const out = await io.post(&#39;/api/mutate&#39;, payload, headers); |
| journalAfterRefusals | const | 161 | no | const journalAfterRefusals = await safe(&#39;journal-after-refusals&#39;, async () =&gt; parseJournalResponse(await response(&#39;/api/journal&#39;, /application\\/json/i))); |
| wikiAfterRefusals | const | 163 | no | const wikiAfterRefusals = await safe(&#39;wiki-after-refusals&#39;, () =&gt; json(&#39;/api/wiki&#39;)); |
| saved | const | 169 | no | const saved = await safe(&#39;wiki-edit-acknowledged&#39;, async () =&gt; { const out = await io.post(&#39;/api/mutate&#39;, edit, trusted); if (out.status !== 200 \|\| !/application\\/json/i.test(out.type \|\| &#39;&#39;)) throw n… |
| out | const | 170 | no | const out = await io.post(&#39;/api/mutate&#39;, edit, trusted); |
| value | const | 173 | no | const value = JSON.parse(out.body); |
| journalAfter | const | 179 | no | const journalAfter = await safe(&#39;journal-json-array-after&#39;, async () =&gt; parseJournalResponse(await response(&#39;/api/journal&#39;, /application\\/json/i))); |
| rawAfter | const | 181 | no | const rawAfter = await safe(&#39;journal-jsonl-integrity-after&#39;, async () =&gt; parseRawJournal(await response(&#39;/api/journal?format=jsonl&#39;, /application\\/jsonl/i))); |
| wikiAfter | const | 183 | no | const wikiAfter = await safe(&#39;wiki-api-after&#39;, () =&gt; json(&#39;/api/wiki&#39;)); |
| stateAfter | const | 184 | no | const stateAfter = await safe(&#39;state-api-after&#39;, () =&gt; json(&#39;/api/state&#39;)); |
| appended | const | 185 | no | const appended = journalAfter?.[journalBefore.length]; |
| ok | const | 207 | no | const ok = checks.every(c =&gt; c.pass); |
| main | function | 220 | no | async function main() { |
| args | const | 221 | no | const args = process.argv.slice(2); |
| live | const | 230 | no | const live = args.includes(&#39;--live&#39;); |
| result | const | 231 | no | const result = await runWikiEvidence({ live, isolated: process.env.ARBOR_WIKI_EVIDENCE_ISOLATED === &#39;1&#39;, baseUrl: process.env.ARBOR_WIKI_EVIDENCE_BASE_URL \|\| &#39;&#39;, ownerToken: process.env.ARBOR_WIKI_EV… |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 4 | external |
| node:fs | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |

## Dependents

| File | Specifier |
| --- | --- |
| [scripts/batch-evidence/wiki-evidence-regression.test.mjs](./wiki-evidence-regression.test.mjs.md) | ./WIKI-BASELINE.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env node
// A00 independent Wiki evidence: source/API checks, never simulated browser acceptance.
// Live mode can mutate ONLY an explicitly flagged isolated loopback Host data root.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WIKI_ACTIONS = ['wiki.page.create', 'wiki.section.edit', 'wiki.page.move', 'wiki.pages.link', 'wiki.section.read', 'wiki.pages.list', 'wiki.page.delete'];
const BASELINE_CAPS = ['send-message', 'read-state', 'execute-intent', 'read-journal', 'get-capabilities'];
const hash = value => createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function parseJournalResponse(body) {
  const entries = JSON.parse(body);
  if (!Array.isArray(entries) || entries.some(entry => !object(entry)))
    throw new Error('/api/journal must be a JSON array of entry objects');
  return entries;
}

export function parseRawJournal(body) {
  if (body === '') return [];
  const lines = body.endsWith('\n') ? body.slice(0, -1).split('\n') : body.split('\n');
  return lines.map((line, index) => {
    if (!line.trim()) throw new Error('Empty or torn journal line ' + (index + 1));
    let value;
    try { value = JSON.parse(line); }
    catch { throw new Error('Corrupt journal line ' + (index + 1)); }
    if (!object(value)) throw new Error('Invalid journal entry at line ' + (index + 1));
    return value;
  });
}

export function assertIsolatedLive(baseUrl, isolated) {
  let url;
  try { url = new URL(baseUrl); } catch { throw new Error('Explicit isolated loopback base URL required'); }
  if (!isolated || url.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('--live requires ARBOR_WIKI_EVIDENCE_ISOLATED=1 and an explicit isolated http://127.0.0.1:<port> Host');
  }
}

export function rendererSourceContract(html, js, css) {
  return /src=["']\/wiki\.js["']/.test(html) &&
    /href=["']\/wiki\.css["']/.test(html) &&
    /function\s+renderWiki\s*\(/.test(js) &&
    /function\s+renderFileSurface\s*\(/.test(js) &&
    !/\/api\/roadmap/.test(js) &&
    /\/api\/wiki/.test(js) &&
    /\/api\/journal/.test(js) &&
    css.trim().length > 0;
}

function makeTransport(baseUrl, fetchImpl) {
  async function request(route, options) {
    const response = await fetchImpl(baseUrl + route, { ...options, signal: AbortSignal.timeout(5000) });
    return { status: response.status, type: response.headers.get('content-type') || '', body: await response.text() };
  }
  return {
    get: route => request(route),
    post: (route, body, headers = {}) => request(route, {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body)
    })
  };
}

export async function runWikiEvidence({
  root = ROOT, live = false, isolated = false, baseUrl = '',
  transport = null, ownerToken = null, fetchImpl = globalThis.fetch
} = {}) {
  if (live) assertIsolatedLive(baseUrl, isolated);
  // A live editor requires an actual Host owner grant. Mock transport tests
  // inject their own trust fixture and never touch a real server.
  if (live && !transport && (typeof ownerToken !== 'string' || !/^[a-f0-9]{64}$/.test(ownerToken)))
    throw new Error('Isolated live edit requires an ephemeral Host owner capability');
  const checks = [];
  const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail: String(detail) });
```

_First 80 of 243 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
