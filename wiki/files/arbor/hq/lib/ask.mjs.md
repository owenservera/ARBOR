# File: hq/lib/ask.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | hq/lib/ask.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 5104 B |
| Lines | 144 |
| Hash | cd1ba847d924 |
| Test | no |
| Generated | no |
| Component | hq |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| RULES | const | 5 | no | const RULES = [ |
| FILE_PATTERN | const | 92 | no | const FILE_PATTERN = /(?:explain\|open\|show\|what is\|tell me about)\\s+([A-Za-z0-9_./\\\\-]+\\.[A-Za-z0-9]+)/i; |
| SYMBOL_PATTERN | const | 93 | no | const SYMBOL_PATTERN = /(?:explain\|find\|where is\|show me)\\s+(?:the\\s+)?(?:symbol\\s+)?([A-Za-z_$][\\w$]*)/i; |
| routeAsk | function | 95 | yes | export function routeAsk(question, { audience = &#39;owner&#39; } = {}) { |
| q | const | 96 | no | const q = String(question ?? &#39;&#39;).trim(); |
| fileMatch | const | 104 | no | const fileMatch = q.match(FILE_PATTERN); |
| args | const | 115 | no | const args = { ...rule.args }; |
| m | const | 119 | no | const m = q.match(/(?:on\|of\|imports?)\\s+([A-Za-z0-9_./\\\\-]+)/i) |
| symbolMatch | const | 130 | no | const symbolMatch = q.match(SYMBOL_PATTERN); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| ./util.mjs | import | 3 | [hq/lib/util.mjs](./util.mjs.md) |

## Dependents

| File | Specifier |
| --- | --- |
| [hq/bin/hq.mjs](../bin/hq.mjs.md) | ../lib/ask.mjs |
| [hq/lib/autonomy.mjs](./autonomy.mjs.md) | ./ask.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// hq/lib/ask.mjs — deterministic natural-language router for the Owner surface.
// No model, no network: patterns route to an HQ command plus arguments.
import { toPosix } from './util.mjs';

const RULES = [
  {
    intent: 'catchup',
    patterns: [/what (did|have) i (work|do)/i, /catch me up/i, /what happened/i],
    command: 'brief',
    args: { since: '7d' },
    explanation: 'Summarise recent work across your spaces.',
  },
  {
    intent: 'changes',
    patterns: [/what changed/i, /what'?s new/i, /recent changes/i, /diff since/i],
    command: 'since',
    args: { ref: 'yesterday' },
    explanation: 'Show what changed recently.',
  },
  {
    intent: 'attention',
    patterns: [/what needs attention/i, /is anything (broken|wrong|stale)/i, /what should i fix/i, /health/i],
    command: 'brief',
    args: { attention: true },
    explanation: 'List items that need attention.',
  },
  {
    intent: 'next',
    patterns: [/what should i do next/i, /next step/i, /where do i start/i],
    command: 'brief',
    args: { next: true },
    explanation: 'Suggest the next action.',
  },
  {
    intent: 'impact',
    patterns: [/what depends on/i, /what breaks if i change/i, /blast radius/i, /impact of/i],
    command: 'impact',
    args: {},
    explanation: 'Show transitive dependents.',
  },
  {
    intent: 'deps',
    patterns: [/who imports/i, /what does .* import/i, /dependencies of/i],
    command: 'deps',
    args: {},
    explanation: 'Show dependency edges.',
  },
  {
    intent: 'run',
    patterns: [/how do i run/i, /how to start/i, /run command/i],
    command: 'file',
    args: { kind: 'runbook' },
    explanation: 'Find run instructions from the project manifest and README.',
  },
  {
    intent: 'test',
    patterns: [/how do i test/i, /which tests/i, /test command/i],
    command: 'file',
    args: { kind: 'test' },
    explanation: 'Find test instructions and nearby tests.',
  },
  {
    intent: 'remember',
    patterns: [/^remember (that )?/i, /^save (a )?note/i, /^note (that )?/i],
    command: 'note',
    args: { action: 'add' },
    explanation: 'Save a note in Recent memory.',
  },
  {
    intent: 'recall',
    patterns: [/what do i know about/i, /remind me/i, /recall/i, /my notes on/i],
    command: 'recall',
    args: {},
    explanation: 'Search your saved notes.',
  },
  {
    intent: 'learn',
    patterns: [/what should i learn/i, /what should i improve/i, /suggest/i],
    command: 'brief',
    args: { suggestions: true },
```

_First 80 of 145 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
