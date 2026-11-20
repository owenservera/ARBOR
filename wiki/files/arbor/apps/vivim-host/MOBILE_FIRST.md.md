# File: apps/vivim-host/MOBILE_FIRST.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | apps/vivim-host/MOBILE_FIRST.md |
| Language | Markdown |
| Kind | doc |
| Size | 2097 B |
| Lines | 43 |
| Hash | a1883937ed8c |
| Test | no |
| Generated | no |
| Component | vivim-host |

## Symbols

_No symbols._

## Imports

_No imports._

## Dependents

_No dependents._

## Annotations

_No annotations._

## Excerpt

````markdown
# Host — mobile-first entry (R001)

The installed Host and loopback browser now open **the real phone PWA first**.
The desktop wrapper (`public/mobile-first.html`) presents
`apps/mobile-relay/index.html` in a phone-sized viewport, so the PWA's actual
mobile breakpoints, modules, and navigation are reused. It is not a rebuilt,
competing desktop dashboard.

## Entry and ownership

- `/` — PWA-first launch with no legacy Host scripts on startup.
- `/mobile/?host-preview=1` — loopback-only, **read-only and unpaired**
  visual shell. It never obtains a device grant, sends a message, or claims
  that a phone has paired. The menu offers explicit Host utilities.
- `/host/control` — existing authenticated desktop administration, loaded
  **only when selected** in the PWA menu.
- `/onboarding` — the existing Host setup and phone pairing UI.
- `/api/host/status` — read-only local diagnostic JSON.
- Trusted Tailscale `/mobile/` and its authenticated APIs remain unchanged.
  No preview behavior is enabled on remote or cloud origins.

The native Tauri launch code reaches the inner PWA only once and is exchanged
for the existing HttpOnly Host browser session, not a phone device session.
The old backend, control dispatcher, journal, pairing store, and receipts
are not replaced.

## Verify locally

```sh
node --test apps/vivim-host/test/mobile-first-entry.test.mjs
node --test apps/vivim-host/test/*.test.mjs
node --test apps/mobile-relay/test/*.test.mjs
```

Open the Host at `http://127.0.0.1:43187/` or launch the desktop app. It
should show a 420px-wide mobile PWA on desktop and the full-height PWA on a
small viewport. Tap the gear to open **Host menu**. Pairing, settings, and
diagnostics must require an explicit choice. Verify a real phone still pairs
through the original trusted Direct endpoint.

Scope note: R001 is the mobile-first **presentation cutover**, not a claim that
unpaired desktop preview can send commands. Subsequent connection work can
share the PWA's authenticated Host action flow without creating a new UI.
````

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
