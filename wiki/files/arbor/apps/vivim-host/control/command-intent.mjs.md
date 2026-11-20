# File: apps/vivim-host/control/command-intent.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/command-intent.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11569 B |
| Lines | 184 |
| Hash | fd7352fb2522 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| COMMAND_INTENT_SCHEMA | const | 7 | yes | export const COMMAND_INTENT_SCHEMA = &#39;vivim.command-intent/0.1&#39;; |
| isRecord | function | 8 | no | const isRecord = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; |
| allowedOutcomes | const | 10 | no | const allowedOutcomes = new Set([&#39;candidate&#39;, &#39;clarification_required&#39;, &#39;interpretation_required&#39;, &#39;refused&#39;]); |
| riskOrder | const | 11 | no | const riskOrder = [&#39;R0&#39;, &#39;R1&#39;, &#39;R2&#39;, &#39;R3&#39;]; |
| refuse | function | 13 | no | function refuse(input, code, message, extra = {}) { |
| canonical | function | 19 | no | function canonical(actionId, args) { |
| wikiApprovalSentence | function | 24 | yes | export function wikiApprovalSentence(actionId,args) { |
| name | function | 25 | no | const name=s=&gt;typeof s===&#39;string&#39;&amp;&amp;/^[a-z0-9_-]+$/i.test(s); |
| parts | const | 27 | no | const parts=typeof args.target===&#39;string&#39;?args.target.split(&#39;/&#39;):[]; |
| checkedArgs | function | 42 | no | function checkedArgs(action, args) { |
| normalized | const | 44 | no | const normalized = {}; |
| value | const | 46 | no | const value = args[key]; |
| context | function | 55 | no | function context(input, catalog, world) { |
| provenance | function | 71 | no | function provenance(input, catalog, world, method, feedback) { |
| actionShape | function | 77 | no | function actionShape(action, args) { |
| toCommandIntent | function | 88 | yes | export function toCommandIntent(input, { catalog, world, personalRules = [], personalScope = null } = {}) { |
| check | const | 89 | no | const check = context(input, catalog, world); |
| baseline | const | 93 | no | const baseline = interpretControl(input.text, { catalog, world }); |
| meaning | variable | 94 | no | let meaning = baseline; |
| personalProvenance | variable | 95 | no | let personalProvenance = null; |
| resolved | const | 97 | no | const resolved = resolvePersonalSemantics({ text: input.text, baseline, catalog, rules: personalRules, scope: personalScope ?? { surface: input.scope ?? &#39;text&#39; } }); |
| meta | const | 113 | no | const meta = { language: { feedback: meaning.feedback, |
| choices | const | 125 | no | const choices = (meaning.choices ?? []).slice(0, 8) |
| action | const | 144 | no | const action = check.actions.get(meaning.candidate?.actionId); |
| args | const | 146 | no | const args = checkedArgs(action, meaning.candidate.args); |
| validateAiCommandCandidate | function | 156 | yes | export function validateAiCommandCandidate(input, { catalog, world, personalRules = [], personalScope = null } = {}) { |
| check | const | 157 | no | const check = context(input, catalog, world); |
| proposal | const | 159 | no | const proposal = input.candidate; |
| reading | const | 167 | no | const reading = toCommandIntent(input, { catalog, world, personalRules, personalScope }); |
| action | const | 173 | no | const action = check.actions.get(proposal.actionId); |
| args | const | 176 | no | const args = checkedArgs(action, proposal.args ?? {}); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../mobile-relay/control-language.mjs | import | 3 | [apps/mobile-relay/control-language.mjs](../../mobile-relay/control-language.mjs.md) |
| ./personal-semantics.mjs | import | 4 | [apps/vivim-host/control/personal-semantics.mjs](./personal-semantics.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./command-intent.mjs |
| [apps/vivim-host/control/intent-planner.mjs](./intent-planner.mjs.md) | ./command-intent.mjs |
| [apps/vivim-host/test/command-intent-v01.test.mjs](../test/command-intent-v01.test.mjs.md) | ../control/command-intent.mjs |
| [apps/vivim-host/test/personal-semantics-integration.test.mjs](../test/personal-semantics-integration.test.mjs.md) | ../control/command-intent.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 6 | v2:type | — | vivim.command-intent@0.1 | vivim.command-intent@0.1 |
| 87 | v2:emits | — | vivim.command-intent@0.1 | vivim.command-intent@0.1 |

## Excerpt

```javascript
// V0.1 typed command intent. Pure interpretation data; never a permission or execution token.
// Browser/phone and desktop share the exact same NLCL world; Host owns effects.
import { interpretControl } from '../../mobile-relay/control-language.mjs';
import { resolvePersonalSemantics } from './personal-semantics.mjs';

// @hq:type vivim.command-intent@0.1
export const COMMAND_INTENT_SCHEMA = 'vivim.command-intent/0.1';
const isRecord = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const allowedOutcomes = new Set(['candidate', 'clarification_required', 'interpretation_required', 'refused']);
const riskOrder = ['R0', 'R1', 'R2', 'R3'];

function refuse(input, code, message, extra = {}) {
  return { schema: COMMAND_INTENT_SCHEMA, outcome: 'refused',
    refusal: { code, message }, ...extra, provenance: {
      method: 'deterministic-validation', catalogRevision: input.catalogRevision ?? null,
      worldRevision: input.worldRevision ?? null, authority: 'none' } };
}
function canonical(actionId, args) {
  return '/' + actionId + Object.keys(args).sort().map(k => ' ' + k + '=' + JSON.stringify(args[k])).join('');
}
// Rendering only: this is not a parser. The Host must compile the returned
// sentence and compare its resolved meaning before claiming round-trip proof.
export function wikiApprovalSentence(actionId,args) {
  const name=s=>typeof s==='string'&&/^[a-z0-9_-]+$/i.test(s);
  if(actionId==='wiki.section.edit'){
    const parts=typeof args.target==='string'?args.target.split('/'):[];
    if(parts.length!==2||!parts.every(name)||typeof args.content!=='string')return null;
    // The existing grammar strips one wrapping pair, not JSON escapes.
    // Interior quotes may make the syntax ambiguous; try only an exact
    // literal representation, and let the incumbent compiler decide.
    if(/(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:password|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[:=])/i.test(args.content))return null;
    return 'edit wiki section '+args.target+' saying "'+args.content+'"';
  }
  if(actionId==='wiki.page.create'&&name(args.page))return 'create wiki page '+args.page;
  if(actionId==='wiki.page.move'&&name(args.page)&&['top','bottom','up','down'].includes(args.position))
    return 'move wiki page '+args.page+' to '+args.position;
  if(actionId==='wiki.pages.link'&&name(args.from)&&name(args.to))
    return 'link wiki pages from '+args.from+' to '+args.to;
  return null;
}
function checkedArgs(action, args) {
  if (!isRecord(args) || Object.keys(args).some(k => !Object.hasOwn(action.args, k))) return null;
  const normalized = {};
  for (const [key, type] of Object.entries(action.args)) {
    const value = args[key];
    if (typeof value !== 'string' || !value || value !== value.trim() ||
      (type.type === 'enum' && !type.values.includes(value)) ||
      (type.type === 'string' && (value.length < type.min || value.length > type.max)))
      return null;
    normalized[key] = value;
  }
  return normalized;
}
function context(input, catalog, world) {
  if (!isRecord(input) || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 1000 ||
      !isRecord(catalog) || !Array.isArray(catalog.actions) || !world)
    return { refusal: 'INVALID_CONTEXT' };
  if (input.catalogRevision !== undefined && input.catalogRevision !== catalog.version)
    return { refusal: 'STALE_CATALOG' };
  if (input.worldRevision !== undefined && input.worldRevision !== world.v)
    return { refusal: 'STALE_WORLD' };
  if (input.audience !== undefined &&
      (typeof input.audience !== 'string' || input.audience.length > 64))
    return { refusal: 'INVALID_AUDIENCE' };
  if (input.scope !== undefined &&
      (typeof input.scope !== 'string' || !['text', 'desktop', 'mobile', 'visual'].includes(input.scope)))
    return { refusal: 'INVALID_SCOPE' };
  return { actions: new Map(catalog.actions.map(a => [a.id, a])) };
}
function provenance(input, catalog, world, method, feedback) {
  return { method, engineVersion: feedback?.nlclVersion ?? null,
    catalogRevision: catalog.version, worldRevision: world.v,
    audience: input.audience ?? 'owner', surface: input.scope ?? 'text',
    confidence: feedback?.confidence ?? null, authority: 'none' };
}
function actionShape(action, args) {
  return { actionId: action.id, args, canonical: canonical(action.id, args),
    risk: action.risk, requiredScopes: Array.isArray(action.requiredScopes) ? [...action.requiredScopes] : [],
    owner: action.owner, readiness: action.readiness };
```

_First 80 of 185 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
