# File: apps/vivim-host/test/ui-revision.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/test/ui-revision.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 15593 B |
| Lines | 347 |
| Hash | 1e62df6e2e9d |
| Test | yes |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TOKEN | const | 14 | no | const TOKEN = &#39;test-owner-token-0123456789abcdef0123456789abcdef&#39;; |
| runtime | function | 16 | no | function runtime() { |
| dir | const | 17 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-ui-revision-&#39;)); |
| host | const | 18 | no | const host = createBootstrapRuntime({ dataRoot: dir, file: &#39;:memory:&#39; }); |
| surface | function | 29 | no | function surface() { |
| card | function | 33 | no | function card(id) { |
| proposal | function | 37 | no | function proposal(target, component, { opId = &#39;op.insert&#39;, baseRevision = target.revision } = {}) { |
| committed | function | 47 | no | function committed(out, prior, body, approvedRefs) { |
| next | const | 48 | no | const next = out.surface ?? compileUiProposal({ proposal: body, surface: prior, approvedRefs }).surface; |
| rejection | function | 52 | no | const rejection = pattern =&gt; error =&gt; pattern.test(String(error?.message ?? error)); |
| env | const | 55 | no | const env = runtime(); |
| start | const | 57 | no | const start = surface(); |
| first | const | 58 | no | const first = proposal(start, card(&#39;item1&#39;)); |
| one | const | 60 | no | const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: &#39;req-ui-1&#39; }); |
| afterOne | const | 68 | no | const afterOne = committed(one, start, first, []); |
| second | const | 69 | no | const second = proposal(afterOne, card(&#39;item2&#39;), { opId: &#39;op.insert.two&#39; }); |
| two | const | 70 | no | const two = env.host.applyUiProposal({ proposal: second, surface: afterOne, approvedRefs: [], requestId: &#39;req-ui-2&#39; }); |
| undone | const | 78 | no | const undone = env.host.undoUiRevision({ requestId: &#39;req-ui-undo&#39; }); |
| env | const | 90 | no | const env = runtime(); |
| start | const | 92 | no | const start = surface(); |
| first | const | 93 | no | const first = proposal(start, card(&#39;item1&#39;)); |
| one | const | 94 | no | const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: &#39;req-ui-stale-1&#39; }); |
| afterOne | const | 96 | no | const afterOne = committed(one, start, first, []); |
| two | const | 97 | no | const two = proposal(afterOne, card(&#39;item2&#39;), { opId: &#39;op.insert.two&#39; }); |
| second | const | 98 | no | const second = env.host.applyUiProposal({ proposal: two, surface: afterOne, approvedRefs: [], requestId: &#39;req-ui-stale-2&#39; }); |
| staleSurface | const | 102 | no | const staleSurface = start; |
| stale | const | 103 | no | const stale = proposal(staleSurface, card(&#39;item3&#39;), { opId: &#39;op.insert.stale&#39;, baseRevision: 0 }); |
| env | const | 115 | no | const env = runtime(); |
| start | const | 117 | no | const start = surface(); |
| before | const | 118 | no | const before = env.host.uiRevision()?.revision ?? 0; |
| unapproved | const | 120 | no | const unapproved = proposal(start, { id: &#39;profile&#39;, type: &#39;profile-card&#39;, props: { title: &#39;Identity&#39;, sourceRef: &#39;clm-madeup&#39; }, children: [] }); |
| rootRemoval | const | 129 | no | const rootRemoval = { |
| refs | const | 142 | no | const refs = [&#39;viw-1&#39;]; |
| privateInsert | const | 143 | no | const privateInsert = proposal(start, { id: &#39;deep.private&#39;, type: &#39;card&#39;, visibility: &#39;pc-private&#39;, props: { title: &#39;Relationships&#39;, sourceRef: &#39;viw-1&#39; }, children: [] }); |
| privateCommit | const | 147 | no | const privateCommit = env.host.applyUiProposal({ proposal: privateInsert, surface: start, approvedRefs: refs, requestId: &#39;req-ui-private-insert&#39; }); |
| withPrivate | const | 150 | no | const withPrivate = committed(privateCommit, start, privateInsert, refs); |
| body | const | 156 | no | const body = { |
| env | const | 176 | no | const env = runtime(); |
| start | const | 178 | no | const start = surface(); |
| first | const | 179 | no | const first = proposal(start, card(&#39;item1&#39;)); |
| one | const | 180 | no | const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: &#39;req-status-1&#39; }); |
| appliedOne | const | 182 | no | const appliedOne = env.host.uiRevisionStatus(1); |
| afterOne | const | 188 | no | const afterOne = committed(one, start, first, []); |
| two | const | 189 | no | const two = env.host.applyUiProposal({ proposal: proposal(afterOne, card(&#39;item2&#39;), { opId: &#39;op.insert.two&#39; }), surface: afterOne, approvedRefs: [], requestId: &#39;req-status-2&#39;, actor: &#39;phone&#39; }); |
| env | const | 207 | no | const env = runtime(); |
| start | const | 209 | no | const start = surface(); |
| first | const | 210 | no | const first = proposal(start, card(&#39;item1&#39;)); |
| one | const | 211 | no | const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: &#39;req-undo-status-1&#39; }); |
| afterOne | const | 212 | no | const afterOne = committed(one, start, first, []); |
| two | const | 213 | no | const two = env.host.applyUiProposal({ proposal: proposal(afterOne, card(&#39;item2&#39;), { opId: &#39;op.insert.two&#39; }), surface: afterOne, approvedRefs: [], requestId: &#39;req-undo-status-2&#39; }); |
| undone | const | 219 | no | const undone = env.host.undoUiRevision({ requestId: &#39;req-undo-status&#39; }); |
| env | const | 232 | no | const env = runtime(); |
| start | const | 235 | no | const start = surface(); |
| first | const | 236 | no | const first = proposal(start, card(&#39;item1&#39;)); |
| projected | const | 239 | no | const projected = env.host.projection(); |
| env | const | 255 | no | const env = runtime(); |
| start | const | 257 | no | const start = surface(); |
| first | const | 258 | no | const first = proposal(start, card(&#39;item1&#39;)); |
| one | const | 259 | no | const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: &#39;req-stale-status-1&#39; }); |
| afterOne | const | 260 | no | const afterOne = committed(one, start, first, []); |
| two | const | 261 | no | const two = env.host.applyUiProposal({ proposal: proposal(afterOne, card(&#39;item2&#39;), { opId: &#39;op.insert.two&#39; }), surface: afterOne, approvedRefs: [], requestId: &#39;req-stale-status-2&#39; }); |
| beforeOne | const | 266 | no | const beforeOne = env.host.uiRevisionStatus(1); |
| beforeTwo | const | 267 | no | const beforeTwo = env.host.uiRevisionStatus(2); |
| stale | const | 269 | no | const stale = proposal(start, card(&#39;item3&#39;), { opId: &#39;op.insert.stale&#39;, baseRevision: 0 }); |
| dir | const | 287 | no | const dir = mkdtempSync(path.join(os.tmpdir(), &#39;vivim-ui-revision-http-&#39;)); |
| host | const | 288 | no | const host = createBootstrapRuntime({ dataRoot: dir, file: &#39;:memory:&#39; }); |
| server | const | 290 | no | const server = createHostServer({ dataRoot: dir, bootstrap: host, ownerToken: TOKEN }); |
| base | const | 292 | no | const base = `http://127.0.0.1:${server.address().port}`; |
| auth | const | 293 | no | const auth = { authorization: &#39;Bearer &#39; + TOKEN }; |
| route | const | 294 | no | const route = &#39;/api/host/bootstrap/ui-proposal&#39;; |
| post | function | 295 | no | const post = (body, headers = {}) =&gt; fetch(base + route, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-bootstrap&#39;: &#39;1&#39;, ...auth, ...headers }, body: JSON.stringify(body) }… |
| start | const | 301 | no | const start = surface(); |
| body | const | 302 | no | const body = { proposal: proposal(start, card(&#39;item1&#39;)), surface: start, approvedRefs: [], requestId: &#39;req-http-ui-1&#39; }; |
| noToken | const | 304 | no | const noToken = await fetch(base + route, { method: &#39;POST&#39;, headers: { &#39;content-type&#39;: &#39;application/json&#39;, &#39;x-vivim-bootstrap&#39;: &#39;1&#39; }, body: JSON.stringify(body) }); |
| noHeader | const | 311 | no | const noHeader = await post(body, { &#39;x-vivim-bootstrap&#39;: &#39;&#39; }); |
| crossOrigin | const | 314 | no | const crossOrigin = await post(body, { origin: &#39;https://evil.example&#39; }); |
| wrongMethod | const | 317 | no | const wrongMethod = await fetch(base + route, { method: &#39;GET&#39;, headers: { &#39;x-vivim-bootstrap&#39;: &#39;1&#39;, ...auth } }); |
| applied | const | 326 | no | const applied = await post(body); |
| out | const | 328 | no | const out = await applied.json(); |
| projection | const | 334 | no | const projection = await (await fetch(base + &#39;/api/host/bootstrap/projection&#39;)).json(); |
| stale | const | 339 | no | const stale = await post(body); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| node:fs | import | 6 | external |
| node:os | import | 7 | external |
| node:path | import | 8 | external |
| ../bootstrap/runtime.mjs | import | 9 | [apps/vivim-host/bootstrap/runtime.mjs](../bootstrap/runtime.mjs.md) |
| ../server.mjs | import | 10 | [apps/vivim-host/server.mjs](../server.mjs.md) |
| ../../mobile-relay/generative-ui/catalog.mjs | import | 11 | [apps/mobile-relay/generative-ui/catalog.mjs](../../mobile-relay/generative-ui/catalog.mjs.md) |
| ../../mobile-relay/generative-ui/compiler.mjs | import | 12 | [apps/mobile-relay/generative-ui/compiler.mjs](../../mobile-relay/generative-ui/compiler.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// GUI01 at the Host boundary: a validated vivim.ui-proposal/1 becomes a Host-owned,
// compare-and-swap vivim.ui-revision/1 commit. The provider never writes the surface;
// the Host compiles, checks the base revision and persists one new active revision.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createBootstrapRuntime } from '../bootstrap/runtime.mjs';
import { createHostServer } from '../server.mjs';
import { createSurface, DEFAULT_THEME } from '../../mobile-relay/generative-ui/catalog.mjs';
import { compileUiProposal } from '../../mobile-relay/generative-ui/compiler.mjs';

const TOKEN = 'test-owner-token-0123456789abcdef0123456789abcdef';

function runtime() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'vivim-ui-revision-'));
  const host = createBootstrapRuntime({ dataRoot: dir, file: ':memory:' });
  host.grantBootstrap({ scope: 'full-bootstrap' });
  return {
    dir, host,
    close() {
      host.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

function surface() {
  return createSurface({ surfaceId: 'ui-revision-space', theme: DEFAULT_THEME });
}

function card(id) {
  return { id, type: 'card', props: { title: 'Known topic', description: 'Grounded summary' }, children: [] };
}

function proposal(target, component, { opId = 'op.insert', baseRevision = target.revision } = {}) {
  return {
    schema: 'vivim.ui-proposal/1', surfaceId: target.surfaceId, baseRevision,
    operations: [{ opId, type: 'insert', parentId: 'root', component }],
    explanation: 'Preview change', assumptions: [], unknowns: []
  };
}

// A service commit may or may not echo the compiled surface; derive it deterministically
// either way so the next compare-and-swap runs against the real committed revision.
function committed(out, prior, body, approvedRefs) {
  const next = out.surface ?? compileUiProposal({ proposal: body, surface: prior, approvedRefs }).surface;
  return { ...next, revision: out.revision };
}

const rejection = pattern => error => pattern.test(String(error?.message ?? error));

test('a proposal CAS-commits revisions 1 and 2, then undo returns the active revision to 1', () => {
  const env = runtime();
  try {
    const start = surface();
    const first = proposal(start, card('item1'));

    const one = env.host.applyUiProposal({ proposal: first, surface: start, approvedRefs: [], requestId: 'req-ui-1' });
    assert.equal(one.ok, true);
    assert.equal(one.revision, 1);
    assert.equal(one.parentRevision, 0);
    assert.equal(one.persisted, true);
    assert.equal(one.surfaceId, start.surfaceId);
    assert.equal(env.host.uiRevision().revision, 1);

    const afterOne = committed(one, start, first, []);
    const second = proposal(afterOne, card('item2'), { opId: 'op.insert.two' });
    const two = env.host.applyUiProposal({ proposal: second, surface: afterOne, approvedRefs: [], requestId: 'req-ui-2' });
    assert.equal(two.ok, true);
    assert.equal(two.revision, 2);
    assert.equal(two.parentRevision, 1);
    assert.equal(two.persisted, true);
    assert.equal(two.surfaceId, start.surfaceId);
    assert.equal(env.host.uiRevision().revision, 2);

    const undone = env.host.undoUiRevision({ requestId: 'req-ui-undo' });
    assert.equal(undone.undone, 2);
    assert.equal(undone.active, 1);
```

_First 80 of 348 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
