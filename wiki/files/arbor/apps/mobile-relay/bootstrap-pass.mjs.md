# File: apps/mobile-relay/bootstrap-pass.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/bootstrap-pass.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 8351 B |
| Lines | 141 |
| Hash | e6ec1f9fc199 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PASS_SCHEMA | const | 5 | yes | export const PASS_SCHEMA = &#39;vivim.bootstrap-output/1&#39;; |
| DEEP_PASSES | const | 6 | yes | export const DEEP_PASSES = Object.freeze([&#39;D03&#39;, &#39;D04&#39;, &#39;D05&#39;, &#39;D06&#39;, &#39;D07&#39;]); |
| CONTROL | const | 7 | no | const CONTROL = /[\\u0000-\\u001f\\u007f]/; |
| URLISH | const | 8 | no | const URLISH = /(?:https?:\\/\\/\|www\\.\|javascript:\|data:text\\/html\|&lt;script\|&lt;\\/\|;\\s*drop\\s+table)/i; |
| ID | const | 9 | no | const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/; |
| FIELD_NAME | const | 10 | no | const FIELD_NAME = /^[a-z][a-z0-9_]{1,31}$/; |
| MAX_OBS | const | 11 | no | const MAX_OBS = 12, MAX_ASSERT = 12, MAX_UNKNOWNS = 8, MAX_VIEWS = 3, MAX_SCHEMAS = 2, MAX_AREAS = 12; |
| BASIS | const | 12 | no | const BASIS = [&#39;explicitly_stated&#39;, &#39;provider_memory_report&#39;, &#39;tentative_inference&#39;]; |
| FRESHNESS | const | 13 | no | const FRESHNESS = [&#39;current&#39;, &#39;historical&#39;, &#39;unknown&#39;]; |
| COVERAGE | const | 14 | no | const COVERAGE = [&#39;covered&#39;, &#39;partial&#39;, &#39;unknown&#39;]; |
| FIELD_TYPES | const | 15 | no | const FIELD_TYPES = [&#39;text&#39;, &#39;number&#39;, &#39;date&#39;, &#39;boolean&#39;, &#39;enum&#39;, &#39;reference&#39;]; |
| VIEW_KINDS | const | 16 | no | const VIEW_KINDS = [&#39;card&#39;, &#39;collection&#39;, &#39;timeline&#39;, &#39;mode&#39;]; |
| PASS_CONTRACT | const | 19 | yes | export const PASS_CONTRACT = Object.freeze({ D03: { sections: [&#39;interest&#39;, &#39;taste&#39;, &#39;hobby&#39;], categories: [&#39;interest&#39;, &#39;taste&#39;, &#39;hobby&#39;] }, D04: { sections: [&#39;role&#39;, &#39;project&#39;, &#39;goal&#39;, &#39;responsibilit… |
| fail | function | 27 | no | function fail(reason) { throw new TypeError(&#39;Invalid bootstrap pass output: &#39; + reason); } |
| object | function | 28 | no | function object(value, allowed, name) { |
| bounded | function | 33 | no | function bounded(value, max, name) { |
| text | function | 37 | no | function text(value, limit, name) { |
| v | const | 39 | no | const v = value.trim(); |
| ratio | function | 45 | no | function ratio(value, name) { |
| parseBootstrapPass | function | 50 | yes | export function parseBootstrapPass(source) { |
| raw | variable | 51 | no | let raw = source; |
| contract | const | 60 | no | const contract = PASS_CONTRACT[raw.passId]; |
| observations | const | 62 | no | const observations = bounded(raw.observations ?? [], MAX_OBS, &#39;observations&#39;).map((o, i) =&gt; { object(o, [&#39;category&#39;, &#39;text&#39;, &#39;confidence&#39;, &#39;sensitive&#39;], &#39;observations[&#39; + i + &#39;]&#39;); if (!contract.cate… |
| assertions | const | 73 | no | const assertions = bounded(raw.assertions ?? [], MAX_ASSERT, &#39;assertions&#39;).map((a, i) =&gt; { object(a, [&#39;section&#39;, &#39;label&#39;, &#39;value&#39;, &#39;basis&#39;, &#39;confidence&#39;, &#39;scope&#39;, &#39;freshness&#39;], &#39;assertions[&#39; + i + &#39;]… |
| scope | const | 78 | no | const scope = a.scope ?? &#39;unknown&#39;; |
| unknowns | const | 87 | no | const unknowns = bounded(raw.unknowns ?? [], MAX_UNKNOWNS, &#39;unknowns&#39;).map((u, i) =&gt; text(u, 140, &#39;unknowns[&#39; + i + &#39;]&#39;)); |
| viewProposals | const | 89 | no | const viewProposals = bounded(raw.viewProposals ?? [], MAX_VIEWS, &#39;viewProposals&#39;).map((v, i) =&gt; { object(v, [&#39;kind&#39;, &#39;title&#39;, &#39;reason&#39;], &#39;viewProposals[&#39; + i + &#39;]&#39;); if (!VIEW_KINDS.includes(v.kind)… |
| schemaProposals | const | 95 | no | const schemaProposals = bounded(raw.schemaProposals ?? [], MAX_SCHEMAS, &#39;schemaProposals&#39;).map((s, i) =&gt; { object(s, [&#39;type&#39;, &#39;fields&#39;, &#39;reason&#39;], &#39;schemaProposals[&#39; + i + &#39;]&#39;); if (typeof s.type !==… |
| fields | const | 98 | no | const fields = bounded(s.fields, 8, &#39;schema fields&#39;).map((f, j) =&gt; { object(f, [&#39;name&#39;, &#39;type&#39;], &#39;schema field[&#39; + j + &#39;]&#39;); if (typeof f.name !== &#39;string&#39; \|\| !FIELD_NAME.test(f.name)) fail(&#39;schema f… |
| coverage | const | 108 | no | const coverage = object(raw.coverage ?? { areas: [] }, [&#39;areas&#39;], &#39;coverage&#39;); |
| areas | const | 109 | no | const areas = bounded(coverage.areas ?? [], MAX_AREAS, &#39;coverage areas&#39;).map((a, i) =&gt; { object(a, [&#39;name&#39;, &#39;state&#39;], &#39;coverage area[&#39; + i + &#39;]&#39;); if (!COVERAGE.includes(a.state)) fail(&#39;coverage stat… |
| digest | function | 119 | no | function digest(worldId, passId, kind, label) { |
| value | const | 120 | no | const value = [worldId, passId, kind, label.toLowerCase()].join(&#39;\\u0000&#39;); |
| hash | variable | 121 | no | let hash = 0x811c9dc5; |
| compilePassOutput | function | 126 | yes | export function compilePassOutput(input, { worldId, requestId } = {}) { |
| out | const | 129 | no | const out = parseBootstrapPass(input); |
| p | const | 130 | no | const p = out.passId; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/bootstrap/service.mjs](../vivim-host/bootstrap/service.mjs.md) | ../../mobile-relay/bootstrap-pass.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Trusted validator for the five deeper bootstrap passes (D03–D07).
// Schema `vivim.bootstrap-output/1`. The provider proposes typed data; the Host
// decides what becomes durable. No SQL, code, HTML, URLs or owner-confirmation
// claims survive validation.
export const PASS_SCHEMA = 'vivim.bootstrap-output/1';
export const DEEP_PASSES = Object.freeze(['D03', 'D04', 'D05', 'D06', 'D07']);
const CONTROL = /[\u0000-\u001f\u007f]/;
const URLISH = /(?:https?:\/\/|www\.|javascript:|data:text\/html|<script|<\/|;\s*drop\s+table)/i;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/;
const FIELD_NAME = /^[a-z][a-z0-9_]{1,31}$/;
const MAX_OBS = 12, MAX_ASSERT = 12, MAX_UNKNOWNS = 8, MAX_VIEWS = 3, MAX_SCHEMAS = 2, MAX_AREAS = 12;
const BASIS = ['explicitly_stated', 'provider_memory_report', 'tentative_inference'];
const FRESHNESS = ['current', 'historical', 'unknown'];
const COVERAGE = ['covered', 'partial', 'unknown'];
const FIELD_TYPES = ['text', 'number', 'date', 'boolean', 'enum', 'reference'];
const VIEW_KINDS = ['card', 'collection', 'timeline', 'mode'];

// Contract per pass: which assertion sections and observation categories are legal.
export const PASS_CONTRACT = Object.freeze({
  D03: { sections: ['interest', 'taste', 'hobby'], categories: ['interest', 'taste', 'hobby'] },
  D04: { sections: ['role', 'project', 'goal', 'responsibility'], categories: ['role', 'project', 'goal'] },
  D05: { sections: ['routine', 'workflow', 'skill', 'tool'], categories: ['routine', 'skill', 'tool'] },
  D06: { sections: ['relationship', 'value', 'boundary'], categories: ['relationship', 'value'] },
  D07: { sections: ['contradiction', 'confidence', 'coverage'], categories: ['contradiction', 'gap'] }
});

function fail(reason) { throw new TypeError('Invalid bootstrap pass output: ' + reason); }
function object(value, allowed, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(name + ' must be an object');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('unsupported ' + name + ' field: ' + key);
  return value;
}
function bounded(value, max, name) {
  if (!Array.isArray(value) || value.length > max) fail(name + ' must be an array of at most ' + max);
  return value;
}
function text(value, limit, name) {
  if (typeof value !== 'string') fail(name + ' must be text');
  const v = value.trim();
  if (!v || v.length > limit) fail(name + ' length');
  if (CONTROL.test(v)) fail(name + ' control characters');
  if (URLISH.test(v)) fail(name + ' must not contain links, markup, scripts or SQL');
  return v;
}
function ratio(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) fail(name + ' must be 0..1');
  return value;
}

export function parseBootstrapPass(source) {
  let raw = source;
  if (typeof source === 'string') {
    if (source.length > 20000) fail('oversized response');
    try { raw = JSON.parse(source); } catch { fail('expected one JSON object, no Markdown fences'); }
  }
  object(raw, ['schema', 'generationId', 'passId', 'observations', 'assertions', 'unknowns', 'viewProposals', 'schemaProposals', 'coverage'], 'response');
  if (raw.schema !== PASS_SCHEMA) fail('schema');
  if (!DEEP_PASSES.includes(raw.passId)) fail('passId must be D03–D07');
  if (typeof raw.generationId !== 'string' || !ID.test(raw.generationId)) fail('generationId');
  const contract = PASS_CONTRACT[raw.passId];

  const observations = bounded(raw.observations ?? [], MAX_OBS, 'observations').map((o, i) => {
    object(o, ['category', 'text', 'confidence', 'sensitive'], 'observations[' + i + ']');
    if (!contract.categories.includes(o.category)) fail('observation category not allowed for ' + raw.passId);
    if (o.sensitive !== undefined && typeof o.sensitive !== 'boolean') fail('observation sensitive flag');
    return {
      category: o.category, text: text(o.text, 240, 'observation text'),
      confidence: ratio(o.confidence, 'observation confidence'),
      sensitive: o.category === 'relationship' || o.category === 'value' ? true : o.sensitive === true
    };
  });

  const assertions = bounded(raw.assertions ?? [], MAX_ASSERT, 'assertions').map((a, i) => {
    object(a, ['section', 'label', 'value', 'basis', 'confidence', 'scope', 'freshness'], 'assertions[' + i + ']');
    if (!contract.sections.includes(a.section)) fail('assertion section not allowed for ' + raw.passId);
    if (!BASIS.includes(a.basis)) fail('assertion basis');
    if (!FRESHNESS.includes(a.freshness)) fail('assertion freshness');
    const scope = a.scope ?? 'unknown';
    if (!['global', 'work', 'personal', 'unknown'].includes(scope)) fail('assertion scope');
    return {
```

_First 80 of 142 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
