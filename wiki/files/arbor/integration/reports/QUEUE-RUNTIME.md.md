# File: integration/reports/QUEUE-RUNTIME.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/reports/QUEUE-RUNTIME.md |
| Language | Markdown |
| Kind | doc |
| Size | 14915 B |
| Lines | 159 |
| Hash | 92d21bc0353c |
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

```markdown
# QUEUE-RUNTIME — PWA host iteration loop, measured

**Base SHA:** `452c82e` (main, upstream `origin/main`) · **Date:** 2026-11-13 · **Total wall time:** ~42 min
**Scope:** read-only; one written file (this report). No git mutation.

## Commands run (exact, with exit codes)

| # | command | exit | wall | result |
|---|---|---|---|---|
| C1 | `cargo check --workspace --locked` | 101 | 87s | `error: cannot create the lock file C:\0-BlackBoxProject-0\ARBOR\Cargo.lock because --locked was passed` (no root lockfile at this SHA) |
| C2 | `CARGO_TARGET_DIR=%TEMP%\arbor-cargo-target cargo check --workspace` | 101 | 350s | `error: failed to run custom build command for vivim-host` → `resource path resources\runtime doesn't exist` |
| C3 | `bun scripts/test-gate.mjs --all --no-cache` | 1 | 665s | 271 selected, **2377 pass, 39 fail** |
| C4 | `node apps/vivim-host/server.mjs` (`VIVIM_HOST_PORT=43999`, `VIVIM_HOST_DATA_DIR=%TEMP%\arbor-host-probe`) | running | — | boot OK, ready in **3595 ms**, stderr empty |
| C5 | same + `VIVIM_DIRECT_ORIGIN=https://pc.example.ts.net`, `VIVIM_DIRECT_USER=owner@example.com`, port 44001 | running | — | `/mobile` served only with simulated Tailscale headers |
| C6 | `node --test apps/vivim-host/test/mobile-first-entry.test.mjs` | 1 | 2s | **2 pass 0 fail→0 pass 2 fail**; `/` returned legacy `host.js` |
| C7 | `bun test packages/tierflow/tests/bus.test.ts` | 0 | 1s | **9 pass 0 fail** (125 ms) — gate recorded 0/0 |
| C8 | `node --test apps/vivim-host/test/data-intelligence.test.mjs` | aborted | >240s | hung standalone; gate measured **317385 ms / 4 fail** |
| C9 | `node hq/bin/arbor-hq.mjs status --allow <repo>` | 0 | 2s | `arbor-self` 2197 files, 52756 symbols |

Processes started: PIDs 16048 and 20252 — both killed by PID. No other process touched.

---

# 1. PWA HOST ITERATION LOOP — current actual state

**Boot: YES. PWA serve: ONLY behind a simulated Tailscale proxy. Render: NO (framing refused).**

`node apps/vivim-host/server.mjs` boots from a clean tree in **3595 ms**, prints `VIVIM Host preview: http://127.0.0.1:43999`, empty stderr, no build step, no network. Default port **43187** (`apps/vivim-host/server.mjs:832`); data root env `VIVIM_HOST_DATA_DIR` (`server.mjs:72-80`).

### Routes (measured; `HEAD`/`GET` against a live boot)

| route | plain `http://127.0.0.1:44001` | with `Host: pc.example.ts.net` + `x-forwarded-proto: https` + `tailscale-user-login` |
|---|---|---|
| `/` | **200** `text/html` (legacy desktop `index.html`) | 403 |
| `/onboarding` | 200 `text/html` | — |
| `/host.css`, `/control-panel.js` | 200 | — |
| `/manifest.webmanifest` | **404** | — |
| `/sw.js` | **404** | — |
| `/mobile` | **403** `application/json` | 200 `text/html` |
| `/mobile/` | **403** | 200 `text/html` |
| `/mobile/app.js` | **403** | 200 `text/javascript` |
| `/mobile/manifest.webmanifest` | **403** | 200 `application/manifest+json` |
| `/mobile/sw.js` | **403** | 200 `text/javascript` |
| `/mobile/?host-preview=1` | 200, but `x-frame-options: DENY`, `frame-ancestors 'none'` | same |
| `/mobile-first.html`, `/mobile-first.js`, `/mobile-first.css` | **404** | **404** |

