# File: hq/test/live-graph-wave1-master.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/live-graph-wave1-master.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 13566 B |
| Lines | 203 |
| Hash | c85e12e557ea |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| GRAPH_MODULE | const | 27 | no | const GRAPH_MODULE = &#39;../live-graph/wave1/master/master-graph.mjs&#39;; |
| BRIDGE_MODULE | const | 28 | no | const BRIDGE_MODULE = &#39;../../research/rust-knowledge-graph/integration/wave1-lane-e/round2/native-bridge.mjs&#39;; |
| GRAPH_PRESENT | const | 29 | no | const GRAPH_PRESENT = existsSync(new URL(GRAPH_MODULE, import.meta.url)) |
| GRAPH_SKIP | const | 31 | no | const GRAPH_SKIP = GRAPH_PRESENT ? false |
| sha | function | 39 | no | const sha = text =&gt; createHash(&#39;sha256&#39;).update(text, &#39;utf8&#39;).digest(&#39;hex&#39;); |
| HEAD | const | 40 | no | const HEAD = &#39;a&#39;.repeat(40); |
| base | const | 45 | no | const base = { projectId: &#39;vivim&#39;, intentId: &#39;intent@1&#39;, intent: &#39;a long enough indexing intent&#39;, revision: 1 }; |
| scope | const | 50 | no | const scope = buildScope({ ...base, roots: [{ id: &#39;hq-code&#39;, repo: &#39;owenservera/repos-hq&#39;, path: &#39;hq&#39;, commitSha: HEAD, sourceRootId: &#39;repos-hq&#39; }] }); |
| observations | const | 56 | no | const observations = { |
| manifest | const | 64 | no | const manifest = sourceManifestFor(observations, &#39;repos-hq&#39;); |
| text | const | 71 | no | const text = [ |
| splitForm | const | 75 | no | const splitForm = [ |
| anchor | const | 81 | no | const anchor = actionSourceAnchor({ text, domain: &#39;index&#39;, object: &#39;space&#39; }); |
| duplicated | const | 84 | no | const duplicated = text + &quot;\\n { name: &#39;space&#39;, purpose: &#39;x&#39; },&quot;; |
| text | const | 90 | no | const text = &quot; Object.freeze({\\n verb: &#39;show&#39;,\\n purpose: &#39;p&#39;,\\n }),&quot;; |
| inventory | const | 96 | no | const inventory = { |
| objectAnchors | const | 105 | no | const objectAnchors = new Map([ [&#39;index.show.space&#39;, { path: &#39;hq/lib/actions/domains-3.mjs&#39;, line: 187, sha256: sha(&#39;file&#39;) }], [&#39;index.create.space&#39;, { path: &#39;hq/lib/actions/domains-3.mjs&#39;, line: 18… |
| definitionAnchors | const | 110 | no | const definitionAnchors = new Map([ [&#39;index.show.space&#39;, { path: &#39;hq/lib/actions/handlers.mjs&#39;, line: 49, sha256: sha(&#39;handlers&#39;) }], [&#39;index.create.space&#39;, { path: &#39;hq/lib/actions/handlers.mjs&#39;, lin… |
| links | const | 115 | no | const links = [ |
| joined | const | 119 | no | const joined = attachSemanticIds({ inventory, semanticLinks: links, definitionAnchors, objectAnchors }); |
| stale | const | 127 | no | const stale = attachSemanticIds({ inventory, definitionAnchors, objectAnchors, semanticLinks: [{ semantic_id: &#39;index.show.space@1&#39;, path: &#39;hq/lib/actions/domains-3.mjs&#39;, line: 187, content_hash: sha(… |
| wrongLine | const | 133 | no | const wrongLine = attachSemanticIds({ inventory, definitionAnchors, objectAnchors, semanticLinks: [{ semantic_id: &#39;index.show.space@1&#39;, path: &#39;hq/lib/actions/domains-3.mjs&#39;, line: 999, content_hash: … |
| oneHalf | const | 140 | no | const oneHalf = attachSemanticIds({ inventory, definitionAnchors, objectAnchors, semanticLinks: [{ semantic_id: &#39;index.show.space@1&#39;, path: &#39;hq/lib/actions/domains-3.mjs&#39;, line: 187, content_hash: sh… |
| inventory | const | 148 | no | const inventory = { |
| semanticRows | const | 155 | no | const semanticRows = [ |
| text | const | 174 | no | const text = &#39;export const status = 1;\\n&#39;; |
| SHA | const | 175 | no | const SHA = sha(text); |
| scope | const | 176 | no | const scope = { schema: SCHEMAS.scope, projectId: &#39;vivim&#39;, intentId: &#39;vivim@1&#39;, intent: &#39;an intent long enough to pass&#39;, revision: 1, roots: [{ id: &#39;hq&#39;, sourceRootId: &#39;repos-hq&#39;, repo: &#39;owenservera/… |
| a | const | 177 | no | const a = { schema: SCHEMAS.a, project: { id: &#39;vivim&#39;, intentRevision: 1, purpose: &#39;p&#39; }, roots: [{ id: &#39;repos-hq&#39;, headSha: HEAD }], files: [{ id: &#39;f1&#39;, projectId: &#39;vivim&#39;, rootId: &#39;repos-hq&#39;, path:… |
| b | const | 178 | no | const b = { schema: SCHEMAS.b, project: { id: 1, name: &#39;vivim&#39;, root: &#39;repos-hq&#39;, revision: HEAD }, records: [], links: [], unknowns: [] }; |
| command | function | 179 | no | const command = (registry, runtime) =&gt; ({ kind: &#39;operation&#39;, id: &#39;hq.action:index.show.space&#39;, projectId: &#39;vivim&#39;, actionId: &#39;index.show.space&#39;, purpose: &#39;show the space&#39;, semanticId: null, evidenceS… |
| c | function | 187 | no | const c = (registry, runtime) =&gt; ({ schema: SCHEMAS.c, projectId: &#39;vivim&#39;, sourceFiles: [{ path: &#39;hq/lib/s.mjs&#39;, sha256: SHA }], records: [command(registry, runtime)], cli: [] }); |
| wired | const | 189 | no | const wired = lowerNative({ scope, a, b: { ...b, records: [{ id: &#39;semantic:x@1&#39;, type: &#39;semantic_id&#39;, label: &#39;x&#39;, state: &#39;current&#39;, authority: &#39;hq&#39;, revision: &#39;1&#39;, writer: &#39;w&#39;, source: { id: &#39;x@1&#39;, k… |
| node | const | 190 | no | const node = wired.feeds[2].nodes.find(n =&gt; n.kind === &#39;command&#39;); |
| declared | const | 197 | no | const declared = lowerNative({ scope, a, b: { ...b, records: [{ id: &#39;semantic:x@1&#39;, type: &#39;semantic_id&#39;, label: &#39;x&#39;, state: &#39;current&#39;, authority: &#39;hq&#39;, revision: &#39;1&#39;, writer: &#39;w&#39;, source: { id: &#39;x@1&#39;… |
| declaredNode | const | 198 | no | const declaredNode = declared.feeds[2].nodes.find(n =&gt; n.kind === &#39;command&#39;); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 19 | external |
| node:assert/strict | import | 20 | external |
| node:crypto | import | 21 | external |
| node:fs | import | 22 | external |

## Dependents

_No dependents._

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 12 | context | — | — | Wave 1 master integration regression tests. |
| 13 | owner | hq-agent | — | hq-agent |
| 14 | task | — | — | wave1-master-tests |
| 15 | invariant | — | — | No graph journal, KB write, semantic write, Host effect, browser or |
| 17 | see | — | hq/live-graph/wave1/master/README.md | hq/live-graph/wave1/master/README.md |

## Excerpt

```javascript
/**
 * Wave 1 master integration tests.
 *
 * These cover the master-owned cross-lane glue and the two repairs the master
 * integration had to make to Lane E's published Round 2 bridge:
 *   - a command status now reports the HQ action registry's OWN status instead of
 *     being flattened to 'declared', while runtime evidence stays unverified;
 *   - the published runner can now carry the real Rust compiler output into the
 *     assembler, so a source -> comment -> typed IR -> semantic -> command chain
 *     can actually exist in the graph.
 *
 * @hq:context Wave 1 master integration regression tests.
 * @hq:owner hq-agent
 * @hq:task wave1-master-tests
 * @hq:invariant No graph journal, KB write, semantic write, Host effect, browser or
 *   provider access. The bridge tests use only in-memory fixtures.
 * @hq:see hq/live-graph/wave1/master/README.md
 */
import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';

// hq/live-graph/ and the wave1-lane-e native bridge are not present in this
// checkout (no commit in any branch ever added them). Skipped loudly rather than
// failing the gate on absent artifacts; the tests stay for when the modules land.
const GRAPH_MODULE = '../live-graph/wave1/master/master-graph.mjs';
const BRIDGE_MODULE = '../../research/rust-knowledge-graph/integration/wave1-lane-e/round2/native-bridge.mjs';
const GRAPH_PRESENT = existsSync(new URL(GRAPH_MODULE, import.meta.url))
  && existsSync(new URL(BRIDGE_MODULE, import.meta.url));
const GRAPH_SKIP = GRAPH_PRESENT ? false
  : 'orphaned suite: hq/live-graph/wave1/master/master-graph.mjs and/or the wave1-lane-e native bridge are absent from this checkout';
const {
  buildScope, sourceManifestFor, actionSourceAnchor, verbSourceAnchor,
  attachSemanticIds, buildCompilerRegistry, SCOPE_SCHEMA, A_SCHEMA, C_SCHEMA, REGISTRY_SCHEMA,
} = GRAPH_PRESENT ? await import(GRAPH_MODULE) : {};
const { lowerNative, SCHEMAS } = GRAPH_PRESENT ? await import(BRIDGE_MODULE) : {};

const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
const HEAD = 'a'.repeat(40);

describe('Wave 1 master integration (hq/live-graph/wave1/master)', { skip: GRAPH_SKIP }, () => {

test('E scope refuses a repo-root or traversing prefix and keeps one logical project', () => {
  const base = { projectId: 'vivim', intentId: 'intent@1', intent: 'a long enough indexing intent', revision: 1 };
  assert.throws(() => buildScope({ ...base, roots: [{ id: 'root-a', repo: 'o/r', path: '.', commitSha: HEAD, sourceRootId: 'r' }] }), /BAD_SCOPE:path/);
  assert.throws(() => buildScope({ ...base, roots: [{ id: 'root-a', repo: 'o/r', path: 'a/../b', commitSha: HEAD, sourceRootId: 'r' }] }), /BAD_SCOPE:path/);
  assert.throws(() => buildScope({ ...base, roots: [{ id: 'root-a', repo: 'not-a-repo', path: 'hq', commitSha: HEAD, sourceRootId: 'r' }] }), /BAD_SCOPE:repo/);
  assert.throws(() => buildScope({ ...base, roots: [{ id: 'root-a', repo: 'o/r', path: 'hq', commitSha: 'zz', sourceRootId: 'r' }] }), /BAD_SCOPE:commitSha/);
  const scope = buildScope({ ...base, roots: [{ id: 'hq-code', repo: 'owenservera/repos-hq', path: 'hq', commitSha: HEAD, sourceRootId: 'repos-hq' }] });
  assert.equal(scope.schema, SCOPE_SCHEMA);
  assert.equal(scope.roots[0].sourceRootId, 'repos-hq');
});

test('the source manifest carries real byte digests for one root only', () => {
  const observations = {
    schema: A_SCHEMA,
    files: [
      { rootId: 'repos-hq', path: 'hq/lib/a.mjs', sourceHash: sha('a') },
      { rootId: 'tierflow', path: 'src/b.ts', sourceHash: sha('b') },
      { rootId: 'repos-hq', path: 'hq/lib/c.mjs', sourceHash: 'not-a-hash' },
    ],
  };
  const manifest = sourceManifestFor(observations, 'repos-hq');
  assert.equal(manifest.length, 1);
  assert.equal(manifest[0].path, 'hq/lib/a.mjs');
  assert.equal(manifest[0].sha256, sha('a'));
});

test('an action anchor is only produced when the declaration line is unique in its file', () => {
  const text = [
    "  {", "    name: 'index',", "    objects: [", "      { name: 'space', purpose: 'x' },",
    "      { name: 'file', purpose: 'y' },", "    ],", "  },",
  ].join('\n');
  const splitForm = [
    "  {", "    name: 'index',", "    objects: Object.freeze([", "      Object.freeze({",
    "        name: 'space',", "        purpose: 'A working tree HQ walks under git-aware ignore.',",
    "      }),", "    ]),", "  },",
  ].join('\n');
  assert.equal(actionSourceAnchor({ text: splitForm, domain: 'index', object: 'space' }).line, 5);
```

_First 80 of 204 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
