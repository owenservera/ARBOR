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
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  buildScope, sourceManifestFor, actionSourceAnchor, verbSourceAnchor,
  attachSemanticIds, buildCompilerRegistry, SCOPE_SCHEMA, A_SCHEMA, C_SCHEMA, REGISTRY_SCHEMA,
} from '../live-graph/wave1/master/master-graph.mjs';
import { lowerNative, SCHEMAS } from '../../research/rust-knowledge-graph/integration/wave1-lane-e/round2/native-bridge.mjs';

const sha = text => createHash('sha256').update(text, 'utf8').digest('hex');
const HEAD = 'a'.repeat(40);

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
  const anchor = actionSourceAnchor({ text, domain: 'index', object: 'space' });
  assert.equal(anchor.line, 4);
  assert.equal(anchor.sha256, sha(text));
  const duplicated = text + "\n      { name: 'space', purpose: 'x' },";
  assert.equal(actionSourceAnchor({ text: duplicated, domain: 'index', object: 'space' }), null);
  assert.equal(actionSourceAnchor({ text, domain: 'missing', object: 'space' }), null);
});

test('a verb anchor is only produced when the verb line is unique', () => {
  const text = "  Object.freeze({\n    verb: 'show',\n    purpose: 'p',\n  }),";
  assert.equal(verbSourceAnchor({ text, verb: 'show' }).line, 2);
  assert.equal(verbSourceAnchor({ text: text + "\n    verb: 'show',", verb: 'show' }), null);
});

test('a semantic identity attaches only when BOTH halves of the action are proven', () => {
  const inventory = {
    schema: C_SCHEMA,
    records: [
      { id: 'hq.action:index.show.space', actionId: 'index.show.space', domain: 'index', object: 'space' },
      { id: 'hq.action:index.create.space', actionId: 'index.create.space', domain: 'index', object: 'space' },
      { id: 'hq.action:index.show.other', actionId: 'index.show.other', domain: 'index', object: 'other' },
    ],
  };
  // The object half: the domain table declaration. The verb half: the handler table.
  const objectAnchors = new Map([
    ['index.show.space', { path: 'hq/lib/actions/domains-3.mjs', line: 187, sha256: sha('file') }],
    ['index.create.space', { path: 'hq/lib/actions/domains-3.mjs', line: 187, sha256: sha('file') }],
    ['index.show.other', { path: 'hq/lib/actions/domains-3.mjs', line: 191, sha256: sha('file') }],
  ]);
  const definitionAnchors = new Map([
    ['index.show.space', { path: 'hq/lib/actions/handlers.mjs', line: 49, sha256: sha('handlers') }],
    ['index.create.space', { path: 'hq/lib/actions/handlers.mjs', line: 46, sha256: sha('handlers') }],
    ['index.show.other', { path: 'hq/lib/actions/handlers.mjs', line: 49, sha256: sha('handlers') }],
  ]);
  const links = [
    { semantic_id: 'index.show.space@1', path: 'hq/lib/actions/domains-3.mjs', line: 187, content_hash: sha('file') },
    { semantic_id: 'index.show.space@1', path: 'hq/lib/actions/handlers.mjs', line: 49, content_hash: sha('handlers') },
  ];
  const joined = attachSemanticIds({ inventory, semanticLinks: links, definitionAnchors, objectAnchors });
  assert.equal(joined.inventory.records.find(r => r.actionId === 'index.show.space').semanticId, 'index.show.space@1');
  // The same object under a DIFFERENT verb is a different action and must not
  // inherit the read-only identity.
  assert.equal(joined.inventory.records.find(r => r.actionId === 'index.create.space').semanticId, undefined);
  assert.equal(joined.inventory.records.find(r => r.actionId === 'index.show.other').semanticId, undefined);
  assert(joined.diagnostics.some(d => d.actionId === 'index.create.space' && d.reason === 'NO_CANONICAL_SEMANTIC_LINK'));

  const stale = attachSemanticIds({
    inventory, definitionAnchors, objectAnchors,
    semanticLinks: [{ semantic_id: 'index.show.space@1', path: 'hq/lib/actions/domains-3.mjs', line: 187, content_hash: sha('other') }],
  });
  assert.equal(stale.inventory.records.find(r => r.actionId === 'index.show.space').semanticId, undefined);

  const wrongLine = attachSemanticIds({
    inventory, definitionAnchors, objectAnchors,
    semanticLinks: [{ semantic_id: 'index.show.space@1', path: 'hq/lib/actions/domains-3.mjs', line: 999, content_hash: sha('file') }],
  });
  assert.equal(wrongLine.inventory.records.find(r => r.actionId === 'index.show.space').semanticId, undefined);

  // A link that proves only the OBJECT half is not enough.
  const oneHalf = attachSemanticIds({
    inventory, definitionAnchors, objectAnchors,
    semanticLinks: [{ semantic_id: 'index.show.space@1', path: 'hq/lib/actions/domains-3.mjs', line: 187, content_hash: sha('file') }],
  });
  assert.equal(oneHalf.inventory.records.find(r => r.actionId === 'index.show.space').semanticId, undefined);
});