Cause of each: `/mobile` gated by `direct-phone.mjs:152` (`remote` loopback **and** `req.headers.host !== url.host` **and** `x-forwarded-proto !== 'https'` **and** `tailscale-user-login !== user`); origin must be exact HTTPS (`direct-phone.mjs:82-83`). `/mobile-first.*` never registered in the two allowlists. `/manifest.webmanifest` + `/sw.js` exist only under `/mobile/` (`direct-phone.mjs:20-70`), not at host root (`server.mjs:44-66`).

### Edit → visible change (measured)

| change | steps | measured |
|---|---|---|
| edit existing `apps/mobile-relay/**` or `apps/vivim-host/public/**` | edit, browser reload | **9–45 ms** warm serve, 562 ms first request — files re-read per request (`direct-phone.mjs:392`, `server.mjs:295`) |
| new file under `apps/mobile-relay/` | edit `assets` Map (`direct-phone.mjs:20-70`) then restart | else **404** (`direct-phone.mjs:391`); restart **3.6 s** |
| new file under `apps/vivim-host/public/` | edit `MIME` (`server.mjs:44`) + `ASSETS` (`server.mjs:57`) then restart | restart 3.6 s |
| any route/server logic (`server.mjs`, `direct-phone.mjs`) | restart | 3.6 s; no `--watch` and no `dev` script in `package.json` |
| build | **none** — no vite/esbuild/rollup/webpack config anywhere; `node_modules` present, no `bun install` needed | 0 |
| service worker | network-first, cache bump only on name change (`apps/mobile-relay/sw.js:8,161,171`) | no purge required |

**Verdict:** the build is not the bottleneck (0 s). Access is: a plain browser cannot open `/mobile/` at all (403), and `/` serves the legacy desktop page, so a UI edit is only observable via `curl` with spoofed proxy headers or a hand-built TLS proxy.

---

# 2. OPTION PACKAGES (ranked)

### O1 — Loopback read-only PWA preview mode  ★ PICK FIRST
- **Outcome:** open `http://127.0.0.1:43187/mobile/` in Chrome, edit a PWA file, reload, see it. No env gymnastics, no phone, no proxy.
- **Why first:** every other UI iteration is currently invisible; this is the single gate on the loop.
- **Work:** `direct-phone.mjs:152` guard + `:153` CSP → accept loopback + `VIVIM_HOST_PREVIEW=1` with `Host` = `127.0.0.1|localhost`, set `x-frame-options: SAMEORIGIN`, `frame-ancestors 'self'`; `server.mjs:229` dispatch, `:851-852` `directPhone` construction. Device-grant routes stay 401/403.
- **Not already done:** measured 403 on `/mobile` and `/mobile/` without proxy headers; `direct-phone.mjs:82-83` rejects non-HTTPS origin outright.
- **Effort:** S–M (<1–3 h). **Risk:** med — a preview must never mint a device session or read owner history.
- **Acceptance:** `VIVIM_HOST_PREVIEW=1 node apps/vivim-host/server.mjs` then `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:43187/mobile/` → `200`, header `x-frame-options: SAMEORIGIN`; and `GET /mobile/api/memory/recent` → 401/403.
- **Excludes:** TLS, Tailscale, real pairing, send paths.

### O2 — Wire `/` to the PWA-first entry that already exists on disk
- **Outcome:** the documented product surface (phone PWA first, Host utilities on demand) is real at `/`.
- **Work:** `server.mjs:44-66` (`ASSETS['/']` → `mobile-first.html`, register `mobile-first.{js,css}`), `:290-295`; frame allowance per O1. `public/mobile-first.html` + `.js` already present.
- **Not done:** C6 fails 2/2 — `/` returned `host.js`+`control-panel.js`; `/mobile-first.js` 404; framed `/mobile/` sends `XFO: DENY`.
- **Effort:** S. **Risk:** low if legacy stays at `/host/control`.
- **Acceptance:** `node --test apps/vivim-host/test/mobile-first-entry.test.mjs` → 2 pass.
```

_First 80 of 160 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
