# File: apps/mobile-relay/nlcl/interpret.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/interpret.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 11495 B |
| Lines | 231 |
| Hash | d63f7c6320ab |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| interpret | function | 15 | yes | export function interpret(input , world ) { |
| stages | const | 16 | no | const stages = []; |
| raw | const | 17 | no | const raw = input ?? &quot;&quot;; |
| e | const | 19 | no | const e = emptyInterp(raw, world); |
| modifiers | const | 31 | no | const modifiers = {}; |
| modifierTokenIdx | const | 32 | no | const modifierTokenIdx = new Set (); |
| fam | const | 40 | no | const fam = MODIFIER_WORDS[t.norm]; |
| folded | const | 51 | no | const folded = fold(raw); |
| recSteps | const | 54 | no | const recSteps = [ |
| interp | const | 64 | no | const interp = assemble(raw, world, tokens, rec.ir, rec.notes, rec.gaps, stages, null, rec.followUp, modifierTokenIdx); |
| eq | const | 71 | no | const eq = recognizeEntityQuery(raw, world); |
| candidates | const | 80 | no | const candidates = matchFrames(tokens, world); |
| wordTokens | const | 87 | no | const wordTokens = tokens.filter((t) =&gt; t.kind === &quot;word&quot; &amp;&amp; !STOPWORDS.includes(t.norm)); |
| first | const | 88 | no | const first = wordTokens[0]?.norm ?? &quot;&quot;; |
| unknownWord | const | 89 | no | const unknownWord = first.length &gt; 0 ? first : null; |
| suggestions | const | 90 | no | const suggestions = []; |
| gaps | const | 98 | no | const gaps = unknownWord |
| e | const | 101 | no | const e = emptyInterp(raw, world); |
| primary | const | 114 | no | const primary = candidates[0]; |
| ties | const | 115 | no | const ties = candidates.filter((c) =&gt; c !== primary &amp;&amp; Math.abs(c.ir.confidence - primary.ir.confidence) &lt; 0.05 &amp;&amp; c.ir.intent !== primary.ir.intent); |
| ambiguous | const | 121 | no | const ambiguous = primary.entityAmbiguous \|\| ties.length &gt; 0; |
| interp | const | 125 | no | const interp = assemble(raw, world, tokens, primary.ir, primary.notes, primary.gaps, stages, ties.length &gt; 0 ? ties : [], undefined, modifierTokenIdx, primary); |
| status | variable | 128 | no | let status ; |
| slotHint | function | 144 | no | function slotHint(fs ) { |
| scoreCandidate | function | 152 | no | function scoreCandidate(c ) { |
| s | variable | 155 | no | let s = c.verbCls === &quot;fuzzy&quot; ? 0.3 : c.verbCls === &quot;taught&quot; ? 0.4 : 0.45; |
| escapeRe | function | 176 | no | function escapeRe(s ) { |
| assemble | function | 180 | no | function assemble( raw , world , tokens , ir , notes , gaps , stages , alternatives , followUp , modifierTokenIdx , primary , ) { |
| tokenNotes | const | 184 | no | const tokenNotes = projectTokens(tokens, primary ?? null, modifierTokenIdx, notes); |
| effects | const | 185 | no | const effects = projectEffects(ir, world); |
| suggestions | const | 186 | no | const suggestions = []; |
| interp | const | 199 | no | const interp = { |
| hasSymbols | const | 216 | no | const hasSymbols = tokens.some((t) =&gt; t.kind === &quot;symbol&quot; \|\| t.kind === &quot;ref&quot; \|\| t.kind === &quot;cmd&quot; \|\| t.kind === &quot;arrow&quot; \|\| t.kind === &quot;tag&quot;); |
| defaultSuggestions | function | 223 | no | function defaultSuggestions(world ) { |
| out | const | 224 | no | const out = []; |
| frames | const | 225 | no | const frames = framesForWorld(world); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./frames.mjs | import | 7 | [apps/mobile-relay/nlcl/frames.mjs](./frames.mjs.md) |
| ./lexer.mjs | import | 8 | [apps/mobile-relay/nlcl/lexer.mjs](./lexer.mjs.md) |
| ./grammar.mjs | import | 9 | [apps/mobile-relay/nlcl/grammar.mjs](./grammar.mjs.md) |
| ./recognize.mjs | import | 10 | [apps/mobile-relay/nlcl/recognize.mjs](./recognize.mjs.md) |
| ./symbols.mjs | import | 11 | [apps/mobile-relay/nlcl/symbols.mjs](./symbols.mjs.md) |
| ./text.mjs | import | 12 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |
| ./project.mjs | import | 13 | [apps/mobile-relay/nlcl/project.mjs](./project.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/nlcl/index.mjs](./index.mjs.md) | ./interpret.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/interpret.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// nlcl-pure/src/interpret.ts — THE pipeline (N1: pure, deterministic, traced).
// scan → lex → symbol-parse(modifiers) → recognizers → frame-match → ground → resolve →
// project. The result is the full Interpretation the console renders per keystroke.

                                                                                                                    
import { NCLL_VERSION, framesForWorld, closestVerbs } from "./frames.mjs";
import { lex } from "./lexer.mjs";
import { matchFrames,                } from "./grammar.mjs";
import { recognizeHelp, recognizeEntityQuery, recognizeTeach, recognizeRule, recognizeReceive, recognizeInbox, emptyInterp } from "./recognize.mjs";
import { MODIFIER_WORDS, STOPWORDS } from "./symbols.mjs";
import { fold } from "./text.mjs";
import { projectTokens, projectEffects } from "./project.mjs";

export function interpret(input        , world            )                 {
  const stages               = [];
  const raw = input ?? "";
  if (raw.trim().length === 0) {
    const e = emptyInterp(raw, world);
    e.stages.push({ stage: "scan", notes: ["empty input"] });
    e.suggestions = defaultSuggestions(world);
    return e;
  }
  stages.push({ stage: "scan", notes: [`${raw.length} chars`] });

  // ---- lex ----
  const { tokens, syntaxNotes } = lex(raw);
  stages.push({ stage: "lex", notes: [`${tokens.length} tokens${syntaxNotes.length ? `; ${syntaxNotes.join("; ")}` : ""}`] });

  // ---- symbol-parse: modifiers ----
  const modifiers                  = {};
  const modifierTokenIdx = new Set        ();
  for (const t of tokens) {
    if (t.kind === "symbol") {
      if (t.norm === "!") { modifiers.force = true; modifierTokenIdx.add(t.i); }
      else if (t.norm === "^") { modifiers.priority = true; modifierTokenIdx.add(t.i); }
      else if (t.norm === "~") { modifiers.fuzzy = true; modifierTokenIdx.add(t.i); }
    }
    if (t.kind === "word" && MODIFIER_WORDS[t.norm] !== undefined) {
      const fam = MODIFIER_WORDS[t.norm];
      if (fam === "!") modifiers.force = true;
      if (fam === "^") modifiers.priority = true;
      modifierTokenIdx.add(t.i);
    }
  }
  if (tokens.length > 0 && tokens[0].kind === "symbol" && tokens[0].norm === "?") modifiers.query = true;
  stages.push({ stage: "symbol-parse", notes: [
    Object.entries(modifiers).filter(([, v]) => v).map(([k]) => `${k} modifier`).join(", ") || "no modifiers",
  ] });

  const folded = fold(raw);

  // ---- recognizers (priority order) ----
  const recSteps                                                    = [
    ["recognize:help", recognizeHelp(folded, tokens, world)],
    ["recognize:inbox", recognizeInbox(folded)],
    ["recognize:teach", recognizeTeach(folded, world)],
    ["recognize:rule", recognizeRule(folded, tokens, world)],
    ["recognize:receive", recognizeReceive(folded, world)],
  ];
  for (const [name, rec] of recSteps) {
    if (rec) {
      rec.ir.modifiers = modifiers;
      const interp = assemble(raw, world, tokens, rec.ir, rec.notes, rec.gaps, stages, null, rec.followUp, modifierTokenIdx);
      stages.push({ stage: `resolve:${name}`, notes: ["matched"] });
      return interp;
    }
  }
  // entity query only when NOT also a frame verb phrase ("who is peter" — no verb)
  if (/^(?:who|what)\s+is\s+/.test(folded) || /^tell me about\s+/.test(folded)) {
    const eq = recognizeEntityQuery(raw, world);
    if (eq) {
      eq.ir.modifiers = modifiers;
      stages.push({ stage: "resolve:entity-query", notes: ["matched"] });
      return assemble(raw, world, tokens, eq.ir, eq.notes, eq.gaps, stages, null, undefined, modifierTokenIdx);
    }
  }

  // ---- frame matching ----
  const candidates = matchFrames(tokens, world);
```

_First 80 of 232 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
