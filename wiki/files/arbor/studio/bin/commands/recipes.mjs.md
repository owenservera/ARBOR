# File: studio/bin/commands/recipes.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/recipes.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 12472 B |
| Lines | 182 |
| Hash | f954213b64d1 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| sendAuthorized | function | 15 | no | const sendAuthorized = (ctx) =&gt; !!ctx.flags[&#39;authorize-send&#39;] \|\| devAutoApprove(); |
| shared | const | 17 | no | const shared = { |
| inputFlag | const | 21 | no | const inputFlag = { input: { type: &#39;string&#39;, valueName: &#39;FILE\|-&#39;, desc: &#39;Private JSON object file or stdin (default empty object)&#39; } }; |
| emit | function | 22 | no | const emit = (ctx, result) =&gt; ctx.out.emit(result, (o) =&gt; o.line(JSON.stringify(result, null, 2))); |
| inputOf | function | 23 | no | function inputOf(ctx) { |
| data | variable | 25 | no | let data; |
| callStudio | function | 32 | no | async function callStudio(ctx, method, route, body) { |
| timeout | const | 33 | no | const timeout = ctx.flags.timeout ?? 60; |
| port | const | 34 | no | const port = ctx.flags[&#39;studio-port&#39;] ?? ctx.settings.studioPort; |
| client | variable | 37 | no | let client; |
| code | const | 43 | no | const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(error?.code ?? &#39;&#39;) ? error.code : &#39;STUDIO_CLIENT_ERROR&#39;; |
| only | function | 49 | no | function only(ctx, count, usage) { |
| runRecipeList | function | 53 | yes | export async function runRecipeList(ctx) { |
| family | const | 55 | no | const family = ctx.flags.family; |
| runRecipeShow | function | 59 | yes | export async function runRecipeShow(ctx) { |
| recipe | const | 61 | no | const recipe = recipeDefinition(ctx.args[0]); |
| runRecipeChoose | function | 65 | yes | export async function runRecipeChoose(ctx) { |
| runRecipePlan | function | 70 | yes | export async function runRecipePlan(ctx) { |
| runRecipeExecute | function | 76 | yes | export async function runRecipeExecute(ctx, dependencies = {}) { |
| id | const | 78 | no | const id = ctx.args[0], input = inputOf(ctx); |
| plan | const | 79 | no | const plan = planRecipe(id, input, { execute: !!ctx.flags.execute, authorizeSend: sendAuthorized(ctx), }); |
| request | const | 86 | no | const request = { input, execute: !!ctx.flags.execute, authorizeSend: sendAuthorized(ctx), |
| runRecipeStatus | function | 91 | yes | export async function runRecipeStatus(ctx, dependencies = {}) { |
| runRecipeReconcile | function | 95 | yes | export async function runRecipeReconcile(ctx, dependencies = {}) { |
| request | const | 97 | no | const request = dependencies.request ?? callStudio; |
| runId | const | 98 | no | const runId = encodeURIComponent(ctx.args[0]); |
| key | variable | 99 | no | let key = ctx.flags.key; |
| current | const | 101 | no | const current = await request(ctx, &#39;GET&#39;, &#39;/recipes/runs/&#39; + runId); |
| runRecipeFinish | function | 107 | yes | export async function runRecipeFinish(ctx, dependencies = {}) { |
| runAgentCapabilities | function | 112 | yes | export async function runAgentCapabilities(ctx) { |
| runAgentContext | function | 119 | yes | export async function runAgentContext(ctx) { |
| content | const | 122 | no | const content = readFileSync(new URL(&#39;../../../context.md&#39;, import.meta.url), &#39;utf8&#39;); |
| runAgentStatus | function | 125 | yes | export async function runAgentStatus(ctx, dependencies = {}) { |
| status | const | 129 | no | const status = await (dependencies.request ?? callStudio)(ctx, &#39;GET&#39;, &#39;/status&#39;); |
| dataDir | const | 130 | no | const dataDir = typeof status.dataDir === &#39;string&#39; ? status.dataDir : null; |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:fs | import | 3 | external |
| node:path | import | 4 | external |
| ../lib/registry.mjs | import | 5 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 6 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/config.mjs | import | 7 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/studio/tool-client.mjs | import | 8 | [studio/src/studio/tool-client.mjs](../../src/studio/tool-client.mjs.md) |
| ../../src/recipes/catalog.mjs | import | 9 | [studio/src/recipes/catalog.mjs](../../src/recipes/catalog.mjs.md) |
| ../../src/recipes/plan.mjs | import | 10 | [studio/src/recipes/plan.mjs](../../src/recipes/plan.mjs.md) |
| ../../src/recipes/choose.mjs | import | 11 | [studio/src/recipes/choose.mjs](../../src/recipes/choose.mjs.md) |
| ../lib/dev-auto-approve.mjs | import | 12 | [studio/bin/lib/dev-auto-approve.mjs](../lib/dev-auto-approve.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/recipes.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// One user-facing recipe command dispatches through the ALREADY-RUNNING Studio HTTP hub.
// Discovery/plan operate offline. Run/status/reconcile reuse the hub's single effect owner.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { define, defineGroup } from '../lib/registry.mjs';
import { usageError, CliError } from '../lib/ui.mjs';
import { EXIT } from '../../src/config.mjs';
import { createStudioToolClient } from '../../src/studio/tool-client.mjs';
import { listRecipes, recipeDefinition, RECIPE_FAMILIES } from '../../src/recipes/catalog.mjs';
import { planRecipe } from '../../src/recipes/plan.mjs';
import { chooseRecipe } from '../../src/recipes/choose.mjs';
import { devAutoApprove } from '../lib/dev-auto-approve.mjs';

// --authorize-send, or VIVIM_DEV_AUTO_APPROVE=1 in development.
const sendAuthorized = (ctx) => !!ctx.flags['authorize-send'] || devAutoApprove();

const shared = {
  'studio-port': { type: 'number', valueName: 'PORT', desc: 'Existing Studio HTTP port (default configured port)' },
  timeout: { type: 'number', valueName: 'SECONDS', default: 60, desc: 'One request, 1..60 seconds; no retries' },
};
const inputFlag = { input: { type: 'string', valueName: 'FILE|-', desc: 'Private JSON object file or stdin (default empty object)' } };
const emit = (ctx, result) => ctx.out.emit(result, (o) => o.line(JSON.stringify(result, null, 2)));
function inputOf(ctx) {
  if (!ctx.flags.input) return {};
  let data;
  try {
    data = JSON.parse(readFileSync(ctx.flags.input === '-' ? 0 : ctx.flags.input, 'utf8'));
  } catch { throw usageError('Recipe input must be a readable JSON object; no private input is printed.'); }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw usageError('Recipe input must be one JSON object.');
  return data;
}
async function callStudio(ctx, method, route, body) {
  const timeout = ctx.flags.timeout ?? 60;
  const port = ctx.flags['studio-port'] ?? ctx.settings.studioPort;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 60)
    throw usageError('Timeout must be 1..60 seconds.');
  let client;
  try {
    client = createStudioToolClient({ port, timeoutMs: timeout * 1000,
      ...(process.env.CAPTURE_STUDIO_TOKEN ? { token: process.env.CAPTURE_STUDIO_TOKEN } : {}) });
    return await client.recipeRequest(method, route === '/status' ? '/api/status' : '/api/v1' + route, body);
  } catch (error) {
    const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(error?.code ?? '') ? error.code : 'STUDIO_CLIENT_ERROR';
    throw new CliError(code, { exit: EXIT.ENVIRONMENT, code,
      details: { httpStatus: Number.isInteger(error?.status) ? error.status : null,
        effect: error?.effect === 'unknown' ? 'unknown' : 'none', retry: false } });
  }
}
function only(ctx, count, usage) {
  if (ctx.args.length !== count) throw usageError('Usage: studio ' + usage);
}

export async function runRecipeList(ctx) {
  if (ctx.args.length) throw usageError('Usage: studio recipe list [--family NAME]');
  const family = ctx.flags.family;
  if (family && !RECIPE_FAMILIES.includes(family)) throw usageError('Unknown recipe family: ' + family);
  emit(ctx, { schema: 'vivim.recipe-catalog/1', families: RECIPE_FAMILIES, recipes: listRecipes(family ? { family } : {}) });
}
export async function runRecipeShow(ctx) {
  only(ctx, 1, 'recipe show FAMILY.NAME');
  const recipe = recipeDefinition(ctx.args[0]);
  if (!recipe) throw usageError('Unknown recipe: ' + ctx.args[0]);
  emit(ctx, recipe);
}
export async function runRecipeChoose(ctx) {
  only(ctx, 0, 'recipe choose --intent TEXT');
  if (!ctx.flags.intent) throw usageError('Provide an intent with --intent TEXT.');
  emit(ctx, chooseRecipe(ctx.flags.intent, { ...(ctx.flags.family ? { family: ctx.flags.family } : {}) }));
}
export async function runRecipePlan(ctx) {
  only(ctx, 1, 'recipe plan FAMILY.NAME [--input FILE]');
  emit(ctx, planRecipe(ctx.args[0], inputOf(ctx), {
    execute: !!ctx.flags.execute, authorizeSend: sendAuthorized(ctx),
  }));
}
export async function runRecipeExecute(ctx, dependencies = {}) {
  only(ctx, 1, 'recipe run FAMILY.NAME [--input FILE] [--execute] [--authorize-send]');
  const id = ctx.args[0], input = inputOf(ctx);
  const plan = planRecipe(id, input, {
    execute: !!ctx.flags.execute, authorizeSend: sendAuthorized(ctx),
```

_First 80 of 183 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