test('the compiler registry admits only current, wired, read-only actions', () => {
  const inventory = {
    records: [
      { actionId: 'index.show.space', evidenceState: { registry: 'wired' }, effects: { mutates: false } },
      { actionId: 'index.create.space', evidenceState: { registry: 'wired' }, effects: { mutates: true } },
      { actionId: 'index.list.space', evidenceState: { registry: 'declared' }, effects: { mutates: false } },
    ],
  };
  const semanticRows = [
    { id: 'index.show.space@1', kind: 'action', status: 'current' },
    { id: 'index.create.space@1', kind: 'action', status: 'current' },
    { id: 'index.list.space@1', kind: 'action', status: 'current' },
    { id: 'index.draft.space@1', kind: 'action', status: 'proposed' },
    { id: 'owner-read@1', kind: 'contract', status: 'current' },
    { id: 'other.type@1', kind: 'type', status: 'current' },
  ];
  const { manifest, rejected } = buildCompilerRegistry({ semanticRows, inventory });
  assert.equal(manifest.schema, REGISTRY_SCHEMA);
  assert.deepEqual(manifest.actions, [{ id: 'index.show.space@1', status: 'active', effect: 'read' }]);
  assert.deepEqual(manifest.scopes, [{ id: 'owner-read@1', status: 'active' }]);
  assert(rejected.some(r => r.id === 'index.create.space@1' && r.reason === 'ACTION_NOT_READ_ONLY'));
  assert(rejected.some(r => r.id === 'index.list.space@1' && r.reason === 'ACTION_NOT_WIRED'));
  assert(rejected.some(r => r.id === 'index.draft.space@1' && r.reason === 'NOT_CURRENT'));
  assert(rejected.some(r => r.id === 'other.type@1' && r.reason === 'KIND_NOT_ADMITTED'));
});

test('bridge repair: a command reports the registry status and never a runtime proof', () => {
  const text = 'export const status = 1;\n';
  const SHA = sha(text);
  const scope = { schema: SCHEMAS.scope, projectId: 'vivim', intentId: 'vivim@1', intent: 'an intent long enough to pass', revision: 1, roots: [{ id: 'hq', sourceRootId: 'repos-hq', repo: 'owenservera/repos-hq', path: 'hq', commitSha: HEAD }] };
  const a = { schema: SCHEMAS.a, project: { id: 'vivim', intentRevision: 1, purpose: 'p' }, roots: [{ id: 'repos-hq', headSha: HEAD }], files: [{ id: 'f1', projectId: 'vivim', rootId: 'repos-hq', path: 'hq/lib/s.mjs', sourceHash: SHA, headSha: HEAD }], symbols: [], imports: [], annotations: [] };
  const b = { schema: SCHEMAS.b, project: { id: 1, name: 'vivim', root: 'repos-hq', revision: HEAD }, records: [], links: [], unknowns: [] };
  const command = (registry, runtime) => ({
    kind: 'operation', id: 'hq.action:index.show.space', projectId: 'vivim', actionId: 'index.show.space',
    purpose: 'show the space', semanticId: null,
    evidenceState: { registry, handlerSource: 'DISPATCH_SOURCE_PRESENT', runtime, device: 'UNTESTED' },
    effects: { risk: 'low', mutates: false }, authority: { effectOwner: 'source_native' },
    handler: { declaredSyntax: 'hq search "<object>"', dispatch: { command: 'search', source: { path: 'hq/lib/s.mjs', sha256: SHA } }, executableVerified: false },
    provenance: { registry: { path: 'hq/lib/s.mjs', sha256: SHA } },
  });
  const c = (registry, runtime) => ({ schema: SCHEMAS.c, projectId: 'vivim', sourceFiles: [{ path: 'hq/lib/s.mjs', sha256: SHA }], records: [command(registry, runtime)], cli: [] });

  const wired = lowerNative({ scope, a, b: { ...b, records: [{ id: 'semantic:x@1', type: 'semantic_id', label: 'x', state: 'current', authority: 'hq', revision: '1', writer: 'w', source: { id: 'x@1', kind: 'action' } }], links: [{ from: 'semantic:x@1', to: 'source:repos-hq:' + encodeURIComponent('hq/lib/s.mjs'), relation: 'source_anchor', evidence: { path: 'hq/lib/s.mjs', sha256: SHA, line: 1 } }] }, c: c('wired', 'UNTESTED') });
  const node = wired.feeds[2].nodes.find(n => n.kind === 'command');
  assert.equal(node.metadata.status, 'wired');
  assert.equal(node.metadata.registry_status, 'wired');
  assert.equal(node.metadata.runtime_status, 'UNTESTED');
  assert.equal(node.metadata.runtime_verified, false);
  assert.equal(node.metadata.runtime_status_source, 'producer_claim');

  const declared = lowerNative({ scope, a, b: { ...b, records: [{ id: 'semantic:x@1', type: 'semantic_id', label: 'x', state: 'current', authority: 'hq', revision: '1', writer: 'w', source: { id: 'x@1', kind: 'action' } }], links: [{ from: 'semantic:x@1', to: 'source:repos-hq:' + encodeURIComponent('hq/lib/s.mjs'), relation: 'source_anchor', evidence: { path: 'hq/lib/s.mjs', sha256: SHA, line: 1 } }] }, c: c('declared', 'VERIFIED') });
  const declaredNode = declared.feeds[2].nodes.find(n => n.kind === 'command');
  assert.equal(declaredNode.metadata.status, 'declared');
  assert.equal(declaredNode.metadata.runtime_verified, false);
});
