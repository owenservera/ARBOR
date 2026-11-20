# File: hq/test/annotation-v2.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/test/annotation-v2.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 16465 B |
| Lines | 396 |
| Hash | 46a20aa04246 |
| Test | yes |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| REGISTRY | const | 18 | no | const REGISTRY = { |
| OPTIONS | const | 28 | no | const OPTIONS = { |
| codes | function | 37 | no | const codes = (result) =&gt; result.records.map((r) =&gt; `${r.line}\|${r.kind}\|${r.value}`); |
| findings | function | 38 | no | const findings = (result) =&gt; result.diagnostics.map((d) =&gt; `${d.line}\|${d.code}\|${d.value}`); |
| source | const | 53 | no | const source = [ |
| result | const | 64 | no | const result = parseAnnotationV2(source, OPTIONS); |
| bare | const | 92 | no | const bare = parseAnnotationV2(&#39;// @hq:effect host:config-write&#39;, { registry: REGISTRY }); |
| source | const | 108 | no | const source = [ |
| result | const | 122 | no | const result = parseAnnotationV2(source, OPTIONS); |
| result | const | 128 | no | const result = parseAnnotationV2(&#39;// @hq:wat something arbitrary&#39;, OPTIONS); |
| source | const | 138 | no | const source = [ |
| result | const | 144 | no | const result = parseAnnotationV2(source, OPTIONS); |
| source | const | 150 | no | const source = [ |
| result | const | 157 | no | const result = parseAnnotationV2(source, OPTIONS); |
| result | const | 163 | no | const result = parseAnnotationV2(&#39;const re = /@hq:type billing.charge@1/;&#39;, OPTIONS); |
| source | const | 169 | no | const source = [ |
| result | const | 174 | no | const result = parseAnnotationV2(source, OPTIONS); |
| result | const | 184 | no | const result = parseAnnotationV2(&#39;// @hq:type billing.unknown@1&#39;, OPTIONS); |
| result | const | 192 | no | const result = parseAnnotationV2(&#39;// @hq:capability billing.retry@1&#39;); |
| result | const | 198 | no | const result = parseAnnotationV2(&#39;// @hq:action billing.retry@1&#39;, { registry: {} }); |
| exploding | const | 204 | no | const exploding = { lookup() { throw new Error(&#39;registry offline&#39;); } }; |
| result | const | 205 | no | const result = parseAnnotationV2(&#39;// @hq:type billing.charge@1&#39;, { registry: exploding }); |
| source | const | 211 | no | const source = [ |
| result | const | 217 | no | const result = parseAnnotationV2(source, OPTIONS); |
| source | const | 232 | no | const source = [ |
| result | const | 241 | no | const result = parseAnnotationV2(source, OPTIONS); |
| source | const | 262 | no | const source = [ |
| result | const | 270 | no | const result = parseAnnotationV2(source, OPTIONS); |
| result | const | 285 | no | const result = parseAnnotationV2(&#39;// @hq:type billing.charge@1.2&#39;, OPTIONS); |
| result | const | 296 | no | const result = parseAnnotationV2(&#39;// @hq:type billing.charge@1 @hq:type billing.charge@1&#39;, OPTIONS); |
| source | const | 303 | no | const source = [&#39;// @hq:type billing.charge@1&#39;, &#39;// @hq:type billing.charge@1&#39;].join(&#39;\\n&#39;); |
| result | const | 304 | no | const result = parseAnnotationV2(source, OPTIONS); |
| source | const | 314 | no | const source = [ |
| result | const | 321 | no | const result = parseAnnotationV2(source, OPTIONS); |
| source | const | 337 | no | const source = &#39;// @hq:effect Bad-Class @hq:type billing.unknown@1 @hq:type a.b@1&#39;; |
| result | const | 338 | no | const result = parseAnnotationV2(source, { registry: { lookup: (id) =&gt; (id === &#39;a.b@1&#39; ? { id, status: &#39;current&#39; } : null) } }); |
| result | const | 351 | no | const result = parseAnnotationV2(input); |
| noOptions | const | 358 | no | const noOptions = parseAnnotationV2(&#39;// @hq:type billing.charge@1&#39;, null); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| node:assert/strict | import | 3 | external |
| ../lib/annotation-v2.mjs | import | 4 | [hq/lib/annotation-v2.mjs](../lib/annotation-v2.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/test/annotation-v2.test.mjs — additive v2 annotation grammar: records, diagnostics, comment scope.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANNOTATION_V2_SCHEMA,
  SOURCE_LINK_SCHEMA,
  ANNOTATION_V2_TAGS,
  parseAnnotationV2,
  isVersionedId,
  isEffectClass,
  isEvidenceRef,
} from '../lib/annotation-v2.mjs';

// ---------------------------------------------------------------------------
// Fixture: one small registry with a current, a deprecated and a proposed ref.
// ---------------------------------------------------------------------------

const REGISTRY = {
  lookup(id) {
    if (id === 'billing.charge@1') return { id, status: 'current', kind: 'type' };
    if (id === 'billing.retry@1') return { id, status: 'current', kind: 'capability' };
    if (id === 'billing.proposal@1') return { id, status: 'proposed', kind: 'type' };
    if (id === 'legacy.refund@1') return { id, status: 'deprecated', kind: 'type' };
    return null;
  },
};

const OPTIONS = {
  projectId: 'demo',
  path: 'src/billing/retry.mjs',
  contentHash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  symbolId: 'retryCharge',
  schemaVersion: '2.1',
  registry: REGISTRY,
};

const codes = (result) => result.records.map((r) => `${r.line}|${r.kind}|${r.value}`);
const findings = (result) => result.diagnostics.map((d) => `${d.line}|${d.code}|${d.value}`);

// ---------------------------------------------------------------------------
// 1. Contract surface
// ---------------------------------------------------------------------------

test('module exports the v2 contract surface', () => {
  assert.equal(ANNOTATION_V2_SCHEMA, 'hq.annotation/2');
  assert.equal(SOURCE_LINK_SCHEMA, 'hq.source-link/1');
  assert.deepEqual(ANNOTATION_V2_TAGS, [
    'type', 'capability', 'effect', 'evidence', 'contract', 'emits', 'consumes', 'action', 'test',
  ]);
});

test('a v2 comment block yields ordered records with provenance', () => {
  const source = [
    '/**',
    ' * @hq:context Billing retry boundary.',
    ' * @hq:type billing.charge@1',
    ' * @hq:capability billing.retry@1',
    ' * @hq:effect host:config-write',
    ' * @hq:evidence test:tests/billing.retry.test.mjs',
    ' */',
    'export function retryCharge() {}',
  ].join('\n');

  const result = parseAnnotationV2(source, OPTIONS);

  assert.equal(result.schema, 'hq.annotation/2');
  assert.equal(result.sourceLinkSchema, 'hq.source-link/1');
  assert.deepEqual(codes(result), [
    '3|type|billing.charge@1',
    '4|capability|billing.retry@1',
    '5|effect|host:config-write',
    '6|evidence|test:tests/billing.retry.test.mjs',
  ]);
  assert.deepEqual(result.diagnostics, []);

  assert.deepEqual(result.records[0], {
    kind: 'type',
    value: 'billing.charge@1',
    projectId: 'demo',
    path: 'src/billing/retry.mjs',
```

_First 80 of 397 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
