# File: scripts/batch-evidence/CHAT-BOX-BASELINE.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | scripts/batch-evidence/CHAT-BOX-BASELINE.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11804 B |
| Lines | 193 |
| Hash | 700dee14a8a6 |
| Test | no |
| Generated | no |
| Component | scripts |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| HERE | const | 18 | no | const HERE = dirname(fileURLToPath(import.meta.url)); |
| REPO_ROOT | const | 19 | no | const REPO_ROOT = resolve(HERE, &#39;..&#39;, &#39;..&#39;); |
| ITEM | const | 20 | no | const ITEM = &#39;CHAT-BOX-BASELINE&#39;; |
| TARGET_CAPS | const | 21 | no | const TARGET_CAPS = 12; |
| BASE_URL | const | 22 | no | const BASE_URL = &#39;http://127.0.0.1:43187&#39;; |
| checks | const | 24 | no | const checks = []; |
| live | variable | 25 | no | let live = false; |
| fail | function | 38 | no | function fail(msg) { |
| check | function | 42 | no | function check(name, pass, detail) { |
| stable | function | 45 | no | function stable(v) { |
| digestOf | function | 50 | no | function digestOf(v) { return createHash(&#39;sha256&#39;).update(stable(v)).digest(&#39;hex&#39;); } |
| read | function | 51 | no | function read(rel) { return readFileSync(resolve(REPO_ROOT, rel), &#39;utf8&#39;); } |
| exists | function | 52 | no | function exists(rel) { return existsSync(resolve(REPO_ROOT, rel)); } |
| draftChat | const | 57 | no | const draftChat = exists(&#39;docs/product/proposals/chat-wiki-baseline/chat.html.draft&#39;); |
| draftState | const | 58 | no | const draftState = exists(&#39;docs/product/proposals/chat-wiki-baseline/state.mjs.draft&#39;); |
| serverSrc | const | 64 | no | const serverSrc = read(&#39;apps/vivim-host/server.mjs&#39;); |
| hasAssetsMap | const | 65 | no | const hasAssetsMap = /const ASSETS = \\{/.test(serverSrc); |
| hasAssetServe | const | 66 | no | const hasAssetServe = /readFile\\(path\\.join\\(staticRoot, asset\\)\\)/.test(serverSrc) &amp;&amp; /res\\.writeHead\\(200\\)/.test(serverSrc); |
| chatRegistered | const | 67 | no | const chatRegistered = /[&#39;&quot;]\\/chat[&#39;&quot;]/.test(serverSrc); |
| stateDraft | const | 72 | no | const stateDraft = read(&#39;docs/product/proposals/chat-wiki-baseline/state.mjs.draft&#39;); |
| hasModel | const | 73 | no | const hasModel = [&#39;loadState&#39;, &#39;saveState&#39;, &#39;loadWiki&#39;, &#39;saveWiki&#39;].every(fn =&gt; stateDraft.includes(`export function ${fn}`)); |
| engineOk | variable | 77 | no | let engineOk = false; |
| plannerMod | const | 79 | no | const plannerMod = await import(pathToFileURL(resolve(REPO_ROOT, &#39;apps/vivim-host/control/intent-planner.mjs&#39;)).href); |
| intentMod | const | 80 | no | const intentMod = await import(pathToFileURL(resolve(REPO_ROOT, &#39;apps/vivim-host/control/command-intent.mjs&#39;)).href); |
| planner | const | 84 | no | const planner = plannerMod.createControlPlanner(); |
| desc | const | 85 | no | const desc = planner.describe(); |
| cov | const | 86 | no | const cov = desc &amp;&amp; desc.coverage; |
| enumOk | const | 87 | no | const enumOk = desc &amp;&amp; desc.schema === &#39;vivim.control-discovery/1&#39; &amp;&amp; cov |
| argsFor | function | 95 | no | function argsFor(action) { |
| args | const | 96 | no | const args = {}; |
| min | const | 99 | no | const min = Number.isInteger(type.min) ? type.min : 1; |
| recOk | variable | 104 | no | let recOk = true; let nExec = 0; let nUnavail = 0; |
| OUTCOMES | const | 105 | no | const OUTCOMES = new Set([&#39;ready&#39;, &#39;approval_required&#39;, &#39;unavailable&#39;]); |
| rec | variable | 107 | no | let rec; |
| expected | const | 111 | no | const expected = argsFor(action); |
| get | function | 132 | no | async function get(path) { |
| res | const | 133 | no | const res = await fetch(BASE_URL + path); |
| post | function | 136 | no | async function post(path, body) { |
| res | const | 137 | no | const res = await fetch(BASE_URL + path, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39; }, body: JSON.stringify(body) }); |
| attempt | function | 140 | no | async function attempt(name, fn) { |
| chat | const | 146 | no | const chat = await attempt(&#39;get-chat&#39;, () =&gt; get(&#39;/chat&#39;)); |
| state | const | 151 | no | const state = await attempt(&#39;state-endpoint&#39;, () =&gt; get(&#39;/api/state&#39;)); |
| stateJson | const | 152 | no | const stateJson = state.ok ? (() =&gt; { try { return JSON.parse(state.body); } catch { return null; } })() : null; |
| writePath | const | 158 | no | const writePath = &#39;/api/mutate&#39;; |
| baseEnvelope | const | 159 | no | const baseEnvelope = { kind: &#39;chat-send&#39;, schemaVersion: 1, text: &#39;parity check message&#39; }; |
| envHuman | const | 160 | no | const envHuman = { ...baseEnvelope, actor: &#39;human&#39; }; |
| envAi | const | 161 | no | const envAi = { ...baseEnvelope, actor: &#39;ai&#39; }; |
| jBefore | const | 162 | no | const jBefore = await attempt(&#39;journal-before&#39;, () =&gt; get(&#39;/api/journal?format=jsonl&#39;)); |
| before | const | 163 | no | const before = await attempt(&#39;state-before&#39;, () =&gt; get(&#39;/api/state&#39;)); |
| postHuman | const | 164 | no | const postHuman = await attempt(&#39;post-human&#39;, () =&gt; post(writePath, envHuman)); |
| postAi | const | 165 | no | const postAi = await attempt(&#39;post-ai&#39;, () =&gt; post(writePath, envAi)); |
| after | const | 166 | no | const after = await attempt(&#39;state-after&#39;, () =&gt; get(&#39;/api/state&#39;)); |
| jAfter | const | 167 | no | const jAfter = await attempt(&#39;journal-after&#39;, () =&gt; get(&#39;/api/journal?format=jsonl&#39;)); |
| sameStatus | const | 168 | no | const sameStatus = postHuman.ok &amp;&amp; postAi.ok &amp;&amp; postHuman.status === 200 &amp;&amp; postAi.status === 200; |
| sameMutation | variable | 171 | no | let sameMutation = false; |
| bLines | const | 173 | no | const bLines = jBefore.ok ? jBefore.body.trim().split(/\\r?\\n/).filter(Boolean) : []; |
| aLines | const | 174 | no | const aLines = jAfter.ok ? jAfter.body.trim().split(/\\r?\\n/).filter(Boolean) : []; |
| tail2 | const | 175 | no | const tail2 = aLines.slice(-2).map(l =&gt; { try { return JSON.parse(l); } catch { return {}; } }); |
| prior | const | 176 | no | const prior = JSON.parse(before.body); |
| next | const | 177 | no | const next = JSON.parse(after.body); |
| stateProjected | const | 178 | no | const stateProjected = before.ok &amp;&amp; after.ok &amp;&amp; next.chat.length === prior.chat.length + 2 &amp;&amp; |
| parityDigest | const | 183 | no | const parityDigest = digestOf({ human: postHuman, ai: postAi, before: before.body, after: after.body }); |
| ok | const | 190 | no | const ok = checks.every(c =&gt; c.pass); |
| verdict | const | 191 | no | const verdict = { ok, item: ITEM, checks, digest: digestOf({ item: ITEM, checks }) }; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:crypto | import | 13 | external |
| node:fs | import | 14 | external |
| node:path | import | 15 | external |
| node:url | import | 16 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
#!/usr/bin/env bun
// scripts/batch-evidence/CHAT-BOX-BASELINE.mjs
//
// Gate-evidence runner for item CHAT-BOX-BASELINE — "Chat box baseline — page 1
// pure chat, human+AI same endpoints" (arbor.item-receipt/1).
//
//   bun scripts/batch-evidence/CHAT-BOX-BASELINE.mjs        static: checks readable without HTTP
//   bun scripts/batch-evidence/CHAT-BOX-BASELINE.mjs --live HTTP/NLCL/parity against http://127.0.0.1:43187
//
// Prints exactly one JSON object: { ok, checks:[{name,pass,detail}], digest? }
// Exits nonzero when any check fails. Never edits server.mjs (demo lane owns the /chat route patch).

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const ITEM = 'CHAT-BOX-BASELINE';
const TARGET_CAPS = 12;
const BASE_URL = 'http://127.0.0.1:43187';

const checks = [];
let live = false;

for (const arg of process.argv.slice(2)) {
  if (arg === '--live') live = true;
  else if (arg === '--help' || arg === '-h') {
    process.stdout.write(`usage: bun ${resolve(HERE, 'CHAT-BOX-BASELINE.mjs')} [--live]\n`);
    process.exit(0);
  } else {
    process.stderr.write(`${ITEM}: unknown argument: ${arg}\n`);
    process.exit(2);
  }
}

function fail(msg) {
  process.stderr.write(`${ITEM}: ${msg}\n`);
  process.exit(2);
}
function check(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail: String(detail) });
}
function stable(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
}
function digestOf(v) { return createHash('sha256').update(stable(v)).digest('hex'); }
function read(rel) { return readFileSync(resolve(REPO_ROOT, rel), 'utf8'); }
function exists(rel) { return existsSync(resolve(REPO_ROOT, rel)); }

// ---------------- static checks (no HTTP) ----------------

// 1. Proposal artifacts (roadmap.v1.json:195 sources)
const draftChat = exists('docs/product/proposals/chat-wiki-baseline/chat.html.draft');
const draftState = exists('docs/product/proposals/chat-wiki-baseline/state.mjs.draft');
check('proposal-artifacts', draftChat && draftState,
  draftChat && draftState ? 'chat.html.draft + state.mjs.draft present' : 'missing draft artifact');

// 2. Product chat route serving pattern (server.mjs:73-99 ASSETS map, 383-389 asset serve)
//    /chat registration itself is the demo lane's pending patch; this gate only verifies the mechanism.
const serverSrc = read('apps/vivim-host/server.mjs');
const hasAssetsMap = /const ASSETS = \{/.test(serverSrc);
const hasAssetServe = /readFile\(path\.join\(staticRoot, asset\)\)/.test(serverSrc) && /res\.writeHead\(200\)/.test(serverSrc);
const chatRegistered = /['"]\/chat['"]/.test(serverSrc);
check('chat-route-pattern', hasAssetsMap && hasAssetServe,
  `ASSETS map ${hasAssetsMap ? 'present' : 'absent'}; asset serve ${hasAssetServe ? 'present' : 'absent'}; /chat registered: ${chatRegistered} (demo lane patch pending)`);

// 3. Machine-readable state model (state.mjs.draft:11-28)
const stateDraft = read('docs/product/proposals/chat-wiki-baseline/state.mjs.draft');
const hasModel = ['loadState', 'saveState', 'loadWiki', 'saveWiki'].every(fn => stateDraft.includes(`export function ${fn}`));
check('state-model-draft', hasModel, hasModel ? 'loadState/saveState/loadWiki/saveWiki (draft:11-28)' : 'state model functions missing');

// 4-7. Real NLCL engine: command-intent.mjs + intent-planner.mjs (route: describe()/coverage + planTyped records)
let engineOk = false;
try {
  const plannerMod = await import(pathToFileURL(resolve(REPO_ROOT, 'apps/vivim-host/control/intent-planner.mjs')).href);
  const intentMod = await import(pathToFileURL(resolve(REPO_ROOT, 'apps/vivim-host/control/command-intent.mjs')).href);
```

_First 80 of 194 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
