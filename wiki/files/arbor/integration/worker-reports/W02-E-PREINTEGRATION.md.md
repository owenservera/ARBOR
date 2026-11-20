# File: integration/worker-reports/W02-E-PREINTEGRATION.md

> Generated 2026-11-19 · Markdown · arbor

## Metadata

| Field | Value |
| --- | --- |
| Project | [arbor](../../../../projects/arbor.md) |
| Path | integration/worker-reports/W02-E-PREINTEGRATION.md |
| Language | Markdown |
| Kind | doc |
| Size | 14631 B |
| Lines | 116 |
| Hash | 864964729d13 |
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
# ARBOR Proposal 5 — Lane E W02 Pre-Integration Closeout

**Date:** 2026-11-12
**Worker:** UI/PWA/TierFlow Lane E
**Status:** `COMPATIBILITY_PATCHES_COMMITTED / LOCAL_CRYPTO_TESTS_GREEN / SHARED_RUNTIME_NOT_INTEGRATED`
**Working branch:** `work/p5-w01-e-ui` — intentionally **NOT** `work/p5-w02-e-ui`
**W01-E starting HEAD:** `1d2fb4fc55784ca74dfeae416129b8b76d5c8216`
**Pre-report patch HEAD:** `c917d77f16d26121acc81a7018a8bd17fd49c1f2`
**W01-E architecture ancestor:** `dd245d78ff3c110ba8630cad557ea0479c51a635`

## 0. Mandatory synchronization gate

Two checks of `integrate/proposal5-beta-r001` via the connected GitHub API returned **404 Branch not found**. Branch search for `proposal5` surfaced only `architecture/proposal5-beta-first-centralization`. Therefore G **has not made an integrated Wave 1E HEAD available at that exact ref**. No new W02 branch was created, no merge/rebase was performed, no root workspace/lockfile was touched, and no Host/TierFlow canonical publisher was changed. The work in this report consists of isolated, ready-for-B/G-review compatibility code and tests on the existing W01-E branch.

## 1. Minimum browser-PWA signing support — staged source

Files staged or updated, all within Lane E's existing owner scope:

- `apps/mobile-relay/browser-device-key.mjs` (**new**): browser-native, origin-scoped P-256 ECDSA key; private key generated with `extractable=false`; stored as structured-clonable `CryptoKey` in IndexedDB, never in localStorage or static assets; SPKI public PEM export; P1363 raw WebCrypto signature converted to ASN.1 DER for the **existing** Node Host verifier; exact signed transcript format uses the donor Host's literal `\\n` separator, not actual newline bytes. Requires secure context, WebCrypto, IndexedDB and local grant metadata storage; fails closed without these.
- `apps/mobile-relay/device-enrollment.mjs` (**adapted**): existing `VivimDeviceKey` Android bridge retained when present, with no fallback from a **broken** native bridge. Browser signer is selected only for a bridge-free browser; enrollment preflight prepares its nonextractable key **before consuming one-use QR token**. Signed Host `prove` remains pending until explicit PC approval; localStorage retains only grant ID, user, origin and signer kind; approved `session` bearer remains in `transport` memory. Existing browser grant resumption uses `requireExisting`, refusing a missing key instead of silently creating a different device identity.
- `apps/mobile-relay/app.js` (**adapted**): same existing screens and pairing route; plain browser can now attempt secure Direct Host enrollment after capability preflight, while Android native uses original signing bridge. No cloud pairing fallback; unsupported browsers do not consume the QR challenge.
- `apps/mobile-relay/sw.js` (**adapted**): shell cache generation v4 and allowlist for the **nonsecret** `browser-device-key.mjs` script. No key material, bearer, API response, authorization request or mutation is cached.
- `apps/mobile-relay/test/service-worker.test.mjs`: reflected shell count 44 -> 45 and exact asset allowlist.
- `apps/mobile-relay/test/browser-device-key.test.mjs` (**new**): ECDSA DER/Host signature compatibility; nonextractability, IDB persistence, missing-key no-rotation, unsupported browser capability, stolen **grant** without key, simulated pending/revoked/replayed state.
- `apps/mobile-relay/test/browser-enrollment-flow.test.mjs` (**new**): staged Direct browser pending/approve/session/revoke lifecycle, no persisted bearer, unsupported browser, broken Android bridge, retained native branch, missing-key session refusal.
- `apps/mobile-relay/test/host-static-allowlist-contract.test.mjs` (**new**): will become mandatory when Lane B's Host exists in the combined tree; skips on this isolated branch until B is present.
- `integration/worker-reports/W02-E-B-HOST-STATIC.patch` (**new**): exact Host owner B compatibility patch; no unauthorized Host modification.

No Android APK code, provider API, extra mobile application, new renderer, external service or new authority has been added.

### Crypto and authority semantics

The browser private key is nonextractable **but is not guaranteed hardware-backed**. Other compromised scripts sharing the PWA origin (including a malicious service worker) might still be able to call WebCrypto signing APIs using an IndexedDB CryptoKey. The shipped service worker does not do this. Strong CSP, secure origin, authentic Host scripts and Host authorization remain required. This is not a substitute for PC approval or Host ownership.

Exact Host existing protocol:

