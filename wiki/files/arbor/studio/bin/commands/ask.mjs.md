# File: studio/bin/commands/ask.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/commands/ask.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 24715 B |
| Lines | 345 |
| Hash | aa9695e4569a |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| TERMINAL_JOB_STATES | const | 31 | no | const TERMINAL_JOB_STATES = new Set([&#39;complete&#39;, &#39;partial&#39;, &#39;failed&#39;, &#39;cancelled&#39;]); |
| KNOWN_SITES | const | 32 | no | const KNOWN_SITES = [&#39;chatgpt&#39;, &#39;claude&#39;, &#39;zai&#39;, &#39;qwen&#39;, &#39;deepseek&#39;, &#39;gemini&#39;]; |
| client | function | 34 | no | function client(ctx) { |
| seconds | const | 35 | no | const seconds = ctx.flags.timeout ?? 15; |
| callStudio | function | 40 | no | async function callStudio(ctx, method, route, body) { |
| code | const | 44 | no | const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(error?.code ?? &#39;&#39;) ? error.code : &#39;STUDIO_CLIENT_ERROR&#39;; |
| questionFrom | function | 50 | no | function questionFrom(flags) { |
| parts | const | 51 | no | const parts = []; |
| content | variable | 55 | no | let content; |
| readDiff | function | 67 | no | function readDiff(range) { |
| readContextFiles | function | 74 | no | function readContextFiles(paths) { |
| rankSites | function | 85 | no | function rankSites(providers) { |
| autoSites | function | 90 | no | async function autoSites(request, n) { |
| report | const | 91 | no | const report = await request(&#39;GET&#39;, &#39;/providers/performance&#39;); |
| ranked | const | 92 | no | const ranked = rankSites(report?.providers ?? []); |
| printResult | function | 96 | no | function printResult(ctx, result) { |
| saveAskResult | function | 110 | no | function saveAskResult({ role, rawQuestion, diffRange, filePaths, job }) { |
| stamp | const | 111 | no | const stamp = new Date().toISOString().replace(/[:.]/g, &#39;-&#39;); |
| dir | const | 112 | no | const dir = path.join(TOOL_ROOT, &#39;docs&#39;, &#39;session&#39;, &#39;ai-work&#39;); |
| file | const | 114 | no | const file = path.join(dir, `${stamp}-${role ?? &#39;ask&#39;}.md`); |
| context | const | 115 | no | const context = [diffRange ? `diff ${diffRange}` : null, filePaths?.length ? `files: ${filePaths.join(&#39;, &#39;)}` : null].filter(Boolean); |
| lines | const | 116 | no | const lines = [`# Ask — ${role ?? &#39;question&#39;} — ${stamp}`, &#39;&#39;, &#39;## Question&#39;, &#39;&#39;, truncate(rawQuestion, 2000)]; |
| ms | const | 120 | no | const ms = r.startedAt &amp;&amp; r.answeredAt ? Date.parse(r.answeredAt) - Date.parse(r.startedAt) : null; |
| patternOptions | function | 131 | no | function patternOptions(flags) { |
| options | const | 132 | no | const options = {}; |
| printPlan | function | 139 | no | function printPlan(ctx, plan) { |
| result | const | 141 | no | const result = plan.result; |
| time | const | 150 | no | const time = Number.isFinite(s.answerMs) ? &#39; (&#39; + fmtMs(s.answerMs) + &#39;)&#39; : &#39;&#39;; |
| savePlanResult | function | 154 | no | function savePlanResult({ role, rawQuestion, diffRange, filePaths, plan }) { |
| stamp | const | 155 | no | const stamp = new Date().toISOString().replace(/[:.]/g, &#39;-&#39;); |
| dir | const | 156 | no | const dir = path.join(TOOL_ROOT, &#39;docs&#39;, &#39;session&#39;, &#39;ai-work&#39;); |
| file | const | 158 | no | const file = path.join(dir, `${stamp}-${plan.pattern}-${role ?? &#39;ask&#39;}.md`); |
| context | const | 159 | no | const context = [diffRange ? `diff ${diffRange}` : null, filePaths?.length ? `files: ${filePaths.join(&#39;, &#39;)}` : null].filter(Boolean); |
| lines | const | 160 | no | const lines = [`# Ask (${plan.title}) — ${role ?? &#39;question&#39;} — ${stamp}`, &#39;&#39;, &#39;## Question&#39;, &#39;&#39;, truncate(rawQuestion, 2000)]; |
| runPattern | function | 173 | no | async function runPattern(ctx, { request, pattern, question, sites, role, rawQuestion, diffRange, filePaths }) { |
| options | const | 174 | no | const options = patternOptions(ctx.flags); |
| mustWait | const | 175 | no | const mustWait = !!ctx.flags.wait \|\| !!ctx.flags.save; |
| started | const | 176 | no | const started = await request(&#39;POST&#39;, &#39;/orchestrate&#39;, { pattern, question, sites, options }); |
| plan | variable | 177 | no | let plan = started.plan; |
| waitSeconds | const | 182 | no | const waitSeconds = Number.isSafeInteger(ctx.flags[&#39;wait-timeout&#39;]) ? ctx.flags[&#39;wait-timeout&#39;] : 900; |
| deadline | const | 183 | no | const deadline = Date.now() + Math.max(1, waitSeconds) * 1000; |
| sleep | function | 184 | no | const sleep = (ms) =&gt; new Promise((resolve) =&gt; { setTimeout(resolve, ms); }); |
| shown | const | 185 | no | const shown = new Set(); // events are a capped rolling log; print each one once |
| id | const | 188 | no | const id = e.at + &#39;\|&#39; + (e.step ?? &#39;&#39;) + &#39;\|&#39; + e.text; |
| runAsk | function | 208 | yes | export async function runAsk(ctx, dependencies = {}) { |
| role | const | 209 | no | const role = ctx.flags.role ?? null; |
| diffRange | const | 210 | no | const diffRange = typeof ctx.flags.diff === &#39;string&#39; &amp;&amp; ctx.flags.diff ? ctx.flags.diff : null; |
| filePaths | const | 211 | no | const filePaths = ctx.flags.files?.length ? ctx.flags.files : []; |
| printPrompt | const | 212 | no | const printPrompt = !!ctx.flags[&#39;print-prompt&#39;]; |
| autoN | const | 213 | no | const autoN = ctx.flags.auto; |
| pattern | const | 215 | no | const pattern = ctx.flags.pattern ?? null; |
| autoPattern | const | 216 | no | const autoPattern = pattern === &#39;auto&#39;; |
| diffText | variable | 221 | no | let diffText = &#39;&#39;; |
| secret | const | 228 | no | const secret = secretPathsInDiff(diffText); |
| contextFiles | const | 231 | no | const contextFiles = filePaths.length ? readContextFiles(filePaths) : []; |
| rawQuestion | const | 233 | no | const rawQuestion = questionFrom(ctx.flags); |
| question | variable | 234 | no | let question = rawQuestion; |
| built | const | 236 | no | const built = buildPrompt({ role, question: rawQuestion, diff: diffText, diffRange, files: contextFiles }); |
| checkPattern | function | 244 | no | const checkPattern = (sites) =&gt; { |
| plan | const | 251 | no | const plan = pattern &amp;&amp; autoN === undefined ? checkPattern(ctx.args) : null; |
| request | function | 261 | no | const request = (...a) =&gt; (dependencies.request ?? callStudio)(ctx, ...a); |
| sites | const | 262 | no | const sites = autoN !== undefined ? await autoSites(request, autoN) : ctx.args; |
| mustWait | const | 267 | no | const mustWait = !!ctx.flags.wait \|\| !!ctx.flags.save; |
| started | const | 269 | no | const started = await request(&#39;POST&#39;, &#39;/compare&#39;, { question, sites }); |
| job | variable | 270 | no | let job = started.job; |
| waitSeconds | const | 279 | no | const waitSeconds = Number.isSafeInteger(ctx.flags[&#39;wait-timeout&#39;]) ? ctx.flags[&#39;wait-timeout&#39;] : 900; // CLI-side polling patience only; never a resend |
| deadline | const | 280 | no | const deadline = Date.now() + Math.max(1, waitSeconds) * 1000; |
| sleep | function | 281 | no | const sleep = (ms) =&gt; new Promise((resolve) =&gt; { setTimeout(resolve, ms); }); |
| announced | const | 282 | no | const announced = new Map(); |
| read | const | 294 | no | const read = await request(&#39;GET&#39;, &#39;/compare/&#39; + encodeURIComponent(job.id)); |
| file | const | 304 | no | const file = saveAskResult({ role, rawQuestion, diffRange, filePaths, job }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:child_process | import | 21 | external |
| node:fs | import | 22 | external |
| node:path | import | 23 | external |
| ../lib/registry.mjs | import | 24 | [studio/bin/lib/registry.mjs](../lib/registry.mjs.md) |
| ../lib/ui.mjs | import | 25 | [studio/bin/lib/ui.mjs](../lib/ui.mjs.md) |
| ../../src/config.mjs | import | 26 | [studio/src/config.mjs](../../src/config.mjs.md) |
| ../../src/studio/tool-client.mjs | import | 27 | [studio/src/studio/tool-client.mjs](../../src/studio/tool-client.mjs.md) |
| ../../src/studio/ask-prompts.mjs | import | 28 | [studio/src/studio/ask-prompts.mjs](../../src/studio/ask-prompts.mjs.md) |
| ../../src/studio/orchestrator-patterns.mjs | import | 29 | [studio/src/studio/orchestrator-patterns.mjs](../../src/studio/orchestrator-patterns.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/studio.mjs](../studio.mjs.md) | ./commands/ask.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// `studio ask`: one or more AI sites asked through the EXISTING /api/v1/compare route on an
// ALREADY-RUNNING Studio (src/studio/compare-routes.mjs -> compare-service.mjs). This file opens
// no browser and runs no runtime of its own; it is a thin HTTP caller, same pattern as recipes.mjs.
// --wait only ever re-polls the SAME job id (GET /api/v1/compare/{id}); it never posts a second
// question. Re-running this exact command (same sites + question) while the job is still active
// reattaches to that SAME job instead of asking again — compare-service.mjs dedupes that itself.
//
// Developer-helper layer on top of that same thin call:
//  --role <reviewer|implementer|explainer|copywriter>  builds a bounded, role-specific prompt
//    (src/studio/ask-prompts.mjs) instead of sending the raw --question text verbatim.
//  --diff <git-rev-range> / --files a,b  attach READ-ONLY local context (git diff / file contents),
//    capped in size and refused outright for secret-looking paths (.env, credentials, keys, …) —
//    those never get read, let alone sent to a third-party AI website.
//  --auto N  asks the N healthiest/fastest signed-in sites from GET /api/v1/providers/performance
//    instead of naming sites (falls back to chatgpt,claude when there is no history yet).
//  --save  waits for the job to finish, then writes the question summary, each provider's answer,
//    its time-to-answer and state to docs/session/ai-work/<timestamp>-<role>.md. It never writes
//    diff/file CONTENT, only that --diff/--files were used, so a saved file can never leak secrets.
//  --print-prompt  prints the built prompt and returns WITHOUT posting anything — a fully offline
//    dry run (no Studio, no browser, no network) for checking what would be sent.
import { execFile } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { define } from '../lib/registry.mjs';
import { usageError, envError, CliError, fmtMs, truncate } from '../lib/ui.mjs';
import { EXIT, TOOL_ROOT } from '../../src/config.mjs';
import { createStudioToolClient } from '../../src/studio/tool-client.mjs';
import { ROLE_NAMES, buildPrompt, isSecretPath, secretPathsInDiff } from '../../src/studio/ask-prompts.mjs';
import { PATTERN_NAMES, PATTERN_CHOICES, PATTERNS, buildPlanSpec } from '../../src/studio/orchestrator-patterns.mjs';

const TERMINAL_JOB_STATES = new Set(['complete', 'partial', 'failed', 'cancelled']);
const KNOWN_SITES = ['chatgpt', 'claude', 'zai', 'qwen', 'deepseek', 'gemini'];

function client(ctx) {
  const seconds = ctx.flags.timeout ?? 15;
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 60) throw usageError('--timeout (per HTTP request) must be 1-60 seconds.');
  return createStudioToolClient({ port: ctx.flags['studio-port'] ?? ctx.settings.studioPort, timeoutMs: seconds * 1000,
    ...(process.env.CAPTURE_STUDIO_TOKEN ? { token: process.env.CAPTURE_STUDIO_TOKEN } : {}) });
}
async function callStudio(ctx, method, route, body) {
  try { return await client(ctx).recipeRequest(method, '/api/v1' + route, body); }
  catch (error) {
    if (error?.status === 503) throw envError('Could not reach the running Studio.', 'Start it first ("studio launch"), or pass the right --studio-port.');
    const code = /^[A-Z][A-Z0-9_]{0,79}$/.test(error?.code ?? '') ? error.code : 'STUDIO_CLIENT_ERROR';
    throw new CliError(code, { exit: EXIT.ENVIRONMENT, code,
      details: { httpStatus: Number.isInteger(error?.status) ? error.status : null, effect: error?.effect === 'unknown' ? 'unknown' : 'none', retry: false } });
  }
}

function questionFrom(flags) {
  const parts = [];
  if (typeof flags.question === 'string' && flags.question.trim()) parts.push(flags.question.trim());
  if (typeof flags.file === 'string' && flags.file) {
    if (isSecretPath(flags.file)) throw usageError(`Refusing to read --file "${flags.file}": looks like a secret/credentials path.`, 'VIVIM never sends secret-looking files to an AI website.');
    let content;
    try { content = readFileSync(flags.file, 'utf8'); }
    catch (e) { throw usageError(`Could not read --file "${flags.file}": ${e.code ?? e.message}`); }
    if (content.trim()) parts.push(content.trim());
  }
  if (!parts.length) throw usageError('Provide a question with --question "..." or --file prompt.md (or both).');
  return parts.join('\n\n');
}

// Read-only: `git diff <range>` in the repo checkout, never a working-tree write. 15s ceiling and a
// generous buffer so a legitimate large diff never silently truncates mid-process; the final cap
// (and the warning for it) happens once, in ask-prompts.mjs, next to the files/question caps.
function readDiff(range) {
  return new Promise((resolve, reject) => {
    execFile('git', ['diff', '--no-color', range], { cwd: TOOL_ROOT, maxBuffer: 16 * 1024 * 1024, timeout: 15000 },
      (error, stdout, stderr) => { if (error) reject(Object.assign(error, { stderr })); else resolve(stdout); });
  });
}

function readContextFiles(paths) {
  return paths.map((p) => {
    if (isSecretPath(p)) throw usageError(`Refusing to read --files entry "${p}": looks like a secret/credentials path.`, 'VIVIM never sends secret-looking files to an AI website. Remove it from --files.');
    try { return { path: p, content: readFileSync(p, 'utf8') }; }
    catch (e) { throw usageError(`Could not read --files entry "${p}": ${e.code ?? e.message}`); }
  });
}
```

_First 80 of 346 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
