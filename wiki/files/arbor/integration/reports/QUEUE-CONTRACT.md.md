# File: integration/reports/QUEUE-CONTRACT.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/reports/QUEUE-CONTRACT.md |
| Language | Markdown |
| Kind | doc |
| Size | 24043 B |
| Lines | 151 |
| Hash | ae8d5672d2b7 |
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
# QUEUE-CONTRACT — PWA HOST TRUST BOUNDARY

Priority frame: **the Host-served PWA is the product surface; fast safe local iteration of it outranks everything else.**
Base SHA `452c82eb48db6fa5f95b47a778d664723359bb63` (main). 2026-11-13. Read-only lane; one write = this file. No git mutation.
Evidence commands: `Select-String`/`read` over `apps/vivim-host/{server.mjs,direct-phone.mjs,control/,public/}`, `apps/mobile-relay/`; `node --test apps/vivim-host/test/control-http.test.mjs` → **1/1 pass, 4157 ms**. Nothing else executed.

## 1. PWA HOST TRUST BOUNDARY — current state

**Verdict: local PWA iteration is impossible today — VIOLATED at the front door, by design, not by bug. The PWA also cannot be reached by an owner without an enrolled device, and every read route proves a device, not a person.**

Three independent blockers, all needed to open `/mobile/`:

1. Mount is env-gated: handler exists only when `VIVIM_DIRECT_ORIGIN` and `VIVIM_DIRECT_USER` are both set (`server.mjs:851-852`), attached at `server.mjs:229` (`direct && rawPath.startsWith('/mobile/')`).
2. Construction requires an **exact `https:`** origin: `if (url.protocol !== 'https:' || url.origin !== origin …) throw` (`direct-phone.mjs:82-83`). A loopback `http://127.0.0.1:43187` throws before the route table exists.
3. Per-request gate requires all four of loopback source, `host === url.host`, `x-forwarded-proto: https`, `tailscale-user-login === user` (`direct-phone.mjs:151-152`) — i.e. a Tailscale Serve proxy.

The client half is already local-ready: `transport.mjs:12` accepts `loopback && (http:||https:)`, `:22` sets direct mode from `directOrigin(location.origin) && pathname.startsWith('/mobile/')`. Only the server refuses. There is no `VIVIM_DIRECT_LOCAL`, no dev branch, no loopback exception anywhere in `direct-phone.mjs`.

The working local owner surface is the **Host Control UI, not the PWA**: `control/cli.mjs:31-37` → `http://127.0.0.1:43187/#control-session=<64hex>` (single-use, 60 s) → `public/control-panel.js:103-107` → `POST /api/host/control/ui-exchange` (`server.mjs:571-584`) → HttpOnly `SameSite=Strict` cookie + CSRF; mutations additionally need `x-vivim-ui-csrf` (`control/browser-session.mjs:52-57`). Nothing in it serves PWA code.

**Minimum authority that would be needed if the mount were opened:** one active **device grant + device session** carrying `control:read`. `authorizeDevice` (`direct-phone.mjs:141-148`) 401s without `x-vivim-grant-id` + `x-vivim-device-session` (`:144`), 403s on scope (`:146`). Reads are not public; there is no read-only unauthenticated floor. `transport.mjs:61-65` mirrors that: any request without a live session throws 401 client-side.

### Route table — every route the PWA can call (`direct-phone.mjs`)

Global check `:151-152` applies to all rows and is omitted from the column.

| Route (under `/mobile/`) | Method | Class | Admission check | Verdict |
|---|---|---|---|---|
| `api/live/ack` `:158-186` | POST | **effect** (records phone delivery receipt) | `origin===origin` + `x-vivim-ack:1` `:162` + `authorizeDevice('relay:write')` `:166` | HOLDS (journal/inbox receipt, no provider effect) |
| `api/memory/recent` `:187-201` | GET | read | `authorizeDevice('control:read')` `:192` | HOLDS |
| `api/media/library` `:202-217` | GET | read | `authorizeDevice('control:read')` `:207`; query string rejected `:208` | HOLDS |
| `api/control/{catalog,world,language,lexicon,recent,plans/:id}` `:223-236` | GET | read | `authorizeDevice('control:read')` `:227` | HOLDS |
| `api/control/plan` `:237-249` | POST | privileged (allocates plan digest) | `control:read` `:227` + `origin===origin` + `x-vivim-control:1` `:239` | HOLDS — but plan is admitted at `control:read`, same scope as reads |
| `api/control/interpret` `:243-246` | POST | privileged (LLM/parse) | same as `plan` | HOLDS, same scope asymmetry |
| `api/control/execute` `:240,250-251` | POST | **effect** (World mutation) | `authorizeDevice('control:execute')` `:240` + origin/CSRF `:239` + dispatcher `c.execute({approval:{channel:'direct-phone', actor:device.deviceId}})` `:251` | HOLDS — single journaled path |
| `api/relay?path=…` GET `:257-288` | GET | read | `authorizeDevice(relay:read)` `:262` + `RELAY_PATH` allowlist `:265` | HOLDS |
| `api/relay?path=…` POST `:257-288` | POST | **effect** (creates bridge commands) | `authorizeDevice(relay:write)` `:262` + `origin===origin` `:266` + `RELAY_PATH` `:265` | HOLDS — writes only the bridge queue |
| `api/enrollment/start|prove|session` `:293-314` | POST | privileged (mints a grant/session) | **none** — network gate only; proof-of-possession is the P-256 transcript | HOLDS by design (enrollment must precede authority) |
| `api/enrollment/status|grant-status` `:301-310` | GET | read | **none** — needs a challenge/grant id as capability | HOLDS |
| `api/enrollment/grants` `:315-319` | GET | read (sensitive) | `authorizeDevice('devices:read')` `:316` | HOLDS |
| `api/pair` `:327-344` | POST | privileged (consumes QR token, starts challenge) | **none** — the 64-hex single-use token is the capability (`:334`) | HOLDS |
| `api/apk/releases`, `api/apk/debug`, `connection.json` `:349-353,377,380-388` | GET | read | **none** — network gate only, redacted (`:384-385`) | HOLDS (metadata only) |
| `api/apk/download` `:354-376` | GET/HEAD | read | **none** — releaseId only; streams a signed APK | HOLDS (artifact, not authority) |
| `<asset>` `:390-393` | GET | static | closed `Map` `:20-62`; miss → 404 `:391` | HOLDS |

