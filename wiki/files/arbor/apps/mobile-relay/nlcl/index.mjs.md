# File: apps/mobile-relay/nlcl/index.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/nlcl/index.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3201 B |
| Lines | 63 |
| Hash | a45bf1a49328 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| interpret | export | 9 | yes | export { interpret } |
| lex | export | 10 | yes | export { lex } |
| FAMILY_BY_CHAR | export | 11 | yes | export { SYMBOL_FAMILIES, FAMILY_BY_CHAR, STOPWORDS, MODIFIER_WORDS } |
| MODIFIER_WORDS | export | 11 | yes | export { SYMBOL_FAMILIES, FAMILY_BY_CHAR, STOPWORDS, MODIFIER_WORDS } |
| STOPWORDS | export | 11 | yes | export { SYMBOL_FAMILIES, FAMILY_BY_CHAR, STOPWORDS, MODIFIER_WORDS } |
| SYMBOL_FAMILIES | export | 11 | yes | export { SYMBOL_FAMILIES, FAMILY_BY_CHAR, STOPWORDS, MODIFIER_WORDS } |
| DEFAULT_FRAMES | export | 12 | yes | export { DEFAULT_FRAMES, NCLL_VERSION, framesForWorld } |
| NCLL_VERSION | export | 12 | yes | export { DEFAULT_FRAMES, NCLL_VERSION, framesForWorld } |
| framesForWorld | export | 12 | yes | export { DEFAULT_FRAMES, NCLL_VERSION, framesForWorld } |
| buildCanonical | export | 17 | yes | export { matchFrames, fillFrame, buildPayload, buildCanonical, buildReading, } |
| buildPayload | export | 17 | yes | export { matchFrames, fillFrame, buildPayload, buildCanonical, buildReading, } |
| buildReading | export | 17 | yes | export { matchFrames, fillFrame, buildPayload, buildCanonical, buildReading, } |
| fillFrame | export | 17 | yes | export { matchFrames, fillFrame, buildPayload, buildCanonical, buildReading, } |
| matchFrames | export | 17 | yes | export { matchFrames, fillFrame, buildPayload, buildCanonical, buildReading, } |
| projectEffects | export | 21 | yes | export { projectTokens, projectEffects } |
| projectTokens | export | 21 | yes | export { projectTokens, projectEffects } |
| fold | export | 22 | yes | export { fold, unquote, lev, slug, prettifyLocalPart, words } |
| lev | export | 22 | yes | export { fold, unquote, lev, slug, prettifyLocalPart, words } |
| prettifyLocalPart | export | 22 | yes | export { fold, unquote, lev, slug, prettifyLocalPart, words } |
| slug | export | 22 | yes | export { fold, unquote, lev, slug, prettifyLocalPart, words } |
| unquote | export | 22 | yes | export { fold, unquote, lev, slug, prettifyLocalPart, words } |
| words | export | 22 | yes | export { fold, unquote, lev, slug, prettifyLocalPart, words } |
| emptyWorld | function | 38 | yes | export function emptyWorld() { |
| contactFromAddress | function | 49 | yes | export function contactFromAddress(address , at ) { |
| addressFolded | const | 50 | no | const addressFolded = address.toLowerCase(); |
| local | const | 51 | no | const local = addressFolded.split(&quot;@&quot;)[0] ?? addressFolded; |
| label | const | 52 | no | const label = prettifyLocalPart(local); |
| labelFolded | const | 53 | no | const labelFolded = label.toLowerCase(); |
| names | const | 54 | no | const names = [local, addressFolded, labelFolded, ...local.split(/[._-]+/).filter((s) =&gt; s.length &gt;= 3)]; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./interpret.mjs | export_from | 9 | [apps/mobile-relay/nlcl/interpret.mjs](./interpret.mjs.md) |
| ./lexer.mjs | export_from | 10 | [apps/mobile-relay/nlcl/lexer.mjs](./lexer.mjs.md) |
| ./symbols.mjs | export_from | 11 | [apps/mobile-relay/nlcl/symbols.mjs](./symbols.mjs.md) |
| ./frames.mjs | export_from | 12 | [apps/mobile-relay/nlcl/frames.mjs](./frames.mjs.md) |
| ./ground.mjs | export_from | 13 | [apps/mobile-relay/nlcl/ground.mjs](./ground.mjs.md) |
| ./grammar.mjs | export_from | 17 | [apps/mobile-relay/nlcl/grammar.mjs](./grammar.mjs.md) |
| ./recognize.mjs | export_from | 18 | [apps/mobile-relay/nlcl/recognize.mjs](./recognize.mjs.md) |
| ./project.mjs | export_from | 21 | [apps/mobile-relay/nlcl/project.mjs](./project.mjs.md) |
| ./text.mjs | export_from | 22 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |
| ./text.mjs | import | 34 | [apps/mobile-relay/nlcl/text.mjs](./text.mjs.md) |
| ./frames.mjs | import | 35 | [apps/mobile-relay/nlcl/frames.mjs](./frames.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/control-language.mjs](../control-language.mjs.md) | ./nlcl/index.mjs |
| [apps/vivim-host/test/control-language.test.mjs](../../vivim-host/test/control-language.test.mjs.md) | ../../mobile-relay/nlcl/index.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// VENDORED from vivim-omega plugins/vivim-nlcl-pure/src/index.ts — do not edit; regenerate with tools/control/vendor-nlcl.mjs
// @vivim/omega-nlcl-pure — the deterministic Natural Command Language Layer core (Ω11).
// ZERO imports outside this package. The exact same bytes run:
//   1. inside the vivim.nlcl compartment (nlcl.interpret@1),
//   2. in the web surface server (authoritative parse),
//   3. in the browser (keystroke-latency feedback against the replicated WorldModel).
// Determinism law N1: interpret(text, world) is pure — same input, same output, always.

export { interpret } from "./interpret.mjs";
export { lex } from "./lexer.mjs";
export { SYMBOL_FAMILIES, FAMILY_BY_CHAR, STOPWORDS, MODIFIER_WORDS } from "./symbols.mjs";
export { DEFAULT_FRAMES, NCLL_VERSION, framesForWorld } from "./frames.mjs";
export {
  ground, groundPhrase, entitySymbol, CONTEXT_WORDS,
  applyPriors, groundWithPriors, groundPhraseWithPriors,
} from "./ground.mjs";
export { matchFrames, fillFrame, buildPayload, buildCanonical, buildReading,                } from "./grammar.mjs";
export {
  recognizeHelp, recognizeEntityQuery, recognizeTeach, recognizeRule, recognizeReceive, recognizeInbox,
} from "./recognize.mjs";
export { projectTokens, projectEffects } from "./project.mjs";
export { fold, unquote, lev, slug, prettifyLocalPart, words } from "./text.mjs";

             
                                                                                            
                                                                                               
                                                                                                    
                                                                        
                                                                      
                                                                                     
                    

                                                         
import { prettifyLocalPart, slug } from "./text.mjs";
import { NCLL_VERSION } from "./frames.mjs";

/** Build an empty world (tests, fixtures, bootstrapping). */
export function emptyWorld()             {
  return {
    v: 1, t: 0,
    kernel: { composition: "empty", nlclVersion: NCLL_VERSION, plugins: [] },
    ops: [], entities: [], lexicon: [], rules: [],
    context: { latestMessageId: null, latestEntityId: null },
  };
}

/** Derive a contact EntityView from an email address — the mind's contact derivation uses
 *  this exact function so derived contacts are byte-identical everywhere (N1). */
export function contactFromAddress(address        , at         )             {
  const addressFolded = address.toLowerCase();
  const local = addressFolded.split("@")[0] ?? addressFolded;
  const label = prettifyLocalPart(local);
  const labelFolded = label.toLowerCase();
  const names = [local, addressFolded, labelFolded, ...local.split(/[._-]+/).filter((s) => s.length >= 3)];
  return {
    id: `contact:${slug(local)}`,
    type: "contact",
    label,
    names: [...new Set(names)],
    data: { address: addressFolded },
    at,
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
