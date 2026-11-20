# File: apps/mobile-relay/nlcl/grammar.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/grammar.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 23392 B |
| Lines | 421 |
| Hash | 14280be342eb |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| isSemantic | function | 30 | no | const isSemantic = (t ) =&gt; |
| CONTEXT_REF_WORDS | const | 35 | no | const CONTEXT_REF_WORDS = [&quot;this&quot;, &quot;that&quot;, &quot;it&quot;, &quot;them&quot;, &quot;they&quot;]; |
| isPrepToken | function | 37 | no | function isPrepToken(t , fs ) { |
| isBoundary | function | 43 | no | function isBoundary(t , frame ) { |
| bodyTokens | function | 49 | no | function bodyTokens(tokens , from , to ) { |
| out | const | 50 | no | const out = []; |
| t | const | 52 | no | const t = tokens[i]; |
| mentionAfter | function | 61 | no | function mentionAfter(tokens , start ) { |
| consumed | const | 62 | no | const consumed = []; |
| parts | variable | 63 | no | let parts = []; |
| quote | variable | 64 | no | let quote ; |
| t | const | 66 | no | const t = tokens[i]; |
| opShortName | function | 80 | no | function opShortName(op ) { |
| local | const | 81 | no | const local = op.split(&quot;@&quot;)[0] ?? op; |
| makeEntitySlot | function | 91 | no | function makeEntitySlot(token0 , mention , quote , frameSlot , world , notes , gaps , contextOverride ) { |
| isContext | const | 93 | no | const isContext = (token0.kind === &quot;word&quot; \|\| token0.kind === &quot;ref&quot;) &amp;&amp; CONTEXT_REF_WORDS.includes(token0.norm); |
| referent | const | 98 | no | const referent = resolveContext(token0.norm, world, frameSlot.entityTypes); |
| value | const | 100 | no | const value = entityPayloadValue(referent, frameSlot.role); |
| direct | const | 108 | no | const direct = world.entities.find((e) =&gt; e.id === `contact:${token0.norm}` \|\| e.id === `message:${token0.norm}` \|\| e.id.endsWith(`:${token0.norm}`)); |
| g | const | 112 | no | const g = ground(token0.norm, world.entities, frameSlot.entityTypes); |
| phrase | const | 121 | no | const phrase = quote ?? mention; |
| g | const | 123 | no | const g = groundPhrase(phrase, world.entities, frameSlot.entityTypes); |
| entityFromMatch | function | 129 | no | function entityFromMatch(g , frameSlot , _world , notes , _gaps ) { |
| p | const | 130 | no | const p = g.primary ; |
| matches | const | 131 | no | const matches = g.matches.length &gt; 1 ? g.matches.slice(0, 5) : undefined; |
| fillFrame | function | 149 | yes | export function fillFrame(frame , tokens , verbTok , world , contextOverride ) { |
| notes | const | 150 | no | const notes = [`verb &quot;${tokens[verbTok].text}&quot; → frame ${frame.op}`]; |
| gaps | const | 151 | no | const gaps = []; |
| usedTokens | const | 152 | no | const usedTokens = new Set ([verbTok]); |
| slots | const | 153 | no | const slots = {}; |
| consumedAll | const | 154 | no | const consumedAll = new Set (); |
| slotsFilled | variable | 155 | no | let slotsFilled = 0; |
| slotsRequired | variable | 156 | no | let slotsRequired = 0; |
| requiredMissing | variable | 157 | no | let requiredMissing = []; |
| entityAmbiguous | variable | 158 | no | let entityAmbiguous = false; |
| contextUnresolved | variable | 159 | no | let contextUnresolved = false; |
| body | const | 161 | no | const body = bodyTokens(tokens, verbTok + 1, tokens.length); |
| prepIdx | variable | 166 | no | let prepIdx = -1; |
| prepTok | const | 172 | no | const prepTok = tokens[prepIdx]; |
| start | variable | 175 | no | let start = -1; |
| mention | const | 180 | no | const mention = mentionAfter(tokens, start); |
| fill | const | 186 | no | const fill = fillSlotValue(fs, tokens[start], mention, world, notes, gaps, contextOverride); |
| hit | const | 199 | no | const hit = body.find((t) =&gt; !consumedAll.has(t.i) &amp;&amp; t.kind === &quot;word&quot; &amp;&amp; fs.enumValues?.includes(t.norm)); |
| rest | const | 209 | no | const rest = body.filter((t) =&gt; !consumedAll.has(t.i)); |
| text | const | 212 | no | const text = rest.map((t) =&gt; (t.kind === &quot;quote&quot; ? t.quote ?? t.norm : t.text)).join(&quot; &quot;); |
| startTok | const | 225 | no | const startTok = body.find((t) =&gt; !consumedAll.has(t.i) &amp;&amp; !isBoundary(t, frame)); |
| isCtxOrRef | const | 231 | no | const isCtxOrRef = startTok.kind === &quot;ref&quot; \|\| (startTok.kind === &quot;word&quot; &amp;&amp; [&quot;this&quot;, &quot;that&quot;, &quot;it&quot;, &quot;them&quot;, &quot;they&quot;, &quot;latest&quot;, &quot;last&quot;].includes(startTok.norm)); |
| fill | const | 233 | no | const fill = fillSlotValue(fs, startTok, { text: startTok.norm, consumed: [startTok.i] }, world, notes, gaps, contextOverride); |
| mention | const | 244 | no | const mention = mentionAfter(tokens, startTok.i); |
| fill | const | 246 | no | const fill = fillSlotValue(fs, startTok, mention, world, notes, gaps, contextOverride); |
| payload | const | 255 | no | const payload = buildPayload(frame, slots, world); |
| ir | const | 256 | no | const ir = { |
| unknownWords | const | 267 | no | const unknownWords = bodyTokens(tokens, verbTok + 1, tokens.length) |
| fillSlotValue | function | 274 | no | function fillSlotValue(fs , token0 , mention , world , notes , gaps , contextOverride ) { |
| v | const | 277 | no | const v = fold(mention.quote ?? mention.text); |
| isCtx | const | 288 | no | const isCtx = (token0.kind === &quot;word&quot; \|\| token0.kind === &quot;ref&quot;) &amp;&amp; [&quot;this&quot;, &quot;that&quot;, &quot;it&quot;, &quot;them&quot;, &quot;they&quot;, &quot;latest&quot;, &quot;last&quot;].includes(token0.norm); |
| referent | const | 293 | no | const referent = resolveContext(token0.norm, world, undefined); |
| bodyText | const | 295 | no | const bodyText = typeof (referent.data ?? {})[&quot;body&quot;] === &quot;string&quot; ? (referent.data )[&quot;body&quot;] : &quot;&quot;; |
| subj | const | 296 | no | const subj = typeof (referent.data ?? {})[&quot;subject&quot;] === &quot;string&quot; ? (referent.data )[&quot;subject&quot;] : &quot;&quot;; |
| referent | const | 305 | no | const referent = world.entities.find((e) =&gt; e.id.endsWith(`:${token0.norm}`) &amp;&amp; typeof (e.data ?? {})[&quot;body&quot;] === &quot;string&quot;); |
| bodyText | const | 307 | no | const bodyText = (referent.data )[&quot;body&quot;] ; |
| subj | const | 308 | no | const subj = typeof (referent.data ?? {})[&quot;subject&quot;] === &quot;string&quot; ? (referent.data )[&quot;subject&quot;] : &quot;&quot;; |
| text | const | 312 | no | const text = mention.text \|\| token0.text; |
| text | const | 316 | no | const text = mention.quote ?? mention.text; |
| text | const | 319 | no | const text = mention.text; |
| allPreps | function | 323 | no | function allPreps(frame ) { |
| out | const | 324 | no | const out = []; |
| buildPayload | function | 330 | yes | export function buildPayload(frame , slots , world ) { |
| payload | const | 331 | no | const payload = {}; |
| s | const | 333 | no | const s = slots[fs.role]; |
| body | const | 338 | no | const body = payload[&quot;body&quot;]; |
| msgSlot | const | 341 | no | const msgSlot = slots[&quot;message&quot;]; |
| src | const | 343 | no | const src = world.entities.find((e) =&gt; e.id === msgSlot.entityId); |
| srcBody | const | 344 | no | const srcBody = typeof (src?.data ?? {})[&quot;body&quot;] === &quot;string&quot; ? (src .data )[&quot;body&quot;] : (body ); |
| srcSubject | const | 345 | no | const srcSubject = typeof (src?.data ?? {})[&quot;subject&quot;] === &quot;string&quot; ? (src .data )[&quot;subject&quot;] : &quot;message&quot;; |
| buildCanonical | function | 355 | yes | export function buildCanonical(frame , slots ) { |
| name | const | 356 | no | const name = opShortName(frame.op); |
| parts | const | 357 | no | const parts = []; |
| s | const | 359 | no | const s = slots[fs.role]; |
| sym | const | 361 | no | const sym = s.canonical \|\| &quot;—&quot;; |
| buildReading | function | 369 | yes | export function buildReading(frame , slots ) { |
| reading | variable | 370 | no | let reading = frame.reading; |
| s | const | 372 | no | const s = slots[fs.role]; |
| matchFrames | function | 380 | yes | export function matchFrames(tokens , world , contextOverride ) { |
| frames | const | 381 | no | const frames = framesForWorld(world); |
| candidates | const | 382 | no | const candidates = []; |
| verbOrder | const | 383 | no | const verbOrder = [&quot;exact&quot;, &quot;taught&quot;, &quot;fuzzy&quot;]; |
| hits | const | 384 | no | const hits = []; |
| direct | const | 388 | no | const direct = frames.filter((f) =&gt; f.verbs.includes(t.norm) \|\| f.op.endsWith(`.${t.norm}@1`) \|\| f.op === t.norm); |
| c | const | 390 | no | const c = fillFrame(frame, tokens, t.i, world, contextOverride); |
| vh | const | 397 | no | const vh = verbHits(t.norm, frames, world); |
| ra | const | 401 | no | const ra = Math.min(...a.hits.map((h) =&gt; verbOrder.indexOf(h.cls))); |
| rb | const | 402 | no | const rb = Math.min(...b.hits.map((h) =&gt; verbOrder.indexOf(h.cls))); |
| c | const | 409 | no | const c = fillFrame(hit.frame, tokens, h.tok.i, world, contextOverride); |
| unquoteText | function | 419 | yes | export function unquoteText(s ) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./frames.mjs | import | 8 | [apps/mobile-relay/nlcl/frames.mjs](./frames.mjs.md) |
| ./ground.mjs | import | 9 | [apps/mobile-relay/nlcl/ground.mjs](./ground.mjs.md) |
| ./text.mjs | import | 10 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |
| ./symbols.mjs | import | 11 | [apps/mobile-relay/nlcl/symbols.mjs](./symbols.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./grammar.mjs |
| [apps/mobile-relay/nlcl/interpret.mjs](./interpret.mjs.md) | ./grammar.mjs |
| [apps/mobile-relay/nlcl/recognize.mjs](./recognize.mjs.md) | ./grammar.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/grammar.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/grammar.ts — deterministic frame grammar: verb → frame → slot filling → IR.
// Mixed symbolic/natural input is FIRST-CLASS: "/send @this → @peter" and "send this to
// Peter" hit the SAME frame through the SAME slot machinery. Every candidate carries its
// trace notes — the console renders how the machine understood.

                                                                                             
import { framesForWorld, verbHits } from "./frames.mjs";
import { ground, groundPhrase, resolveContext, entitySymbol, entityPayloadValue } from "./ground.mjs";
import { fold, unquote } from "./text.mjs";
import { STOPWORDS, MODIFIER_WORDS } from "./symbols.mjs";
                                             

                            
         
                 
                    
                                        
                          
                      
                        
                            
                           
                             
                  
                  
                         
 

const isSemantic = (t       )          =>
  (t.kind === "word" || t.kind === "quote" || t.kind === "ref" || t.kind === "cmd" || t.kind === "tag" || t.kind === "var" || t.kind === "number" || t.kind === "arrow") &&
  !STOPWORDS.includes(t.norm) &&
  !(t.kind === "word" && MODIFIER_WORDS[t.norm] !== undefined);

const CONTEXT_REF_WORDS = ["this", "that", "it", "them", "they"];

function isPrepToken(t       , fs           )          {
  if (t.kind === "arrow") return fs.family === "→"; // → routes ONLY direction slots
  return t.kind === "word" && (fs.preps ?? []).includes(t.norm);
}

/** Boundary for patient material: arrows and any slot's prep words. */
function isBoundary(t       , frame         )          {
  if (t.kind === "arrow") return frame.slots.some((s) => s.family === "→");
  return t.kind === "word" && allPreps(frame).includes(t.norm);
}

/** Tokens between two indices that are semantic material, in order. */
function bodyTokens(tokens         , from        , to        )          {
  const out          = [];
  for (let i = from; i < to; i++) {
    const t = tokens[i];
    if (t.kind === "punct" || t.kind === "symbol") continue;
    if (!isSemantic(t)) continue;
    out.push(t);
  }
  return out;
}

/** Collect a mention phrase: tokens until a prep/arrow/punct boundary. Returns text + consumed indices. */
function mentionAfter(tokens         , start        )                                                       {
  const consumed           = [];
  let parts           = [];
  let quote                    ;
  for (let i = start; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === "punct" || t.kind === "symbol") break;
    if (t.kind === "arrow") break;
    if (t.kind === "word" && isPrepToken(t, ["to", "from", "about", "re", "subject", "regarding", "saying", "in", "into", "on", "with", "and", "then"])) break;
    if (t.kind === "word" && MODIFIER_WORDS[t.norm] !== undefined) break;
    if (t.kind === "word" && STOPWORDS.includes(t.norm)) { consumed.push(t.i); continue; }
    if (t.kind === "quote") { if (quote === undefined && parts.length === 0) { quote = t.quote; parts.push(t.quote); } else break; consumed.push(t.i); continue; }
    if (t.kind === "ref") { parts.push(t.norm); consumed.push(t.i); continue; }
    if (t.kind === "word" || t.kind === "cmd" || t.kind === "tag" || t.kind === "var" || t.kind === "number") { parts.push(t.norm); consumed.push(t.i); continue; }
    break;
  }
  return { text: parts.join(" "), quote, consumed };
}

function opShortName(op        )         {
```

_First 80 of 422 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
