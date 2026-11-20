# File: studio/src/studio/harness-executor-preflight.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/src/studio/harness-executor-preflight.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 1077 B |
| Lines | 19 |
| Hash | 7b85d502dfc5 |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| withDispatchPreflight | function | 4 | yes | export function withDispatchPreflight(toolExecutor, validate) { |
| error | const | 11 | no | const error = e instanceof Error ? e : new Error(&#39;Tool validation failed&#39;); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/src/studio/harness-api.mjs](./harness-api.mjs.md) | ./harness-executor-preflight.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// AION Agent 14 / Z.ai Round 6: pure validation BEFORE invoking Studio's sole executor.
// Does not acquire a browser, initialize a runtime or execute provider calls on its own.
// The caller MUST supply a pure/synchronous validator. Never mark runtime errors safe.
export function withDispatchPreflight(toolExecutor, validate) {
  if (typeof toolExecutor !== 'function' || typeof validate !== 'function')
    throw new TypeError('Expected an existing toolExecutor and a pure validate function');
  return async ({ tool, args, ...rest }) => {
    try {
      validate(tool, args); // Existing validateConversationTool: no browser/effect.
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Tool validation failed');
      error.code = error.code ?? 'INVALID_TOOL_ARGUMENTS';
      error.effectState = 'not_dispatched'; // Grounded ONLY because validation precedes execution.
      throw error;
    }
    // Errors here may have occurred after a real effect: do NOT annotate them.
    return toolExecutor({ tool, args, ...rest });
  };
}
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
