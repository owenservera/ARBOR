# File: apps/vivim-host/control/bootstrap-actions.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/vivim-host/control/bootstrap-actions.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 693 B |
| Lines | 18 |
| Hash | 0e5c0c43b0ad |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| BOOTSTRAP_ACTIONS | const | 10 | yes | export const BOOTSTRAP_ACTIONS = Object.freeze([ &#39;apply-proposal&#39;, &#39;choose-preset&#39;, &#39;grant-visual&#39;, &#39;personalize&#39;, |
| BOOTSTRAP_ACTION_SET | const | 18 | yes | export const BOOTSTRAP_ACTION_SET = new Set(BOOTSTRAP_ACTIONS); |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [apps/mobile-relay/consumer-commands/registry.mjs](../../mobile-relay/consumer-commands/registry.mjs.md) | ../../vivim-host/control/bootstrap-actions.mjs |
| [apps/mobile-relay/lib/relay-core.mjs](../../mobile-relay/lib/relay-core.mjs.md) | ../../vivim-host/control/bootstrap-actions.mjs |
| [apps/mobile-relay/test/bootstrap-actions-allowlist.test.mjs](../../mobile-relay/test/bootstrap-actions-allowlist.test.mjs.md) | ../../vivim-host/control/bootstrap-actions.mjs |
| [apps/vivim-host/bootstrap/command-worker.mjs](../bootstrap/command-worker.mjs.md) | ../control/bootstrap-actions.mjs |
| [apps/vivim-host/test/bootstrap-actions-allowlist.test.mjs](../test/bootstrap-actions-allowlist.test.mjs.md) | ../control/bootstrap-actions.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
/**
 * The ONE bootstrap action allowlist. The command worker, the relay route and the
 * consumer command registry all read this list. Duplicated allowlists are a
 * duplicate authority: they drift, and an order-sensitive comparison of two
 * copies of the same set is already wrong today.
 *
 * The seventh consumer-commands id `control-plan` is deliberately NOT here:
 * it is a control-mode, device-scope command, not a bootstrap action.
 */
export const BOOTSTRAP_ACTIONS = Object.freeze([
  'apply-proposal',
  'choose-preset',
  'grant-visual',
  'personalize',
  'undo-theme',
  'undo-ui-revision',
]);
export const BOOTSTRAP_ACTION_SET = new Set(BOOTSTRAP_ACTIONS);
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
