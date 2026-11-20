# File: packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../../../projects/arbor.md) |
| Path | packages/tierflow/src/visual-runtime/integration-2/action-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1751 B |
| Lines | 25 |
| Hash | 5a0a8e7edce1 |
| Test | no |
| Generated | no |
| Component | tierflow |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ADAPTER_SCHEMA | const | 2 | yes | export const ADAPTER_SCHEMA = &#39;vivim.integration-2-action-adapter/1&#39;; |
| ID | const | 3 | no | const ID = /^(?!javascript:\|data:\|https?:\|file:\|vbscript:)[A-Za-z][A-Za-z0-9._:-]{0,95}$/i; |
| copy | function | 4 | no | const copy = value =&gt; JSON.parse(JSON.stringify(value)); |
| refuse | function | 5 | no | const refuse = code =&gt; { throw new TypeError(`ACTION_ADAPTER_${code}`); }; |
| projectInertActionRefs | function | 7 | yes | export function projectInertActionRefs(document) { |
| references | const | 9 | no | const references = [], nodes = [], seen = new Set(); |
| source | const | 14 | no | const source = node.actionRefs ?? []; |
| actionRefs | const | 16 | no | const actionRefs = source.map((entry,j) =&gt; { if (!ID.test(entry?.id ?? &#39;&#39;) \|\| !Number.isSafeInteger(entry.version) \|\| entry.version &lt; 1) refuse(&#39;ACTION_VERSION&#39;); const alias = `synthetic_ref_${i}_${… |
| alias | const | 18 | no | const alias = `synthetic_ref_${i}_${j}`; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [packages/tierflow/src/visual-runtime/integration-2/compose.ts](./compose.ts.md) | ./action-adapter.mjs |
| [packages/tierflow/tests/visual-runtime/integration-2/action-adapter.test.mjs](../../../tests/visual-runtime/integration-2/action-adapter.test.mjs.md) | ../../../src/visual-runtime/integration-2/action-adapter.mjs |
| [packages/tierflow/tests/visual-runtime/integration-2/real-a-h.test.ts](../../../tests/visual-runtime/integration-2/real-a-h.test.ts.md) | ../../../src/visual-runtime/integration-2/action-adapter.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/** Wave 2 Integration 2, synthetic-only A -> B/D action-ref adapter. */
export const ADAPTER_SCHEMA = 'vivim.integration-2-action-adapter/1';
const ID = /^(?!javascript:|data:|https?:|file:|vbscript:)[A-Za-z][A-Za-z0-9._:-]{0,95}$/i;
const copy = value => JSON.parse(JSON.stringify(value));
const refuse = code => { throw new TypeError(`ACTION_ADAPTER_${code}`); };
/** Canonical Lane A validation MUST already have succeeded; this is not an auth check. */
export function projectInertActionRefs(document) {
  if (document?.schema !== 'vivim.ui-document/1' || !Array.isArray(document.nodes) || document.nodes.length > 64) refuse('SCHEMA');
  const references = [], nodes = [], seen = new Set();
  for (const [i, node] of document.nodes.entries()) {
    if (!ID.test(node?.id ?? '') || seen.has(node.id)) refuse('NODE_ID');
    seen.add(node.id);
    if (!['stack','grid','text','card','button','collection','profile-card','project-card','timeline','chart'].includes(node.type)) refuse('NODE_TYPE');
    const source = node.actionRefs ?? [];
    if (!Array.isArray(source) || source.length > 8 || (node.type !== 'button' && source.length)) refuse('ACTION_SCOPE');
    const actionRefs = source.map((entry,j) => {
      if (!ID.test(entry?.id ?? '') || !Number.isSafeInteger(entry.version) || entry.version < 1) refuse('ACTION_VERSION');
      const alias = `synthetic_ref_${i}_${j}`;
      references.push(Object.freeze({alias, nodeId:node.id, id:entry.id, version:entry.version, inert:true}));
      return alias;
    });
    nodes.push({...copy(node), actionRefs});
  }
  return Object.freeze({schema:ADAPTER_SCHEMA,synthetic:true,actionVersionTable:Object.freeze(references),rendererDocument:{...copy(document),nodes}});
}
```

---

[HQ wiki](../../../../../../../index.md) · [Symbols](../../../../../../../symbols.md) · [Dependency graph](../../../../../../../graph.md) · [Documentation](../../../../../../../docs.md) · [Changes](../../../../../../../changes.md) · [Open tasks](../../../../../../../todos.md) · [Deprecated](../../../../../../../deprecated.md) · [Agent annotation protocol](../../../../../../../protocol.md) · [Glossary](../../../../../../../glossary.md) · [Using HQ](../../../../../../../context.md) · [Capabilities](../../../../../../../capabilities.md) · [Search index](../../../../../../../search.json) · [Browser view](../../../../../../../index.html)
