# File: studio/bin/lib/dev-auto-approve.mjs

> Generated 2026-11-19 · JavaScript · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | studio/bin/lib/dev-auto-approve.mjs |
| Language | JavaScript |
| Kind | source |
| Size | 620 B |
| Lines | 7 |
| Hash | 32f0c913ed6b |
| Test | no |
| Generated | no |
| Component | studio |

## Symbols

| Symbol | Kind | Line | Exported | Signature |
| --- | --- | --- | --- | --- |
| DEV_AUTO_APPROVE_ENV | const | 6 | yes | export const DEV_AUTO_APPROVE_ENV = &#39;VIVIM_DEV_AUTO_APPROVE&#39;; |
| devAutoApprove | function | 7 | yes | export const devAutoApprove = (env = process.env) =&gt; env?.[DEV_AUTO_APPROVE_ENV] === &#39;1&#39;; |

## Imports

_No imports._

## Dependents

| File | Specifier |
| --- | --- |
| [studio/bin/commands/chat.mjs](../commands/chat.mjs.md) | ../lib/dev-auto-approve.mjs |
| [studio/bin/commands/recipes.mjs](../commands/recipes.mjs.md) | ../lib/dev-auto-approve.mjs |

## Annotations

_No annotations._

## Excerpt

```javascript
// Development-mode send consent (owner decision, 2026-10-30): VIVIM_DEV_AUTO_APPROVE=1 stands in for the
// second-consent flags (--accept-sends, --authorize-send). Off by default; exactly "1" turns it on.
// Mirrors harness/src/interface/dev-auto-approve.mjs (studio does not import across the harness boundary).
// Only the consent flag is replaced: --execute is still required for any live action, and the
// no-resend and exact-target rules are unchanged.
export const DEV_AUTO_APPROVE_ENV = 'VIVIM_DEV_AUTO_APPROVE';
export const devAutoApprove = (env = process.env) => env?.[DEV_AUTO_APPROVE_ENV] === '1';
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
