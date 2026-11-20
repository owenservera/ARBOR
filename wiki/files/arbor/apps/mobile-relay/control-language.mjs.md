# File: apps/mobile-relay/control-language.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/mobile-relay/control-language.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 20352 B |
| Lines | 355 |
| Hash | 951fa588aae7 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| LANGUAGE_SCHEMA | const | 13 | yes | export const LANGUAGE_SCHEMA = &#39;vivim.control-language/1&#39;; |
| MIN_CONFIDENCE | const | 14 | yes | export const MIN_CONFIDENCE = 0.6; |
| LOCAL_NAVIGATION | const | 18 | no | const LOCAL_NAVIGATION = Object.freeze({ &#39;open today&#39;: &#39;today&#39;, &#39;go to today&#39;: &#39;today&#39;, &#39;open wiki&#39;: &#39;wiki&#39;, &#39;open the wiki&#39;: &#39;wiki&#39;, &#39;go to wiki&#39;: &#39;wiki&#39;, &#39;show wiki&#39;: &#39;wiki&#39;, &#39;open world&#39;: &#39;world&#39;,… |
| resolveLocalDestination | function | 29 | yes | export function resolveLocalDestination(input) { |
| normalized | const | 31 | no | const normalized = input.trim().toLowerCase().replace(/\\s+/g, &#39; &#39;); |
| resolveProductRoute | function | 35 | yes | export function resolveProductRoute(text,{hostMeaning,compileUi=null,hostRequired=true}={}) { |
| tab | const | 36 | no | const tab=resolveLocalDestination(text); |
| reading | variable | 46 | no | let reading; |
| resolveDesktopDestination | function | 58 | yes | export function resolveDesktopDestination(text){ |
| tab | const | 59 | no | const tab=resolveLocalDestination(text); |
| routes | const | 61 | no | const routes={wiki:&#39;/wiki&#39;,talk:&#39;/chat&#39;,control:&#39;/host/control&#39;,today:&#39;/&#39;}; |
| OMEGA_RISK | const | 65 | no | const OMEGA_RISK = { R0: &#39;READ&#39;, R1: &#39;MUTATION&#39;, R2: &#39;MUTATION&#39;, R3: &#39;EXTERNAL_MUTATION&#39; }; |
| fold | function | 67 | no | const fold = s =&gt; String(s ?? &#39;&#39;).normalize(&#39;NFKD&#39;).replace(/[̀-ͯ]/g, &#39;&#39;).toLowerCase(); |
| words | function | 68 | no | const words = s =&gt; new Set(fold(s).split(/[^a-z0-9]+/).filter(Boolean)); |
| hasAny | function | 69 | no | const hasAny = (set, list) =&gt; Array.isArray(list) &amp;&amp; list.some(w =&gt; set.has(fold(w))); |
| frameFor | function | 71 | no | function frameFor(action) { |
| L | const | 72 | no | const L = action.language; |
| slots | const | 73 | no | const slots = Object.entries(action.args).map(([key, type]) =&gt; { const hint = L.slots?.[key] ?? {}; return { role: key, payloadKey: key, required: true, patient: hint.patient ?? true, kind: type.type… |
| hint | const | 74 | no | const hint = L.slots?.[key] ?? {}; |
| buildControlWorld | function | 88 | yes | export function buildControlWorld(catalog, { lexicon = [], version = 1, only = null } = {}) { |
| spoken | const | 89 | no | const spoken = catalog.actions.filter(a =&gt; a.language &amp;&amp; (!only \|\| only.includes(a.id))); |
| ids | const | 90 | no | const ids = new Set(spoken.map(a =&gt; a.id)); |
| feedbackOf | function | 104 | no | function feedbackOf(interp) { |
| validArg | function | 116 | no | function validArg(type, value) { |
| v | const | 118 | no | const v = value.trim(); |
| rawSpan | function | 126 | no | function rawSpan(text, interp, key, action) { |
| notes | const | 127 | no | const notes = interp.tokens ?? []; |
| idx | const | 128 | no | const idx = interp.ir?.slots?.[key]?.tokens; |
| used | const | 130 | no | const used = notes.filter(t =&gt; idx.includes(t.i)); |
| verbs | const | 135 | no | const verbs = new Set([...(action.language?.verbs ?? []), ...(interp.ir?.provenance?.verbs ?? [])].map(fold)); |
| at | const | 136 | no | const at = notes.findIndex(t =&gt; verbs.has(fold(t.text))); |
| raw | const | 138 | no | const raw = text.slice(notes[at + 1].start); |
| value | const | 139 | no | const value = interp.ir?.payload?.[key]; |
| have | const | 140 | no | const have = words(raw); |
| literalAfterPrep | function | 146 | no | function literalAfterPrep(text, preps) { |
| folded | const | 147 | no | const folded = text.toLowerCase(); |
| rest | const | 153 | no | const rest = text.slice(i + prep.length).trimStart(); |
| argsFrom | function | 161 | no | function argsFrom(action, interp, text) { |
| args | const | 162 | no | const args = {}, missing = [], payload = interp.ir?.payload; |
| hint | const | 164 | no | const hint = action.language?.slots?.[key] ?? {}; |
| v | variable | 165 | no | let v = payload?.[key]; |
| plausible | function | 188 | no | function plausible(action, input, taught) { |
| L | const | 189 | no | const L = action.language; |
| safeSyntaxFeedback | function | 202 | no | function safeSyntaxFeedback(world) { |
| guardControlSyntax | function | 207 | yes | export function guardControlSyntax(text, { catalog, world }) { |
| raw | const | 208 | no | const raw = String(text ?? &#39;&#39;); |
| unquoted | const | 209 | no | const unquoted = raw.replace(/&quot;(?:\\\\.\|[^&quot;\\\\])*&quot;\|“[^”]*”\|«[^»]*»/g, match =&gt; &#39; &#39;.repeat(match.length)); |
| normalized | const | 211 | no | const normalized = fold(unquoted).replace(/\\u2019/g, &quot;&#39;&quot;).trim(); |
| make | function | 212 | no | const make = (outcome, code, message) =&gt; ({ schema: LANGUAGE_SCHEMA, input: raw, outcome, ...(outcome === &#39;refused&#39; ? { refusal: { code, message } } : { question: message, choices: [] }), feedback: s… |
| positiveExclusion | const | 220 | no | const positiveExclusion = /^(?:please\\s+)?never\\s+mention\\b/.test(normalized); |
| negationScan | const | 221 | no | const negationScan = positiveExclusion |
| deviceGrant | const | 233 | no | const deviceGrant = exactDeviceIntent(raw, { catalog, world })?.candidate?.actionId === &#39;devices.approve&#39;; |
| separators | const | 234 | no | const separators = /\\b(?:and\\s+then\|and\|then\|also\|plus\|or\|y\\s+luego\|y\|luego\|ademas\|despues\|o)\\b\|[;,&amp;\|]\|\\n+\|[.!?:](?=\\s+\\S)\|\\s+[—–/+]\\s+/g; |
| exactDeviceIntent | function | 243 | no | function exactDeviceIntent(text, {catalog,world}) { |
| value | const | 246 | no | const value=String(text??&#39;&#39;).trim(); |
| revoke | const | 247 | no | const revoke=/^(?:revoke\|disconnect)\\s+(?:paired\\s+)?phone(?:\\s+grant)?\\s+([a-f0-9]{32})\\.?$/i.exec(value); |
| approve | const | 248 | no | const approve=/^approve\\s+(?:paired\\s+)?phone\\s+grant\\s+([a-f0-9]{32})\\s+(?:with\\s+)?scopes?\\s+([a-z0-9:.,\\s-]+)$/i.exec(value); |
| id | variable | 249 | no | let id,args; |
| scopes | const | 253 | no | const scopes=approve[2].split(&#39;,&#39;).map(s=&gt;s.trim()).filter(Boolean); |
| interpretControl | function | 265 | yes | export function interpretControl(text, { catalog, world }) { |
| raw | const | 266 | no | const raw=String(text??&#39;&#39;).trim(); |
| envelope | const | 268 | no | const envelope=/^run wiki (read\|change) sequence:[ \\t]*\\r?\\n([\\s\\S]+)$/i.exec(raw); |
| sequenceAction | const | 269 | no | const sequenceAction=envelope?.[1].toLowerCase()===&#39;change&#39;?&#39;program.write_wiki&#39;:&#39;program.read_wiki&#39;; |
| commands | const | 271 | no | const commands=envelope[2].trim(); |
| unsafe | const | 276 | no | const unsafe = guardControlSyntax(text, { catalog, world }); |
| exact | const | 278 | no | const exact=exactDeviceIntent(text,{catalog,world}); |
| interp | const | 280 | no | const interp = interpret(String(text ?? &#39;&#39;), world); |
| base | const | 281 | no | const base = { schema: LANGUAGE_SCHEMA, input: String(text ?? &#39;&#39;), feedback: feedbackOf(interp) }; |
| ir | const | 282 | no | const ir = interp.ir; |
| byId | const | 286 | no | const byId = new Map(catalog.actions.map(a =&gt; [a.id, a])); |
| verbs | const | 300 | no | const verbs = new Set(catalog.actions.flatMap(a =&gt; a.language?.verbs ?? []).map(fold)); |
| clauses | const | 301 | no | const clauses = fold(text).split(/\\s*(?:\\band then\\b\|\\bthen\\b\|\\band\\b\|&amp;\|;)\\s*/).filter(Boolean); |
| primary | const | 306 | no | const primary = byId.get(ir.intent); |
| input | const | 310 | no | const input = words(text); |
| verb | const | 311 | no | const verb = fold(ir.provenance?.verbs?.[0] ?? &#39;&#39;); |
| pool | const | 312 | no | const pool = new Map([[primary.id, primary]]); |
| taught | const | 316 | no | const taught = new Set((world.lexicon ?? []).filter(e =&gt; input.has(fold(e.word))).map(e =&gt; e.op)); |
| candidates | const | 317 | no | const candidates = [...pool.values()].filter(a =&gt; plausible(a, input, taught)); |
| explicit | const | 319 | no | const explicit = candidates.filter(a =&gt; a.language.scope &amp;&amp; (hasAny(input, a.language.scope) \|\| taught.has(a.id))); |
| chosen | variable | 320 | no | let chosen = null; |
| unscoped | const | 325 | no | const unscoped = candidates.filter(a =&gt; !a.language.scope); |
| group | const | 331 | no | const group = candidates.find(a =&gt; a.language.group)?.language.group; |
| members | const | 332 | no | const members = group ? catalog.actions.filter(a =&gt; a.language?.group === group) : candidates; |
| question | const | 333 | no | const question = (group &amp;&amp; catalog.languageGroups?.[group]?.question) ?? candidates[0].language.scopeQuestion ?? &#39;Which one do you mean?&#39;; |
| reading | variable | 339 | no | let reading = interp; |
| first | const | 349 | no | const first = missing[0]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./nlcl/index.mjs | import | 11 | [apps/mobile-relay/nlcl/index.mjs](./nlcl/index.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/build-canvas.mjs](./build-canvas.mjs.md) | ./control-language.mjs |
| [apps/mobile-relay/composer-assist.mjs](./composer-assist.mjs.md) | ./control-language.mjs |
| [apps/mobile-relay/control-chat.mjs](./control-chat.mjs.md) | ./control-language.mjs |
| [apps/mobile-relay/control-chat.mjs](./control-chat.mjs.md) | ./control-language.mjs |
| [apps/mobile-relay/control-phone.mjs](./control-phone.mjs.md) | ./control-language.mjs |
| [apps/mobile-relay/test/product-semantic-parity.test.mjs](./test/product-semantic-parity.test.mjs.md) | ../control-language.mjs |
| [apps/vivim-host/control/command-intent.mjs](../vivim-host/control/command-intent.mjs.md) | ../../mobile-relay/control-language.mjs |
| [apps/vivim-host/control/dispatcher.mjs](../vivim-host/control/dispatcher.mjs.md) | ../../mobile-relay/control-language.mjs |
| [apps/vivim-host/control/intent-planner.mjs](../vivim-host/control/intent-planner.mjs.md) | ../../mobile-relay/control-language.mjs |
| [apps/vivim-host/test/chat-command-surface.test.mjs](../vivim-host/test/chat-command-surface.test.mjs.md) | ../../mobile-relay/control-language.mjs |
| [apps/vivim-host/test/command-intent-v01.test.mjs](../vivim-host/test/command-intent-v01.test.mjs.md) | ../../mobile-relay/control-language.mjs |
| [apps/vivim-host/test/control-language.test.mjs](../vivim-host/test/control-language.test.mjs.md) | ../../mobile-relay/control-language.mjs |
| [apps/vivim-host/test/wiki-visual-contract.test.mjs](../vivim-host/test/wiki-visual-contract.test.mjs.md) | ../../mobile-relay/control-language.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VIVIM Universal Text Control — language adapter (UTC02).
// Browser-safe and dependency-free apart from the vendored Omega NCLL engine, so the paired
// phone (keystroke feedback) and the Host (authoritative parse) run identical bytes.
//
//   action catalog ──buildControlWorld──► WorldModel (ops + catalog-derived frames + taught words)
//   text ──interpret (Omega, pure)──► Interpretation ──resolve──► typed candidate {actionId,args}
//
// This module decides MEANING only. It never grants authority, never executes, and never
// treats an NCLL `ok` as readiness: every arg is re-validated against the catalog, scope words
// must disambiguate shared verbs, and the `!` force modifier is reported as ignored.
import { interpret, NCLL_VERSION } from './nlcl/index.mjs';

export const LANGUAGE_SCHEMA = 'vivim.control-language/1';
export const MIN_CONFIDENCE = 0.6;

// Navigating an already-mounted UI is not a Host effect. These exact,
// deterministic phrases do not approve, schedule, send or mutate anything.
const LOCAL_NAVIGATION = Object.freeze({
  'open today': 'today', 'go to today': 'today',
  'open wiki': 'wiki', 'open the wiki': 'wiki', 'go to wiki': 'wiki', 'show wiki': 'wiki',
  'open world': 'world', 'go to world': 'world', 'show media library': 'world',
  'open media library': 'world', 'open my media library': 'world',
  'open build': 'build', 'go to build': 'build',
  'open talk': 'talk', 'go to talk': 'talk', 'open chat': 'talk', 'go to chat': 'talk',
  'open control': 'control', 'go to control': 'control',
  'open me': 'me', 'open my profile': 'me',
  'open pocket': 'pocket', 'capture a note': 'pocket'
});
export function resolveLocalDestination(input) {
  if (typeof input !== 'string') return null;
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  return Object.hasOwn(LOCAL_NAVIGATION, normalized) ? LOCAL_NAVIGATION[normalized] : null;
}
// An inert precedence rule over existing compiler results, not another interpreter.
export function resolveProductRoute(text,{hostMeaning,compileUi=null,hostRequired=true}={}) {
  const tab=resolveLocalDestination(text);
  if(tab)return {kind:'navigate',tab};
  if(hostMeaning==null&&hostRequired)return {kind:'unavailable'};
  if(hostMeaning!=null){
    if(['candidate','done','approval_required','incomplete','clarification_required'].includes(hostMeaning.outcome))
      return {kind:'host',meaning:hostMeaning};
    if(hostMeaning.outcome==='refused')return {kind:'refused',meaning:hostMeaning};
    if(hostMeaning.outcome!=='interpretation_required')return {kind:'unavailable'};
  }
  if(typeof compileUi==='function'){
    let reading;
    try{reading=compileUi(text);}catch{return {kind:'unavailable'};}
    if(reading?.domain==='ui'){
      if(['candidate','clarification_required'].includes(reading.outcome))return {kind:'ui',reading};
      if(reading.outcome==='refused'||(reading.outcome==='unsupported'&&
        ['COMPLEX_REQUEST','UNSUPPORTED_UI_GRAMMAR','MOVE_NESTED_NOT_SUPPORTED','UI_COMPONENT_ADAPTER_NOT_INSTALLED'].includes(reading.code)))
        return {kind:'refused',reading};
      if(reading.outcome!=='unsupported')return {kind:'unavailable'};
    }
  }
  return {kind:'provider'}; // choice only, never an effect
}
export function resolveDesktopDestination(text){
  const tab=resolveLocalDestination(text);
  if(!tab)return null;
  const routes={wiki:'/wiki',talk:'/chat',control:'/host/control',today:'/'};
  return {tab,href:routes[tab]??null};
}

const OMEGA_RISK = { R0: 'READ', R1: 'MUTATION', R2: 'MUTATION', R3: 'EXTERNAL_MUTATION' };

const fold = s => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = s => new Set(fold(s).split(/[^a-z0-9]+/).filter(Boolean));
const hasAny = (set, list) => Array.isArray(list) && list.some(w => set.has(fold(w)));

function frameFor(action) {
  const L = action.language;
  const slots = Object.entries(action.args).map(([key, type]) => {
    const hint = L.slots?.[key] ?? {};
    return {
      role: key, payloadKey: key, required: true, patient: hint.patient ?? true,
      kind: type.type === 'enum' ? 'enum' : (hint.kind ?? 'rest'),
      ...(type.type === 'enum' ? { enumValues: [...type.values] } : {}),
      ...(hint.preps ? { preps: [...hint.preps] } : {}),
    };
```

_First 80 of 356 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