**Can the PWA reach an effect route?** Yes — with a grant: `execute` (`control:execute`), `live/ack` and relay POST (`relay:write`). All three terminate in existing authority (`control/dispatcher.mjs` journal; bridge store), so the PWA adds no second writer. The PWA holds **no capability it can self-issue**: every grant is minted by `enrollment.startChallenge/prove` (`apk/enrollment.mjs`) and approved owner-side.

**The real effect hole is next door, on the same origin.** `server.mjs` serves, unauthenticated, `POST /api/onboarding/setup` (`:681-697`, spawns `studio setup` with caller-supplied `workspaceRoot`/`chromeExe`/`chromeProfile` via `:688-694`), `/start` (`:699-711`, runs `powershell.exe … VIVIM.ps1` `:708`), `/doctor` (`:713-721`), `/apk/register` (`:723-735`, resolves an arbitrary caller path) and `/pair/register` (`:797-801`, mints pairing tokens). No owner token, no origin check — the file says so at `:723-726`. Only the `guided` block checks origin (`:816-819`), and only those routes are covered by `test/onboarding.test.mjs:183-210`. Today this is unreachable *from the PWA* only because the PWA is never served on that origin. The moment a local `/mobile/` is mounted on the same loopback origin, the PWA's own JS (or any injected string) can POST these. That is the P0 that must ship with the loop.

**Service worker.** Network-first, cache-as-fallback only: `sw.js:161-196`. Single cache name `var CACHE = 'vivim-relay-shell-v4'` (`:8`); precache of a fixed `SHELL_PATHS` list (`:12-50`) with `cache:'reload'` (`:132`) and unconditional `skipWaiting` (`:142,145`); `activate` deletes only caches with prefix `vivim-relay-shell-` and name `!== CACHE` (`:149-158`). On every successful shell fetch it re-`cache.put`s (`:177`). **Exact invalidation trigger: editing the string at `sw.js:8`.** Nothing else rotates the cache.

Stale-UI risk is therefore narrow but real: **online, a code edit is picked up immediately** — the network wins and refreshes the cache. **The edit is invisible only when the fetch fails**, e.g. Host restart mid-iteration, killed process, or a module 404 (`:184-192` silently resolves the cached `INDEX_PATH`). Mixed versions are possible: `index.html` from cache v4 plus a newly-edited module that did load. `handles()` (`:106-118`) excludes `/api/`, `?token=`, auth headers (`authorization`, `:115`) and `range`, so no privileged traffic is ever replayed. Note `cache-control: no-store` is set on every Host response including `/mobile/` (`server.mjs:37-38` applied at `:227` before the direct dispatch `:229`), so the HTTP cache is not the vector — the SW cache is.

**Secrets.**

