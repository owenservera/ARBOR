# File: apps/mobile-relay/vec/README.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../../projects/arbor.md) |
| Path | apps/mobile-relay/vec/README.md |
| Language | Markdown |
| Kind | doc |
| Size | 1842 B |
| Lines | 14 |
| Hash | 0522c3f92199 |
| Test | no |
| Generated | no |
| Component | mobile-relay |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

```markdown
# VEC first pure compiler utility — paired PWA bootstrap

This module is the first **runtime seam** of a broader three-output VEC compiler. It is intentionally browser-safe and *not* a new Host or Wiki authority.

- `compiler.mjs`: `createVecCompiler({adapters})` → `compile({domain,text,context})`. Domains: `wiki` (HQ legacy owner pending), `command` (Host/NLCL legacy owner pending), `ui` (first installed adapter). Domain is chosen by **trusted product context**, not text guesses.
- `ui-adapter.mjs`: four narrowly recognized UI grammar families. Returns existing `vivim.ui-proposal/1` with `persisted:false`, `authorization:required` preview after `compileUiProposal` validation.
- `../build-composer.mjs` exposes `resolveBuildRequest`; `../build-canvas.mjs` invokes this first, falls back to the original strictly validated model design **only** on unsupported input. Candidate still requires explicit owner activation through `phone-surface.sendProposal` and Host.
- No auto-install of models/SDK functions; no arbitrary Rust/HTML/JS; no permissions, file read, network or background execution.
- The eventual canonical cross-runtime VEC package will be selected after SDK and asset/Node/runtime ABI parity. Do not duplicate this implementation in HQ or TierFlow as a second independent compiler.

Tests: `node --test apps/mobile-relay/test/vec-ui-compiler.test.mjs apps/mobile-relay/test/build-vec-routing.test.mjs`.

Migration workstreams and machine statuses: `.integration/proposal5/vec-pwa/`.
The UI adapter now resolves its three initial component kinds through the [canonical layered taxonomy](ui-taxonomy/registry.mjs), and refuses missing/mismatched source bindings. The taxonomy describes hundreds of **potential** component kinds; it does not install new renderers. Current source adapters remain closed.
```

---

[HQ wiki](../../../../../index.md) · [Symbols](../../../../../symbols.md) · [Dependency graph](../../../../../graph.md) · [Documentation](../../../../../docs.md) · [Changes](../../../../../changes.md) · [Open tasks](../../../../../todos.md) · [Deprecated](../../../../../deprecated.md) · [Agent annotation protocol](../../../../../protocol.md) · [Glossary](../../../../../glossary.md) · [Using HQ](../../../../../context.md) · [Capabilities](../../../../../capabilities.md) · [Search index](../../../../../search.json) · [Browser view](../../../../../index.html)
