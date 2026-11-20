# File: harness/test/interface/intent.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/interface/intent.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 3812 B |
| Lines | 91 |
| Hash | efe0b50dfa1d |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| r | const | 19 | no | const r = classifyIntent({ task: &#39;implement a new API endpoint in the Talk component&#39; }); |
| r | const | 28 | no | const r = classifyIntent({ task: &#39;fix the bug in the header component&#39; }); |
| r | const | 34 | no | const r = classifyIntent({ task: &#39;change the background theme to dark mode&#39; }); |
| r | const | 41 | no | const r = classifyIntent({ task: &#39;export the database records to csv&#39; }); |
| r | const | 48 | no | const r = classifyIntent({ task: &#39;write a powershell script for windows startup&#39; }); |
| r | const | 54 | no | const r = classifyIntent({ task: &#39;update the android app layout&#39; }); |
| r | const | 60 | no | const r = classifyIntent({ task: &#39;sync the windows app to the android phone&#39; }); |
| r | const | 65 | no | const r = classifyIntent({ task: &#39;what model should I use?&#39; }); |
| r | const | 72 | no | const r = classifyIntent({ task: &#39;do something&#39;, role: &#39;implementer&#39; }); |
| r | const | 77 | no | const r = classifyIntent({ task: &#39;look at this diff&#39;, role: &#39;reviewer&#39; }); |
| r | const | 82 | no | const r = classifyIntent({ task: &#39;&#39; }); |
| r2 | const | 84 | no | const r2 = classifyIntent({ task: &#39;implement a new react component with typescript tests and a pull request&#39; }); |
| r | const | 89 | no | const r = classifyIntent({ task: &#39;hello world&#39; }); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 1 | external |
| node:assert/strict | import | 2 | external |
| ../../src/interface/intent.mjs | import | 3 | [harness/src/interface/intent.mjs](../../src/interface/intent.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyIntent, INTENT_TYPES, EXECUTION_TARGETS, DOMAINS } from '../../src/interface/intent.mjs';

test('intent: exports valid enums', () => {
  assert.ok(Array.isArray(INTENT_TYPES) && INTENT_TYPES.length > 0);
  assert.ok(Array.isArray(EXECUTION_TARGETS) && EXECUTION_TARGETS.length > 0);
  assert.ok(Array.isArray(DOMAINS) && DOMAINS.length > 0);
  assert.ok(INTENT_TYPES.includes('code-change'));
  assert.ok(INTENT_TYPES.includes('ui-change'));
  assert.ok(INTENT_TYPES.includes('data-task'));
  assert.ok(EXECUTION_TARGETS.includes('local-pc'));
  assert.ok(EXECUTION_TARGETS.includes('mobile-app'));
  assert.ok(EXECUTION_TARGETS.includes('webapp'));
  assert.ok(EXECUTION_TARGETS.includes('auto'));
});

test('intent: code-change maps to local-pc / code domain', () => {
  const r = classifyIntent({ task: 'implement a new API endpoint in the Talk component' });
  assert.equal(r.intentType, 'code-change');
  assert.equal(r.executionTarget, 'local-pc');
  assert.equal(r.domain, 'code');
  assert.ok(r.confidence > 0.5);
  assert.ok(r.reasoning.includes('code-change keywords'));
});

test('intent: fix bug maps to code-change', () => {
  const r = classifyIntent({ task: 'fix the bug in the header component' });
  assert.equal(r.intentType, 'code-change');
  assert.equal(r.executionTarget, 'local-pc');
});

test('intent: ui/theme change maps to webapp / ui domain', () => {
  const r = classifyIntent({ task: 'change the background theme to dark mode' });
  assert.equal(r.intentType, 'ui-change');
  assert.equal(r.executionTarget, 'webapp');
  assert.equal(r.domain, 'ui');
});

test('intent: data task maps to local-pc / data domain', () => {
  const r = classifyIntent({ task: 'export the database records to csv' });
  assert.equal(r.intentType, 'data-task');
  assert.equal(r.executionTarget, 'local-pc');
  assert.equal(r.domain, 'data');
});

test('intent: explicit PC keyword overrides to local-pc', () => {
  const r = classifyIntent({ task: 'write a powershell script for windows startup' });
  assert.equal(r.executionTarget, 'local-pc');
  assert.ok(r.reasoning.includes('PC/local keywords'));
});

test('intent: explicit mobile keyword maps to mobile-app', () => {
  const r = classifyIntent({ task: 'update the android app layout' });
  assert.equal(r.executionTarget, 'mobile-app');
  assert.ok(r.reasoning.includes('mobile keywords'));
});

test('intent: both PC and mobile maps to auto', () => {
  const r = classifyIntent({ task: 'sync the windows app to the android phone' });
  assert.equal(r.executionTarget, 'auto');
});

test('intent: short question defaults to webapp chat', () => {
  const r = classifyIntent({ task: 'what model should I use?' });
  assert.equal(r.intentType, 'webapp-chat');
  assert.equal(r.executionTarget, 'webapp');
  assert.equal(r.domain, 'general');
});

test('intent: role implementer implies code-change', () => {
  const r = classifyIntent({ task: 'do something', role: 'implementer' });
  assert.equal(r.intentType, 'code-change');
});

test('intent: role reviewer implies code-change', () => {
  const r = classifyIntent({ task: 'look at this diff', role: 'reviewer' });
  assert.equal(r.intentType, 'code-change');
});
```

_First 80 of 92 lines._

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
