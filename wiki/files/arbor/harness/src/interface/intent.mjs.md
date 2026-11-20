# File: harness/src/interface/intent.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/src/interface/intent.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 4870 B |
| Lines | 106 |
| Hash | 043cd8794d27 |
| Test | no |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| INTENT_TYPES | const | 6 | yes | export const INTENT_TYPES = Object.freeze([&#39;code-change&#39;, &#39;ui-change&#39;, &#39;data-task&#39;, &#39;webapp-chat&#39;, &#39;mobile-task&#39;, &#39;pc-task&#39;, &#39;question&#39;]); |
| EXECUTION_TARGETS | const | 7 | yes | export const EXECUTION_TARGETS = Object.freeze([&#39;local-pc&#39;, &#39;mobile-app&#39;, &#39;webapp&#39;, &#39;auto&#39;]); |
| DOMAINS | const | 8 | yes | export const DOMAINS = Object.freeze([&#39;code&#39;, &#39;ui&#39;, &#39;data&#39;, &#39;media&#39;, &#39;general&#39;]); |
| PC | const | 10 | no | const PC = /\\b(windows\|pc\|computer\|desktop\|laptop\|local machine\|localhost\|file system\|filesystem\|folder\|directory\|\\.env\|env file\|registry\|powershell\|cmd\\.exe\|task scheduler\|startup\|boot)\\b/i; |
| MOBILE | const | 11 | no | const MOBILE = /\\b(mobile\|phone\|android\|ios\|iphone\|app\\b\|tablet\|handset\|device)\\b/i; |
| CODE | const | 12 | no | const CODE = /\\b(implement\|write (the )?code\|add a (feature\|function\|endpoint)\|fix the bug\|refactor\|make the change\|write a patch\|edit (the \|a )?file\|create (a \|an )?(component\|endpoint\|route\|api)\|di… |
| UI | const | 13 | no | const UI = /\\b(ui\|interface\|layout\|theme\|background\|color\|palette\|font\|typography\|spacing\|responsive\|dashboard\|screen\|page\|component\|widget\|visual\|style\|css\|dark mode\|light mode)\\b/i; |
| DATA | const | 14 | no | const DATA = /\\b(data\|database\|query\|sql\|export\|import\|csv\|json\|spreadsheet\|table\|record\|row\|schema\|migration\|backup\|restore\|analytics\|metric\|log)\\b/i; |
| MEDIA | const | 15 | no | const MEDIA = /\\b(image\|photo\|video\|audio\|picture\|generate\|create an\|draw\|illustrate\|mockup\|wireframe)\\b/i; |
| MEDIAS | const | 16 | no | const MEDIAS = Object.freeze([MEDIA]); |
| QUESTION_END | const | 17 | no | const QUESTION_END = /\\?\\s*$/; |
| containsAny | function | 19 | no | function containsAny(text, res) { return res.some(r =&gt; r.test(text)); } |
| classifyIntent | function | 21 | yes | export function classifyIntent({ task = &#39;&#39;, role = null, constraints = {} } = {}) { |
| text | const | 22 | no | const text = String(task ?? &#39;&#39;); |
| trimmed | const | 23 | no | const trimmed = text.trim(); |
| lower | const | 24 | no | const lower = trimmed.toLowerCase(); |
| intentType | variable | 26 | no | let intentType = &#39;webapp-chat&#39;; |
| executionTarget | variable | 27 | no | let executionTarget = &#39;webapp&#39;; |
| domain | variable | 28 | no | let domain = &#39;general&#39;; |
| confidence | variable | 29 | no | let confidence = 0.45; |
| reasons | const | 30 | no | const reasons = []; |
| roleMap | const | 34 | no | const roleMap = { implementer: &#39;code-change&#39;, reviewer: &#39;code-change&#39;, copywriter: &#39;webapp-chat&#39;, designer: &#39;ui-change&#39;, analyst: &#39;data-task&#39; }; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [harness/src/interface/router.mjs](./router.mjs.md) | ./intent.mjs |
| [harness/test/interface/intent.test.mjs](../../test/interface/intent.test.mjs.md) | ../../src/interface/intent.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Intent classification for user change prompts.
// Classifies what kind of automation the user is asking for, where it should
// execute (local PC, mobile app, or AI webapp), and the domain it touches.
// Pure: no browser, no network, no filesystem. Heuristics only; confidence is
// deliberately modest so callers treat ambiguous input as needing clarification.
export const INTENT_TYPES = Object.freeze(['code-change', 'ui-change', 'data-task', 'webapp-chat', 'mobile-task', 'pc-task', 'question']);
export const EXECUTION_TARGETS = Object.freeze(['local-pc', 'mobile-app', 'webapp', 'auto']);
export const DOMAINS = Object.freeze(['code', 'ui', 'data', 'media', 'general']);

const PC = /\b(windows|pc|computer|desktop|laptop|local machine|localhost|file system|filesystem|folder|directory|\.env|env file|registry|powershell|cmd\.exe|task scheduler|startup|boot)\b/i;
const MOBILE = /\b(mobile|phone|android|ios|iphone|app\b|tablet|handset|device)\b/i;
const CODE = /\b(implement|write (the )?code|add a (feature|function|endpoint)|fix the bug|refactor|make the change|write a patch|edit (the |a )?file|create (a |an )?(component|endpoint|route|api)|diff|pull request|merge|commit|build|deploy|test|lint|typescript|javascript|python|react|node|bash|script|shell)\b/i;
const UI = /\b(ui|interface|layout|theme|background|color|palette|font|typography|spacing|responsive|dashboard|screen|page|component|widget|visual|style|css|dark mode|light mode)\b/i;
const DATA = /\b(data|database|query|sql|export|import|csv|json|spreadsheet|table|record|row|schema|migration|backup|restore|analytics|metric|log)\b/i;
const MEDIA = /\b(image|photo|video|audio|picture|generate|create an|draw|illustrate|mockup|wireframe)\b/i;
const MEDIAS = Object.freeze([MEDIA]);
const QUESTION_END = /\?\s*$/;

function containsAny(text, res) { return res.some(r => r.test(text)); }

export function classifyIntent({ task = '', role = null, constraints = {} } = {}) {
  const text = String(task ?? '');
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  let intentType = 'webapp-chat';
  let executionTarget = 'webapp';
  let domain = 'general';
  let confidence = 0.45;
  const reasons = [];

  // Strongest signal: explicit role from the caller.
  if (role) {
    const roleMap = { implementer: 'code-change', reviewer: 'code-change', copywriter: 'webapp-chat', designer: 'ui-change', analyst: 'data-task' };
    if (roleMap[role]) { intentType = roleMap[role]; confidence += 0.2; reasons.push(`role ${role} implies ${intentType}`); }
  }

  // Domain & intent heuristics.
  if (containsAny(lower, [CODE])) {
    intentType = 'code-change';
    domain = 'code';
    executionTarget = 'local-pc';
    confidence += 0.25;
    reasons.push('code-change keywords');
    if (containsAny(lower, [UI])) { domain = 'code'; reasons.push('UI mentioned within code change'); }
  } else if (containsAny(lower, [UI])) {
    intentType = 'ui-change';
    domain = 'ui';
    executionTarget = 'webapp';
    confidence += 0.2;
    reasons.push('UI/visual keywords');
  } else if (containsAny(lower, [DATA])) {
    intentType = 'data-task';
    domain = 'data';
    executionTarget = 'local-pc';
    confidence += 0.2;
    reasons.push('data-task keywords');
  } else if (containsAny(lower, MEDIAS)) {
    intentType = 'webapp-chat';
    domain = 'media';
    executionTarget = 'webapp';
    confidence += 0.15;
    reasons.push('media/generation keywords');
  }

  // Execution target overrides from explicit PC/mobile signals.
  if (containsAny(lower, [PC])) {
    executionTarget = 'local-pc';
    confidence += 0.15;
    reasons.push('PC/local keywords');
  }
  if (containsAny(lower, [MOBILE])) {
    executionTarget = 'mobile-app';
    confidence += 0.15;
    reasons.push('mobile keywords');
  }
  // If both PC and mobile are mentioned, prefer the one that matches the intent domain.
  if (containsAny(lower, [PC]) && containsAny(lower, [MOBILE])) {
    executionTarget = 'auto';
    confidence -= 0.1;
```

_First 80 of 107 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
