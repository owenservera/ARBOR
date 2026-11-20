# File: packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts

> Generated 2026-11-19 · TypeScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../projects/arbor.md) |
| Path | packages/tierflow/tests/visual-runtime/wave3-b-components.test.ts |
| Language | TypeScript |
| Kind | source |
| Size | 12134 B |
| Lines | 187 |
| Hash | 77bc9f026832 |
| Test | yes |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ACTIONS | const | 7 | no | const ACTIONS = [{ id: &#39;fixture.preview&#39;, version: 1 }] as const; |
| fixture | function | 8 | no | function fixture(): Record&lt;string, any&gt; { |
| checked | function | 32 | no | function checked(source: unknown) { return mapCanonicalComponents(source, { knownActions: ACTIONS }); } |
| unavailable | function | 33 | no | function unavailable(source: unknown, code: string) { |
| r | const | 34 | no | const r = checked(source); |
| original | const | 40 | no | const original = fixture(); |
| direct | const | 43 | no | const direct = inspectComponent({ id: &#39;card&#39;, type: &#39;card&#39;, props: original.nodes[2].props }); |
| mapped | const | 46 | no | const mapped = checked(original); |
| f | const | 57 | no | const f = fixture(); f.nodes[2].props.description = &#39;X&#39;.repeat(240); |
| r | const | 58 | no | const r = checked(f); assert.equal(r.ok, true, JSON.stringify(r)); |
| x | const | 63 | no | const x = checked(fixture()); const y = checked(fixture()); |
| grid | const | 67 | no | const grid = x.value.sourceRefs.find(n =&gt; n.sourceId === &#39;grid:cards&#39; &amp;&amp; !n.synthesized)!; |
| r | const | 77 | no | const r = checked(fixture()); assert.equal(r.ok, true); |
| root | const | 79 | no | const root = r.value.sourceRefs.find(x =&gt; x.sourceId === &#39;root:main&#39;)!; |
| a | const | 93 | no | const a = fixture(), b = fixture(); b.nodes.reverse(); |
| left | const | 94 | no | const left = checked(a), right = checked(b); |
| f | const | 109 | no | const f = fixture(); f.nodes[2].type = kind; f.nodes[2].props = props; |
| r | const | 110 | no | const r = checked(f); assert.equal(r.ok, true, `${kind}: ${JSON.stringify(r)}`); |
| c | const | 112 | no | const c = r.value.sourceRefs.find(n =&gt; n.sourceId === &#39;card:today&#39; &amp;&amp; !n.synthesized)!; |
| unknown | const | 120 | no | const unknown = fixture(); unknown.nodes[2].type = &#39;iframe&#39;; unavailable(unknown, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| changed | const | 121 | no | const changed = fixture(); changed.nodes[4].actionRefs[0].version = 2; unavailable(changed, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| unversioned | const | 122 | no | const unversioned = fixture(); delete unversioned.nodes[4].actionRefs[0].version; unavailable(unversioned, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| missing | const | 123 | no | const missing = fixture(); missing.nodes[4].actionRefs = []; unavailable(missing, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| other | const | 124 | no | const other = fixture(); other.nodes[4].actionRefs = [{ id: &#39;unknown&#39;, version: 1 }]; unavailable(other, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| f | const | 129 | no | const f = fixture(); f.nodes[4].props[key as string] = value; |
| f | const | 133 | no | const f = fixture(); f.nodes[2].props.description = text; unavailable(f, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| invisible | const | 135 | no | const invisible = fixture(); invisible.nodes[4].a11y.name = &#39; &#39;; unavailable(invisible, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| unnamed | const | 139 | no | const unnamed = fixture(); delete unnamed.nodes[4].a11y.name; unavailable(unnamed, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| hidden | const | 140 | no | const hidden = fixture(); delete hidden.nodes[4].a11y.focusOrder; unavailable(hidden, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| target | const | 141 | no | const target = fixture(); target.nodes[4].a11y.touchTargetPx = 20; unavailable(target, &#39;INVALID_CANONICAL_DOCUMENT&#39;); |
| live | const | 142 | no | const live = fixture(); live.nodes[3].a11y.live = &#39;polite&#39;; unavailable(live, &#39;INVALID_A11Y&#39;); |
| horizontal | const | 146 | no | const horizontal = fixture(); horizontal.nodes[0].props.direction = &#39;horizontal&#39;; unavailable(horizontal, &#39;INVALID_LAYOUT&#39;); |
| wide | const | 147 | no | const wide = fixture(); wide.nodes[1].layout = { minWidth: 500 }; unavailable(wide, &#39;INVALID_LAYOUT&#39;); |
| zeroWidth | const | 148 | no | const zeroWidth = fixture(); zeroWidth.nodes[1].layout = { maxWidth: 0 }; unavailable(zeroWidth, &#39;INVALID_LAYOUT&#39;); |
| f | const | 152 | no | const f = fixture(); f.nodes[0].children.unshift(&#39;button:prior&#39;); |
| f | const | 159 | no | const f = fixture(); f.nodes[4].actionRefs.push({ id: &#39;fixture.secondary&#39;, version: 1 }); |
| r | const | 160 | no | const r = mapCanonicalComponents(f, { knownActions: [...ACTIONS, { id: &#39;fixture.secondary&#39;, version: 1 }] }); |
| f | const | 166 | no | const f = fixture(); f.nodes[2].type = &#39;collection&#39;; |
| id | const | 170 | no | const id = `more:${i}`; |
| invoked | variable | 178 | no | let invoked = 0; |
| getter | const | 179 | no | const getter = fixture(); Object.defineProperty(getter.nodes[2].props, &#39;title&#39;, { enumerable:true, get() {invoked++; throw Error(&#39;must not execute&#39;);} }); |
| pollution | const | 183 | no | const pollution = fixture(); Object.defineProperty(pollution.nodes[2].props, &#39;__proto__&#39;, {enumerable:true,value:{isAdmin:true}}); |
| original | const | 185 | no | const original = fixture(), snapshot = JSON.stringify(original); checked(original); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/visual-runtime/components/wave3-canonical-map.ts | import | 3 | [packages/tierflow/src/visual-runtime/components/wave3-canonical-map.ts](../../src/visual-runtime/components/wave3-canonical-map.ts.md) |
| ../../src/visual-runtime/document/validate.ts | import | 4 | [packages/tierflow/src/visual-runtime/document/validate.ts](../../src/visual-runtime/document/validate.ts.md) |
| ../../src/visual-runtime/components/catalog.ts | import | 5 | [packages/tierflow/src/visual-runtime/components/catalog.ts](../../src/visual-runtime/components/catalog.ts.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```typescript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapCanonicalComponents, CANONICAL_COMPONENT_MAP_VERSION } from '../../src/visual-runtime/components/wave3-canonical-map.ts';
import { validateUiDocument } from '../../src/visual-runtime/document/validate.ts';
import { inspectComponent } from '../../src/visual-runtime/components/catalog.ts';

const ACTIONS = [{ id: 'fixture.preview', version: 1 }] as const;
function fixture(): Record<string, any> {
  return {
    schema: 'vivim.ui-document/1', documentId: 'document:founder', revision: 3,
    scope: { ownerRef: 'owner:fixture', workspaceRef: 'world:founder' }, rootId: 'root:main',
    nodes: [
      { id: 'root:main', type: 'stack', props: { direction: 'vertical', gap: 'md' }, children: ['grid:cards', 'action:preview'],
        a11y: { role: 'main', name: 'Founder Workspace' },
        layout: { phone: { maxWidth: 360 }, desktop: { maxWidth: 1280 } } },
      { id: 'grid:cards', type: 'grid', props: { columns: 4, gap: 'sm' }, children: ['card:today', 'text:evidence'],
        a11y: { role: 'group', name: 'Evidence overview' } },
      { id: 'card:today', type: 'card', props: { title: 'Today', description: 'Three updates pending review' }, children: [],
        a11y: { role: 'region', name: 'Today summary' }, bindingRefs: ['binding:today'] },
      { id: 'text:evidence', type: 'text', props: { value: 'Cited evidence', variant: 'body' }, children: [],
        a11y: { role: 'text', name: 'Cited evidence' } },
      { id: 'action:preview', type: 'button', props: { label: 'Preview changes' }, children: [],
        a11y: { role: 'button', name: 'Preview changes', focusOrder: 1 },
        actionRefs: [{ id: 'fixture.preview', version: 1 }] },
    ],
    bindings: [{ id: 'binding:today', version: 2, nodeId: 'card:today', field: 'summary',
      knowledgeRef: 'kb:sensitive-internal', provenanceRef: 'provenance:sensitive-internal',
      readScope: 'owner', availability: 'stale' }],
    views: [{ id: 'phone:2d', version: 1, kind: '2d', viewport: 'phone' }, { id: 'desktop:2d', version: 1, kind: '2d', viewport: 'desktop' }],
  };
}
function checked(source: unknown) { return mapCanonicalComponents(source, { knownActions: ACTIONS }); }
function unavailable(source: unknown, code: string) {
  const r = checked(source);
  assert.equal(r.ok, false, JSON.stringify(r));
  if (!r.ok) { assert.equal(r.code, code); assert.equal(r.unavailable, true); }
}

test('A -> B resolves measured description UNSAFE_PROP without expanding old catalog', () => {
  const original = fixture();
  assert.equal(validateUiDocument(original, { knownActions: ACTIONS }).ok, true);
  // Demonstrate that the legacy catalog really refuses the old A props verbatim.
  const direct = inspectComponent({ id: 'card', type: 'card', props: original.nodes[2].props });
  assert.equal(direct.ok, false);
  if (!direct.ok) assert.equal(direct.code, 'UNSAFE_PROP');
  const mapped = checked(original);
  assert.equal(mapped.ok, true, JSON.stringify(mapped));
  if (!mapped.ok) return;
  assert.equal(mapped.value.schema, CANONICAL_COMPONENT_MAP_VERSION);
  assert.equal(mapped.value.components.length, 6); // A's five + inert description paragraph
  assert.equal(mapped.value.components.find(n => n.id === 's_0')?.props.text, 'Three updates pending review');
  assert.equal(mapped.value.authority, 'inert-display-only');
  assert.ok(mapped.value.components.every(c => c.a11y.role.length > 0));
});

test('full-length valid Lane A description maps without artificial B accessible-name truncation', () => {
  const f = fixture(); f.nodes[2].props.description = 'X'.repeat(240);
  const r = checked(f); assert.equal(r.ok, true, JSON.stringify(r));
  if (r.ok) assert.equal(r.value.components.find(c => c.id === 's_0')?.props.text, f.nodes[2].props.description);
});

test('320/360/1280 have deterministic, overflow-free stack/grid plans and reduced motion', () => {
  const x = checked(fixture()); const y = checked(fixture());
  assert.deepEqual(x, y); assert.equal(x.ok, true);
  if (!x.ok) return;
  assert.deepEqual(x.value.viewports.map(v => v.viewportPx), [320, 360, 1280]);
  const grid = x.value.sourceRefs.find(n => n.sourceId === 'grid:cards' && !n.synthesized)!;
  assert.deepEqual(x.value.viewports.map(v => v.nodes.find(n => n.id === grid.id)!.resolved.columns), [1, 2, 2]);
  for (const viewport of x.value.viewports) for (const {resolved} of viewport.nodes) {
    assert.ok(resolved.widthPx <= viewport.viewportPx);
    assert.ok(resolved.itemWidthPx >= 44);
    assert.equal(resolved.motion, 'none');
  }
});

test('semantic provenance and exact action versions survive through inert crosswalk only', () => {
  const r = checked(fixture()); assert.equal(r.ok, true);
  if (!r.ok) return;
  const root = r.value.sourceRefs.find(x => x.sourceId === 'root:main')!;
  assert.equal(root.canonicalA11y.role, 'main');
```

_First 80 of 188 lines._

---

[HQ wiki](../../../../../../index.md) · [Symbols](../../../../../../symbols.md) · [Dependency graph](../../../../../../graph.md) · [Documentation](../../../../../../docs.md) · [Changes](../../../../../../changes.md) · [Open tasks](../../../../../../todos.md) · [Deprecated](../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../protocol.md) · [Glossary](../../../../../../glossary.md) · [Using HQ](../../../../../../context.md) · [Capabilities](../../../../../../capabilities.md) · [Search index](../../../../../../search.json) · [Browser view](../../../../../../index.html)
