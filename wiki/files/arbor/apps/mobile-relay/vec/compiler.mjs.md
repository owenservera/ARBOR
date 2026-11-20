# File: apps/mobile-relay/vec/compiler.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/vec/compiler.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3811 B |
| Lines | 65 |
| Hash | a821831a8ba9 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| VEC_COMPILE_SCHEMA | const | 5 | yes | export const VEC_COMPILE_SCHEMA = &#39;vivim.vec-compile/0.1&#39;; |
| VEC_DOMAINS | const | 6 | yes | export const VEC_DOMAINS = Object.freeze([&#39;wiki&#39;, &#39;command&#39;, &#39;ui&#39;]); |
| VEC_PRODUCTS | const | 7 | yes | export const VEC_PRODUCTS = Object.freeze({ wiki: &#39;wiki-projection&#39;, command: &#39;command-plan&#39;, ui: &#39;ui-revision-proposal&#39; }); |
| PRODUCT_SCHEMAS | const | 14 | no | const PRODUCT_SCHEMAS = Object.freeze({ wiki: &#39;hq.wiki-program/1&#39;, command: &#39;vivim.command-intent/0.1&#39;, ui: &#39;vivim.ui-proposal/1&#39; }); |
| semanticId | function | 17 | no | function semanticId(schema) { |
| at | const | 18 | no | const at = schema.lastIndexOf(&#39;/&#39;); |
| STATES | const | 21 | no | const STATES = new Set([&#39;candidate&#39;, &#39;clarification_required&#39;, &#39;unsupported&#39;, &#39;refused&#39;]); |
| plain | function | 22 | no | const plain = value =&gt; value !== null &amp;&amp; typeof value === &#39;object&#39; &amp;&amp; !Array.isArray(value) &amp;&amp; |
| fail | function | 24 | no | const fail = (domain, outcome, code) =&gt; ({ schema: VEC_COMPILE_SCHEMA, domain, product: VEC_PRODUCTS[domain] ?? null, outcome, code, authorization: &#39;none&#39;, executed: false, persisted: false }); |
| createVecCompiler | function | 31 | yes | export function createVecCompiler({ adapters = {} } = {}) { |
| installed | const | 34 | no | const installed = Object.freeze({ ...adapters }); |
| result | const | 45 | no | const result = installed[domain]({ ...context, text }); |
| sourceSemanticIds | const | 51 | no | const sourceSemanticIds = outcome === &#39;candidate&#39; &amp;&amp; plain(proposal) &amp;&amp; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) | ./vec/compiler.mjs |
| [apps/mobile-relay/test/vec-ui-compiler.test.mjs](../test/vec-ui-compiler.test.mjs.md) | ../vec/compiler.mjs |
| [apps/vivim-host/control/intent-planner.mjs](../../vivim-host/control/intent-planner.mjs.md) | ../../mobile-relay/vec/compiler.mjs |
| [apps/vivim-host/control/personal-semantics.mjs](../../vivim-host/control/personal-semantics.mjs.md) | ../../mobile-relay/vec/compiler.mjs |
| [hq/test/vlang-compiled-context.test.mjs](../../../hq/test/vlang-compiled-context.test.mjs.md) | ../../apps/mobile-relay/vec/compiler.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 4 | v2:type | — | vivim.vec-compile@0.1 | vivim.vec-compile@0.1 |

## Excerpt

```javascript
// VEC core/0.1: one pure compilation boundary, three owner-preserving adapters.
// Source text is NOT an execution or grant token. Only a trusted caller supplies the domain
// and adapters; no input may install a compiler, authorize an action or select a publisher.
// @hq:type vivim.vec-compile@0.1
export const VEC_COMPILE_SCHEMA = 'vivim.vec-compile/0.1';
export const VEC_DOMAINS = Object.freeze(['wiki', 'command', 'ui']);
export const VEC_PRODUCTS = Object.freeze({
  wiki: 'wiki-projection',
  command: 'command-plan',
  ui: 'ui-revision-proposal'
});
// Canonical proposal schemas, not new runtime types. They also anchor the existing
// HQ source-comment index. A source identity is never an execution credential.
const PRODUCT_SCHEMAS = Object.freeze({
  wiki: 'hq.wiki-program/1', command: 'vivim.command-intent/0.1', ui: 'vivim.ui-proposal/1'
});
function semanticId(schema) {
  const at = schema.lastIndexOf('/');
  return schema.slice(0, at) + '@' + schema.slice(at + 1);
}
const STATES = new Set(['candidate', 'clarification_required', 'unsupported', 'refused']);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const fail = (domain, outcome, code) => ({
  schema: VEC_COMPILE_SCHEMA, domain, product: VEC_PRODUCTS[domain] ?? null,
  outcome, code, authorization: 'none', executed: false, persisted: false
});

/** Register only trusted first-party adapters; wiki and command keep their incumbent
 * owners until source parity is independently established. No fallback silently runs. */
export function createVecCompiler({ adapters = {} } = {}) {
  if (!plain(adapters) || Object.keys(adapters).some(k => !VEC_DOMAINS.includes(k) || typeof adapters[k] !== 'function'))
    throw new TypeError('VEC_INVALID_ADAPTERS');
  const installed = Object.freeze({ ...adapters });
  return Object.freeze({
    compile({ domain, text, context = {} } = {}) {
      if (!VEC_DOMAINS.includes(domain)) return fail(null, 'refused', 'UNKNOWN_DOMAIN');
      if (typeof text !== 'string' || !text.trim() || text.length > 4096 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))
        return fail(domain, 'refused', 'INVALID_INPUT');
      if (!plain(context)) return fail(domain, 'refused', 'INVALID_CONTEXT');
      if (!Object.hasOwn(installed, domain))
        return { ...fail(domain, 'unsupported', 'LEGACY_OWNER_NOT_MIGRATED'), legacyOwner:
          PRODUCT_SCHEMAS[domain] };
      try {
        const result = installed[domain]({ ...context, text });
        if (!plain(result) || !STATES.has(result.outcome)) return fail(domain, 'refused', 'ADAPTER_INVALID_RESULT');
        // Explicitly overwrite any caller-supplied "authorized", "persisted" or "executed" claim.
        const { outcome, code, proposal, preview, summary, detail } = result;
        // Emit only identities of actual first-party, schema-matching candidates.
        // Never forward source IDs (or authority flags) supplied by an adapter.
        const sourceSemanticIds = outcome === 'candidate' && plain(proposal) &&
          proposal.schema === PRODUCT_SCHEMAS[domain]
          ? [semanticId(VEC_COMPILE_SCHEMA), semanticId(PRODUCT_SCHEMAS[domain])] : null;
        return { ...fail(domain, outcome, code ?? 'NONE'),
          ...(sourceSemanticIds ? { sourceSemanticIds } : {}),
          ...(proposal === undefined ? {} : { proposal }),
          ...(preview === undefined ? {} : { preview }),
          ...(summary === undefined ? {} : { summary }),
          ...(detail === undefined ? {} : { detail }) };
      } catch {
        return fail(domain, 'refused', 'ADAPTER_FAILURE');
      }
    }
  });
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
