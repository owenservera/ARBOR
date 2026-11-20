# File: studio/src/recipes/choose.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/recipes/choose.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3500 B |
| Lines | 47 |
| Hash | bd333222cd2e |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| samples | const | 5 | no | const samples = Object.freeze({ &#39;provider.targets&#39;: [&#39;list browser tabs&#39;, &#39;discover provider tabs&#39;, &#39;available providers&#39;, &#39;browser targets&#39;], &#39;provider.chat-index&#39;: [&#39;chatgpt chat index&#39;, &#39;chatgpt s… |
| tokens | function | 18 | no | const tokens = (s) =&gt; String(s).toLocaleLowerCase(&#39;en&#39;).normalize(&#39;NFKD&#39;) |
| chooseRecipe | function | 20 | yes | export function chooseRecipe(intent, { family, max = 3 } = {}) { |
| words | const | 25 | no | const words = tokens(intent), set = new Set(words); |
| candidates | const | 26 | no | const candidates = listRecipes(family ? { family } : {}).map((recipe) =&gt; { const phrases = samples[recipe.id] ?? []; const matches = phrases.map((p) =&gt; { const keys = tokens(p), found = keys.filter((… |
| phrases | const | 27 | no | const phrases = samples[recipe.id] ?? []; |
| matches | const | 28 | no | const matches = phrases.map((p) =&gt; { const keys = tokens(p), found = keys.filter((word) =&gt; set.has(word)); return { phrase: p, hits: found.length, coverage: found.length / keys.length }; }); |
| keys | const | 29 | no | const keys = tokens(p), found = keys.filter((word) =&gt; set.has(word)); |
| best | const | 32 | no | const best = matches.sort((a, b) =&gt; b.coverage - a.coverage \|\| b.hits - a.hits)[0]; |
| score | const | 33 | no | const score = best &amp;&amp; best.hits &gt;= 2 ? Math.round(best.coverage * 100) : 0; |
| ambiguous | const | 38 | no | const ambiguous = candidates.length &gt; 1 &amp;&amp; candidates[0].score === candidates[1].score; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./catalog.mjs | import | 3 | [studio/src/recipes/catalog.mjs](./catalog.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/recipes.mjs](../../bin/commands/recipes.mjs.md) | ../../src/recipes/choose.mjs |
| [studio/src/studio/recipe-routes.mjs](../studio/recipe-routes.mjs.md) | ../recipes/choose.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Deterministic intent discovery, not LLM routing and never authorization to execute.
// Suggest only recipes registered in the same source-backed catalogue.
import { recipeDefinition, listRecipes } from './catalog.mjs';

const samples = Object.freeze({
  'provider.targets': ['list browser tabs', 'discover provider tabs', 'available providers', 'browser targets'],
  'provider.chat-index': ['chatgpt chat index', 'chatgpt sidebar chats', 'find chatgpt threads'],
  'conversation.list': ['list conversations', 'recent conversations', 'saved chats', 'my conversations'],
  'conversation.inspect': ['conversation status', 'inspect conversation', 'last turn status', 'conversation evidence'],
  'conversation.read': ['read conversation', 'read transcript', 'show recent messages', 'current reply'],
  'conversation.connect-existing': ['connect existing thread', 'attach chatgpt thread', 'resume exact thread'],
  'conversation.continue': ['continue conversation with revision', 'submit turn with revision'],
  'conversation.ask': ['ask a follow up', 'send follow up', 'ask this conversation', 'one command follow up', 'send prompt'],
  'conversation.finish': ['finish conversation capture', 'stop recording conversation', 'finalize conversation'],
  'recovery.reconcile-turn': ['uncertain send', 'unknown delivery', 'reconcile turn', 'possible duplicate send'],
});

const tokens = (s) => String(s).toLocaleLowerCase('en').normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]+/g) ?? [];
export function chooseRecipe(intent, { family, max = 3 } = {}) {
  if (typeof intent !== 'string' || !intent.trim() || intent.length > 1000)
    throw Object.assign(new Error('INVALID_RECIPE_INTENT'), { code: 'INVALID_RECIPE_INTENT', status: 400 });
  if (!Number.isSafeInteger(max) || max < 1 || max > 10)
    throw Object.assign(new Error('INVALID_RECIPE_LIMIT'), { code: 'INVALID_RECIPE_LIMIT', status: 400 });
  const words = tokens(intent), set = new Set(words);
  const candidates = listRecipes(family ? { family } : {}).map((recipe) => {
    const phrases = samples[recipe.id] ?? [];
    const matches = phrases.map((p) => {
      const keys = tokens(p), found = keys.filter((word) => set.has(word));
      return { phrase: p, hits: found.length, coverage: found.length / keys.length };
    });
    const best = matches.sort((a, b) => b.coverage - a.coverage || b.hits - a.hits)[0];
    const score = best && best.hits >= 2 ? Math.round(best.coverage * 100) : 0;
    return { id: recipe.id, family: recipe.family, score, reason: score ? 'vocabulary-overlap:' + best.phrase : 'no-grounded-match',
      effects: recipe.effects, requires: recipe.requires };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, max);
  const ambiguous = candidates.length > 1 && candidates[0].score === candidates[1].score;
  return {
    schema: 'vivim.recipe-choice/1', intentChars: intent.length, candidates, ambiguous,
    selection: candidates.length === 1 || candidates.length && !ambiguous ? candidates[0].id : null,
    status: !candidates.length ? 'no-match' : ambiguous ? 'ambiguous' : 'suggested',
    evidence: 'deterministic-vocabulary-only', authorized: false, executed: false,
    nextSafeAction: !candidates.length || ambiguous ? 'inspect-catalog-and-choose' : 'inspect-recipe-and-plan',
    note: 'Selection is a suggestion, not capability verification or permission to send.',
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
