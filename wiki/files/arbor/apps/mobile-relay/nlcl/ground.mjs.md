# File: apps/mobile-relay/nlcl/ground.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/ground.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 7829 B |
| Lines | 171 |
| Hash | 71dd2410762e |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| CONTEXT_WORDS | const | 10 | yes | export const CONTEXT_WORDS = new Set([&quot;this&quot;, &quot;that&quot;, &quot;it&quot;, &quot;them&quot;, &quot;they&quot;, &quot;latest&quot;, &quot;last&quot;, &quot;newest&quot;, &quot;current&quot;]); |
| bestScoreForAlias | function | 18 | no | function bestScoreForAlias(name , alias ) { |
| n | const | 19 | no | const n = fold(name); |
| a | const | 20 | no | const a = fold(alias); |
| nw | const | 23 | no | const nw = n.split(/[\\s._-]+/).filter(Boolean); |
| aw | const | 24 | no | const aw = a.split(/[\\s._-]+/).filter(Boolean); |
| d | const | 33 | no | const d = lev(n, a, 2); |
| ground | function | 44 | yes | export function ground(name , entities , typeFilter ) { |
| matches | const | 45 | no | const matches = []; |
| best | variable | 48 | no | let best = 0; |
| reason | variable | 49 | no | let reason = &quot;&quot;; |
| s | const | 51 | no | const s = bestScoreForAlias(name, alias); |
| capped | const | 59 | no | const capped = matches.slice(0, 8); |
| primary | const | 60 | no | const primary = capped.length &gt; 0 ? capped[0] : null; |
| ambiguous | const | 61 | no | const ambiguous = capped.length &gt; 1 &amp;&amp; primary !== null &amp;&amp; Math.abs(capped[1].score - primary.score) &lt; 0.01; |
| resolveContext | function | 66 | yes | export function resolveContext(word , world , typeFilter ) { |
| w | const | 67 | no | const w = fold(word); |
| wantId | const | 69 | no | const wantId = typeFilter?.includes(&quot;message&quot;) \|\| !typeFilter |
| entitySymbol | function | 77 | yes | export function entitySymbol(entity ) { |
| suffix | const | 78 | no | const suffix = entity.id.includes(&quot;:&quot;) ? entity.id.split(&quot;:&quot;).slice(1).join(&quot;:&quot;) : entity.id; |
| entityPayloadValue | function | 83 | yes | export function entityPayloadValue(entity , role ) { |
| d | const | 84 | no | const d = entity.data ?? {}; |
| suggestEntities | function | 93 | yes | export function suggestEntities(entities , typeFilter , cap = 5) { |
| groundPhrase | function | 100 | yes | export function groundPhrase(phrase , entities , typeFilter ) { |
| direct | const | 101 | no | const direct = ground(phrase, entities, typeFilter); |
| ws | const | 103 | no | const ws = words(phrase); |
| lastWord | const | 105 | no | const lastWord = ws[ws.length - 1]; |
| byLast | const | 106 | no | const byLast = ground(lastWord, entities, typeFilter); |
| applyPriors | function | 121 | yes | export function applyPriors( result , priors , mention , slotRole , |
| folded | const | 128 | no | const folded = mention.toLowerCase(); |
| entityPriorById | const | 129 | no | const entityPriorById = new Map((priors.entities ?? []).map((p) =&gt; [p.entityId, p] )); |
| correction | const | 130 | no | const correction = (priors.corrections ?? []).find( (c) =&gt; c.inputText === folded &amp;&amp; c.slotRole === slotRole, ); |
| rescored | const | 133 | no | const rescored = result.matches.map((m) =&gt; { let score = m.score; const prior = entityPriorById.get(m.entity.id); if (prior) score = Math.min(1, score * 0.7 + prior.score * 0.3); // blend, ranking on… |
| score | variable | 134 | no | let score = m.score; |
| prior | const | 135 | no | const prior = entityPriorById.get(m.entity.id); |
| capped | const | 144 | no | const capped = rescored.slice(0, 8); |
| primary | const | 145 | no | const primary = capped.length &gt; 0 ? capped[0] : null; |
| ambiguous | const | 146 | no | const ambiguous = capped.length &gt; 1 &amp;&amp; primary !== null |
| groundWithPriors | function | 152 | yes | export function groundWithPriors( name , entities , priors , slotRole , |
| groundPhraseWithPriors | function | 163 | yes | export function groundPhraseWithPriors( phrase , entities , priors , slotRole , |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./text.mjs | import | 8 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/grammar.mjs](./grammar.mjs.md) | ./ground.mjs |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./ground.mjs |
| [apps/mobile-relay/nlcl/recognize.mjs](./recognize.mjs.md) | ./ground.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/ground.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/ground.ts — entity grounding: a name mention → ranked WorldModel entities.
// Deterministic thresholds (N1): exact > word-prefix > prefix > fuzzy(edit distance) >
// substring. Ties keep world order. This is THE gap-narrowing surface: every mention shows
// what the machine understood, with alternatives.

                                                                                      
import { fold, lev, words } from "./text.mjs";

export const CONTEXT_WORDS = new Set(["this", "that", "it", "them", "they", "latest", "last", "newest", "current"]);

                               
                         
                                                                                         
                                                                   
 

function bestScoreForAlias(name        , alias        )         {
  const n = fold(name);
  const a = fold(alias);
  if (n.length === 0 || a.length === 0) return 0;
  if (n === a) return 1;
  const nw = n.split(/[\s._-]+/).filter(Boolean);
  const aw = a.split(/[\s._-]+/).filter(Boolean);
  // FULL NAME match across separator styles: "peter zhang" ≡ "peter.zhang" (word-set equal)
  if (nw.length > 1 && aw.length > 1 && nw.join(" ") === aw.join(" ")) return 0.98;
  // single-word mention matching a whole word of the alias ("peter" in "peter miller")
  if (nw.length === 1 && aw.includes(n) && n.length >= 3) return 0.9;
  // single-word mention prefixing the alias string ("pete" → "peter.miller")
  if (nw.length === 1 && n.length >= 3 && a.startsWith(n)) return 0.82;
  // fuzzy: distance 1 for names ≥ 5 chars; distance 2 for names ≥ 7 chars
  if (n.length >= 5) {
    const d = lev(n, a, 2);
    if (d <= 1) return 0.72;
    if (n.length >= 7 && d <= 2) return 0.58;
  }
  // substring (min 4)
  if (n.length >= 4 && a.includes(n)) return 0.6;
  if (a.length >= 4 && n.includes(a)) return 0.55;
  return 0;
}

/** Ground a mention against entities (optional type filter). Cap: 8 matches. */
export function ground(name        , entities              , typeFilter           )               {
  const matches                = [];
  for (const entity of entities) {
    if (typeFilter && !typeFilter.includes(entity.type)) continue;
    let best = 0;
    let reason = "";
    for (const alias of entity.names) {
      const s = bestScoreForAlias(name, alias);
      if (s > best) { best = s; reason = `alias "${alias}"`; }
    }
    if (best >= 0.55) {
      matches.push({ entity, score: best, reason: `${reason} (${best === 1 ? "exact" : best >= 0.82 ? "prefix" : best >= 0.72 ? "fuzzy" : "partial"})` });
    }
  }
  matches.sort((a, b) => b.score - a.score || a.entity.id.localeCompare(b.entity.id));
  const capped = matches.slice(0, 8);
  const primary = capped.length > 0 ? capped[0] : null;
  const ambiguous = capped.length > 1 && primary !== null && Math.abs(capped[1].score - primary.score) < 0.01;
  return { matches: capped, primary, ambiguous };
}

/** Resolve a context word ("this") → the referent entity from world context. */
export function resolveContext(word        , world            , typeFilter           )                    {
  const w = fold(word);
  if (!CONTEXT_WORDS.has(w)) return null;
  const wantId = typeFilter?.includes("message") || !typeFilter
    ? world.context.latestMessageId
    : world.context.latestEntityId;
  if (!wantId) return null;
  return world.entities.find((e) => e.id === wantId) ?? null;
}

/** The '@'-symbol suffix convention: contact:peter-miller → "peter-miller". */
export function entitySymbol(entity            )         {
  const suffix = entity.id.includes(":") ? entity.id.split(":").slice(1).join(":") : entity.id;
  return `@${suffix}`;
}
```

_First 80 of 172 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
