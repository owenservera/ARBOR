# File: apps/vivim-host/test/live-source-surface.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/live-source-surface.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14439 B |
| Lines | 228 |
| Hash | 0235dcb06b48 |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| arbor | const | 11 | no | const arbor = realpathSync(fileURLToPath(new URL(&#39;../../../&#39;, import.meta.url))); |
| commandPath | const | 12 | no | const commandPath = &#39;apps/vivim-host/control/intent-planner.mjs&#39;; |
| id | const | 13 | no | const id = &#39;vivim.command-intent@0.1&#39;; |
| ownerToken | const | 14 | no | const ownerToken = &#39;real-source-surface-owner-test-12345678901234567890&#39;; |
| open | function | 15 | no | const open = server =&gt; new Promise(resolve =&gt; server.listen(0, &#39;127.0.0.1&#39;, resolve)); |
| close | function | 16 | no | const close = server =&gt; new Promise(resolve =&gt; server.close(resolve)); |
| request | function | 17 | no | function request(server, route, { authenticated = true, method = &#39;GET&#39;, origin, headers = {}, body } = {}) { |
| host | const | 18 | no | const host = &#39;127.0.0.1:&#39; + server.address().port; |
| req | const | 20 | no | const req = http.request({ hostname: &#39;127.0.0.1&#39;, port: server.address().port, path: route, method, headers: { host, ...(authenticated ? { authorization: &#39;Bearer &#39; + ownerToken } : {}), ...(method ==… |
| chunks | const | 25 | no | const chunks = []; |
| body | const | 28 | no | const body = Buffer.concat(chunks).toString(&#39;utf8&#39;); |
| data | variable | 29 | no | let data; |
| hqAt | function | 38 | no | function hqAt(root, dataDir) { |
| checkContext | function | 41 | no | function checkContext(out, project, path, semanticId) { |
| source | const | 44 | no | const source = out.context.sources.find(s =&gt; s.ref === out.sourceId); |
| createTestHost | function | 53 | no | function createTestHost(sourceRoot, indexRoot, dataRoot) { |
| tmp | const | 63 | no | const tmp = mkdtempSync(join(tmpdir(), &#39;arbor-live-full-source-&#39;)); |
| indexRoot | const | 64 | no | const indexRoot = join(tmp, &#39;hq&#39;); |
| server | const | 65 | no | const server = createTestHost(arbor, indexRoot, join(tmp, &#39;host&#39;)); |
| hq | const | 67 | no | const hq = hqAt(arbor, indexRoot); |
| indexed | const | 69 | no | const indexed = hq.index({ useGit: false }); |
| result | const | 72 | no | const result = hq.fileSurface({ project: &#39;arbor&#39;, query: &#39;planText&#39; }); |
| direct | const | 79 | no | const direct = hq.fileSurfaceContext({ project: &#39;arbor&#39;, path: commandPath }); |
| live | const | 86 | no | const live = await request(server, &#39;/api/file-surface?project=arbor&amp;q=planText&#39;); |
| context | const | 89 | no | const context = await request(server, &#39;/api/file-surface/context?project=arbor&amp;path=&#39; + encodeURIComponent(commandPath)); |
| wiki | const | 93 | no | const wiki = await request(server, &#39;/wiki&#39;, { authenticated: false }); |
| script | const | 96 | no | const script = await request(server, &#39;/wiki.js&#39;, { authenticated: false }); |
| tmp | const | 107 | no | const tmp = mkdtempSync(join(tmpdir(), &#39;arbor-live-source-edit-&#39;)); |
| source | const | 108 | no | const source = join(tmp, &#39;code&#39;), data = join(tmp, &#39;hq&#39;); |
| file | const | 112 | no | const file = join(source, &#39;intent-planner.mjs&#39;); |
| server | const | 116 | no | const server = createTestHost(source, data, join(tmp, &#39;host&#39;)); |
| hq | const | 118 | no | const hq = hqAt(source, data); |
| empty | const | 120 | no | const empty = await request(server, &#39;/api/file-surface&#39;); |
| index | const | 124 | no | const index = hq.index({ useGit: false }); |
| initial | const | 126 | no | const initial = await request(server, &#39;/api/file-surface?project=copy&amp;q=&#39; + encodeURIComponent(id)); |
| contextUrl | const | 129 | no | const contextUrl = &#39;/api/file-surface/context?project=copy&amp;path=intent-planner.mjs&#39;; |
| annotation | const | 130 | no | const annotation=initial.data.files[0].annotations.find(a=&gt;a.semanticId===id&amp;&amp;a.kind===&#39;consumes&#39;); |
| selected | const | 132 | no | const selected=annotation.semanticAnchor; |
| exactUrl | const | 133 | no | const exactUrl=contextUrl+&#39;&amp;anchor=&#39;+encodeURIComponent(selected.anchorId)+&#39;&amp;fingerprint=&#39;+selected.fingerprint; |
| personalBefore | const | 134 | no | const personalBefore=(await request(server,&#39;/api/wiki&#39;)).data; |
| exact | const | 135 | no | const exact=(await request(server,exactUrl)).data; |
| before | const | 144 | no | const before = (await request(server, contextUrl)).data; |
| command | const | 146 | no | const command = await request(server,&#39;/api/host/control/plan&#39;,{ method:&#39;POST&#39;,body:{text:&#39;list wiki pages&#39;} }); |
| automatic | const | 154 | no | const automatic=command.data.requestContext.source.context; |
| again | const | 166 | no | const again=hq.compiledContext({task:&#39;list wiki pages&#39;,sourceSemanticIds:automatic.sourceSemanticIds}); |
| tooSmall | const | 168 | no | const tooSmall=hq.compiledContext({task:&#39;list wiki pages&#39;,sourceSemanticIds:automatic.sourceSemanticIds,budgetTokens:100}); |
| incomplete | const | 171 | no | const incomplete=hq.compiledContext({task:&#39;list wiki pages&#39;,sourceSemanticIds:[...automatic.sourceSemanticIds,&#39;missing.capability@1&#39;]}); |
| newer | const | 183 | no | const newer = &#39;vivim.command-intent@0.2&#39;; |
| code | const | 184 | no | const code = readFileSync(file, &#39;utf8&#39;); |
| edited | const | 185 | no | const edited = code.replace(&#39;// @hq:consumes &#39; + id, &#39;// @hq:consumes &#39; + newer + &#39;0&#39;); |
| changedId | const | 187 | no | const changedId = newer + &#39;0&#39;; // length change exercises ordinary incremental detection |
| stale | const | 189 | no | const stale = (await request(server, &#39;/api/file-surface?project=copy&amp;path=intent-planner.mjs&#39;)).data; |
| noContext | const | 191 | no | const noContext = (await request(server, contextUrl)).data; |
| changed | const | 196 | no | const changed = await request(server,&#39;/api/host/control/plan&#39;,{ method:&#39;POST&#39;,body:{text:&#39;list wiki pages&#39;} }); |
| deniedRefresh | const | 203 | no | const deniedRefresh = await request(server, &#39;/api/file-surface/index&#39;, { method: &#39;POST&#39;, authenticated: false }); |
| refreshed | const | 205 | no | const refreshed = await request(server, &#39;/api/file-surface/index&#39;, { method: &#39;POST&#39; }); |
| after | const | 208 | no | const after = (await request(server, &#39;/api/file-surface?project=copy&amp;q=&#39; + encodeURIComponent(changedId))).data; |
| updated | const | 213 | no | const updated = (await request(server, contextUrl)).data; |
| replacement | const | 218 | no | const replacement=after.files[0].annotations.find(a=&gt;a.semanticId===changedId&amp;&amp;a.kind===&#39;consumes&#39;).semanticAnchor; |
| replaced | const | 219 | no | const replaced=(await request(server,contextUrl+&#39;&amp;anchor=&#39;+encodeURIComponent(replacement.anchorId)+&#39;&amp;fingerprint=&#39;+replacement.fingerprint)).data; |
| forbidden | const | 223 | no | const forbidden = await request(server, &#39;/api/file-surface/context?project=copy&amp;path=private%2Fintent-planner.mjs&#39;); |
| escaped | const | 225 | no | const escaped = await request(server, &#39;/api/file-surface/context?project=copy&amp;path=..%2Foutside.mjs&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| node:http | import | 3 | external |
| node:fs | import | 4 | external |
| node:os | import | 5 | external |
| node:path | import | 6 | external |
| node:url | import | 7 | external |
| ../../../hq/lib/arbor-service.mjs | import | 8 | [hq/lib/arbor-service.mjs](../../../hq/lib/arbor-service.mjs.md) |
| ../server.mjs | import | 9 | [apps/vivim-host/server.mjs](../server.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDevIntelligence } from '../../../hq/lib/arbor-service.mjs';
import { createHostServer } from '../server.mjs';

const arbor = realpathSync(fileURLToPath(new URL('../../../', import.meta.url)));
const commandPath = 'apps/vivim-host/control/intent-planner.mjs';
const id = 'vivim.command-intent@0.1';
const ownerToken = 'real-source-surface-owner-test-12345678901234567890';
const open = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const close = server => new Promise(resolve => server.close(resolve));
function request(server, route, { authenticated = true, method = 'GET', origin, headers = {}, body } = {}) {
  const host = '127.0.0.1:' + server.address().port;
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: route,
      method, headers: { host, ...(authenticated ? { authorization: 'Bearer ' + ownerToken } : {}),
        ...(method === 'POST' ? { origin: 'http://' + host, 'x-vivim-control': '1' } : {}),
        ...(origin ? { origin } : {}), ...(body!==undefined ? {'content-type':'application/json'} : {}), ...headers }
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let data;
        try { data = JSON.parse(body); } catch { data = body; }
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.end(body===undefined?undefined:JSON.stringify(body));
  });
}
function hqAt(root, dataDir) {
  return createDevIntelligence({ mode: 'diagnostic', approvedRoots: [root], dataDir });
}
function checkContext(out, project, path, semanticId) {
  assert.equal(out.status, 'indexed', JSON.stringify(out).slice(0,300));
  assert.equal(out.sourceId, project + ':' + path);
  const source = out.context.sources.find(s => s.ref === out.sourceId);
  assert.ok(source, 'selected genuine source must be included');
  assert.equal(source.contentHash, out.sourceDigest);
  assert.ok(source.semanticReferences.some(a => a.semanticId === semanticId && a.annotationKind === 'consumes'));
  assert.match(out.context.fragment, /function planText\(/);
  assert.equal(out.context.authority, 'read_only_projection');
  assert.ok(out.context.sources.every(s => !Object.hasOwn(s, 'absPath')));
  return source;
}
function createTestHost(sourceRoot, indexRoot, dataRoot) {
  return createHostServer({ dataRoot, ownerToken, autoPump: false,
    developmentSources: { approvedRoots: [sourceRoot], dataDir: indexRoot } });
}

test('actual ARBOR registration and HQ source index feed real Host route and source context', async () => {
  // No fixture, copied source, or precomputed corpus in this acceptance path.
  // The only temporary data is the existing HQ index and Host data directory.
  // The full-repository index is intentionally explicit: run this focused test
  // from a real checkout when testing repository-wide acceptance.
  const tmp = mkdtempSync(join(tmpdir(), 'arbor-live-full-source-'));
  const indexRoot = join(tmp, 'hq');
  const server = createTestHost(arbor, indexRoot, join(tmp, 'host'));
  try {
    const hq = hqAt(arbor, indexRoot);
    hq.registerSource({ name: 'arbor', path: arbor });
    const indexed = hq.index({ useGit: false });
    assert.equal(indexed.errors.length, 0, JSON.stringify(indexed.errors.slice(0,3)));
    assert.ok(indexed.totals.files > 3);
    const result = hq.fileSurface({ project: 'arbor', query: 'planText' });
    assert.equal(result.generatorVersion, 'hq.source-index/1');
    const record = result.files.find(f => f.path === commandPath);
    assert.ok(record, 'real command intent implementation must be indexed');
    assert.equal(record.freshness, 'indexed');
    assert.ok(record.annotations.some(a => a.semanticId === id && a.kind === 'consumes'));
    assert.equal(record.currentDigest, record.sourceDigest);
    const direct = hq.fileSurfaceContext({ project: 'arbor', path: commandPath });
    checkContext(direct, 'arbor', commandPath, id);
```

_First 80 of 229 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
