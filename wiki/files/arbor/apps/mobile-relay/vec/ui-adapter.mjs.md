# File: apps/mobile-relay/vec/ui-adapter.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/vec/ui-adapter.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7709 B |
| Lines | 134 |
| Hash | 4d0cfa6f538e |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PREFIX | const | 9 | no | const PREFIX = /^(?:add\|create\|rename\|remove\|delete\|move)\\b/i; |
| COMPLEX | const | 11 | no | const COMPLEX = /(?:[;]\|\\b(?:and then\|and also\|and (?:add\|create\|remove\|delete\|move\|rename)\|after that\|unless\|whenever\|when\|if\|then\|automatically\|every (?:day\|morning\|night\|week))\\b)/i; |
| ADD | const | 12 | no | const ADD = /^(?:add\|create) (?:a \|an )?(card\|heading\|text\|button\|collection\|timeline\|chart) (?:called\|named\|saying) (.+)$/i; |
| RENAME | const | 13 | no | const RENAME = /^rename (?:the )?(card\|heading\|text\|button\|collection\|timeline\|chart) (?:called \|named )?(.+?) to (.+)$/i; |
| REMOVE | const | 14 | no | const REMOVE = /^(?:remove\|delete) (?:the )?(card\|heading\|text\|button\|collection\|timeline\|chart) (?:called \|named )?(.+)$/i; |
| MOVE | const | 15 | no | const MOVE = /^move (?:the )?(card\|heading\|text\|button\|collection\|timeline\|chart) (?:called \|named )?(.+?) to (?:the )?(top\|bottom)$/i; |
| normalized | function | 16 | no | const normalized = value =&gt; value.trim().toLocaleLowerCase(&#39;en&#39;); |
| MAX_UI_REQUEST | const | 17 | no | const MAX_UI_REQUEST = 400; |
| WORD | const | 18 | no | const WORD = /[^a-z0-9]+/g; |
| outcome | function | 19 | no | const outcome = (state, code, detail = null) =&gt; ({ outcome: state, code, ...(detail ? { detail } : {}) }); |
| isType | function | 22 | no | function isType(node, type) { |
| visibleCandidates | function | 27 | no | function visibleCandidates(node, type, name, found = [], visible = true) { |
| allowed | const | 28 | no | const allowed = visible &amp;&amp; node.visibility !== &#39;pc-private&#39;; |
| label | const | 30 | no | const label = node.props?.title ?? node.props?.value ?? node.props?.label; |
| identifier | function | 36 | no | function identifier(title, type, tree) { |
| base | variable | 37 | no | let base = normalized(title).normalize(&#39;NFKD&#39;).replace(/[\\u0300-\\u036f]/g, &#39;&#39;).replace(WORD, &#39;-&#39;).replace(/^-\|-$/g, &#39;&#39;); |
| taken | const | 39 | no | const taken = new Set(); |
| visit | function | 40 | no | const visit = n =&gt; { taken.add(n.id); (n.children ?? []).forEach(visit); }; |
| stem | const | 42 | no | const stem = &#39;vec.&#39; + type + &#39;.&#39; + base; |
| current | variable | 43 | no | let current = stem, index = 2; |
| safeTitle | function | 47 | no | function safeTitle(title) { |
| value | const | 48 | no | const value = title.trim(); |
| makeProposal | function | 51 | no | function makeProposal(surface, op, explanation) { |
| compileVecUiRequest | function | 59 | yes | export function compileVecUiRequest({ text, surface } = {}) { |
| request | const | 63 | no | const request = text.trim().replace(/\\s+/g, &#39; &#39;); |
| add | const | 65 | no | const add = ADD.exec(request), rename = RENAME.exec(request), |
| current | variable | 69 | no | let current; |
| found | const | 72 | no | const found = add ?? rename ?? remove ?? move, type = normalized(found[1]); |
| canonicalId | const | 75 | no | const canonicalId = ({ card: &#39;vivim.ui.foundation.surface.card@1&#39;, heading: &#39;vivim.ui.foundation.typography.heading@1&#39;, text: &#39;vivim.ui.foundation.typography.text@1&#39;, button:&#39;vivim.ui.input.actions.b… |
| taxonomy | const | 82 | no | const taxonomy = getUiComponent(canonicalId); |
| nativeType | const | 83 | no | const nativeType = type === &#39;heading&#39; ? &#39;text&#39; : type; |
| source | const | 84 | no | const source = resolveUiSourceIdentity({ schema: &#39;vivim.ui-surface/1&#39;, nativeType, props: type === &#39;heading&#39; ? { variant: &#39;heading&#39; } : {} }); |
| title | const | 91 | no | const title = safeTitle(add ? add[2] : found[2]); |
| op | variable | 93 | no | let op, explanation; |
| componentType | const | 95 | no | const componentType = type === &#39;heading&#39; ? &#39;text&#39; : type; |
| component | const | 96 | no | const component = { id: identifier(title, type, current.tree), type: componentType, |
| matches | const | 103 | no | const matches = visibleCandidates(current.tree, type, title); |
| target | const | 106 | no | const target = matches[0]; |
| next | const | 108 | no | const next = safeTitle(rename[3]); |
| position | const | 119 | no | const position = normalized(move[3]); |
| proposal | const | 126 | no | const proposal = makeProposal(current, op, explanation); |
| preview | const | 127 | no | const preview = compileUiProposal({ proposal, surface: current, approvedRefs: [], audience: &#39;phone&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../generative-ui/catalog.mjs | import | 5 | [apps/mobile-relay/generative-ui/catalog.mjs](../generative-ui/catalog.mjs.md) |
| ../generative-ui/compiler.mjs | import | 6 | [apps/mobile-relay/generative-ui/compiler.mjs](../generative-ui/compiler.mjs.md) |
| ./ui-taxonomy/registry.mjs | import | 7 | [apps/mobile-relay/vec/ui-taxonomy/registry.mjs](./ui-taxonomy/registry.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-composer.mjs](../build-composer.mjs.md) | ./vec/ui-adapter.mjs |
| [apps/mobile-relay/test/tierflow-build.test.mjs](../test/tierflow-build.test.mjs.md) | ../vec/ui-adapter.mjs |
| [apps/mobile-relay/test/vec-ui-compiler.test.mjs](../test/vec-ui-compiler.test.mjs.md) | ../vec/ui-adapter.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 58 | v2:emits | — | vivim.ui-proposal@1 | vivim.ui-proposal@1 |

## Excerpt

```javascript
// VEC paired-PWA adapter/0.1. Strict deterministic UI grammar -> the EXISTING
// vivim.ui-proposal/1 validator. No model, network, OS read, Host write or Rust compile.
// UI changes are NOT ordinary command execution. User must still tap Activate and
// the existing paired Host revalidates and commits the exact revision.
import { validateSurface, PROPOSAL_SCHEMA } from '../generative-ui/catalog.mjs';
import { compileUiProposal } from '../generative-ui/compiler.mjs';
import { getUiComponent, resolveUiSourceIdentity } from './ui-taxonomy/registry.mjs';

const PREFIX = /^(?:add|create|rename|remove|delete|move)\b/i;
// Refuse possible second actions/conditionals instead of treating them as card titles.
const COMPLEX = /(?:[;]|\b(?:and then|and also|and (?:add|create|remove|delete|move|rename)|after that|unless|whenever|when|if|then|automatically|every (?:day|morning|night|week))\b)/i;
const ADD = /^(?:add|create) (?:a |an )?(card|heading|text|button|collection|timeline|chart) (?:called|named|saying) (.+)$/i;
const RENAME = /^rename (?:the )?(card|heading|text|button|collection|timeline|chart) (?:called |named )?(.+?) to (.+)$/i;
const REMOVE = /^(?:remove|delete) (?:the )?(card|heading|text|button|collection|timeline|chart) (?:called |named )?(.+)$/i;
const MOVE = /^move (?:the )?(card|heading|text|button|collection|timeline|chart) (?:called |named )?(.+?) to (?:the )?(top|bottom)$/i;
const normalized = value => value.trim().toLocaleLowerCase('en');
const MAX_UI_REQUEST = 400;
const WORD = /[^a-z0-9]+/g;
const outcome = (state, code, detail = null) => ({
  outcome: state, code, ...(detail ? { detail } : {})
});
function isType(node, type) {
  if (!['heading','text'].includes(type)) return node.type === type;
  return node.type === 'text' &&
    (type === 'heading' ? node.props?.variant === 'heading' : node.props?.variant !== 'heading');
}
function visibleCandidates(node, type, name, found = [], visible = true) {
  const allowed = visible && node.visibility !== 'pc-private';
  if (!allowed) return found;
  const label = node.props?.title ?? node.props?.value ?? node.props?.label;
  if (isType(node, type) && typeof label === 'string' && normalized(label) === normalized(name))
    found.push(node);
  for (const child of node.children ?? []) visibleCandidates(child, type, name, found, allowed);
  return found;
}
function identifier(title, type, tree) {
  let base = normalized(title).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(WORD, '-').replace(/^-|-$/g, '');
  base = base.slice(0, 38).replace(/-$/, '') || 'item';
  const taken = new Set();
  const visit = n => { taken.add(n.id); (n.children ?? []).forEach(visit); };
  visit(tree);
  const stem = 'vec.' + type + '.' + base;
  let current = stem, index = 2;
  while (taken.has(current)) current = stem + '-' + index++;
  return current;
}
function safeTitle(title) {
  const value = title.trim();
  return value && value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value) ? value : null;
}
function makeProposal(surface, op, explanation) {
  return {
    schema: PROPOSAL_SCHEMA, surfaceId: surface.surfaceId, baseRevision: surface.revision,
    operations: [{ opId: 'vec.ui.1', ...op }],
    explanation, assumptions: [], unknowns: []
  };
}
// @hq:emits vivim.ui-proposal@1
export function compileVecUiRequest({ text, surface } = {}) {
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_UI_REQUEST ||
      /[\u0000-\u001f\u007f]/.test(text))
    return outcome('refused', 'INVALID_UI_REQUEST');
  const request = text.trim().replace(/\s+/g, ' ');
  if (COMPLEX.test(request)) return outcome('unsupported', 'COMPLEX_REQUEST');
  const add = ADD.exec(request), rename = RENAME.exec(request),
    remove = REMOVE.exec(request), move = MOVE.exec(request);
  if (!add && !rename && !remove && !move)
    return outcome('unsupported', PREFIX.test(request) ? 'UNSUPPORTED_UI_GRAMMAR' : 'NOT_A_KNOWN_UI_INTENT');
  let current;
  try { current = validateSurface(surface, { refs: new Set() }); }
  catch { return outcome('refused', 'INVALID_OR_UNAVAILABLE_SURFACE'); }
  const found = add ?? rename ?? remove ?? move, type = normalized(found[1]);
  // Canonical VEC identity is not a runtime install token. Both identity and a
  // currently closed, reviewed source-type mapping must exist before preview.
  const canonicalId = ({
    card: 'vivim.ui.foundation.surface.card@1',
    heading: 'vivim.ui.foundation.typography.heading@1',
    text: 'vivim.ui.foundation.typography.text@1',
    button:'vivim.ui.input.actions.button@1', collection:'vivim.ui.data.collections.collection@1',
    timeline:'vivim.ui.data.temporal.timeline@1', chart:'vivim.ui.data.charts.chart@1'
```

_First 80 of 135 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