| Secret | Lives | Committed? | Logged? | Exposed to PWA / store / curl? |
|---|---|---|---|---|
| Owner bearer | env `VIVIM_BOOTSTRAP_TOKEN` or `<dataRoot>/bootstrap/owner-token` via `bootstrap/owner-auth.mjs loadOwnerToken`; read at `server.mjs:845`, `src-tauri/src/main.rs:97` | No (runtime path only) | Only the **source path**, `server.mjs:847`; never the value (`control/cli.mjs:3-4,19`) | Not sent to the browser: `ui-exchange` trades a 60 s single-use code for an HttpOnly cookie (`server.mjs:571-584`); no `VIVIM_BOOTSTRAP_TOKEN`/`owner-token`/`authorization` reference anywhere in `apps/mobile-relay/` except SW's header exclusion `sw.js:115` |
| Device key | non-extractable P-256 `CryptoKey` in IndexedDB, `browser-device-key.mjs:1-4,34-48`; SW never opens that store (`:4-5`) | No | No | Never leaves the browser; same-origin script could still call `sign` (documented `:4`) |
| Pairing code | URL fragment, `pairing-link.mjs:2-10` (64 hex ⇔ device token, `:7`); redeemed once `POST /mobile/api/pair` `:14-17`; consumed `direct-phone.mjs:334` | No | No | Fragment never reaches a server or the SW; it is however **single-use only, not bound to a user agent** — screen/QR shoulder-surfing is the residual risk |
| Device session | in-memory only, `transport.mjs:29-36` (`never persist … in localStorage`); headers `:70` | No | No | Replayed per request as `x-vivim-grant-id`/`x-vivim-device-session` until `expiresAt`; static within window, no per-request nonce (UNPROVEN runtime half) |

**Static allowlist — closed.** Host: 12 entries in `ASSETS` (`server.mjs:57-69`), lookup `let asset = ASSETS[pathname]` (`:290`), miss → 404 (`:292`), then `readFile(path.join(staticRoot, asset))` (`:295`) with `staticRoot` fixed to `public/` (`:164`) and `pathname` taken from a parsed URL (`:232`). No directory listing, no `..` reachable, no dev route. `/` swaps to `onboarding.html` when no manifest (`:291`) — still an allowlisted entry. Direct/PWA: closed `assets` Map with 31 explicit entries (`direct-phone.mjs:20-62`), served from `readFile(path.join(root, asset[0]))` where `root` is the relay dir (`:19,392`); `route` is the raw suffix after `/mobile/` (`:157`) with no normalisation, but only exact Map keys resolve (`:390`). Traversal is not reachable (`assets.get('../x')` is undefined).
Note: `public/mobile-first.html`, `mobile-first.css`, `mobile-first.js` exist on disk but are **absent from `ASSETS`** → permanently 404. Dead surface, not a leak; also an iteration trap, since a PWA import missing from `direct-phone.mjs:20-62` fails only in the browser.

## 2. OPTIONS — enable fast local iteration without weakening authority

Ranked by (loop unblocked ÷ risk added). All five are one coding pass each.

### OPT-1 — Local-owner read ceiling for `/mobile/` **(S)** ← first pick
**Outcome:** the PWA is served and hot-iterable at `http://127.0.0.1:43187/mobile/` with no Tailscale, no proxy header, no phone and no enrollment; every effect route answers 403 `DEVICE_SCOPE_DENIED`.
**Repairs:** the front-door violation only. Authority gets *narrower* in this mode, never wider — production path untouched when the flag is unset.
**Work:** `direct-phone.mjs:80-83` accept `http:` only when `origin` is loopback and `opts.local === true`, keeping the exact-origin check; `:150-152` branch `if (local)` → loopback `remoteAddress` + `host === url.host` only, no `x-forwarded-proto`, no `tailscale-user-login`; `:141-148` in local mode resolve a synthetic device grant whose scope list is exactly `['control:read','relay:read','devices:read']` so `relay:write` (`:166,262`) and `control:execute` (`:240`) throw 403; `server.mjs:224` pass `local: process.env.VIVIM_DIRECT_LOCAL === '1'`; `server.mjs:851-852` default `origin: 'http://127.0.0.1:'+port` when local and `VIVIM_DIRECT_ORIGIN` unset; one loud startup line naming the mode.
**Evidence not done:** no `local`/`VIVIM_DIRECT_LOCAL`/loopback-http branch exists (`direct-phone.mjs:82-83,151-152`); client side already supports it (`transport.mjs:12,22`), so this is purely the server.
**Risk if skipped:** iteration stays at zero and the inevitable shortcut is deleting the gate or pasting the owner token into the browser — strictly worse than a scoped flag.
**Accept:** `VIVIM_DIRECT_LOCAL=1 node apps/vivim-host/server.mjs` then `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:43187/mobile/` → `200`; `curl -s -o /dev/null -w "%{http_code}" -X POST -H "content-type: application/json" -H "origin: http://127.0.0.1:43187" -H "x-vivim-control: 1" -d '{"planId":"x","planDigest":"y"}' http://127.0.0.1:43187/mobile/api/control/execute` → `403`; `node --test apps/vivim-host/test/direct-local-mode.test.mjs` (new) + existing `node --test apps/vivim-host/test/control-http.test.mjs`.
**Excludes:** no new scope, no owner token in the browser, no change to the Tailscale/Direct production gate, no local-mode write path of any kind.

### OPT-2 — Authenticate the onboarding/APK POST surface **(S/M)** — P0, ships with OPT-1
**Outcome:** nothing on the loopback origin can spawn a process, run PowerShell, register an APK path or mint a pairing token without owner proof. This is the gate that makes OPT-1 safe.
```

_First 80 of 152 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
