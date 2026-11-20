# File: integration/prd/PWA-HOST-LOOP.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/prd/PWA-HOST-LOOP.md |
| Language | Markdown |
| Kind | doc |
| Size | 5719 B |
| Lines | 134 |
| Hash | 7261b1d45031 |
| Test | no |
| Generated | no |
| Component | integration |

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
# PRD — PWA Host iteration loop (main)

Status: active. Base `452c82e`. Owner priority: the PWA host used for quick iteration.
This is our design; PR #29 is reference only (concepts, not a merge source).

## 1. Goal

From a clean checkout:

```
node apps/vivim-host/server.mjs
open http://127.0.0.1:43187/
```

→ the real `apps/mobile-relay/` PWA renders in a phone frame. Edit any PWA file, reload,
see the change. No env vars, no Tailscale proxy, no phone, no Tauri build, no bundler.

Measured today (QUEUE-RUNTIME.md): boot 3.6 s, serve 9–45 ms warm, no build step.
Access is the only blocker: `/mobile` 403 on plain loopback; `/` serves legacy desktop.

## 2. Non-goals (this pass)

- Pairing a real phone, Tailscale routing, send/approve/execute, effect authority.
- Tauri packaging, installer, APK, Rust IPC changes.
- Replacing Host Control, onboarding, dispatcher, journal, receipts.
- Any new dependency or framework.

## 3. Design

### D1 — Preview is "plain loopback", not a flag

A request is a local preview iff **all** hold:

- socket remote is loopback (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`);
- `Host` header is `127.0.0.1[:port]` or `localhost[:port]`;
- no `x-forwarded-proto` header and no `tailscale-user-login` header.

The Direct phone path always carries both proxy headers (`direct-phone.mjs:181`), so this
cannot capture a real phone. Precedence: preview check **before** the `direct` dispatch in
`server.mjs`. No `VIVIM_HOST_PREVIEW` switch; the loop works out of the box.

### D2 — Preview is read-only by construction

- Only `GET`/`HEAD`; every other method → 405 with `Allow`.
- Only paths present in the phone asset allowlist; `/mobile/api/*`, `/mobile/session*`,
  `/mobile/commands*` → 404. No grant lookup, no enrollment call, no control dispatcher.
- `/mobile` on plain loopback → 308 `/mobile/?host-preview=1`.
- Preview responses set `x-frame-options: SAMEORIGIN` and CSP
  `frame-ancestors 'self'` (so the Host shell may frame it), keep `default-src 'self'`,
  `script-src 'self'`, `connect-src 'self'`, `object-src 'none'`, `base-uri 'none'`,
  `form-action 'none'`.
- The preview must never read owner history, owner token, device grants, or receipts.

### D3 — One allowlist, proved by the import graph

`direct-phone.mjs` owns the phone asset map. Export its keys (single source of truth).
Add a test that walks the **static** ES-module import graph from `apps/mobile-relay/app.js`
and asserts every local specifier resolves to an allowlisted path. A missing file is a test
failure, not a 404 at runtime.

Known defect this must catch: `generative-ui/phone-surface.mjs` imports
`./host-revision-guard.mjs`; the map omits it, so the PWA fails to boot in every mode.

### D4 — Entry points

| path | serves |
|---|---|
| `/` | `public/mobile-first.html` (phone frame; no legacy scripts) |
| `/host/control` | existing `index.html` (admin, explicit only) |
| `/onboarding` | existing onboarding wizard |
| `/mobile/?host-preview=1` | PWA shell, preview mode |
| `/mobile/app.js`, `/mobile/*` | allowlisted PWA assets |
| `/api/host/status` | unchanged |

No first-run redirect from `/` to onboarding. Setup stays reachable at `/onboarding`.

### D5 — PWA preview mode

`apps/mobile-relay/app.js` treats preview as: query `host-preview=1` **and** loopback
hostname **and** path starts `/mobile/`.
````

_First 80 of 135 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