- `POST /mobile/api/pair`: token consumed once, response contains `enrollmentRequired` and challenge.
- `POST /mobile/api/enrollment/prove`: P-256 signature of `['vivim-enrollment-v1', challengeId, challenge, nonce, origin, user].join('\\\\n')`; Host stores **pending** grant. Host computes fingerprint from publicKeyPem and owns granted scopes.
- `GET /mobile/api/enrollment/grant-status?id=<id>`: Host determines pending/active/revoked.
- `POST /mobile/api/enrollment/session`: P-256 signature of `['vivim-session-v1', grantId, randomNonce, String(timestamp), origin, user].join('\\\\n')`; Host checks active approval, nonce replay and timestamp, then issues bounded session.
- `x-vivim-grant-id` and `x-vivim-device-session`: existing Host-owned scope validation on Direct /mobile APIs. LocalStorage stores neither secret session bearer nor signed proof.

The original native Android signer is unaffected for previously enrolled grants: legacy metadata without a `kind` uses `native`, not browser; a partial/broken `VivimDeviceKey` cannot silently downgrade into a browser key.

## 2. Host route/static readiness: one confirmed required B patch

Read-only audit compared the imported service worker's **45** declared shell paths against the donor Host `apps/vivim-host/direct-phone.mjs` explicit `assets` map (including its generated NLCL entries). **Only one PWA shell asset is missing from the current Host allowlist: `browser-device-key.mjs`.** The precise one-line insertion after `device-enrollment.mjs` is supplied in `W02-E-B-HOST-STATIC.patch`.

Until B lands that static asset mapping in the **in-ARBOR** Host, requesting `/mobile/browser-device-key.mjs` returns 404, so the PWA enrollment module cannot load. Do **not** mark browser PWA runtime-ready before that repair and an authenticated Host HTTP smoke test.

Existing Host route source was inspected and observed to implement:

- `/mobile/` same-origin shell/asset routing;
- `/mobile/connection.json` with `direct=true, directOnly=true, cloudEnabled=false`;
- single-use QR `/mobile/api/pair`, signed `/mobile/api/enrollment/*`, scoped `/mobile/api/relay?path=...`;
- Host-owned `/mobile/api/control/*` planning, approvals and receipts;
- source-scoped /mobile media/session routes; no automatic Direct->cloud fallback in PWA transport.

These are **source claims only** until the Host is physically combined and the paths are executed. The cloud/Vercel relay files are historical source compatibility and must not be registered as a beta runtime endpoint.

## 3. B security blocker: an active stolen session remains a bearer

Read-only Host analysis found `apk/enrollment.mjs:validateGrant({grantId,sessionId})` checks grant active/unrevoked, expiry and equality with current session ID, but does **not require a fresh device-key signature for each HTTP request**. If someone steals *both valid headers* and can reach the Host, they may replay the active session until expiry/revoke or replacement. This is distinct from a stolen **grant ID**: a grant ID alone cannot mint a session without the private key. The existing session is valid for up to **four hours**.

**Lane B owns the decision and repair**, not E. For a stolen-session rejection acceptance gate, extend the **existing** Host grant/session validator with a request-bound, nonce/timestamp/method/path/body-digest ECDSA proof (or other B-reviewed proof-of-possession and one-shot replay control) without creating a second device authority. Add negative tests against the actual HTTP Host for copied session headers, nonce replay, revocation and forged origin. The browser signer must then supply the matching request proof under B's approved contract. Do not claim this was implemented or tested by E.

A shorter TTL only reduces exposure and does not itself prove stolen active session replay is prevented. This issue requires explicit B/G/F disposition before secure beta acceptance.

## 4. TierFlow readiness and exactly one publisher

W01-E already imported TierFlow visual implementation, typed visual commands, Wave3/4 device adapters, revision guards and upstream tests. No source re-import or redesign was performed here. The existing internal view ports intended for G/W02-E are:

- `packages/tierflow/src/visual-runtime/host/wave4-h-host-status-contract.ts` — `createWave4HostStatusContract(hostOwnedReadPort).readStatus(query)`; trusted actor/scopes and actual receipts must come from the Host B authorizer, not UI labels.
- `packages/tierflow/src/visual-runtime/render/wave3-semantics.ts` — `renderWave3Semantics(canonical, { viewportPx, knownActions })`; source-linked render/provenance is inert.
- `packages/tierflow/src/visual-runtime/device/wave4-desktop-adapter.ts` — `projectWave4DesktopAdapter` for the existing `world-view` mount with revision/CAS and duplicate publisher refusal.
- `packages/tierflow/src/visual-runtime/device/wave4-phone-adapter.ts` — `projectWave4PhoneAdapter` for the current PWA with Host-issued pairing epoch/session/policy/document revision. It cannot approve, write World, retry effects or publish a second UI.

**No live TierFlow Host observation port, in-ARBOR mount or device acceptance can be claimed while G/B have not landed.** The correct W02 solution is a thin **in-repo read adapter** on the single existing Host publisher, not launching `src/server.ts` or the standalone TierFlow webapp. Do not add a generic visual executor, R007 hypergraph or app builder. Keep PWA navigation/Composer/Control/Mission/Media already imported unchanged.

## 5. Actual validation and limits
```

_First 80 of 117 lines._

---

[HQ wiki](../../../../index.md) · [Symbols](../../../../symbols.md) · [Dependency graph](../../../../graph.md) · [Documentation](../../../../docs.md) · [Changes](../../../../changes.md) · [Open tasks](../../../../todos.md) · [Deprecated](../../../../deprecated.md) · [Agent annotation protocol](../../../../protocol.md) · [Glossary](../../../../glossary.md) · [Using HQ](../../../../context.md) · [Capabilities](../../../../capabilities.md) · [Search index](../../../../search.json) · [Browser view](../../../../index.html)
