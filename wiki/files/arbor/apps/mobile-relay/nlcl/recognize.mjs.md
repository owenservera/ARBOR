# File: apps/mobile-relay/nlcl/recognize.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/recognize.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 18441 B |
| Lines | 367 |
| Hash | dc5f9ac73b4f |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| irBase | function | 22 | no | function irBase(intent , family ) { |
| groundContact | function | 26 | no | function groundContact(phrase , world , notes , gaps ) { |
| t | const | 27 | no | const t = fold(phrase).replace(/^(a\|an\|the)\\s+/, &quot;&quot;); |
| g | const | 31 | no | const g = groundPhrase(t, world.entities, [&quot;contact&quot;]); |
| p | const | 33 | no | const p = g.primary; |
| recognizeHelp | function | 47 | yes | export function recognizeHelp(folded , tokens , world ) { |
| t | const | 48 | no | const t = folded.replace(/[?!.]+$/g, &quot;&quot;).trim(); |
| ir | const | 51 | no | const ir = irBase(&quot;surface.help&quot;, &quot;?&quot;); |
| cap | const | 57 | no | const cap = t.match(/^what\\s+can\\s+(?:i\\s+)?([\\w-]+)\\b(.*)$/); |
| verb | const | 59 | no | const verb = cap[1]; |
| hits | const | 60 | no | const hits = []; |
| ir | const | 65 | no | const ir = irBase(&quot;surface.help&quot;, &quot;?&quot;); |
| ir | const | 74 | no | const ir = irBase(&quot;surface.help&quot;, &quot;?&quot;); |
| rest | const | 77 | no | const rest = tokens.slice(1).map((x) =&gt; (x.kind === &quot;quote&quot; ? x.quote ?? &quot;&quot; : x.text)).join(&quot; &quot;).trim(); |
| eq | const | 80 | no | const eq = recognizeEntityQuery(rest, world); |
| recognizeEntityQuery | function | 90 | yes | export function recognizeEntityQuery(foldedOrText , world ) { |
| t | const | 91 | no | const t = fold(foldedOrText).replace(/[?!.]+$/g, &quot;&quot;).trim(); |
| m | variable | 92 | no | let m = t.match(/^(?:who\|what)\\s+is\\s+(?:an?\\s+)?(.+)$/); |
| phrase | const | 95 | no | const phrase = m[1].replace(/^@/, &quot;&quot;); |
| g | const | 96 | no | const g = groundPhrase(phrase, world.entities); |
| ir | const | 97 | no | const ir = irBase(&quot;surface.entity&quot;, &quot;@&quot;); |
| e | const | 99 | no | const e = g.primary.entity; |
| recognizeTeach | function | 122 | yes | export function recognizeTeach(folded , world ) { |
| t | const | 123 | no | const t = folded.trim(); |
| m | variable | 124 | no | let m = t.match(/^teach\\s+([\\w-]+)\\s+(?:means\|is\|as\|=)\\s+(?:a?\\s+)?(.+)$/); |
| s | const | 128 | no | const s = t.match(/^([\\w-]+)\\s*=\\s*\\/?\\s*([\\w.]+)(?:@\\d+)?$/); |
| word | const | 132 | no | const word = fold(m[1]); |
| target | const | 133 | no | const target = fold(m[2]).replace(/^\\//, &quot;&quot;); |
| frames | const | 134 | no | const frames = framesForWorld(world); |
| op | variable | 135 | no | let op = null; |
| hits | const | 140 | no | const hits = verbHits(target, frames, world); |
| ir | const | 146 | no | const ir = irBase(&quot;director.teach@1&quot;, &quot;=&quot;); |
| f | const | 164 | no | const f = t.match(/^(?:forget\|unteach\|remove word)\\s+([\\w-]+)$/); |
| word | const | 166 | no | const word = fold(f[1]); |
| ir | const | 167 | no | const ir = irBase(&quot;director.teach@1&quot;, &quot;-&quot;); |
| recognizeRule | function | 179 | yes | export function recognizeRule(folded , tokens , world ) { |
| t | const | 180 | no | const t = folded.trim().replace(/[.!?]+$/, &quot;&quot;); |
| ir | const | 183 | no | const ir = irBase(&quot;director.registry@1&quot;, &quot;?&quot;); |
| disable | const | 190 | no | const disable = t.match(/^(?:disable\|pause\|stop)\\s+rule\\s+(.+)$/) ?? t.match(/^(?:disable\|pause\|stop)\\s+(?:the\\s+)?(.+?)\\s+rule$/); |
| g | const | 192 | no | const g = groundPhrase(disable[1], world.entities, [&quot;rule&quot;]); |
| ir | const | 193 | no | const ir = irBase(&quot;director.registry@1&quot;, &quot;-&quot;); |
| enable | const | 199 | no | const enable = t.match(/^(?:enable\|resume\|activate)\\s+rule\\s+(.+)$/); |
| g | const | 201 | no | const g = groundPhrase(enable[1], world.entities, [&quot;rule&quot;]); |
| ir | const | 202 | no | const ir = irBase(&quot;director.registry@1&quot;, &quot;+&quot;); |
| trigger | const | 212 | no | const trigger = def[1].trim(); |
| action | const | 213 | no | const action = def[2].trim(); |
| notes | const | 214 | no | const notes = []; |
| gaps | const | 215 | no | const gaps = []; |
| fromPhrase | variable | 218 | no | let fromPhrase = null; |
| event | variable | 219 | no | let event = &quot;message.received&quot;; |
| trig | variable | 220 | no | let trig = trigger; |
| tm | variable | 221 | no | let tm ; |
| probe | const | 234 | no | const probe = groundPhrase(tm[1], world.entities, [&quot;contact&quot;]); |
| actionCandidates | const | 244 | no | const actionCandidates = matchFrames(actionTokens, world, &quot;trigger.message&quot;); |
| candidates | const | 245 | no | const candidates = actionCandidates.slice(0, 3); |
| ir | const | 247 | no | const ir = irBase(&quot;director.rule@1&quot;, &quot;+&quot;); |
| best | const | 257 | no | const best = candidates[0]; |
| payload | const | 260 | no | const payload = { ...best.ir.payload }; |
| usesTrigger | variable | 261 | no | let usesTrigger = false; |
| ir | const | 269 | no | const ir = irBase(&quot;director.rule@1&quot;, &quot;+&quot;); |
| scoreCandidate | function | 288 | no | function scoreCandidate(c ) { |
| s | variable | 289 | no | let s = 0; |
| lowerFirst | function | 296 | no | function lowerFirst(s ) { |
| recognizeReceive | function | 302 | yes | export function recognizeReceive(folded , world ) { |
| t | const | 303 | no | const t = folded.trim().replace(/[.!?]+$/, &quot;&quot;); |
| m | variable | 304 | no | let m = t.match(/^(?:simulate\|pretend\|imagine)\\s+(?:a\\s+)?(?:new\\s+)?(?:message\|email)\\s+from\\s+(.+?)$/); |
| fromPhrase | variable | 305 | no | let fromPhrase = null; |
| bodyText | variable | 306 | no | let bodyText = null; |
| sm | const | 309 | no | const sm = fromPhrase.match(/^(.+?)\\s+saying\\s+(.+)$/); |
| sm | const | 313 | no | const sm = fromPhrase.match(/^(.+?)\\s+saying\\s+(.+)$/); |
| rest | const | 317 | no | const rest = m[2] ?? &quot;&quot;; |
| sm | const | 318 | no | const sm = rest.match(/^(?::\\s*\|saying\\s+)?(.*)$/); |
| sm | const | 323 | no | const sm = fromPhrase.match(/^(.+?)\\s+saying\\s+(.+)$/); |
| notes | const | 328 | no | const notes = []; |
| gaps | const | 329 | no | const gaps = []; |
| ir | const | 331 | no | const ir = irBase(&quot;message.receive@1&quot;, &quot;/&quot;); |
| subject | const | 338 | no | const subject = bodyText ? (bodyText.length &gt; 48 ? `${bodyText.slice(0, 45)}…` : bodyText) : `message from ${from.label}`; |
| recognizeInbox | function | 348 | yes | export function recognizeInbox(folded ) { |
| t | const | 349 | no | const t = folded.trim().replace(/[?!.]+$/g, &quot;&quot;); |
| m | const | 350 | no | const m = t.match(/^what(?:&#39;s\| is)?\\s+in\\s+(?:my\\s+)?(inbox\|sent\|archive\|trash)$/); |
| ir | const | 352 | no | const ir = irBase(&quot;message.list@1&quot;, &quot;?&quot;); |
| emptyInterp | function | 362 | yes | export function emptyInterp(input , world ) { |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./frames.mjs | import | 8 | [apps/mobile-relay/nlcl/frames.mjs](./frames.mjs.md) |
| ./ground.mjs | import | 9 | [apps/mobile-relay/nlcl/ground.mjs](./ground.mjs.md) |
| ./text.mjs | import | 10 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |
| ./grammar.mjs | import | 11 | [apps/mobile-relay/nlcl/grammar.mjs](./grammar.mjs.md) |
| ./lexer.mjs | import | 12 | [apps/mobile-relay/nlcl/lexer.mjs](./lexer.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./recognize.mjs |
| [apps/mobile-relay/nlcl/interpret.mjs](./interpret.mjs.md) | ./recognize.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/recognize.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/recognize.ts — dedicated deterministic phrase recognizers. These run BEFORE
// generic frame matching (priority order, first match wins): rules, teaching, receive
// simulation, help/capability, entity queries, rules listing. Each is a small grammar over
// the folded input — upgradable with the plugin, never guessed.

                                                                                                              
import { framesForWorld, verbHits, NCLL_VERSION } from "./frames.mjs";
import { ground, groundPhrase, entitySymbol, CONTEXT_WORDS } from "./ground.mjs";
import { fold, unquote } from "./text.mjs";
import { fillFrame,                 matchFrames } from "./grammar.mjs";
import { lex } from "./lexer.mjs";

                             
         
                  
                  
                          
                           
 

function irBase(intent        , family              )     {
  return { intent, family, slots: {}, payload: {}, modifiers: {}, canonical: "", reading: "", confidence: 0.5, provenance: { verbs: [] } };
}

function groundContact(phrase        , world            , notes          , gaps           )                                                                                                                     {
  const t = fold(phrase).replace(/^(a|an|the)\s+/, "");
  if (t === "" || ["anyone", "anybody", "someone", "any", "everyone"].includes(t)) {
    return { entityId: null, label: "anyone", canonical: "*", address: null };
  }
  const g = groundPhrase(t, world.entities, ["contact"]);
  if (g.primary) {
    const p = g.primary;
    notes.push(`"${phrase}" → ${p.entity.label} (${p.reason})`);
    return {
      entityId: p.entity.id, label: p.entity.label, canonical: entitySymbol(p.entity),
      address: typeof (p.entity.data ?? {})["address"] === "string" ? (p.entity.data )["address"]           : null,
      matches: g.matches.length > 1 ? g.matches.slice(0, 5) : undefined,
    };
  }
  gaps.push({ kind: "unresolved-slot", text: `"${phrase}" is not a known contact`, hint: "contacts are learned from message history — simulate a message from them first" });
  return { entityId: null, label: phrase, canonical: `@${fold(phrase).replace(/\s+/g, "-")}`, address: null };
}

// ---- 1. help / capability ----

export function recognizeHelp(folded        , tokens         , world            )                    {
  const t = folded.replace(/[?!.]+$/g, "").trim();
  if (t === "" ) return null;
  if (t === "help" || t === "what can i say" || t === "what can you do" || t === "commands" || t === "?" || t === "what can i type" || t === "cheat sheet" || t === "symbols") {
    const ir = irBase("surface.help", "?");
    ir.reading = "Here is what I can do:";
    ir.canonical = "?";
    return { ir, notes: ["help intent"], gaps: [] };
  }
  // "what can <verb> …" — capability search
  const cap = t.match(/^what\s+can\s+(?:i\s+)?([\w-]+)\b(.*)$/);
  if (cap) {
    const verb = cap[1];
    const hits            = [];
    for (const f of framesForWorld(world)) {
      if (verbHits(verb, [f], world).length > 0) hits.push(f);
    }
    if (hits.length > 0) {
      const ir = irBase("surface.help", "?");
      ir.reading = `Capabilities matching "${verb}":`;
      ir.payload = { focus: verb, ops: hits.map((f) => f.op) };
      ir.canonical = `? what can ${verb}`;
      return { ir, notes: [`capability search: ${hits.map((f) => f.op).join(", ")}`], gaps: [] };
    }
  }
  // leading ? symbol → query mode
  if (tokens.length > 0 && tokens[0].kind === "symbol" && tokens[0].norm === "?") {
    const ir = irBase("surface.help", "?");
    ir.reading = "Query mode — what are you asking about?";
    ir.canonical = "?";
    const rest = tokens.slice(1).map((x) => (x.kind === "quote" ? x.quote ?? "" : x.text)).join(" ").trim();
    if (rest.length > 0) {
      // delegate: entity query on the rest
      const eq = recognizeEntityQuery(rest, world);
```

_First 80 of 368 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
