# File: hq/test/hvi-mcp-tool.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/hvi-mcp-tool.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3899 B |
| Lines | 85 |
| Hash | e4f603e78e23 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| grant | function | 10 | no | const grant = async () =&gt; true; |
| noIndex | const | 13 | no | const noIndex = new Proxy({}, { get(_target, prop) { throw new Error(&#39;the HVI tool must not touch the HQ index (asked for &#39; + String(prop) + &#39;)&#39;); }, }); |
| server | function | 19 | no | const server = () =&gt; createMcpServer({ root: process.cwd(), db: noIndex }); |
| list | function | 20 | no | const list = s =&gt; s.handle({ jsonrpc: &#39;2.0&#39;, id: 1, method: &#39;tools/list&#39; }); |
| call | function | 21 | no | const call = (s, name, args) =&gt; |
| payload | function | 23 | no | const payload = response =&gt; JSON.parse(response.result.content[0].text); |
| invented | function | 25 | no | async function invented(repo = &#39;synthetic/mcp-fixture&#39;, versions = [&#39;v1&#39;, &#39;v2&#39;, &#39;v3&#39;]) { |
| fixture | const | 26 | no | const fixture = syntheticSource(); |
| manifests | const | 27 | no | const manifests = []; |
| pin | const | 29 | no | const pin = await resolvePin({ provider: &#39;github&#39;, repo, ref, approvedScope: &#39;development&#39; }, { adapter: fixture.adapter, authorize: grant, acquiredAt: &#39;2026-01-01T00:00:00.000Z&#39; }); |
| response | const | 39 | no | const response = await list(server()); |
| tools | const | 40 | no | const tools = response.result.tools; |
| hvi | const | 41 | no | const hvi = tools.find(t =&gt; t.name === &#39;hvi_compare_pinned&#39;); |
| manifests | const | 50 | no | const manifests = await invented(); |
| response | const | 51 | no | const response = await call(server(), &#39;hvi_compare_pinned&#39;, { sourceManifests: manifests, targetPinId: manifests.at(-1).pin.pinId, }); |
| out | const | 56 | no | const out = payload(response); |
| manifests | const | 67 | no | const manifests = await invented(); |
| renamed | const | 68 | no | const renamed = manifests.map(m =&gt; ({ ...m, pin: { ...m.pin, repoIdentity: &#39;real-owner/private-repo&#39; } })); |
| response | const | 69 | no | const response = await call(server(), &#39;hvi_compare_pinned&#39;, { sourceManifests: renamed, targetPinId: renamed.at(-1).pin.pinId, }); |
| manifests | const | 78 | no | const manifests = await invented(); |
| response | const | 79 | no | const response = await call(server(), &#39;hvi_compare_pinned&#39;, { sourceManifests: [manifests[0]], targetPinId: manifests[0].pin.pinId, }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 4 | external |
| node:assert/strict | import | 5 | external |
| ../lib/mcp.mjs | import | 6 | [hq/lib/mcp.mjs](../lib/mcp.mjs.md) |
| ../version-intelligence/sources/fixtures.mjs | import | 7 | [hq/version-intelligence/sources/fixtures.mjs](../version-intelligence/sources/fixtures.mjs.md) |
| ../version-intelligence/sources/snapshots.mjs | import | 8 | [hq/version-intelligence/sources/snapshots.mjs](../version-intelligence/sources/snapshots.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// Native HQ capability discovery + invocation for HQ Version Intelligence.
// Invented Git-object fixtures only: no real repository, no network, no provider,
// no browser, no personal corpus and no effect of any kind.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMcpServer } from '../lib/mcp.mjs';
import { syntheticSource } from '../version-intelligence/sources/fixtures.mjs';
import { resolvePin, snapshotAt } from '../version-intelligence/sources/snapshots.mjs';

const grant = async () => true;

/** The HVI tool must never touch the HQ index; this stub proves it. */
const noIndex = new Proxy({}, {
  get(_target, prop) {
    throw new Error('the HVI tool must not touch the HQ index (asked for ' + String(prop) + ')');
  },
});

const server = () => createMcpServer({ root: process.cwd(), db: noIndex });
const list = s => s.handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
const call = (s, name, args) =>
  s.handle({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } });
const payload = response => JSON.parse(response.result.content[0].text);

async function invented(repo = 'synthetic/mcp-fixture', versions = ['v1', 'v2', 'v3']) {
  const fixture = syntheticSource();
  const manifests = [];
  for (const ref of versions) {
    const pin = await resolvePin({ provider: 'github', repo, ref, approvedScope: 'development' },
      { adapter: fixture.adapter, authorize: grant, acquiredAt: '2026-01-01T00:00:00.000Z' });
    manifests.push(await snapshotAt(pin, {
      adapter: fixture.adapter, authorize: grant, inspectContent: true, limits: {},
    }));
  }
  return manifests;
}

test('HVI is discoverable in the native HQ tool list', async () => {
  const response = await list(server());
  const tools = response.result.tools;
  const hvi = tools.find(t => t.name === 'hvi_compare_pinned');
  assert.ok(hvi, 'the HVI capability must be listed for agent discovery');
  assert.match(hvi.description, /source facts/i);
  assert.match(hvi.description, /never runtime proof/i);
  assert.deepEqual(hvi.inputSchema.required, ['sourceManifests', 'targetPinId']);
  assert.equal(hvi.inputSchema.properties.sourceManifests.type, 'array');
});

test('an agent can invoke the native HVI capability on invented fixtures', async () => {
  const manifests = await invented();
  const response = await call(server(), 'hvi_compare_pinned', {
    sourceManifests: manifests,
    targetPinId: manifests.at(-1).pin.pinId,
  });
  assert.equal(response.result.isError, undefined);
  const out = payload(response);
  assert.equal(out.capabilityId, 'arbor.hvi.compare.pinned/1');
  assert.equal(out.comparison.sourcePins.length, 3);
  assert.equal(out.comparison.coverage.length, 2);
  assert.equal(out.runtimeAccepted, false);
  assert.equal(out.hostBound, false);
  assert.equal(out.provenance, 'SYNTHETIC_ONLY');
  assert.ok(out.limitations.includes('not runtime verified'));
});

test('the native HVI tool refuses any non-synthetic source', async () => {
  const manifests = await invented();
  const renamed = manifests.map(m => ({ ...m, pin: { ...m.pin, repoIdentity: 'real-owner/private-repo' } }));
  const response = await call(server(), 'hvi_compare_pinned', {
    sourceManifests: renamed,
    targetPinId: renamed.at(-1).pin.pinId,
  });
  assert.equal(response.result.isError, true);
  assert.match(response.result.content[0].text, /synthetic/i);
});

test('the native HVI tool refuses an incomplete source set', async () => {
  const manifests = await invented();
  const response = await call(server(), 'hvi_compare_pinned', {
    sourceManifests: [manifests[0]],
```

_First 80 of 86 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
