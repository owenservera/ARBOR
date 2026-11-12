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
