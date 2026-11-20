# File: packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-a-schema.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 11280 B |
| Lines | 169 |
| Hash | ee7ffe65be4a |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| action | const | 10 | no | const action = { id: &#39;fixture.preview&#39;, version: 2 } as const; |
| pin | const | 11 | no | const pin = { id: &#39;bind.note&#39;, version: 3, nodeId: &#39;panel&#39;, knowledgeRef: &#39;kb.note&#39;, provenanceRef: &#39;source.opaque&#39; } as const; |
| opts | const | 12 | no | const opts = { expectedRevision: 4, knownActions: [action], knownBindings: [pin] } as const; |
| fixture | function | 13 | no | function fixture(): Record&lt;string, any&gt; { |
| success | function | 29 | no | function success(value = fixture(), options: Wave3SemanticsOptions = opts) { |
| result | const | 30 | no | const result = projectWave3ActionSemantics(value, options); |
| refused | function | 35 | no | function refused(patch: (d: Record&lt;string, any&gt;) =&gt; void, code: string, options: Wave3SemanticsOptions = opts, validationCode?: string) { |
| value | const | 36 | no | const value = fixture(); patch(value); |
| result | const | 37 | no | const result = projectWave3ActionSemantics(value, options); |
| v | const | 46 | no | const v = success(); |
| act | const | 50 | no | const act = v.references.find(r =&gt; r.kind === &#39;action&#39;)!; |
| binding | const | 51 | no | const binding = v.references.find(r =&gt; r.kind === &#39;binding&#39;)!; |
| nativeB | const | 73 | no | const nativeB = inspectComponent({ id: v.componentRefs[2]!.id, type: &#39;button&#39;, props: { label: &#39;Preview&#39; }, children: [], actionRefs: v.componentRefs[2]!.actionRefs }); |
| render | const | 84 | no | const render = renderUiDocument(v.rendererDocument, { viewportPx: width }); |
| first | const | 100 | no | const first = success(); |
| reordered | const | 101 | no | const reordered = fixture(); [reordered.nodes[1], reordered.nodes[2]] = [reordered.nodes[2], reordered.nodes[1]]; |
| second | const | 102 | no | const second = success(reordered); |
| updated | const | 106 | no | const updated = fixture(); updated.revision = 5; |
| later | const | 107 | no | const later = success(updated, { ...opts, expectedRevision: 5 }); |
| d | const | 149 | no | const d = fixture(); d.nodes[2].actionRefs.push({ id: &#39;fixture.extra&#39;, version: 1 }); |
| r | const | 150 | no | const r = projectWave3ActionSemantics(d, { ...opts, knownActions: [...opts.knownActions, { id:&#39;fixture.extra&#39;, version:1 }] }); |
| input | const | 156 | no | const input = fixture(); const copy = JSON.stringify(input); |
| doc | const | 162 | no | const doc = fixture(); doc.nodes[1].props.loop = doc.nodes[1]; |
| count | variable | 164 | no | let count = 0; |
| hostile | const | 165 | no | const hostile = fixture(); |
| r | const | 167 | no | const r = projectWave3ActionSemantics(hostile, opts); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/document/schema.ts | import | 3 | [packages/tierflow/src/visual-runtime/document/schema.ts](../../src/visual-runtime/document/schema.ts.md) |
| ../../src/visual-runtime/document/validate.ts | import | 4 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../src/visual-runtime/document/validate.ts.md) |
| ../../src/visual-runtime/components/catalog.ts | import | 5 | [packages/tierflow/src/visual-runtime/components/catalog.ts](../../src/visual-runtime/components/catalog.ts.md) |
| ../../src/visual-runtime/render/dom.ts | import | 6 | [packages/tierflow/src/visual-runtime/render/dom.ts](../../src/visual-runtime/render/dom.ts.md) |
| ../../src/visual-runtime/document/wave3-action-semantics.ts | import | 7 | [packages/tierflow/src/visual-runtime/document/wave3-action-semantics.ts](../../src/visual-runtime/document/wave3-action-semantics.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_DOCUMENT_SCHEMA } from '../../src/visual-runtime/document/schema.ts';
import { validateUiDocument } from '../../src/visual-runtime/document/validate.ts';
import { inspectComponent } from '../../src/visual-runtime/components/catalog.ts';
import { renderUiDocument } from '../../src/visual-runtime/render/dom.ts';
import { projectWave3ActionSemantics, resolveWave3Reference, restoreWave3NodeReferences,
  WAVE3_ACTION_SEMANTICS_SCHEMA, type Wave3SemanticsOptions } from '../../src/visual-runtime/document/wave3-action-semantics.ts';

const action = { id: 'fixture.preview', version: 2 } as const;
const pin = { id: 'bind.note', version: 3, nodeId: 'panel', knowledgeRef: 'kb.note', provenanceRef: 'source.opaque' } as const;
const opts = { expectedRevision: 4, knownActions: [action], knownBindings: [pin] } as const;
function fixture(): Record<string, any> {
  return {
    schema: UI_DOCUMENT_SCHEMA, documentId: 'doc.founder', scope: { ownerRef: 'owner:a', workspaceRef: 'world:a' },
    revision: 4, rootId: 'root', nodes: [
      { id: 'root', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children: ['panel','button:preview'],
        a11y: { role: 'main', name: 'Founder Workspace' } },
      { id: 'panel', type: 'card', props: { title: 'Today', description: 'Source-backed note' }, children: [],
        a11y: { role: 'region', name: 'Today' }, bindingRefs: ['bind.note'] },
      { id: 'button:preview', type: 'button', props: { label: 'Preview' }, children: [],
        a11y: { role: 'button', name: 'Preview', focusOrder: 1 }, actionRefs: [{ ...action }] },
    ],
    bindings: [{ ...pin, field: 'title', readScope: 'owner', availability: 'present' }],
    views: [{ id: 'phone', kind: '2d', version: 1, viewport: 'phone' },
      { id: 'desktop', kind: '2d', version: 1, viewport: 'desktop' }],
  };
}
function success(value = fixture(), options: Wave3SemanticsOptions = opts) {
  const result = projectWave3ActionSemantics(value, options);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw Error('expected success');
  return result.value;
}
function refused(patch: (d: Record<string, any>) => void, code: string, options: Wave3SemanticsOptions = opts, validationCode?: string) {
  const value = fixture(); patch(value);
  const result = projectWave3ActionSemantics(value, options);
  assert.equal(result.ok, false, JSON.stringify(result));
  if (result.ok) throw Error('expected refusal');
  assert.equal(result.readOnly, true);
  assert.equal(result.code, code);
  if (validationCode !== undefined) assert.equal(result.validationCode, validationCode);
}

test('A/B/D retain versioned opaque action and binding identities; no execute authority', () => {
  const v = success();
  assert.equal(v.schema, WAVE3_ACTION_SEMANTICS_SCHEMA);
  assert.equal(v.readOnly, true); assert.equal(v.executable, false);
  assert.equal(v.references.length, 2);
  const act = v.references.find(r => r.kind === 'action')!;
  const binding = v.references.find(r => r.kind === 'binding')!;
  assert.equal(act.id, 'fixture.preview'); assert.equal(act.version, 2);
  assert.equal(binding.id, 'bind.note'); assert.equal(binding.version, 3);
  if (binding.kind === 'binding') {
    assert.equal(binding.provenanceRef, 'source.opaque');
    assert.equal(binding.knowledgeRef, 'kb.note');
    assert.equal(binding.readScope, 'owner');
  }
  assert.ok(/^a_[a-f0-9]{32}$/.test(act.alias));
  assert.ok(/^b_[a-f0-9]{32}$/.test(binding.alias));
  assert.notEqual(act.alias, act.id);
  assert.equal(Object.isFrozen(v), true);
  assert.equal(Object.isFrozen(v.references), true);
  assert.equal(Object.isFrozen(v.rendererDocument.nodes[2]), true);
  assert.equal(v.documentDigest.startsWith('sha256:'), true);
  assert.equal(v.fieldMap.every(x => x.reversible), true);
  assert.deepEqual(JSON.parse(JSON.stringify(restoreWave3NodeReferences(v, 'button:preview', 4))),
    { ok: true, actionRefs: [action], bindingRefs: [] });
  assert.deepEqual(restoreWave3NodeReferences(v, 'panel', 4),
    { ok: true, actionRefs: [], bindingRefs: ['bind.note'] });
  assert.deepEqual(resolveWave3Reference(v, act.alias, 4), { ok: true, reference: act });
  assert.deepEqual(resolveWave3Reference(v, binding.alias, 4), { ok: true, reference: binding });
  const nativeB = inspectComponent({ id: v.componentRefs[2]!.id, type: 'button', props: { label: 'Preview' },
    children: [], actionRefs: v.componentRefs[2]!.actionRefs });
  assert.equal(nativeB.ok, true, JSON.stringify(nativeB));
  assert.notEqual(v.componentRefs[2]!.canonicalNodeId, v.componentRefs[2]!.id);
  assert.deepEqual(v.componentRefs[0]!.children, [v.componentRefs[1]!.id,v.componentRefs[2]!.id]);
  assert.ok(validateUiDocument(v.canonical, { knownActions: opts.knownActions }).ok);
  assert.equal(v.canonical.nodes[1]?.type, 'card');
  assert.equal(v.canonical.nodes[1]?.props.description, 'Source-backed note');
```

_First 80 of 170 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
