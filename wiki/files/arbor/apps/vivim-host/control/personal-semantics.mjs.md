# File: apps/vivim-host/control/personal-semantics.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/personal-semantics.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 14197 B |
| Lines | 195 |
| Hash | f6c4c2f5cbad |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| PERSONAL_RULE_SCHEMA | const | 8 | yes | export const PERSONAL_RULE_SCHEMA = &#39;vivim.personal-semantic-rule/1&#39;; |
| PERSONAL_RESOLUTION_SCHEMA | const | 9 | yes | export const PERSONAL_RESOLUTION_SCHEMA = &#39;vivim.personal-resolution/1&#39;; |
| SCOPE_KEYS | const | 10 | no | const SCOPE_KEYS = [&#39;workspaceId&#39;, &#39;activity&#39;, &#39;providerId&#39;, &#39;surface&#39;]; |
| STATES | const | 11 | no | const STATES = [&#39;observed&#39;, &#39;proposed&#39;, &#39;accepted&#39;, &#39;suspended&#39;, &#39;revoked&#39;]; |
| keysOnly | function | 15 | no | const keysOnly = (v, keys) =&gt; record(v) &amp;&amp; Object.keys(v).every(k =&gt; keys.includes(k)); |
| phrase | function | 16 | no | const phrase = value =&gt; typeof value === &#39;string&#39; &amp;&amp; value.length &gt;= 2 &amp;&amp; value.length &lt;= 200 &amp;&amp; |
| utterance | function | 18 | no | const utterance = value =&gt; typeof value === &#39;string&#39; &amp;&amp; value.trim().length &gt;= 2 &amp;&amp; |
| normalize | function | 20 | no | const normalize = value =&gt; value.normalize(&#39;NFKC&#39;).trim().replace(/\\s+/g, &#39; &#39;).toLowerCase(); |
| TEMPLATE_SCHEMA | const | 21 | yes | export const TEMPLATE_SCHEMA=&#39;vivim.personal-command-template/1&#39;; |
| slug | function | 22 | no | const slug=value=&gt;typeof value===&#39;string&#39;&amp;&amp;/^[a-z][a-z0-9-]{0,62}$/.test(value)&amp;&amp;![&#39;__proto__&#39;,&#39;prototype&#39;,&#39;constructor&#39;].includes(value); |
| templateAlias | function | 23 | yes | export const templateAlias=value=&gt;typeof value===&#39;string&#39;&amp;&amp;/^[a-z][a-z0-9]{2,31}$/.test(value); |
| canonical | function | 24 | no | const canonical=v=&gt;Array.isArray(v)?v.map(canonical):record(v)? |
| CATALOG_13_DIGEST | const | 28 | no | const CATALOG_13_DIGEST=&#39;422f499257f8828ffe22779a896008549966fdcc89bdcdaa2dc89803de7ae967&#39;; |
| compatibleRuleCatalog | function | 29 | yes | export function compatibleRuleCatalog(rule,catalog){ |
| prior | const | 32 | no | const prior={...catalog,version:14,actions:catalog.actions.filter(a=&gt;a.id!==&#39;program.write_wiki&#39;)}; |
| predecessor | const | 36 | no | const predecessor={...catalog,version:13,actions:catalog.actions.filter(a=&gt;a.id!==&#39;program.read_wiki&#39;)}; |
| templateDependencies | function | 39 | yes | export function templateDependencies(catalog){ |
| action | const | 40 | no | const action=catalog?.actions?.find(a=&gt;a.id===&#39;wiki.page.create&#39;); |
| validTemplate | function | 47 | no | function validTemplate(rule){ |
| t | const | 48 | no | const t=rule.template; |
| currentTemplate | function | 61 | yes | export function currentTemplate(rule,catalog){ |
| current | const | 62 | no | const current=templateDependencies(catalog); |
| bindPersonalRule | function | 67 | yes | export function bindPersonalRule(rule,text,catalog){ |
| parts | const | 70 | no | const parts=String(text).trim().split(/\\s+/); |
| spec | const | 73 | no | const spec=catalog.actions.find(a=&gt;a.id===rule.actionId).args.page; |
| bindPersonalWriteProgram | function | 76 | yes | export function bindPersonalWriteProgram(rule,text,catalog){ |
| parts | const | 80 | no | const parts=String(text).trim().split(/\\s+/); |
| decision | function | 84 | no | const decision = (outcome, extra = {}) =&gt; ({ schema: PERSONAL_RESOLUTION_SCHEMA, outcome, executionAuthorized: false, ...extra }); |
| validatePersonalRule | function | 88 | yes | export function validatePersonalRule(rule, catalog) { |
| r | const | 106 | no | const r=rule.writeProgram; |
| r | const | 115 | no | const r=rule.readProgram; |
| action | const | 122 | no | const action = catalog.actions.find(a =&gt; a.id === rule.actionId); |
| v | const | 128 | no | const v = rule.args[key]; |
| scoped | function | 137 | no | function scoped(rule, scope) { |
| signature | function | 140 | no | function signature(rule,args) { |
| resolvePersonalSemantics | function | 149 | yes | export function resolvePersonalSemantics({ text, baseline, rules, catalog, scope = {} } = {}) { |
| seen | const | 163 | no | const seen = new Set(); |
| checked | const | 165 | no | const checked = validatePersonalRule(rule, catalog); |
| parts | const | 169 | no | const parts=text.trim().split(/\\s+/); |
| matches | const | 170 | no | const matches = rules.filter(rule =&gt; rule.state === &#39;accepted&#39; &amp;&amp; scoped(rule,scope)&amp;&amp; (rule.template\|\|rule.writeProgram?.slot?normalize(parts[0])===normalize(rule.phrase):normalize(rule.phrase)===no… |
| bound | const | 178 | no | const bound=matches.map(rule=&gt;({rule,args:bindPersonalRule(rule,text,catalog)})); |
| highest | const | 180 | no | const highest = Math.max(...bound.map(x=&gt;Object.keys(x.rule.scope).length)); |
| mostSpecific | const | 181 | no | const mostSpecific=bound.filter(x=&gt;Object.keys(x.rule.scope).length===highest); |
| unique | const | 182 | no | const unique=new Set(mostSpecific.map(x=&gt;x.rule.writeProgram?JSON.stringify([x.rule.actionId,canonical(bindPersonalWriteProgram(x.rule,text,catalog))]):signature(x.rule,x.args))); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ../../mobile-relay/nlcl/frames.mjs | import | 4 | [apps/mobile-relay/nlcl/frames.mjs](../../mobile-relay/nlcl/frames.mjs.md) |
| ../../mobile-relay/vec/compiler.mjs | import | 5 | [apps/mobile-relay/vec/compiler.mjs](../../mobile-relay/vec/compiler.mjs.md) |
| ../../mobile-relay/generative-ui/portable-digest.mjs | import | 6 | [apps/mobile-relay/generative-ui/portable-digest.mjs](../../mobile-relay/generative-ui/portable-digest.mjs.md) |
| ./wiki-read-program.mjs | import | 7 | [apps/vivim-host/control/wiki-read-program.mjs](./wiki-read-program.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/vivim-host/control/command-intent.mjs](./command-intent.mjs.md) | ./personal-semantics.mjs |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./personal-semantics.mjs |
| [apps/vivim-host/control/personal-correction.mjs](./personal-correction.mjs.md) | ./personal-semantics.mjs |
| [apps/vivim-host/control/personal-rule-store.mjs](./personal-rule-store.mjs.md) | ./personal-semantics.mjs |
| [apps/vivim-host/control/personal-semantic-observer.mjs](./personal-semantic-observer.mjs.md) | ./personal-semantics.mjs |
| [apps/vivim-host/test/personal-semantic-corpus.test.mjs](../test/personal-semantic-corpus.test.mjs.md) | ../control/personal-semantics.mjs |
| [apps/vivim-host/test/personal-semantics-integration.test.mjs](../test/personal-semantics-integration.test.mjs.md) | ../control/personal-semantics.mjs |
| [apps/vivim-host/test/personal-semantics.test.mjs](../test/personal-semantics.test.mjs.md) | ../control/personal-semantics.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Lane B: pure, inert personal phrase resolution. No filesystem, AI, clock, grants or effects.
// The caller MUST pass the existing Host NLCL result first. A personal rule cannot
// supersede a canonical interpretation, refusal, incomplete command or clarification.
import { NCLL_VERSION } from '../../mobile-relay/nlcl/frames.mjs';
import { VEC_COMPILE_SCHEMA } from '../../mobile-relay/vec/compiler.mjs';
import {sha256Hex} from '../../mobile-relay/generative-ui/portable-digest.mjs';
import {validWikiRecipe,validWikiWriteRecipe,bindWikiWriteRecipe,wikiProgramSlug} from './wiki-read-program.mjs';
export const PERSONAL_RULE_SCHEMA = 'vivim.personal-semantic-rule/1';
export const PERSONAL_RESOLUTION_SCHEMA = 'vivim.personal-resolution/1';
const SCOPE_KEYS = ['workspaceId', 'activity', 'providerId', 'surface'];
const STATES = ['observed', 'proposed', 'accepted', 'suspended', 'revoked'];
const record = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null) &&
  Object.values(Object.getOwnPropertyDescriptors(v)).every(d => Object.hasOwn(d, 'value'));
const keysOnly = (v, keys) => record(v) && Object.keys(v).every(k => keys.includes(k));
const phrase = value => typeof value === 'string' && value.length >= 2 && value.length <= 200 &&
  value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
const utterance = value => typeof value === 'string' && value.trim().length >= 2 &&
  value.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(value);
const normalize = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
export const TEMPLATE_SCHEMA='vivim.personal-command-template/1';
const slug=value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,62}$/.test(value)&&!['__proto__','prototype','constructor'].includes(value);
export const templateAlias=value=>typeof value==='string'&&/^[a-z][a-z0-9]{2,31}$/.test(value);
const canonical=v=>Array.isArray(v)?v.map(canonical):record(v)?
  Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
// Only this audited additive migration is compatible. Any other catalog change
// still requires new owner review; no stored rule or receipt is rewritten.
const CATALOG_13_DIGEST='422f499257f8828ffe22779a896008549966fdcc89bdcdaa2dc89803de7ae967';
export function compatibleRuleCatalog(rule,catalog){
  if(rule.catalogVersion===catalog.version)return true;
  if(catalog.version===15&&[13,14].includes(rule.catalogVersion)&&rule.actionId!=='program.write_wiki'){
    const prior={...catalog,version:14,actions:catalog.actions.filter(a=>a.id!=='program.write_wiki')};
    return catalog.actions.length===38&&sha256Hex(JSON.stringify(canonical(prior)))==='c2c2e6d53a709beca16fb81052206c7ea14bd52a010d996088b662083f24d504'&&compatibleRuleCatalog(rule,prior);
  }
  if(rule.catalogVersion!==13||catalog.version!==14||rule.actionId==='program.read_wiki')return false;
  const predecessor={...catalog,version:13,actions:catalog.actions.filter(a=>a.id!=='program.read_wiki')};
  return predecessor.actions.length===36&&catalog.actions.length===37&&sha256Hex(JSON.stringify(canonical(predecessor)))===CATALOG_13_DIGEST;
}
export function templateDependencies(catalog){
  const action=catalog?.actions?.find(a=>a.id==='wiki.page.create');
  if(!action||action.risk!=='R1'||!['source_wired','verified'].includes(action.readiness)||
    !action.language||!record(action.args)||Object.keys(action.args).join(',')!=='page'||
    action.args.page.type!=='string')return null;
  return {catalogVersion:catalog.version,contract:JSON.stringify(canonical(action)),
    compiler:NCLL_VERSION,vec:VEC_COMPILE_SCHEMA,policy:'desktop-owner/wiki-create/fresh-approval/1'};
}
function validTemplate(rule){
  const t=rule.template;
  return keysOnly(t,['schema','receiptId','receiptDigest','sourceSemanticDigest','sourceEntryId','slot','dependencies','privacy'])&&
    t.schema===TEMPLATE_SCHEMA&&rule.actionId==='wiki.page.create'&&templateAlias(rule.phrase)&&
    rule.scope.surface==='desktop'&&rule.source==='explicit-owner'&&
    keysOnly(rule.args,['page'])&&slug(rule.args.page)&&
    /^ctl-[a-f0-9]{16}$/.test(t.receiptId)&&/^[a-f0-9]{64}$/.test(t.receiptDigest)&&
    /^[a-f0-9]{64}$/.test(t.sourceSemanticDigest)&&/^[a-f0-9-]{36}$/.test(t.sourceEntryId)&&
    t.privacy==='pc-only'&&keysOnly(t.slot,['name','type','provenance'])&&
    t.slot.name==='page'&&t.slot.type==='wiki-page-slug'&&t.slot.provenance==='owner-selected-receipt-argument'&&
    keysOnly(t.dependencies,['catalogVersion','contract','compiler','vec','policy'])&&
    t.dependencies.catalogVersion===rule.catalogVersion&&
    ['contract','compiler','vec','policy'].every(k=>typeof t.dependencies[k]==='string'&&t.dependencies[k].length>0&&t.dependencies[k].length<=20000);
}
export function currentTemplate(rule,catalog){
  const current=templateDependencies(catalog);
  return !!(rule?.template&&current&&compatibleRuleCatalog(rule,catalog)&&JSON.stringify(canonical({...rule.template.dependencies,catalogVersion:catalog.version}))===JSON.stringify(canonical(current)));
}
// One deliberately narrow named invocation, not another natural-language parser.
// Canonical NLCL/refusals always take precedence.
export function bindPersonalRule(rule,text,catalog){
  if(rule.writeProgram){return bindPersonalWriteProgram(rule,text,catalog)?{...rule.args}:null;}
  if(!rule.template)return normalize(rule.phrase)===normalize(text)?{...rule.args}:null;
  const parts=String(text).trim().split(/\s+/);
  if(parts.length!==2||normalize(parts[0])!==normalize(rule.phrase)||!slug(parts[1]))return null;
  if(!currentTemplate(rule,catalog))return null;
  const spec=catalog.actions.find(a=>a.id===rule.actionId).args.page;
  return parts[1].length>=spec.min&&parts[1].length<=spec.max?{page:parts[1]}:null;
}
export function bindPersonalWriteProgram(rule,text,catalog){
  if(!rule?.writeProgram)return null;
  if(!compatibleRuleCatalog(rule,catalog))return null;
  if(!rule.writeProgram.slot)return normalize(rule.phrase)===normalize(text)?bindWikiWriteRecipe(rule.writeProgram,rule.args.commands,catalog):null;
  const parts=String(text).trim().split(/\s+/);
```

_First 80 of 196 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
