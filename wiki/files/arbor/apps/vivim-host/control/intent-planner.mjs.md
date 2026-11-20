# File: apps/vivim-host/control/intent-planner.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/intent-planner.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 19900 B |
| Lines | 302 |
| Hash | 5b3949c54637 |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| catalogPath | const | 12 | no | const catalogPath = fileURLToPath(new URL(&#39;./action-catalog.v1.json&#39;, import.meta.url)); |
| err | function | 13 | no | const err = code =&gt; Object.assign(new Error(code), { code }); |
| plain | function | 14 | no | const plain = v =&gt; v !== null &amp;&amp; typeof v === &#39;object&#39; &amp;&amp; !Array.isArray(v) &amp;&amp; |
| ID | const | 16 | no | const ID = /^[a-z][a-z0-9._-]{2,95}$/; |
| ARG_KEY | const | 17 | no | const ARG_KEY = /^[a-z][a-z0-9._-]{0,95}$/; |
| WORD | const | 18 | no | const WORD = /^[a-z][a-z0-9-]{0,31}$/; |
| SURFACES | const | 19 | no | const SURFACES = [&#39;text&#39;, &#39;desktop&#39;, &#39;mobile&#39;, &#39;visual&#39;]; |
| RISKS | const | 20 | no | const RISKS = [&#39;R0&#39;, &#39;R1&#39;, &#39;R2&#39;, &#39;R3&#39;]; |
| READINESS | const | 21 | no | const READINESS = [&#39;adapter_pending&#39;, &#39;enforcement_missing&#39;, &#39;unsupported&#39;, &#39;source_wired&#39;, &#39;verified&#39;]; |
| EXECUTABLE | const | 22 | no | const EXECUTABLE = new Set([&#39;source_wired&#39;, &#39;verified&#39;]); |
| FAMILIES | const | 23 | no | const FAMILIES = [&#39;/&#39;, &#39;@&#39;, &#39;#&#39;, &#39;!&#39;, &#39;?&#39;, &#39;+&#39;, &#39;-&#39;, &#39;&amp;&#39;, &#39;$&#39;, &#39;*&#39;, &#39;%&#39;, &#39;∆&#39;, &#39;✓&#39;, &#39;=&#39;, &#39;^&#39;, &#39;~&#39;, &#39;→&#39;]; |
| RISK_CROSSWALK | const | 26 | yes | export const RISK_CROSSWALK = Object.freeze({ // capability-activation.mjs R1_ADDITIVE: &#39;R1&#39;, R2_SENSITIVE: &#39;R2&#39;, R3_CAPABILITY: &#39;R3&#39;, // vivim-final ActionPlan CapabilityRisk read: &#39;R0&#39;, reversible_… |
| canonicalRisk | function | 34 | yes | export function canonicalRisk(value) { |
| mapped | const | 36 | no | const mapped = RISK_CROSSWALK[value]; |
| words | function | 41 | no | const words = (list, max) =&gt; Array.isArray(list) &amp;&amp; list.length &gt;= 1 &amp;&amp; list.length &lt;= max &amp;&amp; list.every(w =&gt; typeof w === &#39;string&#39; &amp;&amp; WORD.test(w)); |
| validLanguage | function | 43 | no | function validLanguage(a, catalog) { |
| L | const | 44 | no | const L = a.language; |
| validateControlCatalog | function | 67 | yes | export function validateControlCatalog(catalog) { |
| ids | const | 71 | no | const ids = new Set(catalog.actions.map(a =&gt; a?.id)); |
| seen | const | 72 | no | const seen = new Set(); |
| loadControlCatalog | function | 96 | yes | export function loadControlCatalog() { return JSON.parse(readFileSync(catalogPath, &#39;utf8&#39;)); } |
| createControlPlanner | function | 98 | yes | export function createControlPlanner({ catalog = loadControlCatalog(), lexicon = () =&gt; [], personalRules = () =&gt; [], commandScope = () =&gt; ({}) } = {}) { |
| scopeFor | function | 102 | no | function scopeFor(source) { |
| input | const | 103 | no | const input = commandScope(); |
| actions | const | 109 | no | const actions = new Map(catalog.actions.map(a =&gt; [a.id, a])); |
| executable | function | 110 | no | const executable = a =&gt; EXECUTABLE.has(a.readiness); |
| safeSummary | function | 111 | no | const safeSummary = a =&gt; ({ actionId: a.id, title: a.title, category: a.category ?? null, risk: a.risk, target: a.target, readiness: a.readiness, available: a.readiness === &#39;verified&#39;, executable: ex… |
| taught | function | 117 | no | const taught = () =&gt; { const v = lexicon(); return Array.isArray(v) ? v : []; }; |
| world | function | 120 | no | function world(entries = taught(), rules = personalRules()) { |
| hash | variable | 121 | no | let hash = 2166136261; |
| canonical | function | 124 | no | const canonical = v =&gt; Array.isArray(v) ? v.map(canonical) : v &amp;&amp; typeof v === &#39;object&#39; |
| ruleKeys | const | 127 | no | const ruleKeys = rules.filter(r =&gt; r.state === &#39;accepted&#39;) |
| keys | const | 132 | no | const keys = [...entries.map(e =&gt; String(e.word) + &#39;\\0&#39; + String(e.actionId)), ...ruleKeys].sort(); |
| revision | const | 139 | no | const revision = catalog.version * 4294967296 + (hash &gt;&gt;&gt; 0); |
| describe | function | 143 | no | function describe() { |
| planTyped | function | 155 | no | function planTyped({ actionId, args = {}, source = &#39;text&#39;, origin = &#39;typed&#39; } = {}) { |
| a | const | 158 | no | const a = actions.get(actionId); |
| normalized | const | 161 | no | const normalized = {}; |
| val | const | 163 | no | const val = args[key]; |
| runnable | const | 169 | no | const runnable = executable(a); |
| interpretText | function | 181 | no | function interpretText(text,{source=&#39;text&#39;,worldSnapshot}={}){ |
| compiled | const | 185 | no | const compiled=compileCommand(text,{source,worldSnapshot}); |
| meaning | const | 186 | no | const meaning=compiled.proposal; |
| base | const | 187 | no | const base={schema:LANGUAGE_SCHEMA,input:text,feedback:meaning?.language?.feedback, |
| commandCompiler | const | 205 | no | const commandCompiler = createVecCompiler({ adapters: { command: ({ text, input, worldSnapshot, rules, scope }) =&gt; { const intent = toCommandIntent({ ...input, text }, { catalog, world: worldSnapshot… |
| intent | const | 206 | no | const intent = toCommandIntent({ ...input, text }, { catalog, world: worldSnapshot, personalRules: rules, personalScope: scope }); |
| outcome | const | 208 | no | const outcome = intent.outcome === &#39;interpretation_required&#39; ? &#39;unsupported&#39; : intent.outcome; |
| compileCommand | function | 212 | no | function compileCommand(text, { source = &#39;text&#39;, audience = &#39;owner&#39;, worldRevision, catalogRevision, worldSnapshot: snapshot } = {}) { |
| rules | const | 216 | no | const rules = personalRules(); |
| worldSnapshot | const | 217 | no | const worldSnapshot = snapshot ?? world(taught(), rules); |
| planText | function | 226 | no | function planText(text, { source = &#39;text&#39;, worldRevision, catalogRevision } = {}) { |
| compiled | const | 228 | no | const compiled = compileCommand(text.trim(), { source, worldRevision, catalogRevision }); |
| meaning | const | 229 | no | const meaning = compiled.proposal; |
| language | const | 230 | no | const language = { ...meaning?.language, vec: compiled }; |
| base | const | 231 | no | const base = { schema: &#39;vivim.control-plan/1&#39;, source, executionPerformed: false, language }; |
| ranked | const | 250 | no | const ranked = (meaning.alternatives ?? []).map(choice =&gt; actions.get(choice.actionId)).filter(Boolean); |
| interpretCommand | function | 262 | no | function interpretCommand(text, options = {}) { |
| compiled | const | 263 | no | const compiled = compileCommand(text, options); |
| validateCommandCandidate | function | 270 | no | function validateCommandCandidate(text, candidate, { source = &#39;text&#39;, audience = &#39;owner&#39;, worldRevision, catalogRevision } = {}) { |
| rules | const | 273 | no | const rules = personalRules(); |
| w | const | 274 | no | const w = world(taught(), rules); |
| planCandidate | function | 280 | no | function planCandidate(candidate, { source = &#39;text&#39; } = {}) { |
| a | const | 285 | no | const a = actions.get(candidate.actionId); |
| plan | const | 287 | no | const plan = planTyped({ actionId: candidate.actionId, args: candidate.args ?? {}, source, origin: &#39;ai_candidate&#39; }); |
| languagePack | function | 293 | no | function languagePack() { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 6 | external |
| node:url | import | 7 | external |
| ../../mobile-relay/control-language.mjs | import | 8 | [apps/mobile-relay/control-language.mjs](../../mobile-relay/control-language.mjs.md) |
| ./command-intent.mjs | import | 9 | [apps/vivim-host/control/command-intent.mjs](./command-intent.mjs.md) |
| ../../mobile-relay/vec/compiler.mjs | import | 10 | [apps/mobile-relay/vec/compiler.mjs](../../mobile-relay/vec/compiler.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/test/composer-assist.test.mjs](../../mobile-relay/test/composer-assist.test.mjs.md) | ../../vivim-host/control/intent-planner.mjs |
| [apps/mobile-relay/test/product-semantic-parity.test.mjs](../../mobile-relay/test/product-semantic-parity.test.mjs.md) | ../../vivim-host/control/intent-planner.mjs |
| [apps/vivim-host/control/dispatcher.mjs](./dispatcher.mjs.md) | ./intent-planner.mjs |
| [apps/vivim-host/control/hvi-capability.mjs](./hvi-capability.mjs.md) | ./intent-planner.mjs |
| [apps/vivim-host/direct-phone.mjs](../direct-phone.mjs.md) | ./control/intent-planner.mjs |
| [apps/vivim-host/test/chat-box-baseline.test.mjs](../test/chat-box-baseline.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/command-intent-v01.test.mjs](../test/command-intent-v01.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/control-dispatcher.test.mjs](../test/control-dispatcher.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/control-intent-planner.test.mjs](../test/control-intent-planner.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/control-language.test.mjs](../test/control-language.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/control-wiki-execution.test.mjs](../test/control-wiki-execution.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/host-authorized-mutation.test.mjs](../test/host-authorized-mutation.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/hvi-capability.test.mjs](../test/hvi-capability.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/personal-semantic-host.test.mjs](../test/personal-semantic-host.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/personal-semantics-integration.test.mjs](../test/personal-semantics-integration.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/vlang-command-compilation.test.mjs](../test/vlang-command-compilation.test.mjs.md) | ../control/intent-planner.mjs |
| [apps/vivim-host/test/wiki-read-program.test.mjs](../test/wiki-read-program.test.mjs.md) | ../control/intent-planner.mjs |
| [hq/test/vlang-compiled-context.test.mjs](../../../hq/test/vlang-compiled-context.test.mjs.md) | ../../apps/vivim-host/control/intent-planner.mjs |
| [studio/src/studio/world-service.mjs](../../../studio/src/studio/world-service.mjs.md) | ../../../apps/vivim-host/control/intent-planner.mjs |

## Annotations

| Line | Kind | Owner | Ref | Text |
| --- | --- | --- | --- | --- |
| 224 | v2:consumes | — | vivim.command-intent@0.1 | vivim.command-intent@0.1 |
| 225 | v2:consumes | — | vivim.vec-compile@0.1 | vivim.vec-compile@0.1 |

## Excerpt

```javascript
// Universal Text Control — typed planner (UTC02). Pure: no shell, network, model or mutation.
// Text is interpreted by the vendored deterministic Omega NCLL engine against a WorldModel
// generated from the action catalog (apps/mobile-relay/control-language.mjs); AI output can
// only enter through planCandidate() and is validated exactly like a typed GUI action.
// Planning never executes. Execution belongs to control/dispatcher.mjs (approval + journal).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildControlWorld, interpretControl, LANGUAGE_SCHEMA } from '../../mobile-relay/control-language.mjs';
import { toCommandIntent, validateAiCommandCandidate, COMMAND_INTENT_SCHEMA } from './command-intent.mjs';
import { createVecCompiler } from '../../mobile-relay/vec/compiler.mjs';

const catalogPath = fileURLToPath(new URL('./action-catalog.v1.json', import.meta.url));
const err = code => Object.assign(new Error(code), { code });
const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const ID = /^[a-z][a-z0-9._-]{2,95}$/;
const ARG_KEY = /^[a-z][a-z0-9._-]{0,95}$/;
const WORD = /^[a-z][a-z0-9-]{0,31}$/;
const SURFACES = ['text', 'desktop', 'mobile', 'visual'];
const RISKS = ['R0', 'R1', 'R2', 'R3'];
const READINESS = ['adapter_pending', 'enforcement_missing', 'unsupported', 'source_wired', 'verified'];
const EXECUTABLE = new Set(['source_wired', 'verified']);
const FAMILIES = ['/', '@', '#', '!', '?', '+', '-', '&', '$', '*', '%', '∆', '✓', '=', '^', '~', '→'];

/** One canonical risk scale (R0–R3). Other VIVIM generations map onto it; never the reverse. */
export const RISK_CROSSWALK = Object.freeze({
  // capability-activation.mjs
  R1_ADDITIVE: 'R1', R2_SENSITIVE: 'R2', R3_CAPABILITY: 'R3',
  // vivim-final ActionPlan CapabilityRisk
  read: 'R0', reversible_write: 'R1', external_communication: 'R3', destructive: 'R3', security_sensitive: 'R3',
  // vivim-omega RiskClass
  READ: 'R0', MUTATION: 'R1', EXTERNAL_MUTATION: 'R3', ENGINE: 'R3',
});
export function canonicalRisk(value) {
  if (RISKS.includes(value)) return value;
  const mapped = RISK_CROSSWALK[value];
  if (!mapped) throw err('CONTROL_RISK_UNKNOWN');
  return mapped;
}

const words = (list, max) => Array.isArray(list) && list.length >= 1 && list.length <= max && list.every(w => typeof w === 'string' && WORD.test(w));

function validLanguage(a, catalog) {
  const L = a.language;
  if (L === undefined) return true;
  if (!plain(L) || !words(L.verbs, 32) || (L.family !== undefined && !FAMILIES.includes(L.family)) ||
      (L.reading !== undefined && (typeof L.reading !== 'string' || L.reading.length > 160)) ||
      (L.scope !== undefined && !words(L.scope, 32)) || (L.objects !== undefined && !words(L.objects, 32)) ||
      (L.scopeQuestion !== undefined && (typeof L.scopeQuestion !== 'string' || L.scopeQuestion.length > 240)) ||
      (L.group !== undefined && !plain(catalog.languageGroups?.[L.group]))) return false;
  if (L.slots !== undefined) {
    if (!plain(L.slots)) return false;
    for (const [key, hint] of Object.entries(L.slots)) {
      if (!Object.hasOwn(a.args, key) || !plain(hint) ||
          (hint.kind !== undefined && !['rest', 'text'].includes(hint.kind)) ||
          (hint.preps !== undefined && !words(hint.preps, 8)) ||
          (hint.patient !== undefined && typeof hint.patient !== 'boolean')) return false;
      if (hint.match !== undefined) {
        if (typeof hint.match !== 'string' || hint.match.length > 120) return false;
        try { new RegExp(hint.match); } catch { return false; }
      }
    }
  }
  return true;
}

export function validateControlCatalog(catalog) {
  if (!plain(catalog) || catalog.schema !== 'vivim.control-action-catalog/1' ||
      !Array.isArray(catalog.actions) || catalog.actions.length > 3000 ||
      (catalog.languageGroups !== undefined && !plain(catalog.languageGroups))) throw err('CONTROL_CATALOG_INVALID');
  const ids = new Set(catalog.actions.map(a => a?.id));
  const seen = new Set();
  for (const a of catalog.actions) {
    if (!plain(a) || !ID.test(a.id) || seen.has(a.id) || !plain(a.args) ||
        !RISKS.includes(a.risk) || !SURFACES.every(s => a.surfaces?.includes(s)) ||
        typeof a.owner !== 'string' || !a.owner || !READINESS.includes(a.readiness) ||
        (EXECUTABLE.has(a.readiness) && (!a.executor || typeof a.executor !== 'string')) ||
        (a.risk === 'R3' && EXECUTABLE.has(a.readiness)) ||
        (a.aiCandidate !== undefined && typeof a.aiCandidate !== 'boolean') ||
        (a.undo !== undefined && (!plain(a.undo) || !ids.has(a.undo.actionId))) ||
```

_First 80 of 303 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
