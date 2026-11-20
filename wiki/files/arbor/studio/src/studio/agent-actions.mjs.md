# File: studio/src/studio/agent-actions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/agent-actions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 28575 B |
| Lines | 454 |
| Hash | 7c467809dafc |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| ACTION_TYPES | const | 24 | yes | export const ACTION_TYPES = Object.freeze([ &#39;read_file&#39;, &#39;list_files&#39;, &#39;search&#39;, &#39;propose_edit&#39;, &#39;write_file&#39;, &#39;run_command&#39;, &#39;ask_ai&#39;, &#39;save_to_work&#39;, &#39;note&#39;, &#39;finish&#39;, ]); |
| ASK_AI_PATTERNS | const | 29 | yes | export const ASK_AI_PATTERNS = Object.freeze([ &#39;single&#39;, &#39;fanout&#39;, &#39;race&#39;, &#39;fallback&#39;, &#39;hedge&#39;, &#39;council&#39;, &#39;judge&#39;, &#39;relay&#39;, &#39;critique&#39;, &#39;verify&#39;, ]); |
| ASK_AI_SITES | const | 32 | yes | export const ASK_AI_SITES = Object.freeze([&#39;chatgpt&#39;, &#39;claude&#39;, &#39;gemini&#39;, &#39;deepseek&#39;, &#39;zai&#39;, &#39;qwen&#39;]); |
| FINISH_STATUSES | const | 33 | yes | export const FINISH_STATUSES = Object.freeze([&#39;done&#39;, &#39;blocked&#39;, &#39;needs_owner&#39;]); |
| READ_ONLY_TYPES | const | 34 | no | const READ_ONLY_TYPES = new Set([&#39;read_file&#39;, &#39;list_files&#39;, &#39;search&#39;, &#39;note&#39;, &#39;finish&#39;]); |
| DEFAULT_BUDGETS | const | 36 | yes | export const DEFAULT_BUDGETS = Object.freeze({ maxSteps: 40, // total actions a loop will run before it must stop and ask the owner maxSends: 8, // total ask_ai sends to other web AIs in one loop max… |
| MAX_ACTIONS_PER_REPLY | const | 45 | yes | export const MAX_ACTIONS_PER_REPLY = DEFAULT_BUDGETS.maxActionsPerReply; |
| MAX_QUESTION_CHARS | const | 46 | no | const MAX_QUESTION_CHARS = 10_000; // mirrors orchestrator-patterns.mjs MAX_QUESTION |
| FENCE | const | 50 | no | const FENCE = /```[ \\t]*([A-Za-z0-9_-]*)[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n?```/g; |
| SMART_SINGLE | const | 51 | no | const SMART_SINGLE = /[\\u2018\\u2019\\u201A\\u201B]/g; |
| SMART_DOUBLE | const | 52 | no | const SMART_DOUBLE = /[\\u201C\\u201D\\u201E\\u201F]/g; |
| straightenQuotes | function | 53 | no | const straightenQuotes = (text) =&gt; text.replace(SMART_SINGLE, &quot;&#39;&quot;).replace(SMART_DOUBLE, &#39;&quot;&#39;); |
| CONTROL_LINE | const | 55 | no | const CONTROL_LINE = /[\\u0000-\\u001f\\u007f]/; |
| CONTROL_TEXT | const | 57 | no | const CONTROL_TEXT = /[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]/; |
| jsonObjectsIn | function | 59 | no | function jsonObjectsIn(text) { |
| found | const | 60 | no | const found = []; |
| depth | variable | 63 | no | let depth = 0, inString = false, end = -1; |
| c | const | 65 | no | const c = text[j]; |
| slice | const | 72 | no | const slice = text.slice(i, end + 1); |
| value | const | 74 | no | const value = JSON.parse(slice); |
| problem | function | 82 | no | function problem(code, message) { return { code, message }; } |
| parseFail | function | 83 | no | function parseFail(code, message, retryPrompt) { return { ok: false, problem: problem(code, message), retryPrompt }; } |
| RETRY_FORMAT | const | 85 | no | const RETRY_FORMAT = &#39;Reply with exactly one fenced code block like:\\n```json\\n{&quot;actions&quot;:[{&quot;type&quot;:&quot;note&quot;,&quot;text&quot;:&quot;...&quot;}],&quot;say&quot;:&quot;...&quot;}\\n```&#39;; |
| extractJsonCandidate | function | 88 | no | function extractJsonCandidate(replyText) { |
| text | const | 89 | no | const text = straightenQuotes(String(replyText ?? &#39;&#39;)); |
| blocks | const | 90 | no | const blocks = [...text.matchAll(FENCE)] |
| whole | const | 95 | no | const whole = text.trim(); |
| objects | const | 97 | no | const objects = whole.length &lt;= 100_000 ? jsonObjectsIn(whole) : []; |
| parseAgentReply | function | 107 | yes | export function parseAgentReply(text) { |
| parsed | variable | 119 | no | let parsed; |
| scopePath | function | 159 | no | function scopePath(raw, workspaceRoot) { |
| root | const | 165 | no | const root = nodePath.resolve(workspaceRoot); |
| resolved | const | 166 | no | const resolved = nodePath.resolve(root, raw); |
| rel | const | 167 | no | const rel = nodePath.relative(root, resolved); |
| SECRET_PATH_PATTERNS | const | 174 | no | const SECRET_PATH_PATTERNS = [ |
| isSecretLookingPath | function | 179 | no | const isSecretLookingPath = (rel) =&gt; SECRET_PATH_PATTERNS.some((re) =&gt; re.test(rel.toLowerCase())); |
| DENY_COMMANDS | const | 184 | yes | export const DENY_COMMANDS = Object.freeze([ { re: /\\brm\\s+-[a-z]*r[a-z]*f[a-z]*\\b\|\\brm\\s+-[a-z]*f[a-z]*r[a-z]*\\b/i, reason: &#39;recursive force delete (rm -rf)&#39; }, { re: /\\bsudo\\s+rm\\b/i, reason: &#39;elev… |
| deniedCommandReason | function | 209 | no | const deniedCommandReason = (command) =&gt; DENY_COMMANDS.find((entry) =&gt; entry.re.test(command))?.reason ?? null; |
| isStr | function | 213 | no | const isStr = (v) =&gt; typeof v === &#39;string&#39;; |
| nonEmpty | function | 214 | no | const nonEmpty = (v, max) =&gt; isStr(v) &amp;&amp; v.trim().length &gt; 0 &amp;&amp; v.length &lt;= max &amp;&amp; !CONTROL_TEXT.test(v); |
| singleLine | function | 215 | no | const singleLine = (v, max) =&gt; isStr(v) &amp;&amp; v.trim().length &gt; 0 &amp;&amp; v.length &lt;= max &amp;&amp; !CONTROL_LINE.test(v); |
| clip | function | 216 | no | const clip = (text, max) =&gt; (text.length &lt;= max ? text : text.slice(0, max) + &#39;\\u2026&#39;); |
| fail | function | 217 | no | const fail = (code, message) =&gt; ({ ok: false, problem: problem(code, message) }); |
| mergeBudgets | function | 219 | no | function mergeBudgets(budgets) { return { ...DEFAULT_BUDGETS, ...(budgets &amp;&amp; typeof budgets === &#39;object&#39; ? budgets : {}) }; } |
| mergeUsed | function | 220 | no | function mergeUsed(used) { return { steps: 0, sends: 0, ...(used &amp;&amp; typeof used === &#39;object&#39; ? used : {}) }; } |
| validateAction | function | 229 | yes | export function validateAction(action, ctx = {}) { |
| budgets | const | 232 | no | const budgets = mergeBudgets(ctx.budgets), used = mergeUsed(ctx.used); |
| path | function | 241 | no | function path(raw, label) { |
| scoped | const | 242 | no | const scoped = scopePath(raw, workspaceRoot); |
| p | const | 250 | no | const p = path(action.path, &#39;path&#39;); if (!p.ok) return p; |
| maxBytes | const | 251 | no | const maxBytes = action.maxBytes === undefined ? Math.min(20_000, budgets.maxReadBytes) : action.maxBytes; |
| dir | const | 258 | no | const dir = action.dir === undefined \|\| action.dir === &#39;&#39; ? &#39;.&#39; : action.dir; |
| p | const | 259 | no | const p = path(dir, &#39;dir&#39;); if (!p.ok) return p; |
| dir | const | 265 | no | const dir = action.dir === undefined \|\| action.dir === &#39;&#39; ? &#39;.&#39; : action.dir; |
| p | const | 266 | no | const p = path(dir, &#39;dir&#39;); if (!p.ok) return p; |
| p | const | 270 | no | const p = path(action.path, &#39;path&#39;); if (!p.ok) return p; |
| hasFindReplace | const | 271 | no | const hasFindReplace = action.find !== undefined \|\| action.replace !== undefined; |
| hasDiff | const | 272 | no | const hasDiff = action.unifiedDiff !== undefined; |
| p | const | 285 | no | const p = path(action.path, &#39;path&#39;); if (!p.ok) return p; |
| reason | const | 292 | no | const reason = deniedCommandReason(action.command); |
| cwd | variable | 294 | no | let cwd = &#39;.&#39;; |
| timeoutSec | const | 296 | no | const timeoutSec = action.timeoutSec === undefined ? 60 : action.timeoutSec; |
| sites | variable | 305 | no | let sites; |
| classify | function | 338 | yes | export function classify(action) { |
| countLines | function | 346 | no | const countLines = (text) =&gt; String(text ?? &#39;&#39;).split(&#39;\\n&#39;).length; |
| diffStat | function | 347 | no | const diffStat = (diff) =&gt; { |
| added | variable | 348 | no | let added = 0, removed = 0; |
| summarize | function | 356 | yes | export function summarize(action) { |
| who | const | 369 | no | const who = action.sites === &#39;auto&#39; ? &#39;an AI VIVIM picks&#39; : (Array.isArray(action.sites) ? action.sites.join(&#39;, &#39;) : String(action.sites)); |
| renderObservation | function | 385 | yes | export function renderObservation(results, opts = {}) { |
| cap | const | 386 | no | const cap = Number.isSafeInteger(opts.maxBytes) &amp;&amp; opts.maxBytes &gt; 0 ? opts.maxBytes : DEFAULT_BUDGETS.maxObservationBytes; |
| list | const | 387 | no | const list = Array.isArray(results) ? results : []; |
| lines | const | 388 | no | const lines = []; let used = 0, shown = 0; |
| head | variable | 390 | no | let head; |
| body | const | 393 | no | const body = entry?.ok |
| block | const | 396 | no | const block = body ? `${head}\\n${body}` : head; |
| remaining | const | 397 | no | const remaining = cap - used; |
| piece | const | 399 | no | const piece = block.length &gt; remaining ? block.slice(0, remaining - 20) + &#39;\\n\\u2026(truncated)&#39; : block; |
| omitted | const | 402 | no | const omitted = list.length - shown; |
| text | variable | 403 | no | let text = lines.join(&#39;\\n\\n&#39;); |
| buildSystemBrief | function | 411 | yes | export function buildSystemBrief({ goal = &#39;&#39;, workspace = &#39;.&#39;, budgets = {} } = {}) { |
| b | const | 412 | no | const b = mergeBudgets(budgets); |
| lines | const | 413 | no | const lines = [ |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:path | import | 20 | external |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````javascript
// Pure protocol module: the action language a WEB AI (ChatGPT/Claude/Gemini/DeepSeek/Z.ai/Qwen,
// typed into in a dedicated signed-in browser tab, no API access, no native tool-calling) writes
// into its own reply so it can act as the primary agent — plan, read/edit local files, run approved
// commands, ask the other web AIs, and report back — the way a coding orchestrator does today.
//
// This module has NO side effects of its own: no filesystem, network, process or browser access.
// It only parses a reply into actions, validates one action against a workspace/budget context,
// classifies it read-only vs effect, renders a plain-language approval summary, renders a compact
// observation to send back to the AI, and builds the one-time instruction text that teaches a web AI
// this protocol. A later lane (the agent loop) is the only thing that actually reads/writes files,
// runs commands or calls src/studio/ai-orchestrator.mjs for ask_ai — this module never does.
//
// Parsing follows the same tolerant approach as src/studio/personal-app-provider-reply.mjs: smart
// quotes are straightened, exactly one JSON object is accepted (fenced ```json preferred, a single
// bare fence or embedded object otherwise), and more than one candidate is refused with a plain next
// step rather than guessed at. The constants below (ask_ai patterns/sites) intentionally MIRROR
// src/studio/orchestrator-patterns.mjs rather than importing it: this file stays import-free from the
// rest of Studio so it can be reviewed, tested and reused on its own. Keep the two lists in sync by
// hand if the orchestrator's pattern/site catalog changes.
import nodePath from 'node:path';

// ---------------------------------------------------------------------------------------------
// Closed vocabulary
export const ACTION_TYPES = Object.freeze([
  'read_file', 'list_files', 'search', 'propose_edit', 'write_file',
  'run_command', 'ask_ai', 'save_to_work', 'note', 'finish',
]);
// Mirrors orchestrator-patterns.mjs PATTERN_NAMES / SITE_LABELS (see note above).
export const ASK_AI_PATTERNS = Object.freeze([
  'single', 'fanout', 'race', 'fallback', 'hedge', 'council', 'judge', 'relay', 'critique', 'verify',
]);
export const ASK_AI_SITES = Object.freeze(['chatgpt', 'claude', 'gemini', 'deepseek', 'zai', 'qwen']);
export const FINISH_STATUSES = Object.freeze(['done', 'blocked', 'needs_owner']);
const READ_ONLY_TYPES = new Set(['read_file', 'list_files', 'search', 'note', 'finish']);

export const DEFAULT_BUDGETS = Object.freeze({
  maxSteps: 40,            // total actions a loop will run before it must stop and ask the owner
  maxSends: 8,             // total ask_ai sends to other web AIs in one loop
  maxReadBytes: 200_000,   // ceiling on a single read_file's maxBytes
  maxWriteBytes: 200_000,  // ceiling on write_file content / propose_edit find+replace+unifiedDiff
  maxCommandSeconds: 300,  // ceiling on run_command timeoutSec
  maxObservationBytes: 8_000, // ceiling on renderObservation's total output
  maxActionsPerReply: 8,   // ceiling on actions inside one parsed reply (parse-time, not overridable)
});
export const MAX_ACTIONS_PER_REPLY = DEFAULT_BUDGETS.maxActionsPerReply;
const MAX_QUESTION_CHARS = 10_000; // mirrors orchestrator-patterns.mjs MAX_QUESTION

// ---------------------------------------------------------------------------------------------
// Tolerant reply parsing (adapted from personal-app-provider-reply.mjs's extractProposalText)
const FENCE = /```[ \t]*([A-Za-z0-9_-]*)[ \t]*\r?\n([\s\S]*?)\r?\n?```/g;
const SMART_SINGLE = /[\u2018\u2019\u201A\u201B]/g;
const SMART_DOUBLE = /[\u201C\u201D\u201E\u201F]/g;
const straightenQuotes = (text) => text.replace(SMART_SINGLE, "'").replace(SMART_DOUBLE, '"');
// Control characters that must never appear in a single-line field (path, command, etc).
const CONTROL_LINE = /[\u0000-\u001f\u007f]/;
// Control characters disallowed in multi-line text fields (content, say, question...); \t \n \r kept.
const CONTROL_TEXT = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function jsonObjectsIn(text) {
  const found = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;
    let depth = 0, inString = false, end = -1;
    for (let j = i; j < text.length && end < 0; j++) {
      const c = text[j];
      if (inString) { if (c === '\\') j++; else if (c === '"') inString = false; }
      else if (c === '"') inString = true;
      else if (c === '{') depth++;
      else if (c === '}' && --depth === 0) end = j;
    }
    if (end < 0) break; // unbalanced from here on: nothing further can close
    const slice = text.slice(i, end + 1);
    try {
      const value = JSON.parse(slice);
      if (value && typeof value === 'object' && !Array.isArray(value) && !found.includes(slice)) found.push(slice);
      i = end;
    } catch { /* not JSON: keep scanning from the next brace */ }
  }
  return found;
}
````

_First 80 of 455 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
