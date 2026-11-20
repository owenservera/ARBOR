# File: harness/test/core/relay-chat-fixes.test.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | harness/test/core/relay-chat-fixes.test.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1367 B |
| Lines | 17 |
| Hash | dd77caecde18 |
| Test | yes |
| Generated | no |
| Component | harness |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| n | const | 6 | no | const n = normalizeModels(claude, { items: [{ label: &#39;Opus 5.5\\nFor complex work&#39;, checked: true }, { label: &#39;Effort\\nHigh&#39; }, { label: &#39;Sonnet 5.5&#39; }] }); |
| e | const | 12 | no | const e = dismissExpression(claude); assert.match(e, /reject all cookies/); assert.doesNotMatch(e, /send-button\|Enter/); |

## Imports

| Specifier | Kind | Line | Resolved |
| --- | --- | --- | --- |
| node:test | import | 2 | external |
| ../../src/core/models.mjs | import | 3 | [harness/src/core/models.mjs](../../src/core/models.mjs.md) |
| ../../src/providers/claude.mjs | import | 4 | [harness/src/providers/claude.mjs](../../src/providers/claude.mjs.md) |

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```javascript
// grokbot-authored: effort-menu normalization, dismiss expression, aria-busy scoping.
import test from 'node:test'; import assert from 'node:assert/strict';
import { normalizeModels, dismissExpression, resolveEffort } from '../../src/core/models.mjs';
import claude from '../../src/providers/claude.mjs'; import chatgpt from '../../src/providers/chatgpt.mjs';
test('claude effort menu levels + current', () => {
  const n = normalizeModels(claude, { items: [{ label: 'Opus 5.5\nFor complex work', checked: true }, { label: 'Effort\nHigh' }, { label: 'Sonnet 5.5' }] });
  assert.equal(n.current, 'opus-5.5'); assert.deepEqual(n.efforts.map(e => e.id), ['low', 'medium', 'high', 'max']);
  assert.equal(n.efforts.find(e => e.current).id, 'high'); assert.equal(n.effortMode, 'menu'); assert.equal(resolveEffort(n, 'low').id, 'low');
  assert.ok(!n.models.some(m => /effort|^high$/i.test(m.label)));
});
test('dismiss expression carries cookie text and never targets send', () => {
  const e = dismissExpression(claude); assert.match(e, /reject all cookies/); assert.doesNotMatch(e, /send-button|Enter/);
});
test('aria-busy streaming selector excludes buttons', () => {
  assert.ok(chatgpt.assistant.streamingSelectors.includes('[aria-busy="true"]:not(button)'));
  assert.ok(!chatgpt.assistant.streamingSelectors.includes('[aria-busy="true"]'));
});
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
